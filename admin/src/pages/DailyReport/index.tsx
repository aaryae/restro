import React, { useMemo, useState } from "react";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { CurrencySign } from "@/constants";
import PageTitle from "@/components/PageTitle";
import SummaryCard from "@/components/SummaryCard";
import { Landmark, TrendingUp, PiggyBank } from "lucide-react";
import Modal from "@/components/Modal";

const Report = () => {
  const [selectedTable, setSelectedTable] = useState<any | null>(null);
  const { data: summaryRes, isLoading: loadingSummary } = useGetApiQuery({
    url: "report/daily-summary",
  });
  const { data: revenueRes, isLoading: loadingRevenue } = useGetApiQuery({
    url: "report/daily-revenue-report",
  });

  const { data: sessionsRes, isLoading: loadingSessions } = useGetApiQuery(
    selectedTable
      ? { url: `report/daily-table-sessions/${selectedTable?.id}` }
      : ("report/daily-table-sessions/skip" as any),
    { skip: !selectedTable },
  );

  const summary = summaryRes?.data || {};
  const revenueReport = revenueRes?.data || {};

  const netChange = useMemo(
    () =>
      Number(summary?.closingBalance || 0) -
      Number(summary?.openingBalance || 0),
    [summary?.closingBalance, summary?.openingBalance],
  );

  const getAccountName = (row: any) =>
    row?.account?.name || row?.["account.name"] || row?.name || "Unknown";

  const asList = (arr: any[] | undefined) =>
    (arr || []).map((r: any) => ({
      name: getAccountName(r),
      total: Number(r?.totalAmount || r?.total || r?.amount || 0),
    }));

  const accountsRevenue = asList(summary?.accountsRevenue);
  const accountsPurchase = asList(summary?.accountsPurchase);
  const accountsExpense = asList(summary?.accountsExpense);

  const tables: any[] = revenueReport?.todayTableReport || [];

  return (
    <div className="space-y-6">
      <PageTitle title="Reports" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          title="Opening Balance"
          value={`${CurrencySign}${Number(summary?.openingBalance || 0).toLocaleString()}`}
          gradient="from-blue-500 via-blue-600 to-blue-500"
          variant="gradient"
          Icon={Landmark}
        />
        <SummaryCard
          title="Net Change (Today)"
          value={`${CurrencySign}${netChange.toLocaleString()}`}
          gradient="from-amber-500 via-amber-600 to-amber-500"
          variant="gradient"
          Icon={TrendingUp}
        />
        <SummaryCard
          title="Closing Balance"
          value={`${CurrencySign}${Number(summary?.closingBalance || 0).toLocaleString()}`}
          gradient="from-emerald-500 via-emerald-600 to-emerald-500"
          variant="gradient"
          Icon={PiggyBank}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <AccountList
          title="Today's Revenue by Account"
          items={accountsRevenue}
          loading={loadingSummary}
          colorClass="text-green-600"
        />
        <AccountList
          title="Today's Purchase by Account"
          items={accountsPurchase}
          loading={loadingSummary}
          colorClass="text-red-600"
        />
        <AccountList
          title="Today's Expense by Account"
          items={accountsExpense}
          loading={loadingSummary}
          colorClass="text-rose-600"
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-semibold text-gray-900">
          Today's Table-wise Revenue
        </h3>
        {loadingRevenue ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-28 bg-white rounded-xl border border-gray-200 shadow-sm"
              >
                <div className="h-full w-full animate-pulse bg-gray-100" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tables.map((t: any) => (
              <button
                type="button"
                key={t?.id}
                onClick={() => setSelectedTable(t)}
                className="text-left bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:border-gray-300 hover:shadow transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-gray-900">
                    Table {t?.name}
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {CurrencySign}
                    {Number(t?.totalRevenue || 0).toLocaleString()}
                  </div>
                </div>
                <div className="space-y-1">
                  {(t?.accounts || []).map((a: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-600">{a?.name}</span>
                      <span className="text-gray-900">
                        {CurrencySign}
                        {Number(a?.total || 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}
        {!tables?.length && (
          <div className="text-sm text-gray-500 text0">No data for today.</div>
        )}
      </div>

      <Modal
        isOpen={!!selectedTable}
        onClose={() => setSelectedTable(null)}
        title={selectedTable ? `Table ${selectedTable?.name} sessions` : ""}
        size="large"
      >
        <div className="p-6">
          {loadingSessions ? (
            <div className="h-40 w-full animate-pulse bg-gray-100 rounded" />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total Revenue (Today)</span>
                <span className="font-semibold text-gray-900">
                  {CurrencySign}
                  {Number(selectedTable?.totalRevenue || 0).toLocaleString()}
                </span>
              </div>

              <div className="divide-y divide-gray-200 border border-gray-200 rounded-lg">
                {(sessionsRes?.data || []).map((s: any) => (
                  <div key={s?.sessionId} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-900">
                        Session {s?.sessionId}
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {CurrencySign}
                        {Number(s?.total || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      <span>
                        {s?.sessionStart
                          ? new Date(s.sessionStart).toLocaleString()
                          : "-"}
                      </span>
                      <span className="mx-2">to</span>
                      <span>
                        {s?.sessionEnd
                          ? new Date(s.sessionEnd).toLocaleString()
                          : "-"}
                      </span>
                    </div>

                    <div className="mt-2">
                      <div className="text-xs font-medium text-gray-700 mb-1">
                        Orders
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {(s?.orders || []).map((o: any) => (
                          <div
                            key={o?.id}
                            className="border border-gray-200 rounded p-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">
                                Order #{o?.id}
                              </span>
                              <span className="font-semibold text-gray-900">
                                {CurrencySign}
                                {Number(o?.totalAmount || 0).toLocaleString()}
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-500 mt-1">
                              {o?.orderStartTime
                                ? new Date(
                                    o.orderStartTime,
                                  ).toLocaleTimeString()
                                : "-"}{" "}
                              -{" "}
                              {o?.orderFinishTime
                                ? new Date(
                                    o.orderFinishTime,
                                  ).toLocaleTimeString()
                                : "-"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                {!sessionsRes?.data?.length && (
                  <div className="p-6 text-sm text-gray-500">No sessions.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Report;

function AccountList({
  title,
  items,
  loading,
  colorClass,
}: {
  title: string;
  items: { name: string; total: number }[];
  loading?: boolean;
  colorClass?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      </div>
      {loading ? (
        <div className="h-28 w-full animate-pulse bg-gray-100 rounded" />
      ) : (
        <div className="space-y-1">
          {items?.map((items, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-gray-600">{items.name}</span>
              <span className={`font-medium ${colorClass}`}>
                {CurrencySign}
                {Number(items.total || 0).toLocaleString()}
              </span>
            </div>
          ))}
          {!items?.length && (
            <div className="text-sm text-gray-500">No data for today.</div>
          )}
        </div>
      )}
    </div>
  );
}
