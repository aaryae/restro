import type React from "react";

import { useState, forwardRef } from "react";
// import { cn } from "@/lib/utils";
import { cn } from "../../lib/utils";

interface FloatingInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
}

export const FilterInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ label, icon, className, value, onChange, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value && value.toString().length > 0;

    return (
      <div className="relative">
        <input
          ref={ref}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "peer h-[42px] w-full rounded-md border border-gray-300 bg-white px-3 text-sm transition-all duration-200 ease-in-out",
            "focus:border-[0.5px] focus:border-inputBg focus:ring-[0.5px] focus:ring-inputBg focus:outline-none",
            "placeholder-transparent",
            icon && "pl-10",
            className,
          )}
          placeholder={label}
          {...props}
        />

        {icon && (
          <div
            className={cn(
              "absolute left-3 transition-all duration-200 ease-in-out",
              isFocused || hasValue
                ? "top-2 text-black"
                : "top-2.5 text-gray-500",
            )}
          >
            <div className="mt-0.5 h-4 w-4">{icon}</div>
          </div>
        )}

        <label
          className={cn(
            "absolute left-3 transition-all duration-200 ease-in-out pointer-events-none",
            "text-gray-500 bg-white px-1",
            icon && "left-10",
            isFocused || hasValue
              ? "-top-2 text-xs text-black font-medium"
              : "top-2.5 text-sm",
          )}
        >
          {label}
        </label>
      </div>
    );
  },
);
