import { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import cn from "clsx";

type DashboardChartPanelProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
};

export default function DashboardChartPanel({
  title,
  description,
  icon: Icon,
  children,
  className = "",
}: DashboardChartPanelProps) {
  return (
    <section
      className={cn(
        "min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm",
        className,
      )}
    >
      <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          {Icon ? (
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-600">
              <Icon size={16} />
            </span>
          ) : null}
          <div className="min-w-0">
            <h3 className="truncate text-[13px] font-semibold text-slate-800">
              {title}
            </h3>
            {description ? (
              <p className="truncate text-[12px] text-slate-500">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="min-w-0 overflow-hidden p-4 sm:p-5">{children}</div>
    </section>
  );
}
