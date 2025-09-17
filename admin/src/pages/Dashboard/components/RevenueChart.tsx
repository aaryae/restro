import { useForm, Controller } from "react-hook-form";
import { buildQueryString } from "@/utils/generalHelper";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { useMemo } from "react";
import { CurrencySign } from "@/constants";
import BarChartComponent from "../BarChartComponent";

function RevenueSection() {
  const { control, watch } = useForm<{
    start: string;
    end: string;
    granularity: "day" | "week" | "month";
  }>({
    defaultValues: (() => {
      const today = new Date();
      const start = new Date();
      start.setDate(today.getDate() - 29);
      const fmt = (d: Date) => d.toISOString().slice(0, 10);
      return { start: fmt(start), end: fmt(today), granularity: "day" };
    })(),
  });

  const start = watch("start");
  const end = watch("end");
  const granularity = watch("granularity");

  const url = buildQueryString("revenue/list", {
    page: 1,
    limit: 100000,
    search: { start, end },
  });
  const { data, isLoading } = useGetApiQuery({ url });

  const { totalRevenue, ordersCount, chartData } = useMemo(() => {
    const rows: any[] = (data as any)?.data?.data || [];
    const sum = rows.reduce(
      (acc: number, r: any) => acc + (Number(r?.amount) || 0),
      0,
    );

    // Build time buckets based on granularity
    const buckets = new Map<string, number>();
    const startDate = start ? new Date(start + "T00:00:00") : null;
    const endDate = end ? new Date(end + "T00:00:00") : null;
    const addDays = (d: Date, n: number) => {
      const nd = new Date(d);
      nd.setDate(d.getDate() + n);
      return nd;
    };
    const toKey = (d: Date) => {
      if (granularity === "month")
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (granularity === "week") {
        // ISO week key: YYYY-Www
        const tmp = new Date(
          Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()),
        );
        const dayNum = tmp.getUTCDay() || 7;
        tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil(
          (((tmp as any) - (yearStart as any)) / 86400000 + 1) / 7,
        );
        return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
      }
      return d.toISOString().slice(0, 10);
    };

    if (startDate && endDate) {
      if (granularity === "month") {
        const sd = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        const ed = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        const cursor = new Date(sd);
        while (cursor <= ed) {
          buckets.set(
            `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`,
            0,
          );
          cursor.setMonth(cursor.getMonth() + 1);
        }
      } else {
        for (
          let d = new Date(startDate);
          d <= endDate;
          d = addDays(d, granularity === "week" ? 7 : 1)
        ) {
          buckets.set(toKey(d), 0);
        }
      }
    }

    rows.forEach((r: any) => {
      const created = r?.createdAt ? new Date(r.createdAt) : null;
      if (!created) return;
      const key = toKey(created);
      buckets.set(key, (buckets.get(key) || 0) + (Number(r?.amount) || 0));
    });

    const result = Array.from(buckets.entries()).map(([name, value]) => ({
      name,
      Revenue: value,
    }));

    return { totalRevenue: sum, ordersCount: rows.length, chartData: result };
  }, [data, start, end, granularity]);

  return (
    <div className="mt-8 space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Start Date
            </label>
            <Controller
              name="start"
              control={control}
              render={({ field }) => (
                <input
                  type="date"
                  className="border rounded px-3 py-2 bg-white"
                  {...field}
                />
              )}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">End Date</label>
            <Controller
              name="end"
              control={control}
              render={({ field }) => (
                <input
                  type="date"
                  className="border rounded px-3 py-2 bg-white"
                  {...field}
                />
              )}
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Controller
              name="granularity"
              control={control}
              render={({ field }) => (
                <div className="inline-flex rounded-md border overflow-hidden">
                  {(["day", "week", "month"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`px-3 py-2 text-sm ${
                        field.value === g
                          ? "bg-blue-500 text-white"
                          : "bg-white text-gray-700"
                      } ${g !== "month" ? "border-r" : ""}`}
                      onClick={() => field.onChange(g)}
                    >
                      {g.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="text-sm text-gray-600">Total Revenue</div>
          <div className="text-2xl font-semibold text-blue-600 mt-1">
            {CurrencySign}
            {totalRevenue.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="text-sm text-gray-600">Orders</div>
          <div className="text-2xl font-semibold text-gray-800 mt-1">
            {ordersCount.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="text-sm text-gray-600">Average Order Value</div>
          <div className="text-2xl font-semibold text-emerald-600 mt-1">
            {CurrencySign}
            {(ordersCount ? totalRevenue / ordersCount : 0).toLocaleString(
              undefined,
              { maximumFractionDigits: 2 },
            )}
          </div>
        </div>
      </div>

      {/* Trend */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        {isLoading ? (
          <div className="h-[260px] animate-pulse bg-gray-100 rounded" />
        ) : (
          <>
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Revenue Trend
            </h3>
            <BarChartComponent
              data={chartData}
              dataKeys={["Revenue"]}
              height={300}
              xAxisLabel={
                granularity === "day"
                  ? "Date"
                  : granularity === "week"
                    ? "Week"
                    : "Month"
              }
              yAxisLabel="Revenue"
              showLegend={false}
              colorScale={["#3b82f6"]}
            />
          </>
        )}
      </div>
    </div>
  );
}
export default RevenueSection;
