import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { CurrencySign } from "@/constants";
import {
  PiggyBank,
  Wallet,
  Landmark,
  ChartPie,
  ShoppingCart,
  IndianRupee,
  TrendingUp,
} from "lucide-react";
import {
  ACCOUNT_URL,
  EXPENSE_URL,
  ORDER_URL,
  PURCHASE_URL,
  REVENUE_URL,
  TRANSACTION_URL,
} from "@/constants/apiUrlConstants";
import { checkAccess } from "@/utils/accessHelper";
import { useGetSettingQuery } from "@/redux/services/settings";
import SummaryCard from "@/components/SummaryCard";
import DashboardChartCard from "./DashboardChartCard";
import { type ChartType } from "./ChartTypeTabs";
import { buildQueryString } from "@/utils/generalHelper";
import { CHART_BRAND, CHART_FISCAL_COLORS } from "../chartTheme";
import {
  formatCurrencyAmount,
  sumAccountBalances,
} from "@/utils/formatCurrency";

const PieChartComponent = lazy(() => import("../PieChartComponent"));
const BarChartComponent = lazy(() => import("../BarChartComponent"));
const LineChartComponent = lazy(() => import("../LineChartComponent"));

function ChartFallback() {
  return (
    <div className="h-[280px] animate-pulse rounded-lg bg-slate-50" />
  );
}

function OverviewCards() {
  const revenueAccessList = checkAccess("Revenue");
  const purchaseAccessList = checkAccess("Purchase");
  const expenseAccessList = checkAccess("Expense");
  const withdrawAccessList = checkAccess("Withdraw");
  const orderAccessList = checkAccess("Order");

  // Load summary cards first; defer chart UI until after first paint.
  const [chartsReady, setChartsReady] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setChartsReady(true), 250);
    return () => window.clearTimeout(timer);
  }, []);

  const { data: totalAndBalancesData, isLoading } = useGetApiQuery({
    url: `${ACCOUNT_URL}total-and-balances`,
  });

  const { data: totalRevenueData } = useGetApiQuery(
    { url: `${REVENUE_URL}total-revenue` },
    { skip: !revenueAccessList.includes("view-total") },
  );
  const { data: totalPurchaseData } = useGetApiQuery(
    { url: `${PURCHASE_URL}total-purchase?status=completed` },
    { skip: !purchaseAccessList.includes("view-total") },
  );
  const { data: totalExpenseData } = useGetApiQuery(
    { url: `${EXPENSE_URL}total-expense` },
    { skip: !expenseAccessList.includes("view-total") },
  );
  const { data: totalTransactionData } = useGetApiQuery(
    { url: `${TRANSACTION_URL}total` },
    { skip: !withdrawAccessList.includes("view") },
  );

  // Usually already cached from Layout — cheap.
  const { data: settings } = useGetSettingQuery("");

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-[76px] animate-pulse rounded-xl border border-slate-200 bg-slate-50"
            />
          ))}
        </div>
        <div className="h-[300px] animate-pulse rounded-xl border border-slate-200 bg-slate-50" />
      </div>
    );
  }

  const profit =
    totalRevenueData?.data?.total -
    (totalPurchaseData?.data?.total + totalExpenseData?.data?.total);
  const accountBalances = totalAndBalancesData?.data?.accounts || [];
  const totalCollectionBalance = sumAccountBalances(accountBalances);

  return (
    <div className="min-w-0 space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {totalRevenueData && (
          <SummaryCard
            title="Total Revenue"
            value={`${CurrencySign}${totalRevenueData?.data?.total.toLocaleString()}`}
            tone="violet"
            Icon={PiggyBank}
          />
        )}
        {totalPurchaseData && (
          <SummaryCard
            title="Total Purchase"
            value={`${CurrencySign}${totalPurchaseData?.data?.total.toLocaleString()}`}
            tone="emerald"
            Icon={ShoppingCart}
          />
        )}
        {totalExpenseData && (
          <SummaryCard
            title="Total Expense"
            value={`${CurrencySign}${totalExpenseData?.data?.total.toLocaleString()}`}
            tone="sky"
            Icon={IndianRupee}
          />
        )}
        {totalRevenueData && totalPurchaseData && totalExpenseData && (
          <SummaryCard
            title="Profit"
            value={`${CurrencySign}${profit.toLocaleString()}`}
            tone="amber"
            Icon={TrendingUp}
          />
        )}
        {totalTransactionData && (
          <SummaryCard
            title="Total Withdrawn"
            value={`${CurrencySign}${totalTransactionData?.data?.totalWithdraw?.toLocaleString()}`}
            tone="rose"
            Icon={Wallet}
          />
        )}
        {totalTransactionData && (
          <SummaryCard
            title="Total Deposits"
            value={`${CurrencySign}${totalTransactionData?.data?.totalDeposit?.toLocaleString()}`}
            tone="green"
            Icon={PiggyBank}
          />
        )}
        {totalRevenueData &&
          totalPurchaseData &&
          totalExpenseData &&
          totalTransactionData?.success && (
            <SummaryCard
              title="Remaining Balance"
              value={`${CurrencySign}${(profit + totalTransactionData?.data?.totalDeposit - (totalTransactionData?.data?.totalWithdraw || 0)).toLocaleString()}`}
              tone="teal"
              Icon={Landmark}
            />
          )}
        {totalAndBalancesData?.success && (
          <SummaryCard
            title="Total Collection Till Date"
            value={`${CurrencySign}${formatCurrencyAmount(totalCollectionBalance)}`}
            tone="indigo"
            Icon={Landmark}
          />
        )}
      </div>

      {chartsReady &&
        totalRevenueData &&
        totalPurchaseData &&
        totalExpenseData && (
          <FiscalYearSummary
            totalRevenue={totalRevenueData?.data?.total}
            totalPurchase={totalPurchaseData?.data?.total}
            totalExpense={totalExpenseData?.data?.total}
            openingBalance={settings?.data?.openingBalance}
            showSalesTrend={orderAccessList.includes("view")}
          />
        )}
    </div>
  );
}

function FiscalYearSummary({
  totalRevenue,
  totalPurchase,
  totalExpense,
  openingBalance,
  showSalesTrend,
}: {
  totalRevenue: number;
  totalPurchase: number;
  totalExpense: number;
  openingBalance: number | undefined;
  showSalesTrend: boolean;
}) {
  const [chartType, setChartType] = useState<ChartType>("pie");
  const profit = totalRevenue - (totalPurchase + totalExpense);
  const collectedAmount = profit + Number(openingBalance || 0);

  // Heavy order list only when the sales trend (line) chart is selected.
  const { data: ordersData } = useGetApiQuery(
    {
      url: buildQueryString(`${ORDER_URL}list`, { page: 1, limit: 50 }),
    },
    { skip: !showSalesTrend || chartType !== "line" },
  );

  const pieData = [
    { name: "Revenue", value: Number(totalRevenue) || 0 },
    { name: "Purchase", value: Number(totalPurchase) || 0 },
    { name: "Expense", value: Number(totalExpense) || 0 },
  ].filter((item) => item.value > 0);

  const barData = [
    { name: "Revenue", amount: Number(totalRevenue) || 0 },
    { name: "Purchase", amount: Number(totalPurchase) || 0 },
    { name: "Expense", amount: Number(totalExpense) || 0 },
    {
      name: profit >= 0 ? "Profit" : "Loss",
      amount: Math.abs(Number(profit) || 0),
    },
  ];

  const lineData = useMemo(() => {
    const rows: any[] = ordersData?.data?.data || [];
    const toYmd = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };
    const buckets = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      buckets.set(toYmd(d), 0);
    }
    rows.forEach((order) => {
      const raw = order?.orderStartTime || order?.createdAt;
      if (!raw) return;
      const date = toYmd(new Date(raw));
      if (!buckets.has(date)) return;
      const amount = Number(order?.totalAmount ?? order?.total ?? 0);
      buckets.set(date, (buckets.get(date) || 0) + amount);
    });
    return Array.from(buckets.entries()).map(([name, Sales]) => ({
      name: name.slice(5),
      Sales,
    }));
  }, [ordersData]);

  const allowedTypes: ChartType[] = showSalesTrend
    ? ["pie", "bar", "line"]
    : ["pie", "bar"];

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-3">
      <DashboardChartCard
        title="Fiscal Year Summary"
        icon={ChartPie}
        chartType={chartType}
        onChartTypeChange={setChartType}
        allowedChartTypes={allowedTypes}
        className="lg:col-span-2"
      >
        <div className="min-w-0 overflow-hidden">
          <Suspense fallback={<ChartFallback />}>
            {chartType === "pie" && (
              <PieChartComponent
                data={pieData}
                responsive
                height={280}
                showLegend
                colors={CHART_FISCAL_COLORS}
              />
            )}
            {chartType === "bar" && (
              <BarChartComponent
                data={barData}
                dataKeys={["amount"]}
                height={280}
                xAxisLabel="Metric"
                yAxisLabel="Amount"
                showLegend={false}
              />
            )}
            {chartType === "line" && (
              <LineChartComponent
                data={lineData}
                dataKeys={["Sales"]}
                height={280}
                xAxisLabel="Date"
                yAxisLabel="Sales"
                showLegend={false}
                colorScale={[CHART_BRAND]}
              />
            )}
          </Suspense>
        </div>
      </DashboardChartCard>

      <div className="flex min-w-0 flex-col gap-3">
        <SummaryCard
          title="Total Collected Amount"
          value={`${CurrencySign}${collectedAmount.toLocaleString()}`}
          tone="indigo"
          Icon={PiggyBank}
        />
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[12px] font-medium text-slate-500">
            Opening Balance
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-slate-800">
            {CurrencySign}
            {Number(openingBalance || 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-[12px] font-medium text-slate-500">Net Profit</p>
          <p
            className={`mt-1 text-xl font-semibold tabular-nums ${profit >= 0 ? "text-emerald-700" : "text-rose-700"}`}
          >
            {CurrencySign}
            {profit.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

export default OverviewCards;
