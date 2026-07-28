import React, { useEffect, useMemo, useState } from "react";
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
  getBarXAxisConfig,
  truncateChartLabel,
} from "./chartTheme";

interface ChartData {
  name: string;
  [key: string]: unknown;
}

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia(`(max-width: ${breakpoint}px)`).matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const onChange = () => setIsMobile(mediaQuery.matches);
    onChange();
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, [breakpoint]);

  return isMobile;
}

function BarXAxisTick({
  x = 0,
  y = 0,
  payload,
  angle,
  maxChars,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string };
  angle: number;
  maxChars: number;
}) {
  const label = truncateChartLabel(String(payload?.value ?? ""), maxChars);

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={angle === 0 ? 14 : 4}
        textAnchor={angle === 0 ? "middle" : "end"}
        fill={axisTickStyle.fill}
        fontSize={axisTickStyle.fontSize}
        fontWeight={axisTickStyle.fontWeight}
        transform={angle === 0 ? undefined : `rotate(${angle})`}
      >
        {label}
      </text>
    </g>
  );
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
  const isMobile = useIsMobile();
  const labels = useMemo(
    () => data.map((item) => String(item[nameKey] ?? "")),
    [data, nameKey],
  );
  const xAxisConfig = useMemo(
    () => getBarXAxisConfig(labels, isMobile),
    [labels, isMobile],
  );
  const chartMargin = useMemo(
    () => ({
      ...margin,
      bottom: xAxisConfig.bottom,
    }),
    [margin, xAxisConfig.bottom],
  );

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
          margin={chartMargin}
          barCategoryGap={isMobile ? "12%" : "18%"}
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
            tick={
              <BarXAxisTick
                angle={xAxisConfig.angle}
                maxChars={xAxisConfig.maxChars}
              />
            }
            tickLine={false}
            axisLine={{ stroke: chartGridStroke }}
            interval={0}
            height={xAxisConfig.height}
          />
          <YAxis
            tick={axisTickStyle}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatCompactAxis}
            width={isMobile ? 40 : 48}
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
              labelFormatter={(label) => String(label)}
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
