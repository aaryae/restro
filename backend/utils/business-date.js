const { getLocalDateRange, getTimezone } = require("./timezone");

const toLocalYmd = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: getTimezone(),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return `${year}-${month}-${day}`;
};

/** Normalize to YYYY-MM-DD or null. */
const normalizeYmd = (value) => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return toLocalYmd(value);
  }
  const str = String(value).trim();
  const match = str.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
};

const isFutureYmd = (ymd) => {
  if (!ymd) return false;
  return ymd > toLocalYmd(new Date());
};

/**
 * Parse a business calendar date into a local Date (start of day).
 * Returns { ok, date, ymd, error }.
 */
const parseBusinessDate = (value, { required = false, label = "Date" } = {}) => {
  if (value === undefined || value === null || value === "") {
    if (required) {
      return { ok: false, error: `${label} is required` };
    }
    return { ok: true, date: null, ymd: null };
  }

  const ymd = normalizeYmd(value);
  if (!ymd) {
    return { ok: false, error: `${label} must be a valid date (YYYY-MM-DD)` };
  }
  if (isFutureYmd(ymd)) {
    return { ok: false, error: `${label} cannot be in the future` };
  }

  const { start } = getLocalDateRange(ymd, ymd);
  return { ok: true, date: start, ymd };
};

module.exports = {
  toLocalYmd,
  normalizeYmd,
  isFutureYmd,
  parseBusinessDate,
};
