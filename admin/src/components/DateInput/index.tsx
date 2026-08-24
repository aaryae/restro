import { Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

type DateInputProps = {
  label: string;
  value?: Date | string | null;
  handleChange?: (value: Date) => void;
  onChange?: (value: Date) => void;
};

export default function DateInput({
  label,
  value,
  handleChange,
  onChange,
}: DateInputProps) {
  const selected =
    value instanceof Date
      ? value
      : value
        ? new Date(value)
        : undefined;

  const hasValue = Boolean(selected && !Number.isNaN(selected.getTime()));

  const handleSelect = (date?: Date) => {
    if (!date) return;
    onChange?.(date);
    handleChange?.(date);
  };

  return (
    <div className="relative">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-[42px] w-full items-center justify-between rounded-lg border border-[var(--serve-border)] bg-[var(--serve-surface)] px-3 text-left text-sm transition-colors hover:border-[color-mix(in_srgb,var(--serve-fg)_18%,var(--serve-border))] focus:border-[var(--serve-accent)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--serve-accent)_18%,transparent)]"
          >
            <span
              className={
                hasValue
                  ? "text-[var(--serve-fg)]"
                  : "text-[var(--serve-muted)]"
              }
            >
              {hasValue ? selected!.toLocaleDateString() : label}
            </span>
            <Calendar className="h-4 w-4 shrink-0 text-[var(--serve-muted)]" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto border-[var(--serve-border)] bg-[var(--serve-surface)] p-0 text-[var(--serve-fg)]"
          align="start"
        >
          <CalendarComponent
            mode="single"
            required={true}
            selected={selected}
            onSelect={handleSelect}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
