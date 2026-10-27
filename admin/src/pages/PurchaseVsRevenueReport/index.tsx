import {
  ArrowLeftRight,
  CircleHelp,
  Percent,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { useGetApiQuery } from "@/redux/services/crudApi";
import Spinner from "@/components/Spinner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DualLineChart,
  InsightCards,
  KpiCard,
  ReportPanel,
  ReportPeriodToolbar,
  money,
  useReportPeriod,
} from "@/pages/Reports/shared";

const SNAP_INFO = {
  "Avg daily revenue":
    "Total revenue in this period divided by the number of days in the range. Shows a typical day’s sales.",
  "Avg daily purchase":
    "Total purchases in this period divided by the number of days. Shows a typical day’s buying.",
  "Pressure days":
    "Count of days where purchases were higher than that same day’s revenue. Useful for spotting cash-pressure or restock days.",
  "Heaviest buy day":
    "The day in this period with the highest purchase total — your biggest buying day.",
  "Best sales day":
    "The day in this period with the highest revenue — your strongest sales day.",
} as const;

const PRESSURE_LIST_INFO =
  "Each listed day had purchases greater than revenue on that day. The red amount is how much buying exceeded sales (purchase − revenue). Restock days often appear here.";


export default function PurchaseVsRevenueReport() {
  const periodState = useReportPeriod("30d");
  const { data, isFetching } = useGetApiQuery({
    url: `report/purchase-vs-revenue?${periodState.dateParams}`,
  });

  const report = (data as any)?.data;
  const totals = report?.totals || {};
  const series = report?.series || [];
  const byCategory = report?.purchaseByCategory || [];
  const pressureDays = report?.pressureDays || [];
  const highlights = report?.highlights || {};
  const heaviest = highlights.heaviestPurchaseDay;

  const purchaseShare =
    totals.coveragePct != null
      ? `${totals.coveragePct}%`
      : Number(totals.revenue) > 0
        ? `${((Number(totals.purchase) / Number(totals.revenue)) * 100).toFixed(1)}%`
        : "—";

  return (
    <div className="w-full space-y-6">
      <ReportPeriodToolbar
        title="Purchase vs Revenue"
        description="See whether buying is tracking sales — and where the gap hurts margin"
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Revenue"
              value={money(totals.revenue)}
              hint="Sales in period"
              icon={TrendingUp}
              tone="positive"
            />
            <KpiCard
              label="Purchases"
              value={money(totals.purchase)}
              hint="Stock & goods bought"
              icon={ShoppingBag}
              tone="info"
            />
            <KpiCard
              label="Purchase of revenue"
              value={purchaseShare}
              hint="Ideal cafes often keep this under ~35–45%"
              icon={ArrowLeftRight}
              tone={
                totals.coveragePct != null && Number(totals.coveragePct) > 70
                  ? "negative"
                  : totals.coveragePct != null && Number(totals.coveragePct) <= 35
                    ? "positive"
                    : "warning"
              }
            />
            <KpiCard
              label="Contribution"
              value={money(totals.contribution)}
              hint="Revenue − purchases"
              icon={Percent}
              tone={
                Number(totals.contribution) >= 0 ? "positive" : "negative"
              }
            />
          </div>

          <InsightCards insights={report?.insights} />

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <ReportPanel title="Daily purchase vs revenue">
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
            </div>
            <ReportPanel title="Health snapshot">
              <div className="space-y-3 text-sm">
                <SnapRow
                  label="Avg daily revenue"
                  info={SNAP_INFO["Avg daily revenue"]}
                  value={money(totals.avgDailyRevenue)}
                />
                <SnapRow
                  label="Avg daily purchase"
                  info={SNAP_INFO["Avg daily purchase"]}
                  value={money(totals.avgDailyPurchase)}
                />
                <SnapRow
                  label="Pressure days"
                  info={SNAP_INFO["Pressure days"]}
                  value={String(pressureDays.length)}
                />
                <SnapRow
                  label="Heaviest buy day"
                  info={SNAP_INFO["Heaviest buy day"]}
                  value={
                    heaviest
                      ? `${heaviest.label} · ${money(heaviest.purchase)}`
                      : "—"
                  }
                />
                <SnapRow
                  label="Best sales day"
                  info={SNAP_INFO["Best sales day"]}
                  value={
                    highlights.bestRevenueDay
                      ? `${highlights.bestRevenueDay.label} · ${money(highlights.bestRevenueDay.revenue)}`
                      : "—"
                  }
                />
              </div>
            </ReportPanel>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ReportPanel title="Purchase by category">
              {(byCategory as any[]).length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--serve-border)] text-left text-[12px] uppercase tracking-wide text-[var(--serve-muted)]">
                        <th className="px-2 py-2 font-medium">Category</th>
                        <th className="px-2 py-2 font-medium">Amount</th>
                        <th className="px-2 py-2 font-medium">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(byCategory as any[]).map((row) => {
                        const share =
                          Number(totals.purchase) > 0
                            ? (Number(row.amount) / Number(totals.purchase)) *
                              100
                            : 0;
                        return (
                          <tr
                            key={row.name}
                            className="border-b border-[var(--serve-border)]/70"
                          >
                            <td className="px-2 py-2.5 font-medium text-[var(--serve-fg)]">
                              {row.name || "Other"}
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
                  No purchase breakdown for this period.
                </p>
              )}
            </ReportPanel>

            <ReportPanel
              title="Days purchases outpaced sales"
              action={<InfoTip text={PRESSURE_LIST_INFO} />}
            >
              {(pressureDays as any[]).length ? (
                <div className="space-y-2">
                  {(pressureDays as any[]).map((row) => (
                    <div
                      key={row.date || row.label}
                      className="flex items-center justify-between gap-3 rounded-lg border border-[var(--serve-border)] bg-[var(--serve-surface-2)] px-3 py-2.5"
                    >
                      <div>
                        <p className="font-medium text-[var(--serve-fg)]">
                          {row.label || row.date}
                        </p>
                        <p className="text-[12px] text-[var(--serve-muted)]">
                          Rev {money(row.revenue)} · Buy {money(row.purchase)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold tabular-nums text-[var(--serve-negative)]">
                        −{money(Math.abs(Number(row.gap || 0)))}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-[var(--serve-muted)]">
                  No days where purchases exceeded revenue in this window.
                </p>
              )}
            </ReportPanel>
          </div>
        </>
      )}
    </div>
  );
}

function SnapRow({
  label,
  value,
  info,
}: {
  label: string;
  value: string;
  info: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-[var(--serve-surface-2)] px-3 py-2.5">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex max-w-[50%] items-center gap-1.5 text-left text-[var(--serve-muted)] underline decoration-dotted underline-offset-2 transition-colors hover:text-[var(--serve-fg)]"
            aria-label={`What is ${label}?`}
          >
            <span className="truncate">{label}</span>
            <CircleHelp className="h-3.5 w-3.5 shrink-0 opacity-70" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-72 border-[var(--serve-border)] bg-[var(--serve-surface)] p-3 text-[var(--serve-fg)] shadow-lg"
        >
          <p className="text-[13px] font-semibold text-[var(--serve-fg)]">
            {label}
          </p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--serve-muted)]">
            {info}
          </p>
        </PopoverContent>
      </Popover>
      <span className="max-w-[48%] truncate text-right font-semibold tabular-nums text-[var(--serve-fg)]">
        {value}
      </span>
    </div>
  );
}

function InfoTip({ text }: { text: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center text-[var(--serve-muted)] transition-colors hover:text-[var(--serve-fg)]"
          aria-label="What is this?"
        >
          <CircleHelp className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-72 border-[var(--serve-border)] bg-[var(--serve-surface)] p-3 text-[var(--serve-fg)] shadow-lg"
      >
        <p className="text-[12px] leading-relaxed text-[var(--serve-muted)]">
          {text}
        </p>
      </PopoverContent>
    </Popover>
  );
}
