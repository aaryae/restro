import { useState, forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FloatingSelectProps {
  label: string;
  value: any;
  handleChange: (value: any) => void;
  options: { label: string; value: any }[];
  className?: string;
}

export const FilterSelect = forwardRef<HTMLDivElement, FloatingSelectProps>(
  ({ label, value, handleChange, options, className }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasValue = value !== null && value !== undefined;

    const selectedOption = options.find((option) => option.value === value);

    return (
      <div ref={ref} className="relative">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "w-full px-3 py-3 h-full border border-gray-300 rounded-md bg-white transition-all duration-200 ease-in-out text-left",
                "focus:border-[0.5px] focus:border-inputBg focus:ring-[0.5px] focus:ring-inputBg focus:outline-none",
                "hover:border-gray-400",
                className,
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "transition-all duration-200",
                    hasValue ? "text-gray-900" : "text-transparent",
                  )}
                >
                  {selectedOption?.label || ""}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </div>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-full min-w-[200px]">
            {options.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={value === option.value}
                onCheckedChange={() => handleChange(option.value)}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <label
          className={cn(
            "absolute left-3 transition-all duration-200 ease-in-out pointer-events-none",
            "text-gray-500 bg-white px-1",
            isOpen || hasValue
              ? "-top-2 text-xs text-black font-medium"
              : "top-3 text-base",
          )}
        >
          {label}
        </label>
      </div>
    );
  },
);
