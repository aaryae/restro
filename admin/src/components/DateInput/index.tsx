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
            className="flex h-[42px] w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 text-left text-sm transition-all duration-200 ease-in-out focus:border-bg-inputBg focus:outline-none focus:ring-1 focus:ring-bg-inputBg hover:border-gray-400"
          >
            <span
              className={`transition-all duration-200 ${hasValue ? "text-gray-900" : "text-transparent"}`}
            >
              {hasValue ? selected!.toLocaleDateString() : ""}
            </span>
            <Calendar className="h-4 w-4 shrink-0 text-gray-500" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="single"
            required={true}
            selected={selected}
            onSelect={handleSelect}
          />
        </PopoverContent>
      </Popover>

      <label
        className={`pointer-events-none absolute left-3 bg-white px-1 text-gray-500 transition-all duration-200 ease-in-out ${
          hasValue
            ? "-top-2 text-xs font-medium text-black"
            : "top-2.5 text-sm"
        }`}
      >
        {label}
      </label>
    </div>
  );
}
