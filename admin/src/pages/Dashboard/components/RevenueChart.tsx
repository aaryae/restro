import { useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";
import { ORDER_URL } from "@/constants/apiUrlConstants";
import { checkAccess } from "@/utils/accessHelper";
import { useGetApiQuery } from "@/redux/services/crudApi";
import BarChartComponent from "../BarChartComponent";
import PieChartComponent from "../PieChartComponent";
import LineChartComponent from "../LineChartComponent";
import DashboardChartCard from "./DashboardChartCard";
import { type ChartType } from "./ChartTypeTabs";
import { buildQueryString } from "@/utils/generalHelper";
import { CHART_BRAND, CHART_PALETTE } from "../chartTheme";

function localYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function RevenueSection() {
  const orderAccess = checkAccess("Order");
  const [chartType, setChartType] = useState<ChartType>("bar");

  const canViewCategory =
    orderAccess.includes("view-category-sales-summary") ||
    orderAccess.includes("view");
  const canViewTopSales =
    orderAccess.includes("view-product-top-sales") ||
    orderAccess.includes("view");

  const { data: orderCategoryData, isLoading: loadingCategories } =
    useGetApiQuery({
      url: `${ORDER_URL}category-sales-summary`,
      skip: !canViewCategory,
    });

  const { data: orderTopSalesData, isLoading: loadingTopSales } =
    useGetApiQuery({
      url: `${ORDER_URL}product-top-sales`,
      skip: !canViewTopSales,
    });

  const { data: ordersData, isLoading: loadingOrders } = useGetApiQuery({
    url: buildQueryString(`${ORDER_URL}list`, {
      page: 1,
      limit: 300,
      search: { status: "completed,pending" },
    }),
    skip: !orderAccess.includes("view"),
  });

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

  const salesTrend = useMemo(() => {
    const rows: any[] = ordersData?.data?.data || [];
    const buckets = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      buckets.set(localYmd(d), 0);
    }
    rows.forEach((order) => {
      const status = String(order?.status || "").toLowerCase();
      const payment = String(order?.paymentStatus || "").toLowerCase();
      if (status === "cancelled") return;
      if (!["paid", "partially_paid", "partially paid"].includes(payment) &&
          status !== "completed") {
        return;
      }
      const raw = order?.orderStartTime || order?.createdAt;
      if (!raw) return;
      const date = localYmd(new Date(raw));
      if (!buckets.has(date)) return;
      const amount = Number(order?.totalAmount ?? order?.total ?? 0);
      buckets.set(date, (buckets.get(date) || 0) + amount);
    });
    return Array.from(buckets.entries()).map(([name, Sales]) => ({
      name: name.slice(5),
      Sales,
    }));
  }, [ordersData]);

  const loading =
    chartType === "line"
      ? loadingOrders
      : chartType === "pie"
        ? loadingCategories
        : loadingCategories || loadingTopSales;

  return (
    <DashboardChartCard
      title="Revenue"
      icon={TrendingUp}
      chartType={chartType}
      onChartTypeChange={setChartType}
      loading={loading}
    >
      <div className="min-w-0 overflow-hidden">
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
      </div>
    </DashboardChartCard>
  );
}

export default RevenueSection;
