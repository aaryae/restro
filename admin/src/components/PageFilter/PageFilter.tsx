import Button from "../Button";
import { Controller } from "react-hook-form";
import "./PageFilter.css";

export default function PageFilter(
  filterFields,
  handleSubmit,
  reset,
  onFilter,
) {
  let apiQuery;
  const onSubmit = (data: any) => {
    apiQuery = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((val) => {
          if (val !== null && val !== undefined) {
            apiQuery.append(key, val.toString());
          }
        });
      } else if (value !== null && value !== undefined) {
        apiQuery.append(key, value.toString());
      }
    });
    onFilter(apiQuery.toString());
  };

  const Module = (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="page-filter">
        {filterFields.map(({ name, label, options, Component, control }) => (
          <Controller
            key={name}
            name={name}
            control={control}
            render={({ field }) => (
              <Component
                {...field}
                options={options}
                label={label}
                control={control}
                // onFormChange={field.onChange}
              />
            )}
          />
        ))}
        <div>
          <Button className="submit-button" type="submit">
            Search
          </Button>
        </div>
      </form>
    </>
  );

  return { Module, apiQuery };
}
