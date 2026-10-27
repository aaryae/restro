import {
  ArrowDownRight,
  CircleDollarSign,
  Layers,
  Star,
} from "lucide-react";
import { useGetApiQuery } from "@/redux/services/crudApi";
import Spinner from "@/components/Spinner";
import {
  InsightCards,
  KpiCard,
  ReportPanel,
  ReportPeriodToolbar,
  money,
  useReportPeriod,
} from "@/pages/Reports/shared";

export default function MenuPerformanceReport() {
  const periodState = useReportPeriod("7d");
  const { data, isFetching } = useGetApiQuery({
    url: `report/menu-performance?${periodState.dateParams}`,
  });

  const report = (data as any)?.data;
  const summary = report?.summary || {};
  const topSellers = report?.topSellers || [];
  const lowestSellers = report?.lowestSellers || [];
  const categories = report?.categories || [];
  const neverSold = report?.neverSold || [];

  return (
    <div className="w-full space-y-6">
      <ReportPeriodToolbar
        title="Menu Performance"
        description="Top sellers, slow movers, category mix, and quiet menu items"
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
              label="Units sold"
              value={String(summary.totalQty ?? 0)}
              hint={`${summary.itemsSold ?? 0} products with sales`}
              icon={Layers}
              tone="info"
            />
            <KpiCard
              label="Menu revenue"
              value={money(summary.totalRevenue)}
              hint="From order line items"
              icon={CircleDollarSign}
              tone="positive"
            />
            <KpiCard
              label="Avg price / unit"
              value={money(summary.avgTicketItem)}
              hint="Revenue ÷ quantity"
              icon={Star}
            />
            <KpiCard
              label="Never sold"
              value={String(summary.neverSoldCount ?? 0)}
              hint="Active items with zero sales"
              icon={ArrowDownRight}
              tone={
                Number(summary.neverSoldCount) > 0 ? "warning" : "positive"
              }
            />
          </div>

          <InsightCards insights={report?.insights} />

          <div className="grid gap-4 xl:grid-cols-2">
            <ReportPanel title="Top sellers">
              <SellerTable
                rows={topSellers}
                empty="No sales in this period."
                accent="positive"
              />
            </ReportPanel>
            <ReportPanel title="Lowest sellers">
              <SellerTable
                rows={lowestSellers}
                empty="Nothing to rank yet."
                accent="negative"
              />
            </ReportPanel>
          </div>

          <ReportPanel title="Category mix">
            {(categories as any[]).length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--serve-border)] text-left text-[12px] uppercase tracking-wide text-[var(--serve-muted)]">
                      <th className="px-2 py-2 font-medium">Category</th>
                      <th className="px-2 py-2 font-medium">Qty</th>
                      <th className="px-2 py-2 font-medium">Revenue</th>
                      <th className="px-2 py-2 font-medium">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(categories as any[]).map((row) => {
                      const share =
                        Number(summary.totalRevenue) > 0
                          ? (Number(row.revenue) / Number(summary.totalRevenue)) *
                            100
                          : 0;
                      return (
                        <tr
                          key={row.name}
                          className="border-b border-[var(--serve-border)]/70"
                        >
                          <td className="px-2 py-2.5 font-medium text-[var(--serve-fg)]">
                            {row.name || "Uncategorized"}
                          </td>
                          <td className="px-2 py-2.5 tabular-nums">
                            {row.qtySold ?? 0}
                          </td>
                          <td className="px-2 py-2.5 tabular-nums">
                            {money(row.revenue)}
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
                No category breakdown available.
              </p>
            )}
          </ReportPanel>

          {(neverSold as any[]).length > 0 ? (
            <ReportPanel title="Quiet menu items (zero sales)">
              <div className="flex flex-wrap gap-2">
                {(neverSold as any[]).slice(0, 24).map((row) => (
                  <span
                    key={row.productId || row.name}
                    className="rounded-lg border border-[var(--serve-border)] bg-[var(--serve-surface-2)] px-2.5 py-1.5 text-[12px] text-[var(--serve-fg)]"
                  >
                    {row.name}
                    <span className="ml-1.5 text-[var(--serve-muted)]">
                      {money(row.menuPrice)}
                    </span>
                  </span>
                ))}
              </div>
            </ReportPanel>
          ) : null}
        </>
      )}
    </div>
  );
}

function SellerTable({
  rows,
  empty,
  accent,
}: {
  rows: any[];
  empty: string;
  accent: "positive" | "negative";
}) {
  if (!rows?.length) {
    return (
      <p className="py-8 text-center text-sm text-[var(--serve-muted)]">{empty}</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--serve-border)] text-left text-[12px] uppercase tracking-wide text-[var(--serve-muted)]">
            <th className="px-2 py-2 font-medium">#</th>
            <th className="px-2 py-2 font-medium">Item</th>
            <th className="px-2 py-2 font-medium">Qty</th>
            <th className="px-2 py-2 font-medium">Revenue</th>
            <th className="px-2 py-2 font-medium">Avg price</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.productId || row.name}
              className="border-b border-[var(--serve-border)]/70"
            >
              <td
                className={`px-2 py-2.5 font-semibold tabular-nums ${
                  accent === "positive"
                    ? "text-[var(--serve-positive)]"
                    : "text-[var(--serve-negative)]"
                }`}
              >
                {i + 1}
              </td>
              <td className="px-2 py-2.5 font-medium text-[var(--serve-fg)]">
                {row.name}
                {row.category ? (
                  <span className="mt-0.5 block text-[11px] font-normal text-[var(--serve-muted)]">
                    {row.category}
                  </span>
                ) : null}
              </td>
              <td className="px-2 py-2.5 tabular-nums">{row.qtySold ?? 0}</td>
              <td className="px-2 py-2.5 tabular-nums">{money(row.revenue)}</td>
              <td className="px-2 py-2.5 tabular-nums text-[var(--serve-muted)]">
                {money(row.avgSoldPrice)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
