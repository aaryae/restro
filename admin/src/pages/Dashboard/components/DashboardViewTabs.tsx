type DashboardView =
  | "overview"
  | "purchase-expense"
  | "revenue"
  | "cashbanks";

const viewOptions: { label: string; value: DashboardView }[] = [
  { label: "Overview", value: "overview" },
  { label: "Purchase & Expense", value: "purchase-expense" },
  { label: "Revenue", value: "revenue" },
  { label: "Cash & Banks", value: "cashbanks" },
];

type DashboardViewTabsProps = {
  value: DashboardView;
  onChange: (value: DashboardView) => void;
};

export default function DashboardViewTabs({
  value,
  onChange,
}: DashboardViewTabsProps) {
  return (
    <div className="w-full min-w-0 overflow-x-auto xl:w-auto">
      <div className="dash-tabs">
        {viewOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            data-active={value === option.value}
            className="dash-tab"
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export type { DashboardView };
