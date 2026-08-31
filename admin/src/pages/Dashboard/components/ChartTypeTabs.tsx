import cn from "clsx";

export type ChartType = "pie" | "bar" | "line";

const chartTypes: { label: string; value: ChartType }[] = [
  { label: "Pie", value: "pie" },
  { label: "Bar", value: "bar" },
  { label: "Line", value: "line" },
];

type ChartTypeTabsProps = {
  value: ChartType;
  onChange: (type: ChartType) => void;
  allowed?: ChartType[];
  className?: string;
};

export default function ChartTypeTabs({
  value = "pie",
  onChange,
  allowed = ["pie", "bar", "line"],
  className,
}: ChartTypeTabsProps) {
  const options = chartTypes.filter((t) => allowed.includes(t.value));
  const active = options.some((t) => t.value === value)
    ? value
    : (options[0]?.value ?? "pie");
  return (
    <div className={cn("dash-tabs", className)}>
      {options.map((type) => (
        <button
          key={type.value}
          type="button"
          data-active={active === type.value}
          className="dash-tab"
          onClick={() => onChange(type.value)}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
}
