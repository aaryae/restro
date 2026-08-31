import { CurrencySign } from "@/constants";
import { useTheme } from "@/hooks/useTheme";

/**
 * Distinguishing categories IS the job of a chart, so unlike the KPI cards
 * these get real hue variety. What keeps it from turning into confetti is
 * holding chroma and lightness constant across the ramp and walking the hue
 * wheel in even steps — the colours then read as one family rather than eight
 * unrelated picks. Bronze leads so the brand still opens every chart.
 *
 * Each theme needs its own values at the lightness that background demands:
 * a ramp tuned for white turns to mud on near-black and vice versa.
 */
const PALETTE_LIGHT = [
  "#b06a28", // bronze — brand
  "#0f7d6b", // teal
  "#3f5fc0", // indigo
  "#a2429c", // plum
  "#c0433f", // vermilion
  "#5f8a1f", // olive
  "#1a7fae", // cerulean
  "#8a5fd0", // violet
];

const PALETTE_DARK = [
  "#e8a95c", // bronze — brand
  "#3fc4a8", // teal
  "#8296f2", // indigo
  "#dd88d4", // plum
  "#f4837c", // vermilion
  "#a8c95e", // olive
  "#54b4e0", // cerulean
  "#b79bf5", // violet
];

type Theme = "light" | "dark";

export const getChartPalette = (theme: Theme) =>
  theme === "dark" ? PALETTE_DARK : PALETTE_LIGHT;

/** Revenue / Purchase / Expense keep fixed slots so colours never shuffle. */
export const getFiscalColors = (theme: Theme) =>
  getChartPalette(theme).slice(0, 3);

export const getChartBrand = (theme: Theme) => getChartPalette(theme)[0];

export function useChartPalette() {
  const { theme } = useTheme();
  return getChartPalette(theme as Theme);
}

export function useChartColors() {
  const { theme } = useTheme();
  const t = theme as Theme;
  return {
    palette: getChartPalette(t),
    fiscal: getFiscalColors(t),
    brand: getChartBrand(t),
  };
}

/**
 * Static fallbacks for the handful of call sites that can't use a hook. These
 * favour the light palette; anything theme-sensitive should use the hooks.
 */
export const CHART_PALETTE = PALETTE_LIGHT;
export const CHART_FISCAL_COLORS = PALETTE_LIGHT.slice(0, 3);
export const CHART_PURCHASE_COLORS = PALETTE_LIGHT.slice(0, 4);
export const CHART_EXPENSE_COLORS = PALETTE_LIGHT.slice(3, 7);
export const CHART_BRAND = PALETTE_LIGHT[0];
export const CHART_BRAND_LIGHT = PALETTE_DARK[0];

export const chartMargins = {
  bar: { top: 12, right: 12, left: 4, bottom: 8 },
  line: { top: 12, right: 12, left: 4, bottom: 8 },
};

export const axisTickStyle = {
  fontSize: 11,
  fill: "var(--serve-muted)",
  fontWeight: 500,
};

/** Slice/segment separator — matches the card it sits on, so gaps read as gaps. */
export const chartSurfaceStroke = "var(--serve-surface)";

export const chartTooltipLabelStyle = {
  color: "var(--serve-fg)",
  fontWeight: 600,
  marginBottom: 4,
};

export const chartTooltipStyle = {
  borderRadius: 10,
  border: "1px solid var(--serve-border)",
  backgroundColor: "var(--serve-surface)",
  color: "var(--serve-fg)",
  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
  fontSize: 12,
  padding: "8px 12px",
};

export const formatChartValue = (value: number) =>
  `${CurrencySign}${Number(value).toLocaleString()}`;

function trimFixed(n: number, digits: number) {
  return n
    .toFixed(digits)
    .replace(/\.0+$/, "")
    .replace(/(\.\d*[1-9])0+$/, "$1");
}

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

export const chartGridStroke = "var(--serve-border)";

/** Neutral translucency reads correctly on both the light and dark card. */
export const chartCursorFill = "rgba(122, 110, 100, 0.12)";

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
