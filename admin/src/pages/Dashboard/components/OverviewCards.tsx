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
import { useChartColors } from "../chartTheme";
import { formatCurrencyAmount } from "@/utils/formatCurrency";
import { toTrendData } from "../dashboardHelpers";

const PieChartComponent = lazy(() => import("../PieChartComponent"));
const BarChartComponent = lazy(() => import("../BarChartComponent"));
const LineChartComponent = lazy(() => import("../LineChartComponent"));

function ChartFallback() {
  return (
    <div className="h-[280px] animate-pulse rounded-lg bg-[var(--serve-surface-2)]" />
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
              className="h-[76px] animate-pulse rounded-xl border border-[var(--serve-border)] bg-[var(--serve-surface-2)]"
            />
          ))}
        </div>
        <div className="h-[300px] animate-pulse rounded-xl border border-[var(--serve-border)] bg-[var(--serve-surface-2)]" />
      </div>
    );
  }

  const overview = overviewData?.data;
  const showRevenue = revenueAccessList.includes("view-total");
  const showPurchase = purchaseAccessList.includes("view-total");
  const showExpense = expenseAccessList.includes("view-total");
  const showTransactions = withdrawAccessList.includes("view");
  const profit = overview?.profit ?? 0;

  const showHero = showRevenue && overview;
  const margin =
    overview && overview.totalRevenue > 0
      ? (profit / overview.totalRevenue) * 100
      : null;

  return (
    <div className="min-w-0 space-y-4">
      {showHero && (
        <div className="dash-card dash-hero-kpi">
          <div className="min-w-0">
            <p className="dash-kpi-label">Total Revenue</p>
            <p className="dash-kpi-value truncate">
              {CurrencySign}
              {overview.totalRevenue.toLocaleString()}
            </p>
            {showPurchase && showExpense && (
              <p className="dash-hero-note">
                Net profit{" "}
                <b>
                  {CurrencySign}
                  {profit.toLocaleString()}
                </b>
                {margin != null &&
                  ` · ${margin.toFixed(margin % 1 ? 1 : 0)}% margin`}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {showPurchase && overview && (
          <SummaryCard
            title="Purchase"
            tint="cerulean"
            value={`${CurrencySign}${overview.totalPurchase.toLocaleString()}`}
            amount={overview.totalPurchase}
            Icon={ShoppingCart}
          />
        )}
        {showExpense && overview && (
          <SummaryCard
            title="Expense"
            tint="vermilion"
            value={`${CurrencySign}${overview.totalExpense.toLocaleString()}`}
            amount={overview.totalExpense}
            Icon={IndianRupee}
          />
        )}
        {showTransactions && overview && (
          <SummaryCard
            title="Withdrawn"
            tint="plum"
            value={`${CurrencySign}${overview.totalWithdraw.toLocaleString()}`}
            amount={overview.totalWithdraw}
            Icon={Wallet}
          />
        )}
        {showTransactions && overview && (
          <SummaryCard
            title="Deposits"
            tint="teal"
            value={`${CurrencySign}${overview.totalDeposit.toLocaleString()}`}
            amount={overview.totalDeposit}
            Icon={PiggyBank}
          />
        )}
        {!showHero && showRevenue && overview && (
          <SummaryCard
            title="Revenue"
            tint="bronze"
            value={`${CurrencySign}${overview.totalRevenue.toLocaleString()}`}
            amount={overview.totalRevenue}
            Icon={TrendingUp}
          />
        )}
        {showRevenue &&
          showPurchase &&
          showExpense &&
          showTransactions &&
          overview && (
            <SummaryCard
              title="Remaining Balance"
              tint="olive"
              value={`${CurrencySign}${overview.remainingBalance.toLocaleString()}`}
              amount={overview.remainingBalance}
              Icon={Landmark}
            />
          )}
        {overviewData?.success && overview && (
          <SummaryCard
            title="Collection Till Date"
            tint="indigo"
            value={`${CurrencySign}${formatCurrencyAmount(overview.totalCollectionBalance)}`}
            amount={overview.totalCollectionBalance}
            Icon={Landmark}
          />
        )}
      </div>

      {chartsReady &&
        showRevenue &&
        showPurchase &&
        showExpense &&
        overview && (
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
  const { fiscal, brand } = useChartColors();
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
                colors={fiscal}
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
                colorScale={[brand]}
              />
            )}
          </Suspense>
        </div>
      </DashboardChartCard>

      <div className="flex min-w-0 flex-col gap-3">
        <SummaryCard
          title="Total Collected"
          tint="teal"
          value={`${CurrencySign}${collectedAmount.toLocaleString()}`}
          amount={collectedAmount}
          Icon={PiggyBank}
        />
        <SummaryCard
          title="Opening Balance"
          tint="bronze"
          value={`${CurrencySign}${Number(openingBalance || 0).toLocaleString()}`}
          amount={Number(openingBalance || 0)}
          Icon={Landmark}
        />
        <SummaryCard
          title="Net Profit"
          tint="olive"
          value={`${CurrencySign}${profit.toLocaleString()}`}
          amount={profit}
          Icon={TrendingUp}
          signed
          dimWhenZero={false}
        />
      </div>
    </div>
  );
}

export default OverviewCards;
