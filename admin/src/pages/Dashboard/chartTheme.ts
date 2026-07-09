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

export const formatCompactAxis = (value: number) => {
  const n = Number(value);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
};

export const chartGridStroke = "#e2e8f0";

/** Tooltip / bar hover highlight */
export const chartCursorFill = "rgba(127, 29, 29, 0.06)";
