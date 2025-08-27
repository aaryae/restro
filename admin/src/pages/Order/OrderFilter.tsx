import React, { useState } from "react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css"; // Main style file
import "react-date-range/dist/theme/default.css"; // Theme CSS file

interface OrderFilterPropsType {
  startDate: string;
  endDate: string;
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
  const [showDatePicker, setShowDatePicker] = useState(false);

  const today = new Date();
  const formatDate = (date: Date) => format(date, "yyyy-MM-dd");

  const handleTodayClick = () => {
    const todayDate = formatDate(today);
    setQueryStringOptions({
      ...queryStringOptions,
      startDate: todayDate,
      endDate: todayDate,
    });
    setShowDatePicker(false);
  };

  const handleThisWeekClick = () => {
    const start = startOfWeek(today, { weekStartsOn: 0 });
    const end = endOfWeek(today, { weekStartsOn: 0 });
    setQueryStringOptions({
      ...queryStringOptions,
      startDate: formatDate(start),
      endDate: formatDate(end),
    });
    setShowDatePicker(false);
  };

  const handleAllClick = () => {
    setQueryStringOptions({
      ...queryStringOptions,
      startDate: "",
      endDate: "",
    });
    setShowDatePicker(false);
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
      startDate: startDate ? formatDate(startDate) : "",
      endDate: endDate ? formatDate(endDate) : "",
    });
  };

  const dateRange = {
    startDate: queryStringOptions.startDate
      ? new Date(queryStringOptions.startDate)
      : today,
    endDate: queryStringOptions.endDate
      ? new Date(queryStringOptions.endDate)
      : today,
    key: "selection",
  };

  const isAllSelected =
    !queryStringOptions.startDate && !queryStringOptions.endDate;
  const isTodaySelected =
    queryStringOptions.startDate === formatDate(today) &&
    queryStringOptions.endDate === formatDate(today);
  const isThisWeekSelected =
    queryStringOptions.startDate ===
      formatDate(startOfWeek(today, { weekStartsOn: 0 })) &&
    queryStringOptions.endDate ===
      formatDate(endOfWeek(today, { weekStartsOn: 0 }));
  const isCustomSelected =
    queryStringOptions.startDate &&
    queryStringOptions.endDate &&
    !isAllSelected &&
    !isTodaySelected &&
    !isThisWeekSelected;

  return (
    <div className="p-6 mb-6 border border-gray-200 bg-white rounded-lg shadow-sm">
      <div className="space-y-6">
        <div className="flex flex-col justify-between items-start gap-3">
          <h3 className="text-lg font-semibold text-gray-800">Order Filter</h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAllClick}
              className={`px-4 py-2 rounded-md transition-colors ${
                isAllSelected
                  ? "bg-blue-700 text-white"
                  : "border border-blue-500 text-blue-500 bg-white shadow-sm hover:bg-blue-50"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={handleTodayClick}
              className={`px-4 py-2 rounded-md transition-colors ${
                isTodaySelected
                  ? "bg-blue-700 text-white"
                  : "border border-blue-500 text-blue-500 bg-white shadow-sm hover:bg-blue-50"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleThisWeekClick}
              className={`px-4 py-2 rounded-md transition-colors ${
                isThisWeekSelected
                  ? "bg-blue-700 text-white"
                  : "border border-blue-500 text-blue-500 bg-white shadow-sm hover:bg-blue-50"
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
                    ? "bg-blue-700 text-white"
                    : "border border-blue-500 text-blue-500 bg-white shadow-sm hover:bg-blue-50"
                }`}
              >
                Custom Range
              </button>
              {isCustomSelected && (
                <span className="text-sm text-gray-600">
                  {queryStringOptions.startDate} - {queryStringOptions.endDate}
                </span>
              )}
            </div>
          </div>
        </div>
        {showDatePicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="relative bg-white p-8 rounded-lg shadow-lg">
              <button
                type="button"
                onClick={() => setShowDatePicker(false)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
              >
                ✕
              </button>
              <DateRangePicker
                ranges={[dateRange]}
                onChange={handleDateRangeSelect}
                showSelectionPreview={true}
                moveRangeOnFirstSelection={false}
                months={2}
                direction="horizontal"
                className=""
              />
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
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
              className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">All</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div>
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
              className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
