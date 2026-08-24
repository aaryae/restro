import React, { useEffect, useId, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
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
  useChartPalette,
  axisTickStyle,
  chartCursorFill,
  chartMargins,
  chartTooltipLabelStyle,
  chartTooltipStyle,
  formatChartValue,
  formatCompactAxis,
  getBarXAxisConfig,
  truncateChartLabel,
} from "./chartTheme";
import ChartEmptyState from "./components/ChartEmptyState";

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
  barSize = 30,
  showLegend = false,
  legendPosition = "bottom",
  showTooltip = true,
  tooltipFormatter,
  colorScale,
  nameKey = "name",
  responsive = true,
  margin = chartMargins.bar,
}) => {
  const isMobile = useIsMobile();
  const gradientId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const themePalette = useChartPalette();
  const scale = colorScale ?? themePalette;
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

  /**
   * A single series is one measure, so it gets one colour — cycling hues per
   * category invents meaning that isn't in the data. Only multi-series charts
   * need the palette to tell keys apart.
   */
  const barColors = useMemo(
    () => dataKeys.map((_, i) => scale[i % scale.length]),
    [dataKeys, scale],
  );

  const ChartContainer = responsive ? ResponsiveContainer : React.Fragment;
  const containerProps = responsive ? { width: "100%", height } : {};

  if (!data || data.length === 0) return <ChartEmptyState />;

  const isValidData = data.every((item) =>
    dataKeys.every(
      (key) => typeof item[key] === "number" && Number.isFinite(item[key]),
    ),
  );
  if (!isValidData) {
    return (
      <ChartEmptyState
        tone="error"
        message="Unable to display chart"
        hint="Invalid data format"
      />
    );
  }

  return (
    <div className="min-w-0 w-full overflow-hidden">
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
          <defs>
            {barColors.map((color, index) => (
              <linearGradient
                key={`bargrad-${index}`}
                id={`${gradientId}-${index}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={color} stopOpacity={1} />
                <stop offset="100%" stopColor={color} stopOpacity={0.72} />
              </linearGradient>
            ))}
          </defs>
          <XAxis
            dataKey={nameKey}
            tick={
              <BarXAxisTick
                angle={xAxisConfig.angle}
                maxChars={xAxisConfig.maxChars}
              />
            }
            tickLine={false}
            axisLine={false}
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
              labelStyle={chartTooltipLabelStyle}
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
            <Bar
              key={`bar-${key}`}
              dataKey={key}
              fill={`url(#${gradientId}-${index})`}
              radius={[6, 6, 0, 0]}
              barSize={barSize}
              maxBarSize={48}
              isAnimationActive
              animationDuration={600}
              animationEasing="ease-out"
            />
          ))}
        </BarChart>
      </ChartContainer>
    </div>
  );
};

export default BarChartComponent;
