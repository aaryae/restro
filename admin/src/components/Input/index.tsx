import React, { forwardRef, useState } from "react";
import { FieldError } from "react-hook-form";
import "./input.css";
import useTranslation from "@/locale/useTranslation";
import { RequiredMark } from "@/components/RequiredMark";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string | React.ReactNode;
  error?: string | FieldError;
  className?: string;
  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
  isRequired?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      className,
      leftSection,
      rightSection,
      type = "text",
      isRequired,
      required,
      ...rest
    },
    ref,
  ) => {
    const translate = useTranslation();
    const [showPasswordVisibility, setShowPasswordVisibility] =
      useState<boolean>(false);
    const showRequired = Boolean(isRequired || required);

    const handlePasswordVisibility = () => {
      setShowPasswordVisibility(!showPasswordVisibility);
    };

    return (
      <div className={`input-container ${className || ""}`}>
        {label && (
          <label className="input-label">
            {typeof label === "string" ? translate(label) : label}
            {showRequired && <RequiredMark />}
          </label>
        )}
        <div
          className={`input-wrapper ${
            type === "checkbox" ? "input-checkbox-wrapper" : ""
          } ${rest.disabled === "true" ? "opacity-90 cursor-not-allowed" : "opacity-100"}`}
        >
          {leftSection && (
            <div className="input-left-section">{leftSection}</div>
          )}
          <input
            ref={ref}
            type={type === "password" && showPasswordVisibility ? "text" : type}
            required={required}
            className={`input-field ${error ? "input-error-field" : ""}  ${rest.disabled === "true" ? "cursor-not-allowed" : "cursor-text"}`}
            {...rest}
          />
          {type === "password" && (
            <div
              className="input-right-section cursor-pointer"
              onClick={handlePasswordVisibility}
            >
              {showPasswordVisibility ? "🙈" : "👁️"}
            </div>
          )}
          {rightSection && (
            <div className="input-right-section">{rightSection}</div>
          )}
        </div>
        {error && (
          <span className="input-error">
            {typeof error === "string" ? error : error.message}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = "Input"; // Needed for forwardRef components

export default Input;
