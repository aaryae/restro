import { format, getHours } from "date-fns";
import { useAppSelector } from "@/redux/store/hooks";
import { useForm } from "react-hook-form";
import { Controller } from "react-hook-form";
import { useMemo } from "react";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { buildQueryString } from "@/utils/generalHelper";
import { CurrencySign } from "@/constants";
import { Wallet, Landmark, PiggyBank, ChartPie } from "lucide-react";
import PieChartComponent from "./PieChartComponent";
import BarChartComponent from "./BarChartComponent";

const getPartOfDay = (date: Date = new Date()): string => {
  const hour = getHours(date);
  if (hour >= 0 && hour < 6) return "Night";
  if (hour >= 6 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 18) return "Afternoon";
  return "Evening";
};

export default function Dashboard() {
  const userName = useAppSelector((state) => state.profile.username);
  const todayDate = format(new Date(), "PPPP");

  const headerOptions = [
    { label: "Overview", value: "overview" },
    { label: "Revenue", value: "revenue" },
    { label: "Purchase", value: "purchase" },
  ];

  const { control, watch } = useForm<{ accountType: string }>({
    defaultValues: { accountType: "overview" },
  });
  const selectedView = watch("accountType");

  return (
    <>
      <div className="w-full flex justify-between">
        <div className="flex flex-col">
          <div className="text-left text-2xl font-bold">
            Good {getPartOfDay()},{" "}
            <span className="text-green-500">{userName}</span>
          </div>
          <div className="flex">
            <span className="text-blue-500 font-semibold">{todayDate}</span>
          </div>
        </div>
      </div>
      <div className="flex justify-between mt-4">
        <Controller
          name="accountType"
          control={control}
          render={({ field }) => (
            <div className="flex space-x-5 p-1 rounded-lg">
              {headerOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`flex border-2 py-3 px-8 text-base font-medium rounded-md transition-colors ${
                    field.value === option.value
                      ? "bg-blue-500 text-white border-none"
                      : "bg-white text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => field.onChange(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        />
      </div>
      {/* Overview content */}
      {selectedView === "overview" && (
        <>
          <OverviewCards />
          <FiscalYearSummary />
        </>
      )}
      {/* Revenue content */}
      {selectedView === "revenue" && (
        <>
          <RevenueSection />
        </>
      )}
    </>
  );
}

function OverviewCards() {
  const url = buildQueryString("account/list", { page: 1, limit: 1000 });
  const { data, isLoading } = useGetApiQuery({ url });

  const totals = useMemo(() => {
    const rows: any[] = data?.data?.data || [];
    const cash = rows.filter(
      (r) => (r?.accountType || "").toLowerCase() === "cash",
    );
    const bank = rows.filter(
      (r) => (r?.accountType || "").toLowerCase() === "bank",
    );
    const sum = (arr: any[]) =>
      arr.reduce((acc, r) => acc + (Number(r?.currentBalance) || 0), 0);
    return {
      cash: sum(cash),
      bank: sum(bank),
      all: sum(rows),
    };
  }, [data]);

  if (isLoading)
    return (
      <div className="mt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-24 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
              <div className="h-full w-full animate-pulse bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-28 bg-white rounded-xl border border-gray-200 shadow-sm"
            >
              <div className="h-full w-full animate-pulse bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    );

  return (
    <div className="mt-6 space-y-6">
      {/* Totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          title="Total Cash Balance"
          value={`${CurrencySign}${totals.cash.toLocaleString()}`}
          gradient="from-emerald-500 via-emerald-600 to-emerald-500"
          Icon={Wallet}
        />
        <SummaryCard
          title="Total Bank Balance"
          value={`${CurrencySign}${totals.bank.toLocaleString()}`}
          gradient="from-blue-500 via-blue-600 to-blue-500"
          Icon={Landmark}
        />
        <SummaryCard
          title="Total Balance (All)"
          value={`${CurrencySign}${totals.all.toLocaleString()}`}
          gradient="from-purple-500 via-fuchsia-600 to-purple-500"
          Icon={PiggyBank}
        />
      </div>
    </div>
  );
}

function FiscalYearSummary() {
  // fiscal year (starts Jul 1, ends Jun 30)
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const fyStart = new Date(month >= 6 ? year : year - 1, 6, 1);
  const fyEnd = new Date(month >= 6 ? year + 1 : year, 5, 30, 23, 59, 59, 999);

  // Revenue within fiscal year
  const urlRevenue = buildQueryString("revenue/list", {
    page: 1,
    limit: 1000000,
    search: {
      start: fyStart.toISOString().slice(0, 10),
      end: fyEnd.toISOString().slice(0, 10),
    },
  });
  const { data: revData, isLoading: revLoading } = useGetApiQuery({
    url: urlRevenue,
  });

  const urlPurchase = buildQueryString("purchase/list", {
    page: 1,
    limit: 1000000,
    search: {
      start: fyStart.toISOString().slice(0, 10),
      end: fyEnd.toISOString().slice(0, 10),
    },
  });
  const { data: purData, isLoading: purLoading } = useGetApiQuery({
    url: urlPurchase,
  });

  const revenueTotal: number = Number((revData as any)?.data?.grandTotal) || 0;
  const purchaseRows: any[] = (purData as any)?.data?.data || [];
  const purchasesTotal: number =
    Number((purData as any)?.data?.grandTotal) ||
    (Array.isArray(purchaseRows)
      ? purchaseRows.reduce(
          (sum: number, r: any) => sum + (Number((r as any)?.amount) || 0),
          0,
        )
      : 0);

  const profit = revenueTotal - purchasesTotal;
  const pieData = [
    { name: "Revenue", value: revenueTotal },
    { name: "Purchases", value: purchasesTotal },
  ];

  // Weekly sales of last 7 days
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  const urlRevenueWeek = buildQueryString("revenue/list", {
    page: 1,
    limit: 100000,
    search: {
      start: sevenDaysAgo.toISOString().slice(0, 10),
      end: today.toISOString().slice(0, 10),
    },
  });
  const { data: revWeekData, isLoading: weekLoading } = useGetApiQuery({
    url: urlRevenueWeek,
  });
  const weeklyBarData = useMemo(() => {
    const rows: any[] = (revWeekData as any)?.data?.data || [];
    const map = new Map<string, number>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(sevenDaysAgo.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      map.set(key, 0);
    }
    rows.forEach((r: any) => {
      const created = r?.createdAt ? new Date(r.createdAt) : null;
      const key = created ? created.toISOString().slice(0, 10) : null;
      if (key && map.has(key)) {
        map.set(key, (map.get(key) || 0) + (Number(r?.amount) || 0));
      }
    });

    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return Array.from(map.entries()).map(([dateStr, total]) => {
      const d = new Date(dateStr + "T00:00:00");
      return { name: dayLabels[d.getDay()], Sales: total };
    });
  }, [revWeekData]);

  // Top selling
  const urlOrdersFY = buildQueryString("order/list", {
    page: 1,
    limit: 100000,
    search: {
      start: fyStart.toISOString().slice(0, 10),
      end: fyEnd.toISOString().slice(0, 10),
    },
  });
  const { data: ordersFY, isLoading: ordersLoading } = useGetApiQuery({
    url: urlOrdersFY,
  });
  const topItemsBarData = useMemo(() => {
    const orders: any[] = (ordersFY as any)?.data?.data || [];
    const map = new Map<string, number>();
    orders.forEach((o: any) => {
      (o?.orderItems || []).forEach((oi: any) => {
        if ((oi?.status || "").toLowerCase() === "cancelled") return;
        const prod = oi?.product || {};
        const key =
          prod?.name || prod?.title || prod?.productName || `#${oi?.productId}`;
        const qty = Number(oi?.quantity) || 0;
        map.set(key, (map.get(key) || 0) + qty);
      });
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, qty]) => ({ name, Quantity: qty }));
  }, [ordersFY]);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ChartPie className="text-blue-600" />
          <h3 className="text-base font-semibold text-gray-900">
            Fiscal Year Summary
          </h3>
        </div>
        <div className="text-xs text-gray-500">
          {fyStart.toLocaleDateString()} – {fyEnd.toLocaleDateString()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 lg:col-span-2">
          {revLoading || purLoading ? (
            <div className="h-[260px] animate-pulse bg-gray-100 rounded" />
          ) : (
            <>
              <PieChartComponent
                data={pieData}
                responsive
                height={260}
                showLegend
                legendPosition="bottom"
                colorScale={["#0ea5e9", "#f97316"]}
              />
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <div className="text-sm text-gray-600">Total Revenue</div>
                  <div className="text-2xl font-semibold text-blue-600 mt-1">
                    {CurrencySign}
                    {revenueTotal.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <div className="text-sm text-gray-600">Total Purchases</div>
                  <div className="text-2xl font-semibold text-orange-600 mt-1">
                    {CurrencySign}
                    {purchasesTotal.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <div className="text-sm text-gray-600">
                    {profit >= 0 ? "Total Profit" : "Total Loss"}
                  </div>
                  <div
                    className={`text-2xl font-semibold mt-1 ${profit >= 0 ? "text-emerald-600" : "text-red-600"}`}
                  >
                    {CurrencySign}
                    {Math.abs(profit).toLocaleString()}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          {weekLoading ? (
            <div className="h-[260px] animate-pulse bg-gray-100 rounded" />
          ) : (
            <>
              <h3 className="text-base font-semibold text-gray-900 mb-4">
                Weekly Summary
              </h3>
              <BarChartComponent
                data={weeklyBarData}
                dataKeys={["Sales"]}
                height={260}
                xAxisLabel="Day"
                yAxisLabel="Sales"
                showLegend={false}
                colorScale={["#10b981"]}
              />
            </>
          )}
        </div>
      </div>

      <div className="mt-6 w-full max-w-md bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          Top Selling Items
        </h3>
        {ordersLoading ? (
          <div className="h-[220px] animate-pulse bg-gray-100 rounded" />
        ) : (
          <BarChartComponent
            data={topItemsBarData}
            dataKeys={["Quantity"]}
            height={220}
            xAxisLabel="Item"
            yAxisLabel="Qty"
            showLegend={false}
            colorScale={["#6366f1"]}
          />
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  gradient,
  Icon,
}: {
  title: string;
  value: string;
  gradient: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="relative rounded-xl overflow-hidden shadow-sm border border-gray-200">
      <div
        className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-90`}
      />
      <div className="relative p-5 flex items-center justify-between text-white">
        <div>
          <div className="text-sm/5 opacity-90">{title}</div>
          <div className="text-2xl font-semibold mt-1 drop-shadow-sm">
            {value}
          </div>
        </div>
        <div className="h-12 w-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

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
      // Seed buckets across range
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
