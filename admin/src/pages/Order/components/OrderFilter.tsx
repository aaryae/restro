import React, { useEffect, useState } from "react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css"; // Main style file
import "react-date-range/dist/theme/default.css"; // Theme CSS file
import "./DateRange.css";

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

  const handlePaymentStatusChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setQueryStringOptions({
      ...queryStringOptions,
      paymentStatus: e.target.value,
    });
  };

  const handleOrderStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setQueryStringOptions({
      ...queryStringOptions,
      orderStatus: e.target.value,
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
    <div className="p-6 mb-6 border border-gray-200 bg-white rounded-lg shadow-sm">
      <div className="space-y-6 flex justify-between flex-col md:flex-row">
        <div className="flex flex-col justify-between items-start gap-3">
          <h3 className="text-lg font-semibold text-gray-800">Order Filter</h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAllClick}
              className={`px-4 py-2 rounded-md transition-colors ${
                isAllSelected
                  ? "bg-primaryColor text-white"
                  : "border border-primaryColor text-primaryColor bg-white shadow-sm hover:bg-blue-50"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={handleTodayClick}
              className={`px-4 py-2 rounded-md transition-colors ${
                isTodaySelected
                  ? "bg-primaryColor text-white"
                  : "border border-primaryColor text-primaryColor bg-white shadow-sm hover:bg-blue-50"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleThisWeekClick}
              className={`px-4 py-2 rounded-md transition-colors ${
                isThisWeekSelected
                  ? "bg-primaryColor text-white"
                  : "border border-primaryColor text-primaryColor bg-white shadow-sm hover:bg-blue-50"
              }`}
            >
              This Week
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className={`px-4 py-2 rounded-md transition-colors ${
                  isCustomSelected
                    ? "bg-primaryColor text-white"
                    : "border border-primaryColor text-primaryColor bg-white shadow-sm hover:bg-blue-50"
                }`}
              >
                Custom Range
              </button>
              {isCustomSelected && (
                <span className="text-sm text-gray-600">
                  {queryStringOptions.start} - {queryStringOptions.end}
                </span>
              )}
            </div>
          </div>
        </div>
        {showDatePicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div
              className={`relative bg-white rounded-lg shadow-lg ${
                mobileView
                  ? "w-[95%] p-8 max-h-[85vh] overflow-x-scroll"
                  : "p-8"
              }`}
            >
              <button
                type="button"
                onClick={() => setShowDatePicker(false)}
                className={`text-red-500 hover:text-red-700 ${mobileView ? "absolute top-2 left-[36rem]" : "absolute top-2 right-2"}`}
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
          </div>
        )}
        <div className="flex gap-4">
          <div
            className="flex flex-col items-start
          "
          >
            <label
              htmlFor="paymentStatus"
              className="block text-sm font-medium text-gray-700 mb-2 tracking-wide"
            >
              Payment Status
            </label>
            <select
              id="paymentStatus"
              value={queryStringOptions.paymentStatus}
              onChange={handlePaymentStatusChange}
              className="md:w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">All</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="flex flex-col items-start">
            <label
              htmlFor="orderStatus"
              className="block text-sm font-medium text-gray-700 mb-2 tracking-wide"
            >
              Order Status
            </label>
            <select
              id="orderStatus"
              value={queryStringOptions.orderStatus}
              onChange={handleOrderStatusChange}
              className="md:w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
