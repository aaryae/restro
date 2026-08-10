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
import { DASHBOARD_URL } from "@/constants/apiUrlConstants";
import { checkAccess } from "@/utils/accessHelper";
import SummaryCard from "@/components/SummaryCard";
import DashboardChartCard from "./DashboardChartCard";
import { type ChartType } from "./ChartTypeTabs";
import { CHART_BRAND, CHART_FISCAL_COLORS } from "../chartTheme";
import { formatCurrencyAmount } from "@/utils/formatCurrency";
import { toTrendData } from "../dashboardHelpers";

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

  const [chartsReady, setChartsReady] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setChartsReady(true), 250);
    return () => window.clearTimeout(timer);
  }, []);

  const { data: overviewData, isLoading } = useGetApiQuery({
    url: `${DASHBOARD_URL}overview`,
  });

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

  const overview = overviewData?.data;
  const showRevenue = revenueAccessList.includes("view-total");
  const showPurchase = purchaseAccessList.includes("view-total");
  const showExpense = expenseAccessList.includes("view-total");
  const showTransactions = withdrawAccessList.includes("view");
  const profit = overview?.profit ?? 0;

  return (
    <div className="min-w-0 space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {showRevenue && overview && (
          <SummaryCard
            title="Total Revenue"
            value={`${CurrencySign}${overview.totalRevenue.toLocaleString()}`}
            tone="violet"
            Icon={PiggyBank}
          />
        )}
        {showPurchase && overview && (
          <SummaryCard
            title="Total Purchase"
            value={`${CurrencySign}${overview.totalPurchase.toLocaleString()}`}
            tone="emerald"
            Icon={ShoppingCart}
          />
        )}
        {showExpense && overview && (
          <SummaryCard
            title="Total Expense"
            value={`${CurrencySign}${overview.totalExpense.toLocaleString()}`}
            tone="sky"
            Icon={IndianRupee}
          />
        )}
        {showRevenue && showPurchase && showExpense && overview && (
          <SummaryCard
            title="Profit"
            value={`${CurrencySign}${profit.toLocaleString()}`}
            tone="amber"
            Icon={TrendingUp}
          />
        )}
        {showTransactions && overview && (
          <SummaryCard
            title="Total Withdrawn"
            value={`${CurrencySign}${overview.totalWithdraw.toLocaleString()}`}
            tone="rose"
            Icon={Wallet}
          />
        )}
        {showTransactions && overview && (
          <SummaryCard
            title="Total Deposits"
            value={`${CurrencySign}${overview.totalDeposit.toLocaleString()}`}
            tone="green"
            Icon={PiggyBank}
          />
        )}
        {showRevenue &&
          showPurchase &&
          showExpense &&
          showTransactions &&
          overview && (
            <SummaryCard
              title="Remaining Balance"
              value={`${CurrencySign}${overview.remainingBalance.toLocaleString()}`}
              tone="teal"
              Icon={Landmark}
            />
          )}
        {overviewData?.success && overview && (
          <SummaryCard
            title="Total Collection Till Date"
            value={`${CurrencySign}${formatCurrencyAmount(overview.totalCollectionBalance)}`}
            tone="indigo"
            Icon={Landmark}
          />
        )}
      </div>

      {chartsReady && showRevenue && showPurchase && showExpense && overview && (
        <FiscalYearSummary
          totalRevenue={overview.totalRevenue}
          totalPurchase={overview.totalPurchase}
          totalExpense={overview.totalExpense}
          openingBalance={overview.openingBalance}
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

  const { data: dailySalesData } = useGetApiQuery(
    { url: `${DASHBOARD_URL}daily-sales?days=14` },
    { skip: !showSalesTrend || chartType !== "line" },
  );

  const pieData = useMemo(
    () =>
      [
        { name: "Revenue", value: Number(totalRevenue) || 0 },
        { name: "Purchase", value: Number(totalPurchase) || 0 },
        { name: "Expense", value: Number(totalExpense) || 0 },
      ].filter((item) => item.value > 0),
    [totalRevenue, totalPurchase, totalExpense],
  );

  const barData = useMemo(
    () => [
      { name: "Revenue", amount: Number(totalRevenue) || 0 },
      { name: "Purchase", amount: Number(totalPurchase) || 0 },
      { name: "Expense", amount: Number(totalExpense) || 0 },
      {
        name: profit >= 0 ? "Profit" : "Loss",
        amount: Math.abs(Number(profit) || 0),
      },
    ],
    [totalRevenue, totalPurchase, totalExpense, profit],
  );

  const lineData = useMemo(() => {
    const rows = dailySalesData?.data || [];
    return toTrendData(rows, "Sales");
  }, [dailySalesData]);

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
