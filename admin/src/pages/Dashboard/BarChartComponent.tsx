import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { VerticalAlignmentType } from "recharts/types/component/DefaultLegendContent";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import {
  CHART_PALETTE,
  axisTickStyle,
  chartCursorFill,
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

interface BarChartProps {
  data: ChartData[];
  dataKeys: string[];
  width?: number;
  height?: number;
  barSize?: number;
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
}

const BarChartComponent: React.FC<BarChartProps> = ({
  data,
  dataKeys,
  width = 400,
  height = 300,
  barSize = 36,
  showGrid = true,
  showLegend = false,
  legendPosition = "bottom",
  showTooltip = true,
  tooltipFormatter,
  colorScale = CHART_PALETTE,
  nameKey = "name",
  responsive = true,
  margin = chartMargins.bar,
}) => {
  const barColors = useMemo(() => {
    if (dataKeys.length > 1) {
      return dataKeys.map((_, i) => colorScale[i % colorScale.length]);
    }
    return data.map((_, i) => colorScale[i % colorScale.length]);
  }, [data, dataKeys, colorScale]);

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
    dataKeys.every((key) => typeof item[key] === "number" && item[key] >= 0),
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
        id="bar-chart"
        className="recharts-responsive-container"
        {...containerProps}
      >
        <BarChart
          width={responsive ? undefined : width}
          height={height}
          data={data}
          margin={margin}
          barCategoryGap="18%"
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
            interval={0}
            angle={data.length > 5 ? -25 : 0}
            textAnchor={data.length > 5 ? "end" : "middle"}
            height={data.length > 5 ? 56 : 36}
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
              cursor={{ fill: chartCursorFill, radius: 8 }}
              formatter={
                tooltipFormatter
                  ? (value, name) => tooltipFormatter({ value, name })
                  : (value: number, name: string) => [
                      formatChartValue(Number(value)),
                      name,
                    ]
              }
              contentStyle={chartTooltipStyle}
            />
          )}
          {showLegend && (
            <Legend
              verticalAlign={legendPosition}
              align="center"
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            />
          )}
          {dataKeys.length === 1 ? (
            <Bar
              dataKey={dataKeys[0]}
              radius={[8, 8, 0, 0]}
              barSize={barSize}
              isAnimationActive
              animationDuration={650}
              animationEasing="ease-out"
            >
              {data.map((_, index) => (
                <Cell key={`bar-cell-${index}`} fill={barColors[index]} />
              ))}
            </Bar>
          ) : (
            dataKeys.map((key, index) => (
              <Bar
                key={`bar-${key}`}
                dataKey={key}
                fill={barColors[index]}
                radius={[8, 8, 0, 0]}
                barSize={barSize}
                isAnimationActive
                animationDuration={650}
                animationEasing="ease-out"
              />
            ))
          )}
        </BarChart>
      </ChartContainer>
    </div>
  );
};

export default BarChartComponent;
