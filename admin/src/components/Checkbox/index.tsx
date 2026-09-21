import React, { forwardRef } from "react";
import { FieldError } from "react-hook-form";
import { useFieldId } from "@/hooks/useFieldId";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | FieldError;
  className?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className, id, ...rest }, ref) => {
    const fieldId = useFieldId(id);

    return (
      <div className={`bg-white text-black ${className || ""}`}>
        <div className="flex items-center gap-[0.5rem] bg-white">
          <input
            ref={ref}
            id={fieldId}
            type="checkbox"
            className={`h-4 w-4 border border-gray-300 rounded-sm text-[#0190dd] focus:ring-[#0190dd] ${
              error ? "border-red-500" : ""
            }`}
            {...rest}
          />
          {label && (
            <label htmlFor={fieldId} className="cursor-pointer text-black">
              {label}
            </label>
          )}
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

Checkbox.displayName = "Checkbox";

export default Checkbox;
