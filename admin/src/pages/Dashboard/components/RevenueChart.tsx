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

function RevenueSection() {
  const orderAccess = checkAccess("Order");
  const [chartType, setChartType] = useState<ChartType>("bar");

  const { data: orderCategoryData, isLoading: loadingCategories } =
    useGetApiQuery({
      url: `${ORDER_URL}category-sales-summary`,
      skip: !orderAccess.includes("view-category-sales-summary"),
    });

  const { data: orderTopSalesData, isLoading: loadingTopSales } =
    useGetApiQuery({
      url: `${ORDER_URL}product-top-sales`,
      skip: !orderAccess.includes("view-product-top-sales"),
    });

  const { data: ordersData, isLoading: loadingOrders } = useGetApiQuery({
    url: buildQueryString(`${ORDER_URL}list`, { page: 1, limit: 300 }),
    skip: !orderAccess.includes("view"),
  });

  const categoryPie = useMemo(
    () =>
      (orderCategoryData?.data || []).map((item: any) => ({
        name: item.name || item.category,
        value: Number(item.amount || 0),
      })),
    [orderCategoryData],
  );

  const salesTrend = useMemo(() => {
    const rows: any[] = ordersData?.data?.data || [];
    const buckets = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      buckets.set(d.toISOString().slice(0, 10), 0);
    }
    rows.forEach((order) => {
      const date = String(order?.createdAt || "").slice(0, 10);
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
            data={orderTopSalesData?.data || orderCategoryData?.data || []}
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
