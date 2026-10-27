import {
  ArrowDownCircle,
  ArrowUpCircle,
  Scale,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useGetApiQuery } from "@/redux/services/crudApi";
import Spinner from "@/components/Spinner";
import {
  DualLineChart,
  InsightCards,
  KpiCard,
  ReportPanel,
  ReportPeriodToolbar,
  money,
  pct,
  useReportPeriod,
} from "@/pages/Reports/shared";

export default function BusinessReport() {
  const periodState = useReportPeriod("7d");
  const { data, isFetching } = useGetApiQuery({
    url: `report/business-overview?${periodState.dateParams}`,
  });

  const report = (data as any)?.data;
  const totals = report?.totals || {};
  const previous = report?.previous || {};
  const series = report?.series || [];

  return (
    <div className="w-full space-y-6">
      <ReportPeriodToolbar
        title="Business Report"
        description="Revenue, purchases, expenses, and net health for your cafe"
        period={periodState.period}
        setPeriod={periodState.setPeriod}
        customStart={periodState.customStart}
        setCustomStart={periodState.setCustomStart}
        customEnd={periodState.customEnd}
        setCustomEnd={periodState.setCustomEnd}
        rangeLabel={periodState.range.label}
      />

      {isFetching && !report ? (
        <Spinner className="flex h-40 items-center justify-center" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <KpiCard
              label="Revenue"
              value={money(totals.revenue)}
              hint={
                previous.revenueDeltaPct != null
                  ? `${pct(previous.revenueDeltaPct)} vs prior period`
                  : undefined
              }
              icon={TrendingUp}
              tone="positive"
            />
            <KpiCard
              label="Purchases"
              value={money(totals.purchase)}
              hint={
                totals.purchaseToRevenuePct != null
                  ? `${totals.purchaseToRevenuePct}% of revenue`
                  : undefined
              }
              icon={ArrowDownCircle}
              tone="info"
            />
            <KpiCard
              label="Expenses"
              value={money(totals.expense)}
              hint={
                totals.expenseToRevenuePct != null
                  ? `${totals.expenseToRevenuePct}% of revenue`
                  : undefined
              }
              icon={ArrowUpCircle}
              tone="negative"
            />
            <KpiCard
              label="Net"
              value={money(totals.net)}
              hint={
                totals.profitMarginPct != null
                  ? `Margin ${totals.profitMarginPct}%`
                  : undefined
              }
              icon={Scale}
              tone={Number(totals.net) >= 0 ? "positive" : "negative"}
            />
            <KpiCard
              label="Cash & banks"
              value={money(totals.closingBalance)}
              hint="Current combined balance"
              icon={Wallet}
            />
          </div>

          <InsightCards insights={report?.insights} />

          <div className="grid gap-4 xl:grid-cols-3">
            <ReportPanel title="Daily net pulse">
              <DualLineChart
                data={series}
                aKey="revenue"
                bKey="net"
                aName="Revenue"
                bName="Net"
                aColor="var(--serve-positive)"
                bColor="var(--primary-color)"
              />
            </ReportPanel>
            <ReportPanel title="Revenue vs spend">
              <DualLineChart
                data={series}
                aKey="revenue"
                bKey="purchase"
                aName="Revenue"
                bName="Purchase"
                aColor="var(--serve-positive)"
                bColor="var(--serve-info)"
              />
            </ReportPanel>
            <ReportPanel title="Period comparison">
              <div className="space-y-3 text-sm">
                <CompareRow
                  label="Revenue"
                  current={totals.revenue}
                  previous={previous.revenue}
                />
                <CompareRow
                  label="Purchase"
                  current={totals.purchase}
                  previous={previous.purchase}
                />
                <CompareRow
                  label="Expense"
                  current={totals.expense}
                  previous={previous.expense}
                />
                <CompareRow
                  label="Net"
                  current={totals.net}
                  previous={previous.net}
                />
                <p className="pt-2 text-[12px] text-[var(--serve-muted)]">
                  Prior window: {previous.days || "—"} day(s) immediately before
                  this period.
                </p>
              </div>
            </ReportPanel>
          </div>

          <ReportPanel title="Revenue by payment account">
            {(report?.revenueByAccount || []).length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--serve-border)] text-left text-[12px] uppercase tracking-wide text-[var(--serve-muted)]">
                      <th className="px-2 py-2 font-medium">Account</th>
                      <th className="px-2 py-2 font-medium">Amount</th>
                      <th className="px-2 py-2 font-medium">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(report.revenueByAccount as any[]).map((row) => {
                      const share =
                        totals.revenue > 0
                          ? (Number(row.amount) / Number(totals.revenue)) * 100
                          : 0;
                      return (
                        <tr
                          key={row.accountId || row.name}
                          className="border-b border-[var(--serve-border)]/70"
                        >
                          <td className="px-2 py-2.5 font-medium text-[var(--serve-fg)]">
                            {row.name}
                          </td>
                          <td className="px-2 py-2.5 tabular-nums">
                            {money(row.amount)}
                          </td>
                          <td className="px-2 py-2.5 tabular-nums text-[var(--serve-muted)]">
                            {share.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-[var(--serve-muted)]">
                No account revenue in this period.
              </p>
            )}
          </ReportPanel>
        </>
      )}
    </div>
  );
}

function CompareRow({
  label,
  current,
  previous,
}: {
  label: string;
  current: number;
  previous: number;
}) {
  const delta =
    previous !== 0
      ? ((Number(current) - Number(previous)) / Math.abs(Number(previous))) * 100
      : null;
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-[var(--serve-surface-2)] px-3 py-2.5">
      <span className="text-[var(--serve-muted)]">{label}</span>
      <div className="text-right">
        <p className="font-semibold tabular-nums text-[var(--serve-fg)]">
          {money(current)}
        </p>
        <p className="text-[11px] text-[var(--serve-muted)]">
          was {money(previous)}
          {delta != null ? ` · ${pct(delta)}` : ""}
        </p>
      </div>
    </div>
  );
}
