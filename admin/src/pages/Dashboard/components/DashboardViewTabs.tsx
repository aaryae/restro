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
      <div className="inline-flex min-w-max gap-1 rounded-lg border border-slate-200 bg-slate-50/80 p-1">
        {viewOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-[12px] font-medium transition-all duration-200 sm:text-[13px] ${
              value === option.value
                ? "bg-primaryColor text-white shadow-sm"
                : "text-slate-600 hover:bg-white/60 hover:text-slate-800"
            }`}
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
