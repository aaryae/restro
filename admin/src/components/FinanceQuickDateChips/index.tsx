interface FinanceQuickDateChipsProps {
  selected: string | null;
  onSelect: (value: string) => void;
  onClear?: () => void;
  options?: { label: string; value: string }[];
}

const defaultOptions = [
  { label: "Yesterday", value: "yesterday" },
  { label: "Today", value: "today" },
];

export default function FinanceQuickDateChips({
  selected,
  onSelect,
  onClear,
  options = defaultOptions,
}: FinanceQuickDateChipsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[12px] font-medium text-slate-500">Quick date:</span>
      {options.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onSelect(item.value)}
          className={`h-8 rounded-lg px-2.5 text-[12px] font-medium transition ${
            selected === item.value
              ? "bg-primaryColor text-white"
              : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
          }`}
        >
          {item.label}
        </button>
      ))}
      {selected && onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="h-8 px-2 text-[12px] font-medium text-rose-500 transition hover:text-rose-600"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}
