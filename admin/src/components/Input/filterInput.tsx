import type React from "react";
import { forwardRef } from "react";
import { cn } from "../../lib/utils";

interface FilterInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
}

export const FilterInput = forwardRef<HTMLInputElement, FilterInputProps>(
  ({ label, icon, className, ...props }, ref) => {
    return (
      <div className="relative">
        {icon ? (
          <div className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-[var(--serve-muted)]">
            {icon}
          </div>
        ) : null}
        <input
          ref={ref}
          className={cn(
            "serve-search-input h-[42px] w-full rounded-lg border border-[var(--serve-border)] bg-[var(--serve-surface)] px-3 text-sm text-[var(--serve-fg)] transition-colors",
            "placeholder:text-[var(--serve-muted)]",
            "focus:border-[var(--serve-accent)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--serve-accent)_18%,transparent)]",
            icon && "pl-10",
            className,
          )}
          placeholder={label}
          {...props}
        />
      </div>
    );
  },
);

FilterInput.displayName = "FilterInput";
