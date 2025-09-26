import { buildQueryString } from "@/utils/generalHelper";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { useMemo, useState } from "react";
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
import BarChartComponent from "../BarChartComponent";
import PieChartComponent from "../PieChartComponent";
import {
  ACCOUNT_URL,
  EXPENSE_URL,
  PURCHASE_URL,
  REVENUE_URL,
} from "@/constants/apiUrlConstants";
import { checkAccess } from "@/utils/accessHelper";
import { useGetSettingQuery } from "@/redux/services/settings";
import SummaryCard from "@/components/SummaryCard";
import { TRANSACTION_URL } from "@/constants/apiUrlConstants";

function OverviewCards() {
  const revenueAccessList = checkAccess("Revenue");
  const purchaseAccessList = checkAccess("Purchase");
  const expenseAccessList = checkAccess("Expense");
  const withdrawAccessList = checkAccess("Withdraw");
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
  const { data: totalTransactionData } = useGetApiQuery({
    url: `${TRANSACTION_URL}total`,
    skip: !withdrawAccessList.includes("view"),
  });
  const { data: settings } = useGetSettingQuery("");

  const url = buildQueryString("account/list", { page: 1, limit: 1000 });
  const { data, isLoading } = useGetApiQuery({ url });
  const { data: totalAndBalancesData } = useGetApiQuery({
    url: `${ACCOUNT_URL}total-and-balances`,
  });

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

  const profit =
    totalRevenueData.data.total -
    (totalPurchaseData.data.total + totalExpenseData.data.total);

  return (
    <>
      <div className="mt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              Icon={ShoppingCart}
            />
          )}
          {totalExpenseData && (
            <SummaryCard
              title="Total Expense"
              value={`${CurrencySign}${totalExpenseData?.data?.total.toLocaleString()}`}
              gradient="from-blue-500 via-blue-600 to-blue-500"
              Icon={IndianRupee}
            />
          )}
          {totalRevenueData && totalPurchaseData && totalExpenseData && (
            <SummaryCard
              title="Profit"
              value={`${CurrencySign}${profit.toLocaleString()}`}
              gradient="from-amber-500 via-amber-600 to-amber-500"
              Icon={TrendingUp}
            />
          )}
          {totalTransactionData && (
            <SummaryCard
              title="Total Withdrawn"
              value={`${CurrencySign}${totalTransactionData?.data?.totalWithdraw?.toLocaleString()}`}
              gradient="from-rose-500 via-rose-600 to-rose-500"
              Icon={Wallet}
            />
          )}
          {totalRevenueData &&
            totalPurchaseData &&
            totalExpenseData &&
            totalTransactionData?.success && (
              <SummaryCard
                title="Remaining Balance"
                value={`${CurrencySign}${(profit + totalTransactionData?.data?.totalDeposit - (totalTransactionData?.data?.totalWithdraw || 0)).toLocaleString()}`}
                gradient="from-teal-500 via-teal-600 to-teal-500"
                Icon={PiggyBank}
              />
            )}
          {totalAndBalancesData?.success && (
            <SummaryCard
              title="Total Collection Till Date"
              value={`${CurrencySign}${Number(totalAndBalancesData?.data?.totalBalance).toLocaleString()}`}
              gradient="from-purple-500 via-fuchsia-600 to-purple-500"
              Icon={Landmark}
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
          openingBalance={settings?.data?.openingBalance}
        />
      )}
    </>
  );
}

function FiscalYearSummary({
  totalRevenue,
  totalPurchase,
  totalExpense,
  openingBalance,
}: {
  totalRevenue: number;
  totalPurchase: number;
  totalExpense: number;
  openingBalance: number | undefined;
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
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Total Collected Amount
          </h3>
          <SummaryCard
            title="Total Collected Amount"
            value={`${CurrencySign}${profit + Number(openingBalance || 0)}`}
            gradient="from-blue-500 via-blue-600 to-blue-500"
            Icon={PiggyBank}
          />
          <h3 className="text-2xl text-left font-semibold text-gray-900 my-4">
            Opening Balance {CurrencySign}
            {openingBalance}
          </h3>
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
