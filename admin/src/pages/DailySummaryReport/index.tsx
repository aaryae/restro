import TotalRevenue from "./components/TotalRevenue";
import TotalPurchase from "./components/TotalPurchase";
import TotalExpense from "./components/TotalExpense";
import { ADToBS } from "bikram-sambat-js";
import { formatDate } from "@/utils/formatDate";
import { formatNepaliDate } from "@/utils/formatNepaliDate";
import { OpeningBalance } from "./components/OpeningBalance";
import { REVENUE_URL } from "@/constants/apiUrlConstants";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { DateRangePicker } from "react-date-range";
import { subDays } from "date-fns";
import { useState } from "react";

const PageHeader = ({
  dateRange,
  selectedDateFilter,
  handleDateFilter,
  showDatePicker,
  setShowDatePicker,
  setDateRange,
  setSelectedDateFilter,
}: any) => {
  const button = [
    { label: "Yesterday", value: "yesterday" },
    { label: "Today", value: "today" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">
          Daily Summary Report
        </h1>
        <div className="flex items-center gap-2">
          {button.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => handleDateFilter(item.value)}
              className={`px-4 py-2 rounded-md transition-colors ${
                selectedDateFilter === item.value
                  ? "bg-primaryColor text-white"
                  : "border border-primaryColor text-primaryColor bg-white shadow-sm hover:bg-blue-50"
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setShowDatePicker(!showDatePicker);
              if (!showDatePicker) {
                setSelectedDateFilter("custom");
              }
            }}
            className={`px-4 py-2 rounded-md transition-colors ${
              selectedDateFilter === "custom"
                ? "bg-primaryColor text-white"
                : "border border-primaryColor text-primaryColor bg-white shadow-sm hover:bg-blue-50"
            }`}
          >
            Custom
          </button>
        </div>
      </div>
      {showDatePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative bg-white p-8 rounded-lg shadow-lg">
            <button
              type="button"
              onClick={() => setShowDatePicker(false)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-2xl"
            >
              ×
            </button>
            <DateRangePicker
              ranges={[
                {
                  startDate: dateRange.startDate,
                  endDate: dateRange.endDate,
                  key: "selection",
                },
              ]}
              onChange={(ranges: any) => {
                setDateRange({
                  startDate: ranges.selection.startDate,
                  endDate: ranges.selection.endDate,
                  key: "selection",
                });
                setSelectedDateFilter("custom");
              }}
              showSelectionPreview={true}
              moveRangeOnFirstSelection={false}
              months={2}
              direction="horizontal"
            />
          </div>
        </div>
      )}
      <div className="flex items-center justify-between text-xl text-black font-bold">
        <p>
          Date: {formatDate(dateRange.startDate)}
          {dateRange.startDate.getTime() !== dateRange.endDate.getTime() &&
            ` - ${formatDate(dateRange.endDate)}`}
        </p>
        <p>{formatNepaliDate(ADToBS(dateRange.startDate))}</p>
      </div>
      <div className="flex justify-center">
        <p className="text-xl font-semibold border-x-2 px-4 border-black w-fit">
          {dateRange.startDate.toLocaleDateString("en-US", { weekday: "long" })}
        </p>
      </div>
    </div>
  );
};

export const DailySummaryReport = () => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(
    "today",
  );
  const [dateRange, setDateRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
    key: "selection",
  });

  const handleDateFilter = (type: string) => {
    const today = new Date();
    if (type === "today") {
      setDateRange({
        startDate: today,
        endDate: today,
        key: "selection",
      });
    } else if (type === "yesterday") {
      const yesterday = subDays(today, 1);
      setDateRange({
        startDate: yesterday,
        endDate: yesterday,
        key: "selection",
      });
    }
    setSelectedDateFilter(type);
  };

  const getDateParams = () => {
    const year = dateRange.startDate.getFullYear();
    const month = String(dateRange.startDate.getMonth() + 1).padStart(2, "0");
    const day = String(dateRange.startDate.getDate()).padStart(2, "0");
    const start = `${year}-${month}-${day}`;

    const year2 = dateRange.endDate.getFullYear();
    const month2 = String(dateRange.endDate.getMonth() + 1).padStart(2, "0");
    const day2 = String(dateRange.endDate.getDate()).padStart(2, "0");
    const end = `${year2}-${month2}-${day2}`;

    return `start=${start}&end=${end}`;
  };

  const { data: revenueData } = useGetApiQuery({
    url: `${REVENUE_URL}revenue-today?${getDateParams()}`,
  });
  const todayRevenue = revenueData?.data?.totalRevenue || 0;
  const revenues = revenueData?.data?.revenues || [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <PageHeader
          dateRange={dateRange}
          selectedDateFilter={selectedDateFilter}
          handleDateFilter={handleDateFilter}
          showDatePicker={showDatePicker}
          setShowDatePicker={setShowDatePicker}
          setDateRange={setDateRange}
          setSelectedDateFilter={setSelectedDateFilter}
        />
      </div>
      <div className="flex flex-col gap-4">
        <TotalRevenue dateParams={getDateParams()} />
        <OpeningBalance revenues={revenues} />
        <TotalPurchase dateParams={getDateParams()} />
        <TotalExpense dateParams={getDateParams()} />
      </div>
    </div>
  );
};
