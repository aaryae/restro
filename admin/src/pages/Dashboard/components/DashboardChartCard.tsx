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
    <section className={cn("dash-card min-w-0 overflow-hidden", className)}>
      <div className="dash-chart-head">
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon ? (
            <span className="dash-kpi-icon">
              <Icon size={16} />
            </span>
          ) : null}
          <h3 className="dash-chart-title truncate">{title}</h3>
        </div>
        <ChartTypeTabs
          value={chartType}
          onChange={onChartTypeChange}
          allowed={allowedChartTypes}
        />
      </div>
      <div className="min-w-0 overflow-hidden p-4 sm:p-5">
        {loading ? (
          <div className="h-[300px] animate-pulse rounded-xl bg-[var(--serve-surface-2)]" />
        ) : (
          <AnimatedPanel panelKey={chartType} variant="chart">
            {children}
          </AnimatedPanel>
        )}
      </div>
    </section>
  );
}
