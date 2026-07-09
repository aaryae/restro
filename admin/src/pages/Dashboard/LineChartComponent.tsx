import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { VerticalAlignmentType } from "recharts/types/component/DefaultLegendContent";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import {
  CHART_PALETTE,
  axisTickStyle,
  chartGridStroke,
  chartMargins,
  chartTooltipStyle,
  formatChartValue,
  formatCompactAxis,
} from "./chartTheme";

interface ChartData {
  name: string;
  [key: string]: unknown;
}

interface LineChartProps {
  data: ChartData[];
  dataKeys: string[];
  width?: number;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  legendPosition?: VerticalAlignmentType;
  showTooltip?: boolean;
  tooltipFormatter?: (payload: { name: NameType; value: ValueType }) => string;
  colorScale?: string[];
  nameKey?: keyof ChartData;
  xAxisLabel?: string;
  yAxisLabel?: string;
  responsive?: boolean;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  lineType?: "monotone" | "linear" | "natural" | "step";
  dotSize?: number;
}

const LineChartComponent: React.FC<LineChartProps> = ({
  data,
  dataKeys,
  width = 400,
  height = 300,
  showGrid = true,
  showLegend = false,
  legendPosition = "bottom",
  showTooltip = true,
  tooltipFormatter,
  colorScale = CHART_PALETTE,
  nameKey = "name",
  responsive = true,
  margin = chartMargins.line,
  lineType = "monotone",
  dotSize = 5,
}) => {
  const colors = useMemo(
    () => dataKeys.map((_, i) => colorScale[i % colorScale.length]),
    [dataKeys, colorScale],
  );

  const ChartContainer = responsive ? ResponsiveContainer : React.Fragment;
  const containerProps = responsive ? { width: "100%", height } : {};

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-gradient-to-b from-slate-50/80 to-white text-center">
        <p className="text-[13px] font-medium text-slate-600">No data yet</p>
        <p className="mt-1 text-[12px] text-slate-400">
          Charts will appear once records are available
        </p>
      </div>
    );
  }

  const isValidData = data.every((item) =>
    dataKeys.every(
      (key) =>
        item[key] == null || (typeof item[key] === "number" && item[key] >= 0),
    ),
  );
  if (!isValidData) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-xl border border-dashed border-rose-200 bg-rose-50/50 text-[13px] text-rose-600">
        Unable to display chart — invalid data format
      </div>
    );
  }

  return (
    <div className="min-w-0 w-full overflow-hidden rounded-xl bg-gradient-to-b from-slate-50/40 to-white p-1">
      <ChartContainer
        id="line-chart"
        className="recharts-responsive-container"
        {...containerProps}
      >
        <LineChart
          width={responsive ? undefined : width}
          height={height}
          data={data}
          margin={margin}
        >
          {showGrid && (
            <CartesianGrid
              stroke={chartGridStroke}
              strokeDasharray="4 4"
              vertical={false}
            />
          )}
          <XAxis
            dataKey={nameKey}
            tick={axisTickStyle}
            tickLine={false}
            axisLine={{ stroke: chartGridStroke }}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            tick={axisTickStyle}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatCompactAxis}
            width={48}
          />
          {showTooltip && (
            <Tooltip
              formatter={
                tooltipFormatter
                  ? (value, name) => tooltipFormatter({ value, name })
                  : (value: number, name: string) => [
                      formatChartValue(Number(value)),
                      name,
                    ]
              }
              contentStyle={chartTooltipStyle}
              labelStyle={{ color: "#475569", fontWeight: 600, marginBottom: 4 }}
            />
          )}
          {showLegend && (
            <Legend
              verticalAlign={legendPosition}
              align="center"
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            />
          )}
          {dataKeys.map((key, index) => (
            <Line
              key={`line-${key}`}
              type={lineType}
              dataKey={key}
              stroke={colors[index]}
              strokeWidth={2.5}
              dot={{
                r: 3,
                fill: "#fff",
                stroke: colors[index],
                strokeWidth: 2,
              }}
              activeDot={{
                r: dotSize,
                fill: colors[index],
                stroke: "#fff",
                strokeWidth: 2,
              }}
              isAnimationActive
              animationDuration={700}
              animationEasing="ease-out"
            />
          ))}
        </LineChart>
      </ChartContainer>
    </div>
  );
};

export default LineChartComponent;
