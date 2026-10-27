import { ReactNode, useMemo, useState } from "react";
import { subDays } from "date-fns";
import type { LucideIcon } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { CurrencySign } from "@/constants";
import { ReportDateChip } from "@/pages/DailySummaryReport/components/ReportUI";
import { formatDate } from "@/utils/formatDate";

export type PeriodKey = "today" | "yesterday" | "7d" | "30d" | "custom";

function fmtLocalDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseLocalDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function useReportPeriod(defaultKey: PeriodKey = "7d") {
  const [period, setPeriod] = useState<PeriodKey>(defaultKey);
  const [customStart, setCustomStart] = useState(() =>
    fmtLocalDate(subDays(new Date(), 6)),
  );
  const [customEnd, setCustomEnd] = useState(() => fmtLocalDate(new Date()));

  const range = useMemo(() => {
    const today = new Date();

    if (period === "today") {
      return { start: fmtLocalDate(today), end: fmtLocalDate(today), label: "Today" };
    }
    if (period === "yesterday") {
      const y = subDays(today, 1);
      return { start: fmtLocalDate(y), end: fmtLocalDate(y), label: "Yesterday" };
    }
    if (period === "7d") {
      return {
        start: fmtLocalDate(subDays(today, 6)),
        end: fmtLocalDate(today),
        label: "Last 7 days",
      };
    }
    if (period === "30d") {
      return {
        start: fmtLocalDate(subDays(today, 29)),
        end: fmtLocalDate(today),
        label: "Last 30 days",
      };
    }

    const start = customStart || fmtLocalDate(subDays(today, 6));
    const end = customEnd || fmtLocalDate(today);
    const startDate = parseLocalDate(start) || subDays(today, 6);
    const endDate = parseLocalDate(end) || today;
    const orderedStart = startDate <= endDate ? startDate : endDate;
    const orderedEnd = startDate <= endDate ? endDate : startDate;

    return {
      start: fmtLocalDate(orderedStart),
      end: fmtLocalDate(orderedEnd),
      label: `${formatDate(orderedStart)} → ${formatDate(orderedEnd)}`,
    };
  }, [period, customStart, customEnd]);

  const dateParams = `start=${range.start}&end=${range.end}`;

  return {
    period,
    setPeriod,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    range,
    dateParams,
  };
}

export function ReportPeriodToolbar({
  title,
  description,
  period,
  setPeriod,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  rangeLabel,
}: {
  title: string;
  description: string;
  period: PeriodKey;
  setPeriod: (p: PeriodKey) => void;
  customStart: string;
  setCustomStart: (v: string) => void;
  customEnd: string;
  setCustomEnd: (v: string) => void;
  rangeLabel: string;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--serve-fg)]">
          {title}
        </h1>
        <p className="mt-1 text-[13px] text-[var(--serve-muted)]">
          {description}
          <span className="mx-1.5 text-[var(--serve-border)]">·</span>
          <span className="font-medium text-[var(--serve-fg)]">{rangeLabel}</span>
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ["today", "Today"],
              ["yesterday", "Yesterday"],
              ["7d", "7 days"],
              ["30d", "30 days"],
              ["custom", "Custom"],
            ] as const
          ).map(([key, label]) => (
            <ReportDateChip
              key={key}
              active={period === key}
              onClick={() => setPeriod(key)}
            >
              {label}
            </ReportDateChip>
          ))}
        </div>
        {period === "custom" ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="h-9 rounded-lg border border-[var(--serve-border)] bg-[var(--serve-surface)] px-3 text-sm text-[var(--serve-fg)]"
            />
            <span className="text-sm text-[var(--serve-muted)]">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="h-9 rounded-lg border border-[var(--serve-border)] bg-[var(--serve-surface)] px-3 text-sm text-[var(--serve-fg)]"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "default" | "positive" | "negative" | "info" | "warning";
}) {
  const toneClass =
    tone === "positive"
      ? "text-[var(--serve-positive)]"
      : tone === "negative"
        ? "text-[var(--serve-negative)]"
        : tone === "info"
          ? "text-[var(--serve-info)]"
          : tone === "warning"
            ? "text-amber-600"
            : "text-[var(--serve-fg)]";

  return (
    <div className="rounded-xl border border-[var(--serve-border)] bg-[var(--serve-surface)] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-[var(--serve-muted)]">
            {label}
          </p>
          <p
            className={`mt-1.5 text-2xl font-bold tabular-nums tracking-tight ${toneClass}`}
          >
            {value}
          </p>
          {hint ? (
            <p className="mt-1 text-[11px] text-[var(--serve-muted)]">{hint}</p>
          ) : null}
        </div>
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--serve-surface-2)] text-[var(--serve-muted)]">
          <Icon size={16} strokeWidth={2} />
        </span>
      </div>
    </div>
  );
}

export function InsightCards({
  insights,
}: {
  insights?: Array<{ tone: string; title: string; body: string }>;
}) {
  if (!insights?.length) return null;

  const accent = (tone: string) => {
    if (tone === "positive") return "var(--serve-positive)";
    if (tone === "negative") return "var(--serve-negative)";
    return "var(--serve-info)";
  };

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {insights.map((insight) => {
        const color = accent(insight.tone);
        return (
          <div
            key={`${insight.title}-${insight.body}`}
            className="rounded-xl bg-[var(--serve-surface)] p-4 shadow-sm"
            style={{
              border: `1px solid ${color}`,
            }}
          >
            <p
              className="text-[13px] font-semibold"
              style={{ color }}
            >
              {insight.title}
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-[var(--serve-muted)]">
              {insight.body}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function money(n: number | null | undefined) {
  return `${CurrencySign}${Number(n || 0).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`;
}

export function pct(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${Number(n).toFixed(1)}%`;
}

export function ReportPanel({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[var(--serve-border)] bg-[var(--serve-surface)] p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--serve-muted)]">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function DualLineChart({
  data,
  aKey,
  bKey,
  aName,
  bName,
  aColor = "var(--serve-positive)",
  bColor = "var(--serve-info)",
}: {
  data: Array<Record<string, unknown>>;
  aKey: string;
  bKey: string;
  aName: string;
  bName: string;
  aColor?: string;
  bColor?: string;
}) {
  if (!data?.length) {
    return (
      <p className="py-10 text-center text-sm text-[var(--serve-muted)]">
        No trend data for this period.
      </p>
    );
  }
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--serve-border)" />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--serve-muted)", fontSize: 11 }}
          />
          <YAxis
            tick={{ fill: "var(--serve-muted)", fontSize: 11 }}
            tickFormatter={(v) =>
              Number(v) >= 1000 ? `${Math.round(Number(v) / 1000)}k` : String(v)
            }
          />
          <Tooltip
            contentStyle={{
              background: "var(--serve-surface)",
              border: "1px solid var(--serve-border)",
              borderRadius: 10,
            }}
            formatter={(value: number) => money(value)}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey={aKey}
            name={aName}
            stroke={aColor}
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey={bKey}
            name={bName}
            stroke={bColor}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SimpleBarChart({
  data,
  dataKey = "amount",
  nameKey = "name",
  color = "var(--primary-color)",
}: {
  data: Array<Record<string, unknown>>;
  dataKey?: string;
  nameKey?: string;
  color?: string;
}) {
  if (!data?.length) {
    return (
      <p className="py-10 text-center text-sm text-[var(--serve-muted)]">
        Nothing to chart yet.
      </p>
    );
  }
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--serve-border)" />
          <XAxis
            dataKey={nameKey}
            interval={0}
            angle={-25}
            textAnchor="end"
            height={60}
            tick={{ fill: "var(--serve-muted)", fontSize: 10 }}
          />
          <YAxis
            tick={{ fill: "var(--serve-muted)", fontSize: 11 }}
            tickFormatter={(v) =>
              Number(v) >= 1000 ? `${Math.round(Number(v) / 1000)}k` : String(v)
            }
          />
          <Tooltip
            contentStyle={{
              background: "var(--serve-surface)",
              border: "1px solid var(--serve-border)",
              borderRadius: 10,
            }}
            formatter={(value: number) => money(value)}
          />
          <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
