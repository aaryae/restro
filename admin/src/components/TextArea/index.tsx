import React, { forwardRef } from "react";
import { FieldError } from "react-hook-form";
import "./textarea.css";
import useTranslation from "@/locale/useTranslation";
import { RequiredMark } from "@/components/RequiredMark";

interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: any | React.ReactNode;
  error?: string | FieldError;
  className?: string;
  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
  isRequired?: boolean;
  rows?: number;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      error,
      className,
      rows,
      leftSection,
      rightSection,
      isRequired,
      required,
      ...rest
    },
    ref,
  ) => {
    const translate = useTranslation();
    const showRequired = Boolean(isRequired || required);
    return (
      <div className={`textarea-container ${className || ""}`}>
        {label && (
          <label className="input-label">
            {typeof label === "string" ? translate(label) : label}{" "}
            {showRequired && <RequiredMark />}
          </label>
        )}
        <div className="textarea-wrapper">
          {leftSection && (
            <div className="textarea-left-section">{leftSection}</div>
          )}
          <textarea
            ref={ref}
            rows={rows || 10}
            required={required}
            className={`textarea-field ${error ? "textarea-error-field" : ""}`}
            {...rest}
          />
          {rightSection && (
            <div className="textarea-right-section">{rightSection}</div>
          )}
        </div>
        {error && (
          <span className="textarea-error">
            {typeof error === "string" ? error : error.message}
          </span>
        )}
      </div>
    );
  },
);

TextArea.displayName = "TextArea"; // Needed for forwardRef components

export default TextArea;
