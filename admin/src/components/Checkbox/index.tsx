import React, { forwardRef } from "react";
import { FieldError } from "react-hook-form";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | FieldError;
  className?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className, ...rest }, ref) => {
    return (
      <div className={`bg-white text-black ${className || ""}`}>
        <div className="flex items-center gap-[0.5rem] bg-white">
          <input
            ref={ref}
            type="checkbox"
            className={`h-4 w-4 border border-gray-300 rounded-sm text-[#0190dd] focus:ring-[#0190dd] ${
              error ? "border-red-500" : ""
            }`}
            {...rest}
          />
          {label && <label className="text-black">{label}</label>}
        </div>
        {error && (
          <span className="text-red-500 text-sm">
            {typeof error === "string" ? error : error.message}
          </span>
        )}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox"; // Needed for forwardRef components

export default Checkbox;
