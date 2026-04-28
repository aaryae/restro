import React, { useMemo, useState } from "react";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { CurrencySign } from "@/constants";
import PageTitle from "@/components/PageTitle";
import Modal from "@/components/Modal";
import { FLOOR_URL, TABLE_URL } from "@/constants/apiUrlConstants";
import { formatDate } from "@/utils/formatDate";
import { subDays, startOfDay, endOfDay } from "date-fns";
import TopTablesChart from "./components/TopTablesChart";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export const TableReport = () => {
  const [selectedTable, setSelectedTable] = useState<any | null>(null);
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(
    null,
  );
  const [dateRange, setDateRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
    key: "selection",
  });

  const getDateRangeParams = () => {
    const { startDate, endDate } = dateRange;
    return {
      start: startOfDay(startDate).toISOString(),
      end: endOfDay(endDate).toISOString(),
    };
  };

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

  const button = [
    { label: "Yesterday", value: "yesterday" },
    { label: "Today", value: "today" },
  ];

  const { data: floorsRes } = useGetApiQuery({
    url: `${FLOOR_URL}list?page=1&limit=100`,
  });

  const { data: tablesRes } = useGetApiQuery({
    url: `${TABLE_URL}list?page=1&limit=100`,
  });

  const floors = floorsRes?.data?.data || [];
  const allTables = tablesRes?.data?.data || [];

  const floorMap = useMemo(() => {
    const map: Record<number, string> = {};
    floors.forEach((f: any) => {
      map[f.id] = f.name;
    });
    return map;
  }, [floors]);

  const filteredTables = useMemo(() => {
    if (!selectedFloorId) return allTables;
    return allTables.filter((t: any) => t.floorId === selectedFloorId);
  }, [allTables, selectedFloorId]);

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

  const { data: revenueRes, isLoading: loadingRevenue } = useGetApiQuery({
    url: `report/daily-revenue-report?${getDateParams()}`,
  });

  const { data: sessionsRes, isLoading: loadingSessions } = useGetApiQuery(
    selectedTable
      ? { url: `report/daily-table-sessions/${selectedTable?.id}` }
      : ("report/daily-table-sessions/skip" as any),
    { skip: !selectedTable },
  );

  const tables: any[] = revenueRes?.data?.todayTableReport || [];

  const tableRevenueMap = useMemo(() => {
    const map: Record<number, any> = {};
    tables.forEach((t: any) => {
      map[t.id] = t;
    });
    return map;
  }, [tables]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Table-wise Report</h1>

      {/* Date Filter Buttons */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2">
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
      </div>
      <div className="flex items-center gap-2">
        <p className="text-xl font-semibold">
          Date: {formatDate(dateRange.startDate)}
          {dateRange.startDate.getTime() !== dateRange.endDate.getTime() &&
            ` - ${formatDate(dateRange.endDate)}`}
        </p>
      </div>

      {/* Floor Filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Floor:</label>
        <select
          value={selectedFloorId || ""}
          onChange={(e) =>
            setSelectedFloorId(e.target.value ? Number(e.target.value) : null)
          }
          className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
        >
          <option value="">All Floors</option>
          {floors.map((floor: any) => (
            <option key={floor.id} value={floor.id}>
              {floor.name}
            </option>
          ))}
        </select>
      </div>

       {/* Date Picker Modal */}
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
             <DatePicker
               selected={dateRange.startDate}
               onChange={(date: Date) => {
                 setDateRange({
                   startDate: date,
                   endDate: date,
                   key: "selection",
                 });
                 setSelectedDateFilter("custom");
               }}
               inline
             />
           </div>
         </div>
       )}

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredTables.map((table: any) => {
          const tableData = tableRevenueMap[table.id];
          const revenue = tableData?.totalRevenue || 0;

          return (
            <button
              key={table.id}
              type="button"
              onClick={() => setSelectedTable(tableData || table)}
              disabled={!tableData}
              className={`text-left bg-white rounded-xl border shadow-sm p-4 transition ${
                tableData
                  ? "hover:border-gray-300 hover:shadow cursor-pointer"
                  : "opacity-50 cursor-not-allowed border-gray-100"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-gray-900">
                  Table {table.tableNo}
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {CurrencySign}
                  {Number(revenue).toLocaleString()}
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Floor: {floorMap[table.floorId] || table.floorId}
              </div>
              {(tableData?.accounts || []).length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  {(tableData.accounts || []).map((a: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-gray-600">{a?.name}</span>
                      <span className="text-gray-900">
                        {CurrencySign}
                        {Number(a?.total || 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {!filteredTables.length && (
        <div className="text-sm text-gray-500">No tables found.</div>
      )}
      <TopTablesChart data={tables} isLoading={loadingRevenue} />

      {/* Table Sessions Modal */}
      <Modal
        isOpen={!!selectedTable}
        onClose={() => setSelectedTable(null)}
        title={
          selectedTable
            ? `Table ${selectedTable?.name || selectedTable?.tableNo} sessions`
            : ""
        }
        size="large"
      >
        <div className="p-6">
          {loadingSessions ? (
            <div className="h-40 w-full animate-pulse bg-gray-100 rounded" />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total Revenue (Today)</span>
                <span className="font-semibold text-gray-900">
                  {CurrencySign}
                  {Number(selectedTable?.totalRevenue || 0).toLocaleString()}
                </span>
              </div>

              <div className="divide-y divide-gray-200 border border-gray-200 rounded-lg">
                {(sessionsRes?.data || []).map((s: any) => (
                  <div key={s?.sessionId} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-900">
                        Session {s?.sessionId}
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {CurrencySign}
                        {Number(s?.total || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      <span>
                        {s?.sessionStart
                          ? new Date(s.sessionStart).toLocaleString()
                          : "-"}
                      </span>
                      <span className="mx-2">to</span>
                      <span>
                        {s?.sessionEnd
                          ? new Date(s.sessionEnd).toLocaleString()
                          : "-"}
                      </span>
                    </div>

                    <div className="mt-2">
                      <div className="text-xs font-medium text-gray-700 mb-1">
                        Orders
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {(s?.orders || []).map((o: any) => (
                          <div
                            key={o?.id}
                            className="border border-gray-200 rounded p-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">
                                Order #{o?.id}
                              </span>
                              <span className="font-semibold text-gray-900">
                                {CurrencySign}
                                {Number(o?.totalAmount || 0).toLocaleString()}
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-500 mt-1">
                              {o?.orderStartTime
                                ? new Date(
                                    o.orderStartTime,
                                  ).toLocaleTimeString()
                                : "-"}{" "}
                              -{" "}
                              {o?.orderFinishTime
                                ? new Date(
                                    o.orderFinishTime,
                                  ).toLocaleTimeString()
                                : "-"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                {!sessionsRes?.data?.length && (
                  <div className="p-6 text-sm text-gray-500">No sessions.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default TableReport;
