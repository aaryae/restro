import { useForm, Controller } from "react-hook-form";
import { buildQueryString } from "@/utils/generalHelper";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { useMemo } from "react";
import { CurrencySign } from "@/constants";
import { Wallet, Landmark, PiggyBank, ChartPie } from "lucide-react";
import BarChartComponent from "../BarChartComponent";
import PieChartComponent from "../PieChartComponent";

function PurchaseSection() {
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

  const url = buildQueryString("purchase/list", {
    page: 1,
    limit: 25,
    search: { start, end },
  });
  const { data, isLoading } = useGetApiQuery({ url });

  const toNum = (v: any) => {
    if (v === null || v === undefined) return 0;
    const s = String(v).replace(/,/g, "").trim();
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  };

  const {
    totalPurchases,
    purchasesCount,
    avgPurchaseValue,
    // outstandingPayables,
    trendData,
    supplierPie,
  } = useMemo(() => {
    const rows: any[] = (data as any)?.data?.data || [];

    // Totals and counts
    const totals = rows.map((r) =>
      toNum(r?.totalAmount ?? r?.total ?? r?.amount),
    );
    const totalPurchases = totals.reduce((a, b) => a + b, 0);
    const purchasesCount = rows.length;
    const avgPurchaseValue = purchasesCount
      ? totalPurchases / purchasesCount
      : 0;

    // const outstandingPayables = rows.reduce((sum: number, r: any) => {
    //   const total = toNum(r?.totalAmount ?? r?.total ?? r?.amount);
    //   const paid = toNum(r?.paidAmount ?? r?.amountPaid ?? 0);
    //   const dueField = toNum(r?.dueAmount);
    //   let due = dueField || Math.max(total - paid, 0);
    //   const status = String(r?.paymentStatus ?? r?.status ?? "").toLowerCase();
    //   if (
    //     status &&
    //     ["paid", "completed", "settled"].some((k) => status.includes(k))
    //   ) {
    //     due = 0;
    //   }
    //   return sum + Math.max(due, 0);
    // }, 0);

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
      const created = r?.createdAt || r?.purchaseDate;
      const d = created ? new Date(created) : null;
      if (!d) return;
      const key = toKey(d);
      const amt = toNum(r?.totalAmount ?? r?.total ?? r?.amount);
      buckets.set(key, (buckets.get(key) || 0) + amt);
    });
    const trendData = Array.from(buckets.entries()).map(([name, value]) => ({
      name,
      Purchases: value,
    }));

    // Supplier breakdown pie
    const supplierMap = new Map<string, number>();
    rows.forEach((r: any) => {
      const sup =
        r?.supplier?.name ||
        r?.supplierName ||
        r?.supplier ||
        `#${r?.supplierId ?? "N/A"}`;
      const amt = toNum(r?.totalAmount ?? r?.total ?? r?.amount);
      supplierMap.set(sup, (supplierMap.get(sup) || 0) + amt);
    });
    const supplierEntries = Array.from(supplierMap.entries()).sort(
      (a, b) => b[1] - a[1],
    );
    const top5 = supplierEntries.slice(0, 5);
    const othersTotal = supplierEntries.slice(5).reduce((s, [, v]) => s + v, 0);
    const supplierPie = [
      ...top5.map(([name, value]) => ({ name, value })),
      ...(othersTotal > 0 ? [{ name: "Others", value: othersTotal }] : []),
    ];

    return {
      totalPurchases,
      purchasesCount,
      avgPurchaseValue,
      // outstandingPayables,
      trendData,
      supplierPie,
    };
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
                      className={`px-3 py-2 text-sm ${field.value === g ? "bg-orange-500 text-white" : "bg-white text-gray-700"} ${g !== "month" ? "border-r" : ""}`}
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="text-sm text-gray-600">Total Purchases</div>
          <div className="text-2xl font-semibold text-orange-600 mt-1">
            {CurrencySign}
            {totalPurchases.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="text-sm text-gray-600">Average Purchase Value</div>
          <div className="text-2xl font-semibold text-emerald-600 mt-1">
            {CurrencySign}
            {avgPurchaseValue.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
        {/* <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="text-sm text-gray-600">Outstanding Payables</div>
            <div className="text-2xl font-semibold text-red-600 mt-1">
              {CurrencySign}
              {outstandingPayables.toLocaleString()}
            </div>
          </div> */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="text-sm text-gray-600">Purchases</div>
          <div className="text-2xl font-semibold text-gray-800 mt-1">
            {purchasesCount.toLocaleString()}
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
              Purchase Trend
            </h3>
            <BarChartComponent
              data={trendData}
              dataKeys={["Purchases"]}
              height={300}
              xAxisLabel={
                granularity === "day"
                  ? "Date"
                  : granularity === "week"
                    ? "Week"
                    : "Month"
              }
              yAxisLabel="Amount"
              showLegend={false}
              colorScale={["#f97316"]}
            />
          </>
        )}
      </div>

      {/* Breakdown (Supplier only) */}
      <div className="grid grid-cols-1 gap-6 items-start">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          {isLoading ? (
            <div className="h-[260px] animate-pulse bg-gray-100 rounded" />
          ) : (
            <>
              <h3 className="text-base font-semibold text-gray-900 mb-4">
                Spend by Supplier
              </h3>
              <PieChartComponent
                data={supplierPie}
                responsive
                height={260}
                showLegend
                legendPosition="bottom"
                colorScale={[
                  "#fb923c",
                  "#fdba74",
                  "#f59e0b",
                  "#fbbf24",
                  "#fcd34d",
                  "#fca5a5",
                ]}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PurchaseSection;
