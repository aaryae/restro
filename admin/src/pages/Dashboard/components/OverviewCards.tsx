import { buildQueryString } from "@/utils/generalHelper";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { useMemo, useState } from "react";
import { CurrencySign } from "@/constants";
import { PiggyBank, Wallet, Landmark, ChartPie } from "lucide-react";
import BarChartComponent from "../BarChartComponent";
import PieChartComponent from "../PieChartComponent";
import {
  EXPENSE_URL,
  PURCHASE_URL,
  REVENUE_URL,
} from "@/constants/apiUrlConstants";
import { checkAccess } from "@/utils/accessHelper";

function OverviewCards() {
  const revenueAccessList = checkAccess("Revenue");
  const purchaseAccessList = checkAccess("Purchase");
  const expenseAccessList = checkAccess("Expense");
  const { data: totalRevenueData } = useGetApiQuery({
    url: `${REVENUE_URL}total-revenue`,
    skip: !revenueAccessList.includes("view-total"),
  });
  const { data: totalPurchaseData } = useGetApiQuery({
    url: `${PURCHASE_URL}total-purchase`,
    skip: !purchaseAccessList.includes("view-total"),
  });
  const { data: totalExpenseData } = useGetApiQuery({
    url: `${EXPENSE_URL}total-expense`,
    skip: !expenseAccessList.includes("view-total"),
  });

  console.log(totalRevenueData, "reveueueueu");

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
          {totalRevenueData && (
            <SummaryCard
              title="Total Revenue"
              value={`${CurrencySign}${totalRevenueData?.data?.total.toLocaleString()}`}
              gradient="from-purple-500 via-fuchsia-600 to-purple-500"
              Icon={PiggyBank}
            />
          )}
          {totalPurchaseData && (
            <SummaryCard
              title="Total Purchase"
              value={`${CurrencySign}${totalPurchaseData?.data?.total.toLocaleString()}`}
              gradient="from-emerald-500 via-emerald-600 to-emerald-500"
              Icon={PiggyBank}
            />
          )}
          {totalExpenseData && (
            <SummaryCard
              title="Total Expense"
              value={`${CurrencySign}${totalExpenseData?.data?.total.toLocaleString()}`}
              gradient="from-blue-500 via-blue-600 to-blue-500"
              Icon={PiggyBank}
            />
          )}
          {/* <SummaryCard
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
          /> */}
        </div>
      </div>
      {totalRevenueData && totalPurchaseData && totalExpenseData && (
        <FiscalYearSummary
          totalRevenue={totalRevenueData?.data?.total}
          totalPurchase={totalPurchaseData?.data?.total}
          totalExpense={totalExpenseData?.data?.total}
        />
      )}
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
          <div className="text-2xl font-semibold mt-1 drop-shadow-sm text-left">
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

function FiscalYearSummary({
  totalRevenue,
  totalPurchase,
  totalExpense,
}: {
  totalRevenue: number;
  totalPurchase: number;
  totalExpense: number;
}) {
  const profit = totalRevenue - (totalPurchase + totalExpense);
  const pieData = [
    { name: "Profit", value: profit },
    { name: "Purchases", value: totalPurchase },
    { name: "Expense", value: totalExpense },
  ];

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 lg:col-span-2">
          <PieChartComponent
            data={pieData}
            responsive
            height={260}
            showLegend
            legendPosition="bottom"
            colors={["#22c55e", "#8B0000", "#FF7F7F"]}
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <>
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Weekly Summary
            </h3>
            <BarChartComponent
              data={[
                {
                  name: "Sales",
                  data: [10, 20, 30, 40, 50, 60, 70],
                },
              ]}
              dataKeys={["Sales"]}
              height={260}
              xAxisLabel="Day"
              yAxisLabel="Sales"
              showLegend={false}
              colorScale={["#10b981"]}
            />
          </>
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

export default OverviewCards;
