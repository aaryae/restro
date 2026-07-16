import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css"; // Main style file
import "react-date-range/dist/theme/default.css"; // Theme CSS file
import "./DateRange.css";
import Select from "@/components/Select";

interface OrderFilterPropsType {
  start: string;
  end: string;
  paymentStatus: string;
  orderStatus: string;
}

export default function OrderFilter({
  queryStringOptions,
  setQueryStringOptions,
}: {
  queryStringOptions: OrderFilterPropsType;
  setQueryStringOptions: React.Dispatch<
    React.SetStateAction<OrderFilterPropsType>
  >;
}) {
  const today = new Date();
  const formatDate = (date: Date) => format(date, "yyyy-MM-dd");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedQuick, setSelectedQuick] = useState<
    "all" | "today" | "week" | "custom"
  >(() => {
    const start = queryStringOptions.start;
    const end = queryStringOptions.end;
    if (!start && !end) return "today";
    if (
      start === formatDate(startOfWeek(today, { weekStartsOn: 0 })) &&
      end === formatDate(endOfWeek(today, { weekStartsOn: 0 }))
    )
      return "week";
    if (start === formatDate(today) && end === formatDate(today))
      return "today";
    return "custom";
  });

  // responsive breakpoint for date picker behavior
  const [mobileView, setMobileView] = useState<boolean>(false);

  useEffect(() => {
    if (!queryStringOptions.start && !queryStringOptions.end) {
      const todayDate = formatDate(today);
      setQueryStringOptions((prev) => ({
        ...prev,
        start: todayDate,
        end: todayDate,
      }));
      setSelectedQuick("today");
    }
  }, []);

  useEffect(() => {
    const onResize = () => setMobileView(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleTodayClick = () => {
    const todayDate = formatDate(today);
    setQueryStringOptions({
      ...queryStringOptions,
      start: todayDate,
      end: todayDate,
    });
    setShowDatePicker(false);
    setSelectedQuick("today");
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
    setSelectedQuick("week");
  };

  const handleAllClick = () => {
    setQueryStringOptions({
      ...queryStringOptions,
      start: "",
      end: "",
    });
    setShowDatePicker(false);
    setSelectedQuick("all");
  };

  const handlePaymentStatusChange = (paymentStatus: string) => {
    setQueryStringOptions({
      ...queryStringOptions,
      paymentStatus,
    });
  };

  const handleOrderStatusChange = (orderStatus: string) => {
    setQueryStringOptions({
      ...queryStringOptions,
      orderStatus,
    });
  };

  const handleDateRangeSelect = (ranges: any) => {
    const { startDate, endDate } = ranges.selection;
    setQueryStringOptions({
      ...queryStringOptions,
      start: startDate ? formatDate(startDate) : "",
      end: endDate ? formatDate(endDate) : "",
    });
    setSelectedQuick("custom");
  };

  const dateRange = {
    startDate: queryStringOptions.start
      ? new Date(queryStringOptions.start)
      : today,
    endDate: queryStringOptions.end ? new Date(queryStringOptions.end) : today,
    key: "selection",
  };

  const isAllSelected = selectedQuick === "all";
  const isTodaySelected = selectedQuick === "today";
  const isThisWeekSelected = selectedQuick === "week";
  const isCustomSelected = selectedQuick === "custom";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="flex flex-col items-start gap-2.5">
          <h3 className="text-sm font-semibold text-slate-700">Order Filter</h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAllClick}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${
                isAllSelected
                  ? "bg-primaryColor text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-primaryColor/30 hover:text-primaryColor"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={handleTodayClick}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${
                isTodaySelected
                  ? "bg-primaryColor text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-primaryColor/30 hover:text-primaryColor"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleThisWeekClick}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${
                isThisWeekSelected
                  ? "bg-primaryColor text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-primaryColor/30 hover:text-primaryColor"
              }`}
            >
              This Week
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${
                  isCustomSelected
                    ? "bg-primaryColor text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-primaryColor/30 hover:text-primaryColor"
                }`}
              >
                Custom Range
              </button>
              {isCustomSelected && (
                <span className="text-xs text-slate-500">
                  {queryStringOptions.start} - {queryStringOptions.end}
                </span>
              )}
            </div>
          </div>
        </div>
        {showDatePicker &&
          createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
              <div
                className={`relative rounded-xl bg-white shadow-lg ${
                  mobileView
                    ? "max-h-[85vh] w-[95%] overflow-x-scroll p-8"
                    : "p-8"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setShowDatePicker(false)}
                  className={`text-red-500 hover:text-red-700 ${mobileView ? "absolute left-[36rem] top-2" : "absolute right-2 top-2"}`}
                >
                  ✕
                </button>

                <DateRangePicker
                  ranges={[dateRange]}
                  onChange={handleDateRangeSelect}
                  showSelectionPreview={true}
                  moveRangeOnFirstSelection={false}
                  months={mobileView ? 1 : 2}
                  direction={mobileView ? "vertical" : "horizontal"}
                  className={mobileView ? "w-full" : ""}
                />
              </div>
            </div>,
            document.body,
          )}
        <div className="flex gap-3">
          <div className="flex min-w-[150px] flex-col items-start">
            <Select
              id="paymentStatus"
              label="Payment Status"
              value={queryStringOptions.paymentStatus}
              onValueChange={handlePaymentStatusChange}
              options={[
                { value: "", label: "All" },
                { value: "paid", label: "Paid" },
                { value: "partially_paid", label: "Partially Paid" },
                { value: "pending", label: "Pending" },
                { value: "failed", label: "Failed" },
              ]}
              triggerClassName="h-9 text-[13px]"
            />
          </div>
          <div className="flex min-w-[150px] flex-col items-start">
            <Select
              id="orderStatus"
              label="Order Status"
              value={queryStringOptions.orderStatus}
              onValueChange={handleOrderStatusChange}
              options={[
                { value: "", label: "All" },
                { value: "pending", label: "Pending" },
                { value: "completed", label: "Completed" },
                { value: "cancelled", label: "Cancelled" },
              ]}
              triggerClassName="h-9 text-[13px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
