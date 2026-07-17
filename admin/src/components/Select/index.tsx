import React, { forwardRef, ReactNode, useMemo, useState } from "react";
import { FieldError } from "react-hook-form";
import { Check, ChevronDown } from "lucide-react";
import useTranslation from "@/locale/useTranslation";
import { cn } from "@/lib/utils";
import { RequiredMark } from "@/components/RequiredMark";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type SelectOption = {
  label: string;
  value: string | number;
  disabled?: boolean;
  options?: { label: string; value: string | number; disabled?: boolean }[];
};

interface SelectProps {
  label?: string | ReactNode;
  error?: string | FieldError;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
  options: SelectOption[];
  value?: string | number | null;
  defaultValue?: string | number;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
  id?: string;
  isRequired?: boolean;
  required?: boolean;
  onBlur?: React.FocusEventHandler;
  onChange?: (event: { target: { value: string; name?: string } }) => void;
  onValueChange?: (value: string) => void;
  resolveLabel?: (value: string) => string | undefined;
}

const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      label,
      error,
      className,
      triggerClassName,
      contentClassName,
      leftSection,
      rightSection,
      options,
      value,
      defaultValue,
      placeholder = "Select an option",
      disabled,
      name,
      id,
      isRequired,
      required,
      onBlur,
      onChange,
      onValueChange,
      resolveLabel,
    },
    ref,
  ) => {
    const translate = useTranslation();
    const showRequired = Boolean(isRequired || required);
    const [open, setOpen] = useState(false);
    const [uncontrolled, setUncontrolled] = useState(
      defaultValue != null ? String(defaultValue) : "",
    );

    const stringValue =
      value !== undefined && value !== null ? String(value) : uncontrolled;

    const flatOptions = useMemo(() => {
      const list: { label: string; value: string }[] = [];
      (options || []).forEach((option) => {
        if (!option) return;
        if (option.options?.length) {
          option.options.forEach((nested) => {
            if (!nested) return;
            list.push({ label: nested.label, value: String(nested.value) });
          });
        } else {
          list.push({ label: option.label, value: String(option.value) });
        }
      });
      return list;
    }, [options]);

    const selectedLabel =
      (stringValue ? resolveLabel?.(stringValue) : undefined) ??
      flatOptions.find((option) => option.value === stringValue)?.label;

    const commit = (next: string) => {
      if (value === undefined) setUncontrolled(next);
      onValueChange?.(next);
      onChange?.({ target: { value: next, name } });
      setOpen(false);
    };

    const errorText =
      typeof error === "string" ? error : error?.message || undefined;

    return (
      <div className={cn("select-container flex w-full flex-col gap-1", className)}>
        {label && (
          <label htmlFor={id} className="input-label text-left">
            {typeof label === "string" ? translate(label) : label}
            {showRequired && <RequiredMark />}
          </label>
        )}

        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild disabled={disabled}>
            <button
              ref={ref}
              id={id}
              type="button"
              name={name}
              disabled={disabled}
              onBlur={onBlur}
              aria-required={showRequired || undefined}
              className={cn(
                "flex h-10 w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-left text-sm text-slate-700 outline-none transition",
                "hover:border-slate-300",
                "focus-visible:border-primaryColor/40 focus-visible:ring-2 focus-visible:ring-primaryColor/15",
                "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
                open && "border-primaryColor/40 ring-2 ring-primaryColor/15",
                errorText && "border-red-300 focus-visible:ring-red-100",
                triggerClassName,
              )}
            >
              {leftSection}
              <span
                className={cn(
                  "min-w-0 flex-1 truncate",
                  !selectedLabel && "text-slate-400",
                )}
              >
                {selectedLabel || placeholder}
              </span>
              {rightSection}
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-slate-400 transition-transform",
                  open && "rotate-180",
                )}
              />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            className={cn(
              "max-h-72 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto",
              contentClassName,
            )}
          >
            {options.map((option, index) => {
              if (option.options?.length) {
                return (
                  <React.Fragment key={`group-${index}-${option.label}`}>
                    {index > 0 && <DropdownMenuSeparator />}
                    <DropdownMenuLabel>{option.label}</DropdownMenuLabel>
                    {option.options.map((nested) => {
                      const nestedValue = String(nested.value);
                      const active = nestedValue === stringValue;
                      return (
                        <DropdownMenuItem
                          key={nestedValue}
                          disabled={nested.disabled}
                          onSelect={() => commit(nestedValue)}
                          className={cn(
                            "justify-between",
                            active && "bg-primaryColor/5 text-primaryColor",
                          )}
                        >
                          <span>{nested.label}</span>
                          {active && (
                            <Check className="h-4 w-4 text-primaryColor" />
                          )}
                        </DropdownMenuItem>
                      );
                    })}
                  </React.Fragment>
                );
              }

              const optionValue = String(option.value);
              const active = optionValue === stringValue;
              return (
                <DropdownMenuItem
                  key={optionValue}
                  disabled={option.disabled}
                  onSelect={() => commit(optionValue)}
                  className={cn(
                    "justify-between",
                    active && "bg-primaryColor/5 text-primaryColor",
                  )}
                >
                  <span>{option.label}</span>
                  {active && <Check className="h-4 w-4 text-primaryColor" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {errorText && (
          <span className="text-sm text-red-500">{errorText}</span>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";

export default Select;
