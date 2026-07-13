import { useMemo, useState } from "react";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { CurrencySign } from "@/constants";
import Modal from "@/components/Modal";
import { FLOOR_URL, TABLE_URL } from "@/constants/apiUrlConstants";
import { formatDate } from "@/utils/formatDate";
import { subDays } from "date-fns";
import TopTablesChart from "./components/TopTablesChart";
import Select from "@/components/Select";
import {
  ReportDateChip,
  ReportEmptyState,
} from "@/pages/DailySummaryReport/components/ReportUI";
import { ReportDatePickerDialog } from "@/pages/DailySummaryReport/components/ReportDatePickerDialog";
import { TrendingUp, UtensilsCrossed } from "lucide-react";

export const TableReport = () => {
  const [selectedTable, setSelectedTable] = useState<any | null>(null);
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("today");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
    key: "selection",
  });

  const handleDateFilter = (type: string) => {
    const today = new Date();
    if (type === "today") {
      setDateRange({ startDate: today, endDate: today, key: "selection" });
    } else if (type === "yesterday") {
      const yesterday = subDays(today, 1);
      setDateRange({
        startDate: yesterday,
        endDate: yesterday,
        key: "selection",
      });
    }
    setSelectedDateFilter(type);
    setShowDatePicker(false);
  };

  const periodLabel = useMemo(() => {
    if (selectedDateFilter === "today") return "Today";
    if (selectedDateFilter === "yesterday") return "Yesterday";
    if (dateRange.startDate.getTime() !== dateRange.endDate.getTime()) {
      return `${formatDate(dateRange.startDate)} – ${formatDate(dateRange.endDate)}`;
    }
    return formatDate(dateRange.startDate);
  }, [selectedDateFilter, dateRange]);

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
    const fmt = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };
    return `start=${fmt(dateRange.startDate)}&end=${fmt(dateRange.endDate)}`;
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

  const totalTableRevenue = useMemo(
    () =>
      filteredTables.reduce((sum, table) => {
        const rev = tableRevenueMap[table.id]?.totalRevenue || 0;
        return sum + Number(rev);
      }, 0),
    [filteredTables, tableRevenueMap],
  );

  const tablesWithRevenue = useMemo(
    () =>
      filteredTables.filter(
        (t) => Number(tableRevenueMap[t.id]?.totalRevenue || 0) > 0,
      ).length,
    [filteredTables, tableRevenueMap],
  );

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Table Report
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            <span className="font-medium text-slate-800">{periodLabel}</span>
            <span className="mx-1.5 text-slate-300">·</span>
            Tap a table for session details
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ReportDateChip
            active={selectedDateFilter === "yesterday"}
            onClick={() => handleDateFilter("yesterday")}
          >
            Yesterday
          </ReportDateChip>
          <ReportDateChip
            active={selectedDateFilter === "today"}
            onClick={() => handleDateFilter("today")}
          >
            Today
          </ReportDateChip>
          <ReportDateChip
            active={selectedDateFilter === "custom" || showDatePicker}
            onClick={() => setShowDatePicker(true)}
          >
            Custom
          </ReportDateChip>
        </div>
      </div>

      <ReportDatePickerDialog
        open={showDatePicker}
        onOpenChange={setShowDatePicker}
        selectedDate={dateRange.startDate}
        onConfirm={(date) => {
          setDateRange({
            startDate: date,
            endDate: date,
            key: "selection",
          });
          setSelectedDateFilter("custom");
        }}
      />

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
        <div className="w-full max-w-[220px]">
          <Select
            label="Floor"
            value={selectedFloorId ?? ""}
            options={[
              { value: "", label: "All Floors" },
              ...floors.map((floor: any) => ({
                value: String(floor.id),
                label: floor.name,
              })),
            ]}
            onValueChange={(next) =>
              setSelectedFloorId(next ? Number(next) : null)
            }
          />
        </div>
        <div className="flex flex-wrap gap-2 text-[13px]">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <span className="text-slate-500">Tables </span>
            <span className="font-semibold text-slate-800">
              {filteredTables.length}
            </span>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <span className="text-slate-500">With sales </span>
            <span className="font-semibold text-slate-800">
              {tablesWithRevenue}
            </span>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
            <span className="text-emerald-700/80">Total </span>
            <span className="font-semibold text-emerald-700">
              {CurrencySign}
              {totalTableRevenue.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {loadingRevenue ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl border border-slate-200 bg-slate-100"
            />
          ))}
        </div>
      ) : !filteredTables.length ? (
        <ReportEmptyState
          icon={UtensilsCrossed}
          title="No tables found"
          description="Add floors and tables, or switch the floor filter to see results."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredTables.map((table: any) => {
            const tableData = tableRevenueMap[table.id];
            const revenue = Number(tableData?.totalRevenue || 0);
            const hasSales = revenue > 0;

            return (
              <button
                key={table.id}
                type="button"
                onClick={() => setSelectedTable(tableData || table)}
                className={`rounded-xl border bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow ${
                  hasSales
                    ? "border-slate-200"
                    : "border-dashed border-slate-200 opacity-90"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Table {table.tableNo}
                    </p>
                    <p className="mt-0.5 text-[12px] text-slate-500">
                      {floorMap[table.floorId] || `Floor ${table.floorId}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-base font-bold ${
                        hasSales ? "text-emerald-600" : "text-slate-400"
                      }`}
                    >
                      {CurrencySign}
                      {revenue.toLocaleString()}
                    </p>
                    {!hasSales && (
                      <p className="text-[11px] text-slate-400">No sales</p>
                    )}
                  </div>
                </div>

                {(tableData?.accounts || []).length > 0 && (
                  <div className="mt-3 space-y-1 border-t border-slate-100 pt-3">
                    {(tableData.accounts || []).map((a: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-[12px]"
                      >
                        <span className="text-slate-500">{a?.name}</span>
                        <span className="font-medium text-slate-800">
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
      )}

      <TopTablesChart
        data={tables}
        isLoading={loadingRevenue}
        periodLabel={periodLabel}
      />

      <Modal
        isOpen={!!selectedTable}
        onClose={() => setSelectedTable(null)}
        title={
          selectedTable
            ? `Table ${selectedTable?.name || selectedTable?.tableNo} · sessions`
            : ""
        }
        size="large"
      >
        <div className="p-5 sm:p-6">
          {loadingSessions ? (
            <div className="h-40 w-full animate-pulse rounded-xl bg-slate-100" />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <span className="inline-flex items-center gap-2 text-sm text-emerald-800">
                  <TrendingUp size={15} />
                  Revenue ({periodLabel})
                </span>
                <span className="font-bold text-emerald-700">
                  {CurrencySign}
                  {Number(selectedTable?.totalRevenue || 0).toLocaleString()}
                </span>
              </div>

              <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                {(sessionsRes?.data || []).map((s: any) => (
                  <div key={s?.sessionId} className="space-y-2 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-900">
                        Session {s?.sessionId}
                      </div>
                      <div className="text-sm font-semibold text-slate-900">
                        {CurrencySign}
                        {Number(s?.total || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-[12px] text-slate-500">
                      <span>
                        {s?.sessionStart
                          ? new Date(s.sessionStart).toLocaleString()
                          : "—"}
                      </span>
                      <span className="mx-2">→</span>
                      <span>
                        {s?.sessionEnd
                          ? new Date(s.sessionEnd).toLocaleString()
                          : "—"}
                      </span>
                    </div>

                    <div className="mt-2">
                      <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                        Orders
                      </div>
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        {(s?.orders || []).map((o: any) => (
                          <div
                            key={o?.id}
                            className="rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 text-[12px]"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600">
                                Order #{o?.id}
                              </span>
                              <span className="font-semibold text-slate-900">
                                {CurrencySign}
                                {Number(o?.totalAmount || 0).toLocaleString()}
                              </span>
                            </div>
                            <div className="mt-1 text-[11px] text-slate-500">
                              {o?.orderStartTime
                                ? new Date(
                                    o.orderStartTime,
                                  ).toLocaleTimeString()
                                : "—"}{" "}
                              –{" "}
                              {o?.orderFinishTime
                                ? new Date(
                                    o.orderFinishTime,
                                  ).toLocaleTimeString()
                                : "—"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                {!sessionsRes?.data?.length && (
                  <div className="p-8">
                    <ReportEmptyState
                      icon={UtensilsCrossed}
                      title="No sessions"
                      description="This table has no recorded sessions for the current filter."
                    />
                  </div>
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
