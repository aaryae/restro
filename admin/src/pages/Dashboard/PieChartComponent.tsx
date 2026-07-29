import React, { useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Sector,
} from "recharts";
import chroma from "chroma-js";
import { VerticalAlignmentType } from "recharts/types/component/DefaultLegendContent";
import {
  CHART_PALETTE,
  formatChartValue,
} from "./chartTheme";

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

const generateColors = (
  count: number,
  colorScale: string[] = CHART_PALETTE,
): string[] => {
  if (colorScale.length >= count) return colorScale.slice(0, count);
  const colors = chroma.scale(colorScale).mode("lch").colors(count);
  return colors.map((color) => {
    const contrast = chroma.contrast(color, "#fff");
    if (contrast < 4.5) {
      return chroma(color).luminance(0.5).hex();
    }
    return color;
  });
};

function ActiveShape(props: any) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } =
    props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 4}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="#fff"
        strokeWidth={2}
        cornerRadius={3}
      />
    </g>
  );
}

const PieChartComponent: React.FC<PieChartProps> = ({
  data,
  width = 400,
  height = 300,
  showTooltip: _showTooltip = true,
  colorScale = CHART_PALETTE,
  nameKey = "name",
  dataKey = "value",
  responsive = false,
  colors: fixedColors,
  showLegend = true,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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
    return generateColors(chartData.length, colorScale);
  }, [chartData.length, fixedColors, colorScale]);

  const ChartContainer = responsive ? ResponsiveContainer : React.Fragment;
  const containerProps = responsive ? { width: "100%", aspect: 1 } : {};

  const activeItem =
    activeIndex != null && chartData[activeIndex]
      ? chartData[activeIndex]
      : null;
  const activePct =
    activeItem && total > 0
      ? ((Number(activeItem.value) || 0) / total) * 100
      : null;

  if (!chartData.length) {
    return (
      <div className="flex h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-gradient-to-b from-slate-50/80 to-white text-center">
        <p className="text-[13px] font-medium text-slate-600">No data yet</p>
        <p className="mt-1 text-[12px] text-slate-400">
          Charts will appear once records are available
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0 w-full">
      <div className="relative mx-auto aspect-square w-full max-w-[260px] overflow-visible">
        <ChartContainer
          id="pie-chart"
          className="recharts-responsive-container relative z-10"
          {...containerProps}
        >
          <PieChart width={responsive ? undefined : width} height={responsive ? undefined : width}>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="78%"
              dataKey={dataKey}
              nameKey={nameKey}
              paddingAngle={chartData.length > 1 ? 2 : 0}
              stroke="#fff"
              strokeWidth={2}
              cornerRadius={3}
              isAnimationActive
              animationDuration={700}
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
                  style={{
                    outline: "none",
                    filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.06))",
                    cursor: "pointer",
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>

        {/* Center label stays under tooltips; only covers the donut hole */}
        <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center">
          <div className="flex h-[46%] w-[46%] max-w-[9.5rem] flex-col items-center justify-center rounded-full bg-white/95 px-2 text-center shadow-[inset_0_0_0_1px_rgba(226,232,240,0.9)]">
            {activeItem ? (
              <>
                <p
                  className="line-clamp-2 text-[10px] font-medium leading-tight text-slate-500"
                  title={String(activeItem.name)}
                >
                  {String(activeItem.name)}
                </p>
                <p className="mt-1 text-sm font-semibold tabular-nums text-slate-800 sm:text-base">
                  {formatChartValue(Number(activeItem.value) || 0)}
                </p>
                {activePct != null && (
                  <p className="mt-0.5 text-[10px] tabular-nums text-slate-400">
                    {activePct.toFixed(1)}%
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Total
                </p>
                <p className="mt-0.5 text-base font-semibold tabular-nums text-slate-800 sm:text-lg">
                  {formatChartValue(total)}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {showLegend && (
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {chartData.map((item, index) => {
            const pct = total > 0 ? ((item.value || 0) / total) * 100 : 0;
            const isActive = activeIndex === index;
            return (
              <div
                key={String(item.name)}
                className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 transition ${
                  isActive
                    ? "border-slate-300 bg-white shadow-sm"
                    : "border-slate-100 bg-slate-50/60"
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: colors[index] }}
                  />
                  <span className="truncate text-[12px] font-medium text-slate-700">
                    {item.name}
                  </span>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[12px] font-semibold tabular-nums text-slate-800">
                    {formatChartValue(item.value || 0)}
                  </p>
                  <p className="text-[11px] text-slate-500">{pct.toFixed(1)}%</p>
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
