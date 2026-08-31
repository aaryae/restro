"use strict";

const xlsx = require("xlsx");

const STOCK_STATUSES = new Set(["in_stock", "out_of_stock", "low_stock"]);

/**
 * Canonical column -> accepted spreadsheet headers.
 * Headers are matched loosely (case/space/underscore insensitive) so a cafe
 * can paste their own sheet without renaming columns first.
 */
const COLUMN_ALIASES = {
  name: ["name", "productname", "itemname", "item", "product", "title"],
  category: ["category", "categoryname", "productcategory", "menucategory"],
  department: ["department", "kitchen", "departmentname", "station"],
  price: ["price", "rate", "amount", "sellingprice"],
  description: ["description", "details", "desc", "note"],
  quantity: ["quantity", "qty", "stock", "stockquantity"],
  stockStatus: ["stockstatus", "availability", "status"],
};

const TEMPLATE_HEADERS = [
  "Name",
  "Category",
  "Department",
  "Price",
  "Description",
  "Quantity",
  "Stock Status",
];

function normalizeHeader(header) {
  return String(header || "")
    .toLowerCase()
    .replace(/[\s_\-.]/g, "");
}

/** Map a sheet's raw headers onto canonical field names. */
function buildHeaderMap(rawHeaders) {
  const map = {};
  rawHeaders.forEach((raw) => {
    const normalized = normalizeHeader(raw);
    if (!normalized) return;
    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (map[field]) continue;
      if (aliases.includes(normalized)) {
        map[field] = raw;
        return;
      }
    }
  });
  return map;
}

function cellToString(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function parseStockStatus(value) {
  const normalized = normalizeHeader(value);
  if (!normalized) return "in_stock";
  if (normalized === "instock" || normalized === "available") return "in_stock";
  if (normalized === "outofstock" || normalized === "unavailable") {
    return "out_of_stock";
  }
  if (normalized === "lowstock") return "low_stock";
  const snake = String(value).trim().toLowerCase().replace(/\s+/g, "_");
  return STOCK_STATUSES.has(snake) ? snake : "in_stock";
}

/**
 * Pull the first number out of a cell, tolerating "Rs. 250" and "1,250.50".
 * Stripping non-digits naively would turn "Rs. 250" into 0.25, so match the
 * numeric token instead.
 */
function parseNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  const text = String(value).trim();
  // A bare ".25" is only a decimal when no letter precedes it, otherwise the
  // dot belongs to a currency prefix like "Rs.250".
  const match = text.match(/-?(?:\d[\d,]*\.\d+|(?<![A-Za-z])\.\d+|\d[\d,]*)/);
  if (!match) return null;

  const num = Number(match[0].replace(/,/g, ""));
  return Number.isFinite(num) ? num : null;
}

function parsePrice(value) {
  return parseNumber(value);
}

function parseQuantity(value) {
  const num = parseNumber(value);
  return num === null ? 0 : Math.trunc(num);
}

/**
 * Read the first sheet of an .xlsx/.xls/.csv file into raw row objects.
 * Returns rows plus the header map so callers can report unknown columns.
 */
function readSheet(filePath) {
  const workbook = xlsx.readFile(filePath, { cellDates: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { rows: [], headerMap: {}, rawHeaders: [] };
  }

  const worksheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(worksheet, { defval: "" });
  const rawHeaders =
    xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: "" })[0] || [];

  return { rows, headerMap: buildHeaderMap(rawHeaders), rawHeaders };
}

/**
 * Turn raw sheet rows into normalized, validated import candidates.
 * `rowNumber` is the spreadsheet line (header is line 1) so error messages
 * point at something the user can actually find in their file.
 */
function normalizeRows(rows, headerMap) {
  const seenNames = new Set();

  return rows.map((raw, index) => {
    const rowNumber = index + 2;
    const pick = (field) =>
      headerMap[field] ? cellToString(raw[headerMap[field]]) : "";

    const name = pick("name");
    const category = pick("category");
    const department = pick("department");
    const rawPrice = pick("price");
    const price = parsePrice(rawPrice);
    const errors = [];

    if (!name) errors.push("Name is required");
    if (name.length > 255) errors.push("Name is too long (max 255)");
    if (!category) errors.push("Category is required");
    if (price === null) {
      errors.push(rawPrice ? `Price "${rawPrice}" is not a number` : "Price is required");
    } else if (price < 0) {
      errors.push("Price cannot be negative");
    }

    const dedupeKey = name.toLowerCase();
    if (name && seenNames.has(dedupeKey)) {
      errors.push("Duplicate name in this file");
    } else if (name) {
      seenNames.add(dedupeKey);
    }

    return {
      rowNumber,
      name,
      category,
      department,
      price: price ?? 0,
      description: pick("description"),
      quantity: parseQuantity(pick("quantity")),
      stockStatus: parseStockStatus(pick("stockStatus")),
      errors,
    };
  });
}

function missingRequiredColumns(headerMap) {
  return ["name", "category", "price"].filter((field) => !headerMap[field]);
}

module.exports = {
  COLUMN_ALIASES,
  TEMPLATE_HEADERS,
  buildHeaderMap,
  missingRequiredColumns,
  normalizeHeader,
  normalizeRows,
  parseNumber,
  parsePrice,
  parseQuantity,
  parseStockStatus,
  readSheet,
};
