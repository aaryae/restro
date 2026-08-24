import React from "react";
import DatePicker from "react-datepicker";
import { Controller, Control, FieldPath, FieldValues } from "react-hook-form";
import "react-datepicker/dist/react-datepicker.css";
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
      <label className="date-time-range-label text-left">{label}</label>
      <Controller
        name={name}
        control={control}
        rules={{
          validate: {
            datesOrder: (value: [Date | null, Date | null]) => {
              const [start, end] = value || [null, null];
              if (!start || !end) return true; // Allow null if not required
              if (start > end)
                return "Start date must be before or equal to end date";
              return true;
            },
            timesOrder: (value: [Date | null, Date | null]) => {
              const [start, end] = value || [null, null];
              if (!start || !end) return true;
              const sameDate = start.toDateString() === end.toDateString();
              if (sameDate && start >= end) {
                return "Start time must be before end time on the same date";
              }
              return true;
            },
          },
        }}
        render={({ field, fieldState: { error } }) => {
          const [start, end] = field.value || [null, null];
          return (
            <div className="date-time-range-pickers">
              <div className="date-time-picker">
                <label htmlFor={`${name}-start`}>Start</label>
                <DatePicker
                  id={`${name}-start`}
                  selected={start}
                  onChange={(date: Date | null) => field.onChange([date, end])}
                  showTimeSelect
                  timeIntervals={15} // 15-minute steps
                  dateFormat="yyyy-MM-dd h:mm aa" // Display format
                  minDate={minDate}
                  maxDate={maxDate}
                  disabled={disabled}
                  placeholderText="Select start date and time"
                  className="date-time-picker-input"
                  calendarClassName="date-time-picker-calendar"
                  popperClassName="date-time-picker-popper"
                />
              </div>
              <div className="date-time-picker">
                <label htmlFor={`${name}-end`}>End</label>
                <DatePicker
                  id={`${name}-end`}
                  selected={end}
                  onChange={(date: Date | null) =>
                    field.onChange([start, date])
                  }
                  showTimeSelect
                  timeIntervals={15} // 15-minute steps
                  dateFormat="yyyy-MM-dd h:mm aa" // Display format
                  minDate={start || minDate} // Enforce start ≤ end
                  maxDate={maxDate}
                  disabled={disabled}
                  placeholderText="Select end date and time"
                  className="date-time-picker-input"
                  calendarClassName="date-time-picker-calendar"
                  popperClassName="date-time-picker-popper"
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
