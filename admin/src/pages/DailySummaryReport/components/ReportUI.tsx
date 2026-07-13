import { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { CurrencySign } from "@/constants";

export function ReportEmptyState({
  icon: Icon,
  title,
  description,
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center ${
        compact ? "min-h-[88px] px-3 py-5" : "min-h-[120px] px-4 py-6"
      }`}
    >
      <span className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm ring-1 ring-slate-200/80">
        <Icon size={16} strokeWidth={1.75} />
      </span>
      <p className="text-[13px] font-medium text-slate-700">{title}</p>
      {description && (
        <p className="mt-0.5 max-w-xs text-[12px] leading-snug text-slate-500">
          {description}
        </p>
      )}
    </div>
  );
}

export function ReportSection({
  title,
  total,
  totalTone = "default",
  children,
  className = "",
}: {
  title: string;
  total?: number | null;
  totalTone?: "default" | "green" | "orange" | "red";
  children: ReactNode;
  className?: string;
}) {
  const toneClass =
    totalTone === "green"
      ? "text-emerald-600"
      : totalTone === "orange"
        ? "text-orange-600"
        : totalTone === "red"
          ? "text-rose-600"
          : "text-slate-900";

  return (
    <section className={`min-w-0 ${className}`}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </h2>
        {total != null && (
          <p className={`text-base font-bold tabular-nums ${toneClass}`}>
            {CurrencySign}
            {Number(total).toLocaleString()}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

export function ReportDateChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-[13px] font-medium transition ${
        active
          ? "bg-primaryColor text-white shadow-sm shadow-primaryColor/25"
          : "border border-slate-200 bg-white text-slate-600 hover:border-primaryColor/35 hover:text-primaryColor"
      }`}
    >
      {children}
    </button>
  );
}
