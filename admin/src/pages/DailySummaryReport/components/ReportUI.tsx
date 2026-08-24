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
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--serve-border)] bg-[var(--serve-surface-2)] text-center ${
        compact ? "min-h-[88px] px-3 py-5" : "min-h-[120px] px-4 py-6"
      }`}
    >
      <span className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--serve-surface)] text-[var(--serve-muted)] shadow-sm ring-1 ring-[var(--serve-border)]">
        <Icon size={16} strokeWidth={1.75} />
      </span>
      <p className="text-[13px] font-medium text-[var(--serve-fg)]">{title}</p>
      {description && (
        <p className="mt-0.5 max-w-xs text-[12px] leading-snug text-[var(--serve-muted)]">
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
          : "text-[var(--serve-fg)]";

  return (
    <section className={`min-w-0 ${className}`}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--serve-muted)]">
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
          : "border border-[var(--serve-border)] bg-[var(--serve-surface)] text-[var(--serve-muted)] hover:border-[color-mix(in_srgb,var(--primary-color)_35%,var(--serve-border))] hover:text-[var(--primary-ink)]"
      }`}
    >
      {children}
    </button>
  );
}
