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
}

const TopTablesChart: React.FC<TopTablesChartProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="h-64 w-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
        <span className="text-gray-400">Loading chart...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 w-full bg-gray-50 rounded-lg flex items-center justify-center">
        <span className="text-gray-400">No data available</span>
      </div>
    );
  }

  const chartData = data.slice(0, 5).map((table: any) => ({
    name: `Table - ${table.name || table.id || "Unknown"}`,
    revenue: table.totalRevenue || 0,
    id: table.id,
  }));

  const COLORS = ["#032768", "#FF6B00", "#10B981", "#8B5CF6", "#EF4444"];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h2 className="text-lg font-semibold mb-4">
        Top 5 Performing Tables (Today)
      </h2>
      <div className="h-64">
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
