import React, { forwardRef } from "react";
import { FieldError } from "react-hook-form";
import useTranslation from "@/locale/useTranslation";
import { RequiredMark } from "@/components/RequiredMark";
import "./multiselect-checkbox.css";

interface MultiSelectCheckboxProps
  extends React.HTMLAttributes<HTMLDivElement> {
  label?: string | React.ReactNode;
  error?: string | FieldError;
  className?: string;
  name: string; // Required for react-hook-form
  value?: (string | number)[]; // Controlled value from react-hook-form
  options: { label: string; value: string | number }[]; // Options for checkboxes
  onValuesChange?: (selectedValues: (string | number)[]) => void; // Optional callback
  onChange?: (selectedValues: (string | number)[]) => void; // For react-hook-form
  isRequired?: boolean;
}

const MultiSelectCheckbox = forwardRef<
  HTMLInputElement,
  MultiSelectCheckboxProps
>(
  (
    {
      label,
      error,
      className,
      name,
      value = [], // Default to empty array
      options,
      onValuesChange,
      onChange,
      isRequired,
      ...rest
    },
    ref,
  ) => {
    const translate = useTranslation();

    const handleCheckboxChange = (optionValue: string | number) => {
      const newValues = value.includes(optionValue)
        ? value.filter((v) => v !== optionValue) // Remove if already selected
        : [...value, optionValue]; // Add if not selected
      onChange?.(newValues); // Update react-hook-form state
      onValuesChange?.(newValues); // Call optional callback
    };

    return (
      <div
        className={`multiselect-checkbox-container ${className || ""}`}
        {...rest}
      >
        {label && (
          <label className="input-label">
            {typeof label === "string" ? translate(label) : label}
            {isRequired && <RequiredMark />}
          </label>
        )}
        <div className="checkbox-group">
          {options.map((option, index) => (
            <div key={index} className="checkbox-item">
              <input
                ref={ref}
                type="checkbox"
                id={`${name}-${index}`}
                name={name}
                value={option.value}
                checked={value.includes(option.value)} // Controlled by value prop
                className={`h-4 w-4 border border-gray-300 rounded-sm text-[#0190dd] focus:ring-[#0190dd] ${
                  error ? "border-red-500" : ""
                }`}
                onChange={() => handleCheckboxChange(option.value)}
              />
              <label htmlFor={`${name}-${index}`} className="text-black ml-2">
                {option.label}
              </label>
            </div>
          ))}
        </div>
        {error && (
          <span className="multiselect-error text-red-500 text-sm">
            {typeof error === "string" ? error : error.message}
          </span>
        )}
      </div>
    );
  },
);

MultiSelectCheckbox.displayName = "MultiSelectCheckbox";

export default MultiSelectCheckbox;
