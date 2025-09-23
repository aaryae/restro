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
            value,
          }: FilterField) => (
            <Controller
              key={name}
              name={name}
              control={control}
              render={({ field }) => (
                <Component
                  {...(value && { value })}
                  {...(options && { options })}
                  {...(className && { className })}
                  {...(icon && { icon })}
                  {...field}
                  {...(handleChange && { handleChange })}
                  label={label}
                  control={control}
                />
              )}
            />
          ),
        )}
        <div className="flex items-center gap-2 h-full">
          {resetFn && (
            <button
              type="button"
              onClick={() => {
                resetFn();
              }}
              className="h-[42px] px-4 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4 mr-2" /> Clear
            </button>
          )}
          <Button
            type="submit"
            className="bg-primaryColor h-[42px] text-white px-6"
          >
            <Search className="w-4 h-4 mr-2" /> Search
          </Button>
        </div>
      </form>
    </div>
  );

  return { Component };
}
