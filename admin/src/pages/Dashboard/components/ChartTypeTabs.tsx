import cn from "clsx";

export type ChartType = "pie" | "bar" | "line";

const chartTypes: { label: string; value: ChartType }[] = [
  { label: "Pie", value: "pie" },
  { label: "Bar", value: "bar" },
  { label: "Line", value: "line" },
];

type ChartTypeTabsProps = {
  value: ChartType;
  onChange: (value: ChartType) => void;
  allowed?: ChartType[];
  className?: string;
};

export default function ChartTypeTabs({
  value,
  onChange,
  allowed = ["pie", "bar", "line"],
  className,
}: ChartTypeTabsProps) {
  return (
    <div
      className={cn(
        "inline-flex gap-1 rounded-lg border border-slate-200 bg-slate-50/80 p-1",
        className,
      )}
    >
      {chartTypes
        .filter((t) => allowed.includes(t.value))
        .map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
            className={cn(
              "rounded-md px-2.5 py-1 text-[12px] font-medium transition-all duration-200 sm:px-3",
              value === type.value
                ? "bg-primaryColor text-white shadow-sm"
                : "text-slate-600 hover:text-slate-800",
            )}
          >
            {type.label}
          </button>
        ))}
    </div>
  );
}
