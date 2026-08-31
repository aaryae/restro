import { Controller } from "react-hook-form";
import { Button } from "../ui/button";
import { RotateCcw, Search } from "lucide-react";

type FilterField = {
  name: string;
  label: string;
  // Using React.ComponentType to support different field components
  Component: React.ComponentType<any>;
  control: any; // control from react-hook-form; kept generic for reuse across pages
  options?: any;
  className?: string;
  icon?: React.ReactNode;
  handleChange?: (...args: any[]) => void;
  value?: any;
};

export default function PageFilterSample(
  filterFields: FilterField[],
  handleSubmit: any,
  // reset,
  onFilter: (data: any) => void,
  resetFn?: any,
) {
  const onSubmit = (data: any) => {
    onFilter(data);
  };
  const Component = (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"></div> */}

        {filterFields.map(
          ({
            name,
            label,
            Component,
            control,
            options,
            className,
            icon,
            handleChange,
          }: FilterField) => (
            <Controller
              key={name}
              name={name}
              control={control}
              render={({ field }) => {
                const { value: fieldValue, onChange, ...restField } = field;
                return (
                  <Component
                    {...restField}
                    value={fieldValue}
                    onChange={onChange}
                    {...(options && { options })}
                    {...(className && { className })}
                    {...(icon && { icon })}
                    {...(handleChange && { handleChange })}
                    label={label}
                    control={control}
                  />
                );
              }}
            />
          ),
        )}
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
          {resetFn && (
            <button
              type="button"
              onClick={() => {
                resetFn();
              }}
              className="inline-flex h-[42px] flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--serve-border)] bg-[var(--serve-surface)] px-4 text-sm font-medium text-[var(--serve-muted)] transition hover:bg-[var(--serve-surface-2)] hover:text-[var(--serve-fg)] sm:flex-none"
            >
              <RotateCcw className="h-4 w-4" /> Clear
            </button>
          )}
          <Button
            type="submit"
            className="h-[42px] flex-1 bg-primaryColor px-6 text-white sm:flex-none"
          >
            <Search className="mr-2 h-4 w-4" /> Search
          </Button>
        </div>
      </form>
    </div>
  );

  return { Component };
}
