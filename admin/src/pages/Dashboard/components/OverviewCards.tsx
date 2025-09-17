import { buildQueryString } from "@/utils/generalHelper";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { useMemo, useState } from "react";
import { CurrencySign } from "@/constants";
import { PiggyBank, Wallet, Landmark, ChartPie } from "lucide-react";
import BarChartComponent from "../BarChartComponent";
import PieChartComponent from "../PieChartComponent";

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
    <>
      <div className="mt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard
            title="Total Balance (All)"
            value={`${CurrencySign}${totals.all.toLocaleString()}`}
            gradient="from-purple-500 via-fuchsia-600 to-purple-500"
            Icon={PiggyBank}
          />
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
        </div>
      </div>
      <FiscalYearSummary />
    </>
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

function FiscalYearSummary() {
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
  const toNum = (v: any) => {
    if (v === null || v === undefined) return 0;
    const s = String(v).replace(/,/g, "").trim();
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  };
  const pd = (purData as any)?.data || {};
  const purchaseRows: any[] = pd?.data || [];
  const purchasesFromRows = Array.isArray(purchaseRows)
    ? purchaseRows.reduce(
        (sum: number, r: any) =>
          sum + toNum(r?.totalAmount ?? r?.total ?? r?.amount),
        0,
      )
    : 0;
  const purchasesTotal: number = toNum(pd?.grandTotal) || purchasesFromRows;

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

  // Top selling filters
  const [topRange, setTopRange] = useState<"fy" | "7d" | "30d">("fy");
  const [topN, setTopN] = useState<number>(5);

  const topRangeDates = useMemo(() => {
    const now = new Date();
    const start7 = new Date(now);
    start7.setDate(now.getDate() - 6);
    const start30 = new Date(now);
    start30.setDate(now.getDate() - 29);
    if (topRange === "7d") return { start: start7, end: now };
    if (topRange === "30d") return { start: start30, end: now };
    return { start: fyStart, end: fyEnd };
  }, [topRange, fyStart, fyEnd]);

  const urlOrdersFY = buildQueryString("order/list", {
    page: 1,
    limit: 100000,
    search: {
      start: topRangeDates.start.toISOString().slice(0, 10),
      end: topRangeDates.end.toISOString().slice(0, 10),
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
      .slice(0, Math.max(1, Math.min(15, Number(topN) || 5)))
      .map(([name, qty]) => ({ name, Quantity: qty }));
  }, [ordersFY, topN]);

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
        <div className="flex items-center justify-between mb-4 gap-2">
          <h3 className="text-base font-semibold text-gray-900">
            Top Selling Items
          </h3>
          <div className="flex items-center gap-2">
            <select
              value={topRange}
              onChange={(e) => setTopRange(e.target.value as any)}
              className="border border-gray-300 rounded-md text-xs px-2 py-1 bg-white"
              title="Range"
            >
              <option value="fy">Fiscal Year</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
            <div className="flex items-center gap-1">
              <label htmlFor="topN" className="text-xs text-gray-600">
                Top
              </label>
              <input
                id="topN"
                type="number"
                min={1}
                max={15}
                value={topN}
                onChange={(e) => setTopN(Math.max(1, Math.min(15, Number(e.target.value) || 5)))}
                className="w-14 border border-gray-300 rounded-md text-xs px-2 py-1 bg-white"
              />
            </div>
          </div>
        </div>
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

export default OverviewCards;
