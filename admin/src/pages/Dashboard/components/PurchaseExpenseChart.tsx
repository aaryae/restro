import { ChartPie } from "lucide-react";
import PieChartComponent from "../PieChartComponent";
import { EXPENSE_URL, PURCHASE_URL } from "@/constants/apiUrlConstants";
import { checkAccess } from "@/utils/accessHelper";
import { useGetApiQuery } from "@/redux/services/crudApi";

function PurchaseExpenseSection() {
  const { data: purchaseCategoryData } = useGetApiQuery({
    url: `${PURCHASE_URL}category-summary?status=completed`,
    skip: !checkAccess("Purchase").includes("view-category-summary"),
  });

  const { data: expenseCategoryData } = useGetApiQuery({
    url: `${EXPENSE_URL}category-summary`,
    skip: !checkAccess("Expense").includes("view-category-summary"),
  });

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ChartPie className="text-blue-600" />
          <h3 className="text-base font-semibold text-gray-900">
            Fiscal Year Summary
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <PieChartComponent
            data={purchaseCategoryData?.data || []}
            responsive
            height={260}
            showLegend
            legendPosition="bottom"
            colorScale={["#22c55e", "#8B0000"]}
          />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <PieChartComponent
            data={expenseCategoryData?.data || []}
            responsive
            height={260}
            showLegend
            legendPosition="bottom"
            colorScale={["#22c55e", "#8B0000"]}
          />
        </div>
      </div>

      {/* <div className="mt-6 w-full max-w-md bg-white rounded-xl border border-gray-200 shadow-sm p-4">
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
                onChange={(e) =>
                  setTopN(
                    Math.max(1, Math.min(15, Number(e.target.value) || 5)),
                  )
                }
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
      </div> */}
    </div>
  );
}
export default PurchaseExpenseSection;
