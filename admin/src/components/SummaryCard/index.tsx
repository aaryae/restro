import cn from "clsx";

/**
 * `tone` is kept for call-site compatibility but no longer paints the card.
 * Giving each metric its own hue produced eight colours with no shared
 * meaning; emphasis is carried by scale and position instead, and colour is
 * reserved for values that are genuinely signed.
 */
type SummaryTone =
  | "violet"
  | "emerald"
  | "sky"
  | "amber"
  | "rose"
  | "green"
  | "teal"
  | "indigo"
  | "coffee"
  | "slate";

/** Category colour for the icon chip. Mirrors the chart palette hues. */
export type SummaryTint =
  | "bronze"
  | "teal"
  | "indigo"
  | "plum"
  | "vermilion"
  | "olive"
  | "cerulean"
  | "violet";

export default function SummaryCard({
  title,
  value,
  gradient,
  tone: _tone,
  Icon,
  className,
  variant = "soft",
  signed = false,
  amount,
  dimWhenZero = true,
  tint,
}: {
  title: string;
  value: string;
  gradient?: string;
  tone?: SummaryTone;
  tint?: SummaryTint;
  Icon: React.ComponentType<{ className?: string }>;
  className?: string;
  variant?: "soft" | "gradient";
  /** Colour the value green/red by sign — only for true deltas like profit. */
  signed?: boolean;
  /** Numeric backing for `signed` / zero detection; parsed from `value` if absent. */
  amount?: number;
  dimWhenZero?: boolean;
}) {
  if (variant === "gradient" && gradient) {
    return (
      <div className={cn("dash-card relative overflow-hidden", className)}>
        <div
          className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-90`}
        />
        <div className="relative flex items-center justify-between p-5 text-white">
          <div>
            <div className="text-sm opacity-90">{title}</div>
            <div className="mt-1 text-left text-2xl font-semibold">{value}</div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/20 bg-white/15">
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </div>
    );
  }

  const parsed = amount ?? Number(String(value).replace(/[^0-9.-]/g, ""));
  const numeric = Number.isFinite(parsed) ? parsed : 0;

  return (
    <div className={cn("dash-card dash-kpi", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="dash-kpi-label truncate">{title}</p>
          <p
            className={cn(
              "dash-kpi-value truncate",
              signed && numeric > 0 && "is-up",
              signed && numeric < 0 && "is-down",
              dimWhenZero && numeric === 0 && "is-zero",
            )}
          >
            {value}
          </p>
        </div>
        <div className={cn("dash-kpi-icon", tint && `tint-${tint}`)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
