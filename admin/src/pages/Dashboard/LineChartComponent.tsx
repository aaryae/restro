import React, { useId, useMemo } from "react";
import {
  ComposedChart,
  Area,
  Line,
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
  chartGridStroke,
  chartMargins,
  chartSurfaceStroke,
  chartTooltipLabelStyle,
  chartTooltipStyle,
  formatChartValue,
  formatCompactAxis,
} from "./chartTheme";
import ChartEmptyState from "./components/ChartEmptyState";

interface ChartData {
  name: string;
  [key: string]: unknown;
}

interface LineChartProps {
  data: ChartData[];
  dataKeys: string[];
  width?: number;
  height?: number;
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
  showLegend = false,
  legendPosition = "bottom",
  showTooltip = true,
  tooltipFormatter,
  colorScale,
  nameKey = "name",
  responsive = true,
  margin = chartMargins.line,
  lineType = "monotone",
  dotSize = 5,
}) => {
  const gradientId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const themePalette = useChartPalette();
  const scale = colorScale ?? themePalette;
  const colors = useMemo(
    () => dataKeys.map((_, i) => scale[i % scale.length]),
    [dataKeys, scale],
  );
  /** A soft wash under a single trend line reads as volume; stacking several
   * translucent fills just muddies them, so only fill when there's one key. */
  const showArea = dataKeys.length === 1;

  const ChartContainer = responsive ? ResponsiveContainer : React.Fragment;
  const containerProps = responsive ? { width: "100%", height } : {};

  if (!data || data.length === 0) return <ChartEmptyState />;

  const isValidData = data.every((item) =>
    dataKeys.every(
      (key) =>
        item[key] == null || (typeof item[key] === "number" && item[key] >= 0),
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

  const denseAxis = data.length > 8;
  const chartMargin = {
    ...margin,
    bottom: Math.max(margin?.bottom ?? 8, denseAxis ? 28 : margin?.bottom ?? 8),
  };

  return (
    <div className="min-w-0 w-full overflow-hidden">
      <ChartContainer
        id="line-chart"
        className="recharts-responsive-container"
        {...containerProps}
      >
        <ComposedChart
          width={responsive ? undefined : width}
          height={height}
          data={data}
          margin={chartMargin}
        >
          <defs>
            {colors.map((color, index) => (
              <linearGradient
                key={`grad-${index}`}
                id={`${gradientId}-${index}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={color} stopOpacity={0.22} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <XAxis
            dataKey={nameKey}
            tick={axisTickStyle}
            tickLine={false}
            axisLine={false}
            interval={0}
            minTickGap={4}
            angle={denseAxis ? -35 : 0}
            textAnchor={denseAxis ? "end" : "middle"}
            height={denseAxis ? 52 : 30}
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
              labelStyle={chartTooltipLabelStyle}
              cursor={{
                stroke: chartGridStroke,
                strokeWidth: 1,
              }}
            />
          )}
          {showLegend && (
            <Legend
              verticalAlign={legendPosition}
              align="center"
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            />
          )}
          {showArea && (
            <Area
              type={lineType}
              dataKey={dataKeys[0]}
              stroke="none"
              fill={`url(#${gradientId}-0)`}
              isAnimationActive
              animationDuration={700}
              animationEasing="ease-out"
              legendType="none"
              tooltipType="none"
            />
          )}
          {dataKeys.map((key, index) => (
            <Line
              key={`line-${key}`}
              type={lineType}
              dataKey={key}
              stroke={colors[index]}
              strokeWidth={2.25}
              dot={false}
              activeDot={{
                r: dotSize,
                fill: colors[index],
                stroke: chartSurfaceStroke,
                strokeWidth: 2.5,
              }}
              isAnimationActive
              animationDuration={700}
              animationEasing="ease-out"
            />
          ))}
        </ComposedChart>
      </ChartContainer>
    </div>
  );
};

export default LineChartComponent;
