import { useState, forwardRef } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "../../lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
    const hasValue = value !== null && value !== undefined && value !== "";
    const selectedOption = options.find((option) => option.value === value);

    return (
      <div ref={ref} className={cn("relative", className)}>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex h-11 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-left text-sm text-slate-700 outline-none transition",
                "hover:border-slate-300 focus-visible:border-primaryColor/40 focus-visible:ring-2 focus-visible:ring-primaryColor/15",
                isOpen && "border-primaryColor/40 ring-2 ring-primaryColor/15",
              )}
            >
              <span className={cn("truncate", !hasValue && "text-transparent")}>
                {selectedOption?.label || label}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-slate-400 transition-transform",
                  isOpen && "rotate-180",
                )}
              />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            className="max-h-72 w-[var(--radix-dropdown-menu-trigger-width)] min-w-[200px] overflow-y-auto"
          >
            {options.map((option) => {
              const active = value === option.value;
              return (
                <DropdownMenuItem
                  key={String(option.value)}
                  onSelect={() => {
                    handleChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "justify-between",
                    active && "bg-primaryColor/5 text-primaryColor",
                  )}
                >
                  <span>{option.label}</span>
                  {active && <Check className="h-4 w-4 text-primaryColor" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <label
          className={cn(
            "pointer-events-none absolute left-3 bg-white px-1 text-slate-500 transition-all duration-200",
            isOpen || hasValue
              ? "-top-2 text-xs font-medium text-slate-700"
              : "top-3 text-sm",
          )}
        >
          {label}
        </label>
      </div>
    );
  },
);

FilterSelect.displayName = "FilterSelect";
