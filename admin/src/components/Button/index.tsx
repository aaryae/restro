import React, { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  type?: "button" | "submit" | "reset";
  className?: string;
  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
  isLoading?: boolean; // For loading state
  handleClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({
  type = "button",
  className,
  leftSection,
  rightSection,
  isLoading = false,
  children,
  handleClick,
  ...rest
}) => {
  return (
    <button
      type={type}
      className={`button ${className || ""}`}
      {...rest}
      onClick={handleClick}
    >
      {isLoading && <span className="loading-spinner"></span>}
      {leftSection && <div className="button-left-section">{leftSection}</div>}
      <span className="button-text flex justify-center items-center">
        {children}
      </span>
      {rightSection && (
        <div className="button-right-section">{rightSection}</div>
      )}
    </button>
  );
};

export default Button;
