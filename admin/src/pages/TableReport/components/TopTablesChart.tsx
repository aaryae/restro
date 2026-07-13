import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { CurrencySign } from "@/constants";

interface TopTablesChartProps {
  data: any[];
  isLoading?: boolean;
  periodLabel?: string;
}

const TopTablesChart: React.FC<TopTablesChartProps> = ({
  data,
  isLoading,
  periodLabel = "Today",
}) => {
  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-100 animate-pulse">
        <span className="text-sm text-slate-400">Loading chart…</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-48 w-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60">
        <span className="text-sm text-slate-400">
          No table revenue to chart for this day
        </span>
      </div>
    );
  }

  const chartData = data.map((table: any) => ({
    name: `Table - ${table.name || table.id || "Unknown"}`,
    revenue: table.totalRevenue || 0,
    id: table.id,
  }));

  const COLORS = ["#032768", "#FF6B00", "#10B981", "#8B5CF6", "#EF4444", "#3B82F6", "#F59E0B", "#EC4899", "#14B8A6", "#6366F1"];

  const chartHeight = Math.max(300, chartData.length * 60);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="mb-4 text-base font-semibold text-slate-900">
        Table revenue · {periodLabel}
      </h2>
      <div style={{ height: `${chartHeight}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(value) =>
                `${CurrencySign}${value.toLocaleString()}`
              }
              style={{ fontSize: "12px" }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={60}
              style={{ fontSize: "12px", fontWeight: 500 }}
            />
            <Tooltip
              formatter={(value: number) => [
                `${CurrencySign}${value.toLocaleString()}`,
                "Revenue",
              ]}
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            />
            <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TopTablesChart;
