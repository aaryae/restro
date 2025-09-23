import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
  PieLabelRenderProps,
} from "recharts";
import chroma from "chroma-js";
import { VerticalAlignmentType } from "recharts/types/component/DefaultLegendContent";

// Default color scale anchors for chroma-js
const DEFAULT_COLOR_SCALE = ["#0088FE", "#FF8042"];

// Interface for data shape
interface ChartData {
  name: string;
  value?: number;
  [key: string]: unknown; // Allow additional properties
}

interface TootTipFormatterProps {
  name: string;
  value: number;
}

// Props interface
interface PieChartProps {
  data: ChartData[];
  width?: number;
  height?: number;
  outerRadius?: number;
  showLabels?: boolean;
  showLegend?: boolean;
  legendPosition?: VerticalAlignmentType;
  showTooltip?: boolean;
  tooltipFormatter?: (payload: TootTipFormatterProps) => string;
  colorScale?: string[];
  nameKey?: keyof ChartData;
  dataKey?: keyof ChartData;
  responsive?: boolean;
  // Explicit colors to use in order of the data array. If provided and sufficient,
  // these will be used instead of the generated chroma scale colors.
  colors?: string[];
}

interface ExtendedPreLabelRenderProps extends PieLabelRenderProps {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  midAngle: number;
}

// Utility to generate dynamic colors
// const generateColors = (
//   count: number,
//   colorScale: string[] = DEFAULT_COLOR_SCALE,
// ): string[] => {
//   return chroma.scale(colorScale).mode("lch").colors(count);
// };

// also ensures WACC guidelines
const generateColors = (
  count: number,
  colorScale: string[] = DEFAULT_COLOR_SCALE,
): string[] => {
  const colors = chroma.scale(colorScale).mode("lch").colors(count);
  return colors.map((color) => {
    const contrast = chroma.contrast(color, "#fff");
    if (contrast < 4.5) {
      return chroma(color).luminance(0.5).hex(); // Adjust luminance for better contrast
    }
    return color;
  });
};

// Custom label renderer for percentage
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: ExtendedPreLabelRenderProps): JSX.Element => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={12}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const PieChartComponent: React.FC<PieChartProps> = ({
  data,
  width = 400,
  height = 250,
  outerRadius = 80,
  showLabels = true,
  showLegend = true,
  legendPosition = "bottom",
  showTooltip = true,
  colorScale = DEFAULT_COLOR_SCALE,
  nameKey = "name",
  dataKey = "value",
  responsive = false,
  colors: fixedColors,
}) => {
  // Generate colors based on data length
  const colors = useMemo(() => {
    // Prefer explicit colors if provided and long enough
    if (fixedColors && fixedColors.length >= data.length) {
      return fixedColors.slice(0, data.length);
    }
    // If user provided a full list in colorScale, use it directly
    if (colorScale && colorScale.length >= data.length) {
      return colorScale.slice(0, data.length);
    }
    // Fallback to generated accessible colors
    return generateColors(data.length, colorScale);
  }, [data.length, fixedColors, colorScale]);

  // Render the chart inside ResponsiveContainer if responsive is true
  const ChartContainer = responsive ? ResponsiveContainer : React.Fragment;
  const containerProps = responsive ? { width: "100%", height } : {};

  // Early return if no data
  if (!data || data.length === 0) {
    return <div>No data available</div>;
  }

  return (
    <ChartContainer
      id="pie-chart"
      className="recharts-responsive-container"
      {...containerProps}
    >
      <PieChart width={responsive ? undefined : width} height={height}>
        {showTooltip && <Tooltip />}
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={showLabels ? renderCustomizedLabel : false}
          outerRadius={outerRadius}
          dataKey={dataKey}
          nameKey={nameKey}
        >
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={colors[index]}
              style={{ outline: "none" }}
            />
          ))}
        </Pie>
        {showLegend && (
          <Legend
            verticalAlign={legendPosition}
            align={
              legendPosition === "bottom" || legendPosition === "top"
                ? "center"
                : "left"
            }
          />
        )}
      </PieChart>
    </ChartContainer>
  );
};

export default PieChartComponent;
