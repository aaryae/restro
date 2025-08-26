import { Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

type DateInputProps = {
  label: string;
  value: Date;
  handleChange: (value: Date) => void;
};

export default function DateInput({
  label,
  value,
  handleChange,
}: DateInputProps) {
  return (
    <div className="relative">
      <Popover>
        <PopoverTrigger asChild>
          <button className="w-full h-full px-3 py-3 border border-gray-300 rounded-md bg-white transition-all duration-200 ease-in-out text-left focus:border-bg-inputBg focus:ring-1 focus:ring-bg-inputBg focus:outline-none hover:border-gray-400">
            <div className="flex items-center justify-between">
              <span
                className={`transition-all duration-200 ${value ? "text-gray-900" : "text-transparent"}`}
              >
                {value ? value.toLocaleDateString() : ""}
              </span>
              <Calendar className="h-4 w-4 text-gray-500" />
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="single"
            required={true}
            selected={value}
            onSelect={handleChange}
          />
        </PopoverContent>
      </Popover>

      <label
        className={`absolute left-3 transition-all duration-200 ease-in-out pointer-events-none text-gray-500 bg-white px-1 ${
          value ? "-top-2 text-xs text-black font-medium" : "top-3 text-base"
        }`}
      >
        {label}
      </label>
    </div>
  );
}
