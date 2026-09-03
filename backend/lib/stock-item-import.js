"use strict";

const xlsx = require("xlsx");

/**
 * Canonical column -> accepted spreadsheet headers for stock items.
 * Matched loosely (case/space/underscore insensitive).
 */
const COLUMN_ALIASES = {
  name: ["name", "itemname", "stockitem", "stockitemname", "item", "title"],
  measuringUnit: [
    "measuringunit",
    "unit",
    "uom",
    "symbol",
    "unitsymbol",
    "measure",
  ],
  group: ["group", "stockgroup", "groupname", "category"],
  defaultPrice: [
    "defaultprice",
    "price",
    "rate",
    "consumptionrate",
    "unitprice",
  ],
  openingQuantity: [
    "openingquantity",
    "openingqty",
    "opening",
    "quantity",
    "qty",
    "stock",
  ],
  openingRate: ["openingrate", "openingprice", "purchaseprice"],
  supplier: ["supplier", "suppliername", "vendor"],
  lowStockThreshold: [
    "lowstockthreshold",
    "lowstock",
    "reorderlevel",
    "threshold",
    "minstock",
  ],
};

const TEMPLATE_HEADERS = [
  "Name",
  "Measuring Unit",
  "Group",
  "Default Price",
  "Opening Quantity",
  "Opening Rate",
  "Supplier",
  "Low Stock Threshold",
];

function normalizeHeader(header) {
  return String(header || "")
    .toLowerCase()
    .replace(/[\s_\-.]/g, "");
}

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

function parseNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  const text = String(value).trim();
  const match = text.match(/-?(?:\d[\d,]*\.\d+|(?<![A-Za-z])\.\d+|\d[\d,]*)/);
  if (!match) return null;

  const num = Number(match[0].replace(/,/g, ""));
  return Number.isFinite(num) ? num : null;
}

function parseNonNegative(value, { required = false, label = "Value" } = {}) {
  if (
    (value === null || value === undefined || value === "") &&
    !required
  ) {
    return { value: 0, error: null };
  }
  const num = parseNumber(value);
  if (num === null) {
    return {
      value: 0,
      error: value
        ? `${label} "${value}" is not a number`
        : `${label} is required`,
    };
  }
  if (num < 0) {
    return { value: 0, error: `${label} cannot be negative` };
  }
  return { value: num, error: null };
}

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

function normalizeRows(rows, headerMap) {
  const seenNames = new Set();

  return rows.map((raw, index) => {
    const rowNumber = index + 2;
    const pick = (field) =>
      headerMap[field] ? cellToString(raw[headerMap[field]]) : "";

    const name = pick("name");
    const measuringUnit = pick("measuringUnit");
    const group = pick("group");
    const supplier = pick("supplier");
    const errors = [];

    if (!name) errors.push("Name is required");
    if (name.length > 150) errors.push("Name is too long (max 150)");
    if (!measuringUnit) errors.push("Measuring Unit is required");

    const priceParsed = parseNonNegative(pick("defaultPrice"), {
      label: "Default Price",
    });
    if (priceParsed.error) errors.push(priceParsed.error);

    const openingQtyParsed = parseNonNegative(pick("openingQuantity"), {
      label: "Opening Quantity",
    });
    if (openingQtyParsed.error) errors.push(openingQtyParsed.error);

    const openingRateRaw = pick("openingRate");
    let openingRate = priceParsed.value;
    if (openingRateRaw !== "") {
      const openingRateParsed = parseNonNegative(openingRateRaw, {
        label: "Opening Rate",
      });
      if (openingRateParsed.error) errors.push(openingRateParsed.error);
      else openingRate = openingRateParsed.value;
    }

    const thresholdRaw = pick("lowStockThreshold");
    let lowStockThreshold = null;
    if (thresholdRaw !== "") {
      const thresholdParsed = parseNonNegative(thresholdRaw, {
        label: "Low Stock Threshold",
      });
      if (thresholdParsed.error) errors.push(thresholdParsed.error);
      else lowStockThreshold = thresholdParsed.value;
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
      measuringUnit,
      group,
      supplier,
      defaultPrice: priceParsed.value,
      openingQuantity: openingQtyParsed.value,
      openingRate,
      lowStockThreshold,
      errors,
    };
  });
}

function missingRequiredColumns(headerMap) {
  return ["name", "measuringUnit"].filter((field) => !headerMap[field]);
}

module.exports = {
  COLUMN_ALIASES,
  TEMPLATE_HEADERS,
  buildHeaderMap,
  missingRequiredColumns,
  normalizeHeader,
  normalizeRows,
  parseNumber,
  readSheet,
};
