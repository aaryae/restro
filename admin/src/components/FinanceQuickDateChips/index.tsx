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
      <span className="text-[12px] font-medium text-[var(--serve-muted)]">
        Quick date:
      </span>
      {options.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onSelect(item.value)}
          className={`h-8 rounded-lg px-2.5 text-[12px] font-medium transition ${
            selected === item.value
              ? "bg-[var(--primary-color)] text-[var(--primary-fg)]"
              : "border border-[var(--serve-border)] bg-[var(--serve-surface)] text-[var(--serve-muted)] hover:border-[color-mix(in_srgb,var(--serve-accent)_30%,var(--serve-border))] hover:text-[var(--serve-fg)]"
          }`}
        >
          {item.label}
        </button>
      ))}
      {selected && onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="h-8 px-2 text-[12px] font-medium text-[var(--serve-negative)] transition hover:opacity-80"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}
