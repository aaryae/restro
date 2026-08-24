import { lazy, Suspense, useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";
import { DASHBOARD_URL, ORDER_URL } from "@/constants/apiUrlConstants";
import { checkAccess } from "@/utils/accessHelper";
import { useGetApiQuery } from "@/redux/services/crudApi";
import DashboardChartCard from "./DashboardChartCard";
import { type ChartType } from "./ChartTypeTabs";
import { CHART_BRAND, CHART_PALETTE } from "../chartTheme";
import { toTrendData } from "../dashboardHelpers";

const PieChartComponent = lazy(() => import("../PieChartComponent"));
const BarChartComponent = lazy(() => import("../BarChartComponent"));
const LineChartComponent = lazy(() => import("../LineChartComponent"));

function ChartFallback() {
  return <div className="h-[300px] animate-pulse rounded-lg bg-slate-50" />;
}

function RevenueSection() {
  const orderAccess = checkAccess("Order");
  const [chartType, setChartType] = useState<ChartType>("pie");

  const canViewCategory =
    orderAccess.includes("view-category-sales-summary") ||
    orderAccess.includes("view");
  const canViewTopSales =
    orderAccess.includes("view-product-top-sales") ||
    orderAccess.includes("view");

  const { data: orderCategoryData, isLoading: loadingCategories } =
    useGetApiQuery(
      { url: `${ORDER_URL}category-sales-summary` },
      { skip: !canViewCategory || (chartType !== "pie" && chartType !== "bar") },
    );

  const { data: orderTopSalesData, isLoading: loadingTopSales } =
    useGetApiQuery(
      { url: `${ORDER_URL}product-top-sales` },
      { skip: !canViewTopSales || chartType !== "bar" },
    );

  const { data: dailySalesData, isLoading: loadingDailySales } =
    useGetApiQuery(
      { url: `${DASHBOARD_URL}daily-sales?days=14` },
      { skip: !orderAccess.includes("view") || chartType !== "line" },
    );

  const categoryPie = useMemo(
    () =>
      (orderCategoryData?.data || [])
        .map((item: any) => ({
          name: item.name || item.category || "Uncategorized",
          value: Number(item.amount ?? item.value ?? 0),
        }))
        .filter((item: { value: number }) => item.value > 0),
    [orderCategoryData],
  );

  const topSalesBar = useMemo(
    () =>
      (orderTopSalesData?.data || orderCategoryData?.data || [])
        .map((item: any) => ({
          name: item.name || item.category || "Uncategorized",
          amount: Number(item.amount ?? item.value ?? 0),
        }))
        .filter((item: { amount: number }) => item.amount > 0),
    [orderTopSalesData, orderCategoryData],
  );

  const salesTrend = useMemo(
    () => toTrendData(dailySalesData?.data || [], "Sales"),
    [dailySalesData],
  );

  const loading =
    chartType === "line"
      ? loadingDailySales
      : chartType === "pie"
        ? loadingCategories
        : loadingCategories || loadingTopSales;

  return (
    <DashboardChartCard
      title="Revenue"
      icon={TrendingUp}
      chartType={chartType}
      onChartTypeChange={setChartType}
      allowedChartTypes={["pie", "bar", "line"]}
      loading={loading}
    >
      <div className="min-w-0 overflow-hidden">
        <Suspense fallback={<ChartFallback />}>
          {chartType === "pie" && (
            <PieChartComponent
              data={categoryPie}
              responsive
              height={300}
              showLegend
              colorScale={CHART_PALETTE}
            />
          )}
          {chartType === "bar" && (
            <BarChartComponent
              data={topSalesBar}
              dataKeys={["amount"]}
              height={300}
              xAxisLabel="Item"
              yAxisLabel="Amount"
              showLegend={false}
              colorScale={CHART_PALETTE}
            />
          )}
          {chartType === "line" && (
            <LineChartComponent
              data={salesTrend}
              dataKeys={["Sales"]}
              height={300}
              xAxisLabel="Date"
              yAxisLabel="Sales"
              showLegend={false}
              colorScale={[CHART_BRAND]}
            />
          )}
        </Suspense>
      </div>
    </DashboardChartCard>
  );
}

export default RevenueSection;
