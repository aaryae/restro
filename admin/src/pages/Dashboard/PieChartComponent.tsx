import React, { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";
import chroma from "chroma-js";
import { VerticalAlignmentType } from "recharts/types/component/DefaultLegendContent";
import {
  chartSurfaceStroke,
  formatChartValue,
  useChartPalette,
} from "./chartTheme";
import ChartEmptyState from "./components/ChartEmptyState";

interface ChartData {
  name: string;
  value?: number;
  [key: string]: unknown;
}

interface PieChartProps {
  data: ChartData[];
  width?: number;
  height?: number;
  showLabels?: boolean;
  showLegend?: boolean;
  legendPosition?: VerticalAlignmentType;
  showTooltip?: boolean;
  colorScale?: string[];
  nameKey?: keyof ChartData;
  dataKey?: keyof ChartData;
  responsive?: boolean;
  colors?: string[];
}

const generateColors = (count: number, colorScale: string[]): string[] => {
  if (colorScale.length >= count) return colorScale.slice(0, count);
  return chroma.scale(colorScale).mode("lch").colors(count);
};

function ActiveShape(props: any) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } =
    props;

  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 5}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      stroke={chartSurfaceStroke}
      strokeWidth={3}
      cornerRadius={4}
    />
  );
}

const PieChartComponent: React.FC<PieChartProps> = ({
  data,
  width = 400,
  height: _height = 300,
  showTooltip: _showTooltip = true,
  colorScale,
  nameKey = "name",
  dataKey = "value",
  responsive = false,
  colors: fixedColors,
  showLegend = true,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const themePalette = useChartPalette();
  const scale = colorScale ?? themePalette;

  const chartData = useMemo(
    () =>
      (data || []).filter(
        (item) => typeof item.value === "number" && item.value > 0,
      ),
    [data],
  );

  const total = useMemo(
    () => chartData.reduce((sum, item) => sum + (item.value || 0), 0),
    [chartData],
  );

  const colors = useMemo(() => {
    if (fixedColors && fixedColors.length >= chartData.length) {
      return fixedColors.slice(0, chartData.length);
    }
    return generateColors(chartData.length, scale);
  }, [chartData.length, fixedColors, scale]);

  const ChartContainer = responsive ? ResponsiveContainer : React.Fragment;
  const containerProps = responsive ? { width: "100%", aspect: 1 } : {};

  const activeItem =
    activeIndex != null && chartData[activeIndex] ? chartData[activeIndex] : null;
  const activePct =
    activeItem && total > 0
      ? ((Number(activeItem.value) || 0) / total) * 100
      : null;

  if (!chartData.length) return <ChartEmptyState />;

  return (
    <div className="min-w-0 w-full">
      <div className="relative mx-auto aspect-square w-full max-w-[240px]">
        <ChartContainer
          id="pie-chart"
          className="recharts-responsive-container relative z-10"
          {...containerProps}
        >
          <PieChart
            width={responsive ? undefined : width}
            height={responsive ? undefined : width}
          >
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="68%"
              outerRadius="94%"
              dataKey={dataKey}
              nameKey={nameKey}
              paddingAngle={chartData.length > 1 ? 1.5 : 0}
              stroke={chartSurfaceStroke}
              strokeWidth={3}
              cornerRadius={4}
              isAnimationActive
              animationDuration={650}
              animationEasing="ease-out"
              activeIndex={activeIndex ?? undefined}
              activeShape={ActiveShape}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index]}
                  style={{ outline: "none", cursor: "pointer" }}
                />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>

        {/* Sits inside the donut hole only, so it never blocks slice hovers. */}
        <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center">
          <div className="flex w-[58%] flex-col items-center justify-center text-center">
            {activeItem ? (
              <>
                <p
                  className="line-clamp-2 text-[11px] font-medium leading-tight text-[var(--serve-muted)]"
                  title={String(activeItem.name)}
                >
                  {String(activeItem.name)}
                </p>
                <p className="mt-1 text-[15px] font-bold tabular-nums tracking-tight text-[var(--serve-fg)]">
                  {formatChartValue(Number(activeItem.value) || 0)}
                </p>
                {activePct != null && (
                  <p className="mt-0.5 text-[11px] font-medium tabular-nums text-[var(--serve-muted)]">
                    {activePct.toFixed(1)}%
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--serve-muted)]">
                  Total
                </p>
                <p className="mt-1 text-[17px] font-bold tabular-nums tracking-tight text-[var(--serve-fg)]">
                  {formatChartValue(total)}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {showLegend && (
        <div className="mt-5 flex flex-col gap-1">
          {chartData.map((item, index) => {
            const pct = total > 0 ? ((item.value || 0) / total) * 100 : 0;
            const isActive = activeIndex === index;
            return (
              <div
                key={String(item.name)}
                className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 transition-colors"
                style={{
                  backgroundColor: isActive
                    ? "var(--serve-surface-2)"
                    : "transparent",
                }}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: colors[index] }}
                  />
                  <span className="truncate text-[12.5px] font-medium text-[var(--serve-fg)]">
                    {item.name}
                  </span>
                </div>
                <div className="flex shrink-0 items-baseline gap-2">
                  <span className="text-[12.5px] font-semibold tabular-nums text-[var(--serve-fg)]">
                    {formatChartValue(item.value || 0)}
                  </span>
                  <span className="w-[38px] text-right text-[11px] font-medium tabular-nums text-[var(--serve-muted)]">
                    {pct.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PieChartComponent;
