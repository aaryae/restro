import { Controller } from "react-hook-form";
import { Button } from "../ui/button";

export default function PageFilterSample(
  filterFields,
  handleSubmit,
  // reset,
  onFilter,
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
          }) => (
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
        <Button
          type="submit"
          className="bg-primaryColor h-full text-white px-6"
        >
          Search
        </Button>
      </form>
    </div>
  );

  return { Component };
}
