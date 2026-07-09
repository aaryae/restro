import cn from "clsx";

type SummaryTone =
  | "violet"
  | "emerald"
  | "sky"
  | "amber"
  | "rose"
  | "green"
  | "teal"
  | "indigo"
  | "slate";

const toneStyles: Record<
  SummaryTone,
  { icon: string; value: string }
> = {
  violet: {
    icon: "bg-violet-50 text-violet-600 ring-violet-100",
    value: "text-violet-700",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    value: "text-emerald-700",
  },
  sky: {
    icon: "bg-sky-50 text-sky-600 ring-sky-100",
    value: "text-sky-700",
  },
  amber: {
    icon: "bg-amber-50 text-amber-600 ring-amber-100",
    value: "text-amber-700",
  },
  rose: {
    icon: "bg-rose-50 text-rose-600 ring-rose-100",
    value: "text-rose-700",
  },
  green: {
    icon: "bg-green-50 text-green-600 ring-green-100",
    value: "text-green-700",
  },
  teal: {
    icon: "bg-teal-50 text-teal-600 ring-teal-100",
    value: "text-teal-700",
  },
  indigo: {
    icon: "bg-indigo-50 text-indigo-600 ring-indigo-100",
    value: "text-indigo-700",
  },
  slate: {
    icon: "bg-slate-100 text-slate-600 ring-slate-200",
    value: "text-slate-800",
  },
};

export default function SummaryCard({
  title,
  value,
  gradient,
  tone = "slate",
  Icon,
  className,
  variant = "soft",
}: {
  title: string;
  value: string;
  gradient?: string;
  tone?: SummaryTone;
  Icon: React.ComponentType<{ className?: string }>;
  className?: string;
  variant?: "soft" | "gradient";
}) {
  const styles = toneStyles[tone];

  if (variant === "gradient" && gradient) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-gray-200 shadow-sm",
          className,
        )}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-90`}
        />
        <div className="relative flex items-center justify-between p-5 text-white">
          <div>
            <div className="text-sm opacity-90">{title}</div>
            <div className="mt-1 text-left text-2xl font-semibold drop-shadow-sm">
              {value}
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/20 bg-white/15 backdrop-blur-sm">
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium uppercase tracking-wide text-slate-500 sm:text-[12px] sm:normal-case sm:tracking-normal">
            {title}
          </p>
          <p
            className={cn(
              "mt-1 truncate text-base font-semibold tabular-nums tracking-tight sm:text-lg",
              styles.value,
            )}
          >
            {value}
          </p>
        </div>
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 sm:h-10 sm:w-10",
            styles.icon,
          )}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
    </div>
  );
}
