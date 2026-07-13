import React, { useState } from "react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import Select from "@/components/Select";

interface RevenueFilterPropsType {
  start: string;
  end: string;
  paymentStatus: string;
  orderStatus: string;
  cash_or_credit: string;
}

const chipClass = (active: boolean) =>
  `h-8 rounded-lg px-2.5 text-[12px] font-medium transition ${
    active
      ? "bg-primaryColor text-white"
      : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
  }`;

export default function RevenueFilter({
  queryStringOptions,
  setQueryStringOptions,
}: {
  queryStringOptions: RevenueFilterPropsType;
  setQueryStringOptions: React.Dispatch<
    React.SetStateAction<RevenueFilterPropsType>
  >;
}) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const today = new Date();
  const formatDate = (date: Date) => format(date, "yyyy-MM-dd");

  const handleTodayClick = () => {
    const todayDate = formatDate(today);
    setQueryStringOptions({
      ...queryStringOptions,
      start: todayDate,
      end: todayDate,
    });
    setShowDatePicker(false);
  };

  const handleThisWeekClick = () => {
    const start = startOfWeek(today, { weekStartsOn: 0 });
    const end = endOfWeek(today, { weekStartsOn: 0 });
    setQueryStringOptions({
      ...queryStringOptions,
      start: formatDate(start),
      end: formatDate(end),
    });
    setShowDatePicker(false);
  };

  const handleAllClick = () => {
    setQueryStringOptions({
      ...queryStringOptions,
      start: "",
      end: "",
    });
    setShowDatePicker(false);
  };

  const handleCashOrCreditChange = (cash_or_credit: string) => {
    setQueryStringOptions({
      ...queryStringOptions,
      cash_or_credit,
    });
  };

  const handleDateRangeSelect = (ranges: any) => {
    const { startDate, endDate } = ranges.selection;
    setQueryStringOptions({
      ...queryStringOptions,
      start: startDate ? formatDate(startDate) : "",
      end: endDate ? formatDate(endDate) : "",
    });
  };

  const dateRange = {
    startDate: queryStringOptions.start
      ? new Date(queryStringOptions.start)
      : today,
    endDate: queryStringOptions.end ? new Date(queryStringOptions.end) : today,
    key: "selection",
  };

  const isAllSelected = !queryStringOptions.start && !queryStringOptions.end;
  const isTodaySelected =
    queryStringOptions.start === formatDate(today) &&
    queryStringOptions.end === formatDate(today);
  const isThisWeekSelected =
    queryStringOptions.start ===
      formatDate(startOfWeek(today, { weekStartsOn: 0 })) &&
    queryStringOptions.end ===
      formatDate(endOfWeek(today, { weekStartsOn: 0 }));
  const isCustomSelected =
    queryStringOptions.start &&
    queryStringOptions.end &&
    !isAllSelected &&
    !isTodaySelected &&
    !isThisWeekSelected;

  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[12px] font-medium text-slate-500">Period:</span>
          <button
            type="button"
            onClick={handleAllClick}
            className={chipClass(isAllSelected)}
          >
            All
          </button>
          <button
            type="button"
            onClick={handleTodayClick}
            className={chipClass(isTodaySelected)}
          >
            Today
          </button>
          <button
            type="button"
            onClick={handleThisWeekClick}
            className={chipClass(isThisWeekSelected)}
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className={chipClass(Boolean(isCustomSelected))}
          >
            Custom Range
          </button>
          {isCustomSelected ? (
            <span className="text-[12px] text-slate-500">
              {queryStringOptions.start} – {queryStringOptions.end}
            </span>
          ) : null}
        </div>

        <div className="w-[160px]">
          <Select
            id="cash_or_credit"
            label="Payment method"
            value={queryStringOptions.cash_or_credit}
            onValueChange={handleCashOrCreditChange}
            options={[
              { value: "", label: "All" },
              { value: "cash", label: "Cash" },
              { value: "credit", label: "Credit" },
            ]}
            triggerClassName="h-8 text-[12px]"
          />
        </div>
      </div>

      {showDatePicker ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative max-w-full rounded-xl bg-white p-4 shadow-xl sm:p-6">
            <button
              type="button"
              onClick={() => setShowDatePicker(false)}
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
            >
              ✕
            </button>
            <DateRangePicker
              ranges={[dateRange]}
              onChange={handleDateRangeSelect}
              showSelectionPreview
              moveRangeOnFirstSelection={false}
              months={2}
              direction="horizontal"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
