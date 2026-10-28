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
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { DASHBOARD_URL } from "@/constants/apiUrlConstants";
import { checkAccess } from "@/utils/accessHelper";
import SummaryCard from "@/components/SummaryCard";
import DashboardChartCard from "./DashboardChartCard";
import { type ChartType } from "./ChartTypeTabs";
import { formatChartValue, useChartColors } from "../chartTheme";
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
              value={`${CurrencySign}${Number(overview.remainingBalance || 0).toLocaleString()}`}
              amount={Number(overview.remainingBalance || 0)}
              Icon={Landmark}
            />
          )}
        {showRevenue && showPurchase && showExpense && overview && (
          <SummaryCard
            title="Net Profit"
            tint="olive"
            value={`${CurrencySign}${profit.toLocaleString()}`}
            amount={profit}
            Icon={TrendingUp}
            signed
            dimWhenZero={false}
          />
        )}
        {overviewData?.success && overview && (
          <SummaryCard
            title="Cash on Hand"
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
            profit={profit}
            showSalesTrend={orderAccessList.includes("view")}
          />
        )}
    </div>
  );
}

type AllocationSlice = "Net Profit" | "Purchase" | "Expense";

function formatMarginPct(value: number) {
  const abs = Math.abs(value);
  return `${abs.toFixed(abs % 1 ? 1 : 0)}%`;
}

function FiscalHealthBanner({
  revenue,
  profit,
}: {
  revenue: number;
  profit: number;
}) {
  const marginPct = revenue > 0 ? (profit / revenue) * 100 : null;
  const isProfit = profit > 0;
  const isLoss = profit < 0;

  if (marginPct == null) {
    return (
      <div className="mb-3 rounded-lg border border-[var(--serve-border)] bg-[var(--serve-surface-2)] px-3 py-2 text-[12px] font-medium text-[var(--serve-muted)]">
        No revenue yet — allocation will appear once sales come in.
      </div>
    );
  }

  if (!isProfit && !isLoss) {
    return (
      <div className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] font-semibold text-slate-600">
        Break-even · 0% of revenue
      </div>
    );
  }

  if (isProfit) {
    return (
      <div className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] font-semibold text-emerald-700">
        <TrendingUp size={14} strokeWidth={2.25} aria-hidden />
        Business profit {formatMarginPct(marginPct)} of revenue
      </div>
    );
  }

  return (
    <div className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] font-semibold text-rose-700">
      <TrendingDown size={14} strokeWidth={2.25} aria-hidden />
      Business loss {formatMarginPct(marginPct)} of revenue
    </div>
  );
}

function FiscalYearSummary({
  totalRevenue,
  totalPurchase,
  totalExpense,
  openingBalance,
  profit,
  showSalesTrend,
}: {
  totalRevenue: number;
  totalPurchase: number;
  totalExpense: number;
  openingBalance: number | undefined;
  profit: number;
  showSalesTrend: boolean;
}) {
  const [chartType, setChartType] = useState<ChartType>("pie");
  const { allocation, brand } = useChartColors();
  const revenue = Number(totalRevenue) || 0;
  const purchase = Number(totalPurchase) || 0;
  const expense = Number(totalExpense) || 0;
  const net = Number(profit) || 0;
  const isProfit = net > 0;
  const isLoss = net < 0;

  const { data: dailySalesData } = useGetApiQuery(
    { url: `${DASHBOARD_URL}daily-sales?days=14` },
    { skip: !showSalesTrend || chartType !== "line" },
  );

  /**
   * Pie = how revenue was allocated.
   * Profit: Net Profit + Purchase + Expense (= revenue when books balance).
   * Loss: Purchase + Expense only — there is no profit slice to show.
   */
  const pieData = useMemo(() => {
    const slices: { name: AllocationSlice; value: number }[] = [];
    if (isProfit) slices.push({ name: "Net Profit", value: net });
    if (purchase > 0) slices.push({ name: "Purchase", value: purchase });
    if (expense > 0) slices.push({ name: "Expense", value: expense });
    return slices;
  }, [isProfit, net, purchase, expense]);

  const pieColors = useMemo(
    () => pieData.map((slice) => allocation[slice.name]),
    [pieData, allocation],
  );

  const barData = useMemo(
    () => [
      { name: "Revenue", amount: revenue },
      { name: "Purchase", amount: purchase },
      { name: "Expense", amount: expense },
      {
        name: isLoss ? "Loss" : "Profit",
        amount: Math.abs(net),
      },
    ],
    [revenue, purchase, expense, net, isLoss],
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
              <>
                <FiscalHealthBanner revenue={revenue} profit={net} />
                <PieChartComponent
                  data={pieData}
                  responsive
                  height={280}
                  showLegend
                  colors={pieColors}
                  centerLabel="Total Revenue"
                  centerValue={revenue}
                  centerTone="neutral"
                />
              </>
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
          value={`${CurrencySign}${revenue.toLocaleString()}`}
          amount={revenue}
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
          title={isLoss ? "Net Loss" : "Net Profit"}
          tint={isLoss ? "vermilion" : "olive"}
          value={formatChartValue(net)}
          amount={net}
          Icon={isLoss ? TrendingDown : TrendingUp}
          signed
          dimWhenZero={false}
        />
      </div>
    </div>
  );
}

export default OverviewCards;
