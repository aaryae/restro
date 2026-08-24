import { lazy, Suspense, useMemo, useState } from "react";
import { PieChart, Receipt } from "lucide-react";
import { EXPENSE_URL, PURCHASE_URL } from "@/constants/apiUrlConstants";
import { checkAccess } from "@/utils/accessHelper";
import { useGetApiQuery } from "@/redux/services/crudApi";
import DashboardChartCard from "./DashboardChartCard";
import { type ChartType } from "./ChartTypeTabs";
import {
  CHART_BRAND,
  CHART_BRAND_LIGHT,
  CHART_EXPENSE_COLORS,
  CHART_PURCHASE_COLORS,
} from "../chartTheme";
import { toTrendData } from "../dashboardHelpers";

const PieChartComponent = lazy(() => import("../PieChartComponent"));
const LineChartComponent = lazy(() => import("../LineChartComponent"));

function ChartFallback() {
  return <div className="h-[280px] animate-pulse rounded-lg bg-slate-50" />;
}

function canViewCategory(access: string[]) {
  return (
    access.includes("view-category-summary") || access.includes("view")
  );
}

function PurchaseExpenseSection() {
  const purchaseAccess = checkAccess("Purchase");
  const expenseAccess = checkAccess("Expense");
  const [purchaseChart, setPurchaseChart] = useState<ChartType>("pie");
  const [expenseChart, setExpenseChart] = useState<ChartType>("pie");

  const canPurchaseCategory = canViewCategory(purchaseAccess);
  const canExpenseCategory = canViewCategory(expenseAccess);

  const { data: purchaseCategoryData, isLoading: loadingPurchase } =
    useGetApiQuery(
      { url: `${PURCHASE_URL}category-summary?status=completed` },
      { skip: !canPurchaseCategory || purchaseChart !== "pie" },
    );

  const { data: expenseCategoryData, isLoading: loadingExpense } =
    useGetApiQuery(
      { url: `${EXPENSE_URL}category-summary` },
      { skip: !canExpenseCategory || expenseChart !== "pie" },
    );

  const { data: purchaseDailyData, isLoading: loadingPurchaseDaily } =
    useGetApiQuery(
      { url: `${PURCHASE_URL}daily-summary?days=14&status=completed` },
      {
        skip:
          !purchaseAccess.includes("view") || purchaseChart !== "line",
      },
    );

  const { data: expenseDailyData, isLoading: loadingExpenseDaily } =
    useGetApiQuery(
      { url: `${EXPENSE_URL}daily-summary?days=14` },
      {
        skip: !expenseAccess.includes("view") || expenseChart !== "line",
      },
    );

  const purchaseTrend = useMemo(
    () => toTrendData(purchaseDailyData?.data || []),
    [purchaseDailyData],
  );

  const expenseTrend = useMemo(
    () => toTrendData(expenseDailyData?.data || []),
    [expenseDailyData],
  );

  const purchaseCategoryChartData = useMemo(
    () =>
      (purchaseCategoryData?.data || []).map((item: any) => ({
        name: item.name || item.category || "Uncategorized",
        value: Number(item.value ?? item.amount ?? 0),
      })),
    [purchaseCategoryData],
  );

  const expenseCategoryChartData = useMemo(
    () =>
      (expenseCategoryData?.data || []).map((item: any) => ({
        name: item.name || item.category || "Uncategorized",
        value: Number(item.value ?? item.amount ?? 0),
      })),
    [expenseCategoryData],
  );

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
      <DashboardChartCard
        title="Purchase by Category"
        icon={PieChart}
        chartType={purchaseChart}
        onChartTypeChange={setPurchaseChart}
        allowedChartTypes={["pie", "line"]}
        loading={
          purchaseChart === "line" ? loadingPurchaseDaily : loadingPurchase
        }
      >
        <div className="min-w-0 overflow-hidden">
          <Suspense fallback={<ChartFallback />}>
            {purchaseChart === "pie" && (
              <PieChartComponent
                data={purchaseCategoryChartData}
                responsive
                height={280}
                showLegend
                colorScale={CHART_PURCHASE_COLORS}
              />
            )}
            {purchaseChart === "line" && (
              <LineChartComponent
                data={purchaseTrend}
                dataKeys={["Amount"]}
                height={280}
                xAxisLabel="Date"
                yAxisLabel="Amount"
                showLegend={false}
                colorScale={[CHART_BRAND]}
              />
            )}
          </Suspense>
        </div>
      </DashboardChartCard>

      <DashboardChartCard
        title="Expense by Category"
        icon={Receipt}
        chartType={expenseChart}
        onChartTypeChange={setExpenseChart}
        allowedChartTypes={["pie", "line"]}
        loading={
          expenseChart === "line" ? loadingExpenseDaily : loadingExpense
        }
      >
        <div className="min-w-0 overflow-hidden">
          <Suspense fallback={<ChartFallback />}>
            {expenseChart === "pie" && (
              <PieChartComponent
                data={expenseCategoryChartData}
                responsive
                height={280}
                showLegend
                colorScale={CHART_EXPENSE_COLORS}
              />
            )}
            {expenseChart === "line" && (
              <LineChartComponent
                data={expenseTrend}
                dataKeys={["Amount"]}
                height={280}
                xAxisLabel="Date"
                yAxisLabel="Amount"
                showLegend={false}
                colorScale={[CHART_BRAND_LIGHT]}
              />
            )}
          </Suspense>
        </div>
      </DashboardChartCard>
    </div>
  );
}

export default PurchaseExpenseSection;
