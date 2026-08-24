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
  handleChange?: (value: any) => void;
  onChange?: (value: any) => void;
  options: { label: string; value: any }[];
  className?: string;
}

export const FilterSelect = forwardRef<HTMLDivElement, FloatingSelectProps>(
  ({ label, value, handleChange, onChange, options, className }, ref) => {
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
                "flex h-[42px] w-full items-center justify-between rounded-lg border border-[var(--serve-border)] bg-[var(--serve-surface)] px-3 text-left text-sm outline-none transition",
                "hover:border-[color-mix(in_srgb,var(--serve-fg)_18%,var(--serve-border))] focus-visible:border-[var(--serve-accent)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--serve-accent)_18%,transparent)]",
                isOpen &&
                  "border-[var(--serve-accent)] ring-2 ring-[color-mix(in_srgb,var(--serve-accent)_18%,transparent)]",
              )}
            >
              <span
                className={cn(
                  "truncate",
                  hasValue
                    ? "text-[var(--serve-fg)]"
                    : "text-[var(--serve-muted)]",
                )}
              >
                {selectedOption?.label || label}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-[var(--serve-muted)] transition-transform",
                  isOpen && "rotate-180",
                )}
              />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            className="max-h-72 w-[var(--radix-dropdown-menu-trigger-width)] min-w-[200px] overflow-y-auto border-[var(--serve-border)] bg-[var(--serve-surface)] text-[var(--serve-fg)]"
          >
            {options.map((option) => {
              const active = value === option.value;
              return (
                <DropdownMenuItem
                  key={String(option.value)}
                  onSelect={() => {
                    handleChange?.(option.value);
                    onChange?.(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "justify-between focus:bg-[var(--serve-surface-2)] focus:text-[var(--serve-fg)]",
                    active &&
                      "bg-[color-mix(in_srgb,var(--serve-accent)_10%,var(--serve-surface))] text-[var(--serve-accent)]",
                  )}
                >
                  <span>{option.label}</span>
                  {active ? (
                    <Check className="h-4 w-4 text-[var(--serve-accent)]" />
                  ) : null}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  },
);

FilterSelect.displayName = "FilterSelect";
