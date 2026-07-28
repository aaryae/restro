import { CurrencySign } from "@/constants";

/** Burgundy + warm gold + slate — matches restaurant admin brand */
export const CHART_PALETTE = [
  "#7F1D1D",
  "#B45309",
  "#475569",
  "#0F766E",
  "#92400E",
  "#334155",
  "#9A3412",
  "#115E59",
];

/** Fiscal year pie: profit, purchases, expense */
export const CHART_FISCAL_COLORS = ["#166534", "#7F1D1D", "#B45309"];

/** Purchase-focused charts */
export const CHART_PURCHASE_COLORS = ["#7F1D1D", "#991B1B", "#B45309", "#92400E"];

/** Expense-focused charts */
export const CHART_EXPENSE_COLORS = ["#B45309", "#C2410C", "#92400E", "#78350F"];

/** Single-series bar / line */
export const CHART_BRAND = "#7F1D1D";
export const CHART_BRAND_LIGHT = "#B45309";

export const chartMargins = {
  bar: { top: 12, right: 12, left: 4, bottom: 8 },
  line: { top: 12, right: 12, left: 4, bottom: 8 },
};

export const axisTickStyle = {
  fontSize: 11,
  fill: "#64748b",
  fontWeight: 500,
};

export const chartTooltipStyle = {
  borderRadius: 10,
  border: "1px solid #e2e8f0",
  backgroundColor: "#fff",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
  fontSize: 12,
  padding: "8px 12px",
};

export const formatChartValue = (value: number) =>
  `${CurrencySign}${Number(value).toLocaleString()}`;

/** Trim trailing zeros from fixed decimals (2.0 → 2, 5.50 → 5.5). */
function trimFixed(n: number, digits: number) {
  return n
    .toFixed(digits)
    .replace(/\.0+$/, "")
    .replace(/(\.\d*[1-9])0+$/, "$1");
}

/**
 * Compact Y-axis labels using South Asian (Nepali/Indian) scales:
 * 1 Lakh = 1,00,000 · 1 Crore = 1,00,00,000
 */
export const formatCompactAxis = (value: number) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";

  if (abs >= 10_000_000) return `${sign}${trimFixed(abs / 10_000_000, 1)}Cr`;
  if (abs >= 100_000) return `${sign}${trimFixed(abs / 100_000, 1)}L`;
  if (abs >= 1_000) return `${sign}${trimFixed(abs / 1_000, 1)}K`;
  return String(n);
};

export const chartGridStroke = "#e2e8f0";

/** Tooltip / bar hover highlight */
export const chartCursorFill = "rgba(127, 29, 29, 0.06)";

export function truncateChartLabel(label: string, maxLength: number) {
  const text = String(label || "").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(maxLength - 1, 1))}…`;
}

export function getBarXAxisConfig(labels: string[], isMobile: boolean) {
  const count = labels.length;
  const maxLabelLength = labels.reduce(
    (max, label) => Math.max(max, String(label || "").length),
    0,
  );

  if (isMobile) {
    const maxChars = count >= 6 ? 7 : count >= 4 ? 9 : 11;
    const angle = count > 2 || maxLabelLength > 8 ? -55 : -40;
    const height = angle <= -55 ? 78 : 64;
    return { maxChars, angle, height, bottom: height - 24 };
  }

  const needsAngle = count > 4 || maxLabelLength > 12;
  const angle = needsAngle ? -28 : count > 3 ? -18 : 0;
  const height = angle !== 0 ? 58 : 36;
  const maxChars = angle !== 0 ? 14 : 20;
  return { maxChars, angle, height, bottom: angle !== 0 ? 18 : 8 };
}
