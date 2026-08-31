import { useMemo, useState, type CSSProperties } from "react";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { CurrencySign } from "@/constants";
import Modal from "@/components/Modal";
import { FLOOR_URL, TABLE_URL } from "@/constants/apiUrlConstants";
import { formatDate } from "@/utils/formatDate";
import { subDays } from "date-fns";
import Select from "@/components/Select";
import {
  ReportDateChip,
  ReportEmptyState,
} from "@/pages/DailySummaryReport/components/ReportUI";
import { ReportDatePickerDialog } from "@/pages/DailySummaryReport/components/ReportDatePickerDialog";
import { TrendingUp, UtensilsCrossed } from "lucide-react";
import { useChartPalette } from "@/pages/Dashboard/chartTheme";
import "./tableReport.css";

export const TableReport = () => {
  const palette = useChartPalette();
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
    url: `${FLOOR_URL}list?page=1&limit=25`,
  });

  const { data: tablesRes } = useGetApiQuery({
    url: `${TABLE_URL}list?page=1&limit=25`,
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

  const {
    data: revenueRes,
    isLoading: loadingRevenue,
    isError: revenueError,
  } = useGetApiQuery(
    {
      url: `report/daily-revenue-report?${getDateParams()}`,
    },
    { refetchOnMountOrArgChange: true },
  );

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

  const sortedTables = useMemo(
    () =>
      [...filteredTables].sort((a, b) => {
        const revA = Number(tableRevenueMap[a.id]?.totalRevenue || 0);
        const revB = Number(tableRevenueMap[b.id]?.totalRevenue || 0);
        if (revB !== revA) return revB - revA;
        return String(a.tableNo).localeCompare(String(b.tableNo), undefined, {
          numeric: true,
        });
      }),
    [filteredTables, tableRevenueMap],
  );

  const peakRevenue = useMemo(
    () =>
      sortedTables.reduce((peak, table) => {
        const rev = Number(tableRevenueMap[table.id]?.totalRevenue || 0);
        return Math.max(peak, rev);
      }, 0),
    [sortedTables, tableRevenueMap],
  );

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--serve-fg)]">
            Table Report
          </h1>
          <p className="mt-1 text-[13px] text-[var(--serve-muted)]">
            <span className="font-medium text-[var(--serve-fg)]">{periodLabel}</span>
            <span className="mx-1.5 text-[var(--serve-border)]">·</span>
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

      <div className="flex flex-col gap-3 rounded-xl border border-[var(--serve-border)] bg-[var(--serve-surface)] p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
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
          <div className="rounded-lg border border-[var(--serve-border)] bg-[var(--serve-surface-2)] px-3 py-2">
            <span className="text-[var(--serve-muted)]">Tables </span>
            <span className="font-semibold text-[var(--serve-fg)]">
              {filteredTables.length}
            </span>
          </div>
          <div className="rounded-lg border border-[var(--serve-border)] bg-[var(--serve-surface-2)] px-3 py-2">
            <span className="text-[var(--serve-muted)]">With sales </span>
            <span className="font-semibold text-[var(--serve-fg)]">
              {tablesWithRevenue}
            </span>
          </div>
          <div className="rounded-lg border border-[color-mix(in_srgb,var(--serve-accent)_28%,var(--serve-border))] bg-[color-mix(in_srgb,var(--serve-accent)_10%,var(--serve-surface))] px-3 py-2">
            <span className="text-[var(--serve-accent)]">Total </span>
            <span className="font-semibold text-[var(--serve-accent)]">
              {CurrencySign}
              {totalTableRevenue.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {loadingRevenue ? (
        <div className="table-report-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl border border-[var(--serve-border)] bg-[var(--serve-surface-2)]"
            />
          ))}
        </div>
      ) : revenueError ? (
        <ReportEmptyState
          icon={UtensilsCrossed}
          title="Could not load table sales"
          description="The table report request failed. Try again, or check that the report API is running."
        />
      ) : !sortedTables.length ? (
        <ReportEmptyState
          icon={UtensilsCrossed}
          title="No tables found"
          description="Add floors and tables, or switch the floor filter to see results."
        />
      ) : (
        <div className="table-report-grid">
          {sortedTables.map((table: any, index: number) => {
            const tableData = tableRevenueMap[table.id];
            const revenue = Number(tableData?.totalRevenue || 0);
            const hasSales = revenue > 0;
            const barWidth =
              hasSales && peakRevenue > 0
                ? Math.max(6, (revenue / peakRevenue) * 100)
                : 0;

            return (
              <button
                key={table.id}
                type="button"
                onClick={() => setSelectedTable(tableData || table)}
                className={`table-report-card${hasSales ? "" : " is-idle"}`}
                style={
                  hasSales
                    ? ({
                        ["--bar-color" as string]:
                          palette[index % palette.length],
                      } as CSSProperties)
                    : undefined
                }
              >
                <div className="table-report-card__head">
                  <div>
                    <p className="table-report-card__label">
                      Table {table.tableNo}
                    </p>
                    <p className="table-report-card__floor">
                      {floorMap[table.floorId] || `Floor ${table.floorId}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`table-report-card__amount${
                        hasSales ? "" : " is-idle"
                      }`}
                    >
                      {CurrencySign}
                      {revenue.toLocaleString()}
                    </p>
                    {!hasSales ? (
                      <p className="table-report-card__hint">No sales</p>
                    ) : null}
                  </div>
                </div>

                {hasSales ? (
                  <div className="table-report-card__bar" aria-hidden>
                    <span
                      className="table-report-card__bar-fill"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                ) : null}

                {(tableData?.accounts || []).length > 0 ? (
                  <div className="table-report-card__accounts">
                    {(tableData.accounts || []).map((a: any, idx: number) => (
                      <div key={idx} className="table-report-card__account-row">
                        <span>{a?.name}</span>
                        <span>
                          {CurrencySign}
                          {Number(a?.total || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      )}

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
            <div className="h-40 w-full animate-pulse rounded-xl bg-[var(--serve-surface-2)]" />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-[color-mix(in_srgb,var(--serve-accent)_28%,var(--serve-border))] bg-[color-mix(in_srgb,var(--serve-accent)_10%,var(--serve-surface))] px-4 py-3">
                <span className="inline-flex items-center gap-2 text-sm text-[var(--serve-fg)]">
                  <TrendingUp size={15} />
                  Revenue ({periodLabel})
                </span>
                <span className="font-bold text-[var(--serve-accent)]">
                  {CurrencySign}
                  {Number(selectedTable?.totalRevenue || 0).toLocaleString()}
                </span>
              </div>

              <div className="divide-y divide-[var(--serve-border)] overflow-hidden rounded-xl border border-[var(--serve-border)]">
                {(sessionsRes?.data || []).map((s: any) => (
                  <div key={s?.sessionId} className="space-y-2 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-[var(--serve-fg)]">
                        Session {s?.sessionId}
                      </div>
                      <div className="text-sm font-semibold text-[var(--serve-fg)]">
                        {CurrencySign}
                        {Number(s?.total || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-[12px] text-[var(--serve-muted)]">
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
                      <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--serve-muted)]">
                        Orders
                      </div>
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        {(s?.orders || []).map((o: any) => (
                          <div
                            key={o?.id}
                            className="rounded-lg border border-[var(--serve-border)] bg-[var(--serve-surface-2)] p-2.5 text-[12px]"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[var(--serve-muted)]">
                                Order #{o?.id}
                              </span>
                              <span className="font-semibold text-[var(--serve-fg)]">
                                {CurrencySign}
                                {Number(o?.totalAmount || 0).toLocaleString()}
                              </span>
                            </div>
                            <div className="mt-1 text-[11px] text-[var(--serve-muted)]">
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
