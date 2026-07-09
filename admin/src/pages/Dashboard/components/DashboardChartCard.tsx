import { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import cn from "clsx";
import ChartTypeTabs, { type ChartType } from "./ChartTypeTabs";
import AnimatedPanel from "./AnimatedPanel";

type DashboardChartCardProps = {
  title: string;
  icon?: LucideIcon;
  chartType: ChartType;
  onChartTypeChange: (type: ChartType) => void;
  allowedChartTypes?: ChartType[];
  loading?: boolean;
  children: ReactNode;
  className?: string;
};

export default function DashboardChartCard({
  title,
  icon: Icon,
  chartType,
  onChartTypeChange,
  allowedChartTypes,
  loading,
  children,
  className,
}: DashboardChartCardProps) {
  return (
    <section
      className={cn(
        "min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm",
        className,
      )}
    >
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          {Icon ? (
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primaryColor/10 text-primaryColor">
              <Icon size={16} />
            </span>
          ) : null}
          <h3 className="truncate text-[13px] font-semibold text-slate-800">
            {title}
          </h3>
        </div>
        <ChartTypeTabs
          value={chartType}
          onChange={onChartTypeChange}
          allowed={allowedChartTypes}
        />
      </div>
      <div className="min-w-0 overflow-hidden p-4 sm:p-5">
        {loading ? (
          <div className="h-[300px] animate-pulse rounded-xl bg-gradient-to-b from-slate-50 to-slate-100/50" />
        ) : (
          <AnimatedPanel panelKey={chartType} variant="chart">
            {children}
          </AnimatedPanel>
        )}
      </div>
    </section>
  );
}
