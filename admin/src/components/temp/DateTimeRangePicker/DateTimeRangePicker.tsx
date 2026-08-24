import React from "react";
import DateTimePicker from "react-datetime-picker";
import { Controller, Control, FieldPath, FieldValues } from "react-hook-form";
import "react-datetime-picker/dist/DateTimePicker.css";
import "react-datetime/css/react-datetime.css";
import "./DateTimeRangePicker.css";

interface DateTimeRangePickerProps<T extends FieldValues> {
  name: FieldPath<T>;
  control: Control<T>;
  label?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
}

const DateTimeRangePicker = <T extends FieldValues>({
  name,
  control,
  label = "Select Date and Time Range",
  minDate,
  maxDate,
  disabled = false,
}: DateTimeRangePickerProps<T>) => {
  return (
    <div className="date-time-range-container">
      <label className="date-time-range-label">{label}</label>
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState: { error } }) => {
          const [start, end] = field.value || [null, null];
          return (
            <div className="date-time-range-pickers">
              <div className="date-time-picker">
                <label htmlFor={`${name}-start`}>Start</label>
                <DateTimePicker
                  id={`${name}-start`}
                  value={start}
                  onChange={(value) => field.onChange([value, end])}
                  minDate={minDate}
                  maxDate={end || maxDate}
                  disabled={disabled}
                  format="y-MM-dd h:mm a"
                  calendarAriaLabel="Toggle start date calendar"
                  // clockAriaLabel="Toggle start time clock"
                  clearAriaLabel="Clear start date and time"
                  className="date-time-picker-input"
                />
              </div>
              <div className="date-time-picker">
                <label htmlFor={`${name}-end`}>End</label>
                <DateTimePicker
                  id={`${name}-end`}
                  value={end}
                  onChange={(value) => field.onChange([start, value])}
                  minDate={start || minDate}
                  maxDate={maxDate}
                  disabled={disabled}
                  format="y-MM-dd h:mm a"
                  calendarAriaLabel="Toggle end date calendar"
                  // clockAriaLabel="Toggle end time clock"
                  clearAriaLabel="Clear end date and time"
                  className="date-time-picker-input"
                />
              </div>
              {error && <p className="error">{error.message}</p>}
            </div>
          );
        }}
      />
    </div>
  );
};

export default DateTimeRangePicker;
