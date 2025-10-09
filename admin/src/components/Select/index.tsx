import React, { forwardRef, ReactNode } from "react";
import { FieldError } from "react-hook-form";
import "./select.css";
import useTranslation from "@/locale/useTranslation";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string | ReactNode;
  error?: string | FieldError;
  className?: string;
  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
  options: { label: string; value: string | number }[]; // options for the select dropdown
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, error, className, leftSection, rightSection, options, ...rest },
    ref,
  ) => {
    const translate = useTranslation();
    return (
      <div className={`select-container ${className || ""}`}>
        {label && (
          <label className="input-label">
            {" "}
            {typeof label === "string" ? translate(label) : label}
            {/* {translate(label)} */}
          </label>
        )}
        <div className={`select-wrapper`}>
          {leftSection && (
            <div className="select-left-section">{leftSection}</div>
          )}
          <select
            ref={ref}
            className={`select-field ${error ? "select-error-field" : ""}`}
            {...rest}
          >
            <option value="" disabled selected>
              Select an Option
            </option>
            {options.map((option, index) => {
              if (option.options && option.options.length > 0) {
                // If nested options exist, render as an <optgroup>
                return (
                  <optgroup key={index} label={option.label}>
                    {option.options.map((nestedOption, nestedIndex) => (
                      <option
                        key={`${index}-${nestedIndex}`}
                        value={nestedOption.value}
                      >
                        {nestedOption.label}
                      </option>
                    ))}
                  </optgroup>
                );
              }

              // Render as a regular <option> if no nested options exist
              return (
                <option key={index} value={option.value}>
                  {option.label}
                </option>
              );
            })}
          </select>

          {rightSection && (
            <div className="select-right-section">{rightSection}</div>
          )}
        </div>
        {error && (
          <span className="select-error">
            {typeof error === "string" ? error : error.message}
          </span>
        )}
      </div>
    );
  },
);

Select.displayName = "Select"; // Needed for forwardRef components

export default Select;
