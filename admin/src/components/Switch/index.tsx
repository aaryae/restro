import React from "react";
import { cn } from "@/lib/utils";

interface ToggleSwitchProps {
  isActive: boolean;
  onToggle: (value: boolean) => void;
  disabled?: boolean;
  className?: string;
}

function toBool(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  isActive,
  onToggle,
  disabled = false,
  className,
}) => {
  const active = toBool(isActive);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
        onToggle(!active);
      }}
      className={cn(
        "relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaryColor/30 disabled:cursor-not-allowed disabled:opacity-50",
        active ? "bg-primaryColor" : "bg-gray-400",
        className,
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform",
          active && "translate-x-4",
        )}
      />
    </button>
  );
};

export default ToggleSwitch;
