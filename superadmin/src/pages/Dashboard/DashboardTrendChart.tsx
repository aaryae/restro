import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { CalendarDays } from 'lucide-react'
import {
  fetchStatsTrends,
  type StatsTrendPoint,
  type StatsTrendSeriesKey,
  type StatsTrendsParams,
} from '@/api/platform'
import { queryKeys } from '@/lib/queryClient'
import { isSessionFailure, forceLoginRedirect } from '@/api/client'
import { cn } from '@/lib/utils'
import { DateRangeCalendarModal } from '@/components/ui/DateRangeCalendarModal'

type PresetRange = '7d' | '30d' | '90d' | 'custom'
type ScenarioKey = 'overview' | StatsTrendSeriesKey

const PRESETS: Array<{ key: Exclude<PresetRange, 'custom'>; label: string }> = [
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: '90d', label: '90 days' },
]

const SCENARIOS: Array<{
  key: ScenarioKey
  label: string
  description: string
}> = [
  {
    key: 'overview',
    label: 'Overview',
    description: 'Signups, activations, and suspensions',
  },
  {
    key: 'cafesCreated',
    label: 'Cafe signups',
    description: 'New cafes created each day',
  },
  {
    key: 'activations',
    label: 'Activations',
    description: 'Activate / unsuspend events',
  },
  {
    key: 'suspensions',
    label: 'Suspensions',
    description: 'Cafes suspended each day',
  },
  {
    key: 'extensions',
    label: 'Trial extensions',
    description: 'Trial extend actions',
  },
  {
    key: 'impersonations',
    label: 'POS opens',
    description: 'Impersonate / open POS',
  },
  {
    key: 'operatorsCreated',
    label: 'Operators',
    description: 'New platform operators',
  },
  {
    key: 'auditEvents',
    label: 'All audit',
    description: 'Every audit log event',
  },
]

const SERIES_STYLE: Record<
  StatsTrendSeriesKey,
  { label: string; color: string }
> = {
  cafesCreated: { label: 'Signups', color: '#032768' },
  activations: { label: 'Activations', color: '#059669' },
  suspensions: { label: 'Suspensions', color: '#dc2626' },
  extensions: { label: 'Extensions', color: '#d97706' },
  impersonations: { label: 'POS opens', color: '#7c3aed' },
  operatorsCreated: { label: 'Operators', color: '#0284c7' },
  auditEvents: { label: 'Audit events', color: '#475569' },
}

function toLocalDayKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function daysAgoLocal(days: number) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - (days - 1))
  return toLocalDayKey(d)
}

function formatDayLabel(day: string) {
  const d = new Date(`${day}T00:00:00.000Z`)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatRangeLabel(from: string, to: string) {
  return `${formatDayLabel(from)} – ${formatDayLabel(to)}`
}

function toChartRows(
  series: Record<StatsTrendSeriesKey, StatsTrendPoint[]>,
  keys: StatsTrendSeriesKey[],
) {
  const days = series[keys[0]]?.map((p) => p.day) || []
  return days.map((day, i) => {
    const row: Record<string, string | number> = {
      day,
      label: formatDayLabel(day),
    }
    for (const key of keys) {
      row[key] = series[key]?.[i]?.count ?? 0
    }
    return row
  })
}

export function DashboardTrendChart() {
  const [preset, setPreset] = useState<PresetRange>('30d')
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [appliedCustom, setAppliedCustom] = useState({
    from: daysAgoLocal(14),
    to: toLocalDayKey(),
  })
  const [scenario, setScenario] = useState<ScenarioKey>('overview')

  const queryParams = useMemo<StatsTrendsParams>(() => {
    if (preset === 'custom') {
      return { from: appliedCustom.from, to: appliedCustom.to }
    }
    return { range: preset }
  }, [preset, appliedCustom])

  const trendsQuery = useQuery({
    queryKey: queryKeys.statsTrends(queryParams),
    queryFn: () => fetchStatsTrends(queryParams),
    placeholderData: keepPreviousData,
  })

  useEffect(() => {
    if (trendsQuery.error && isSessionFailure(trendsQuery.error)) {
      forceLoginRedirect()
    }
  }, [trendsQuery.error])

  const activeKeys = useMemo<StatsTrendSeriesKey[]>(() => {
    if (scenario === 'overview') {
      return ['cafesCreated', 'activations', 'suspensions']
    }
    return [scenario]
  }, [scenario])

  const chartData = useMemo(() => {
    if (!trendsQuery.data?.series) return []
    return toChartRows(trendsQuery.data.series, activeKeys)
  }, [trendsQuery.data, activeKeys])

  const totalsByKey = useMemo(() => {
    const totals = {} as Record<StatsTrendSeriesKey, number>
    for (const key of activeKeys) totals[key] = 0
    for (const row of chartData) {
      for (const key of activeKeys) {
        totals[key] += Number(row[key] || 0)
      }
    }
    return totals
  }, [chartData, activeKeys])

  const total = useMemo(
    () => activeKeys.reduce((sum, key) => sum + (totalsByKey[key] || 0), 0),
    [activeKeys, totalsByKey],
  )

  const scenarioMeta = SCENARIOS.find((s) => s.key === scenario)

  return (
    <section className="mt-6 min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Activity trends</h2>
          <p className="mt-1 text-xs text-slate-500">
            {scenarioMeta?.description}
            {trendsQuery.isFetching ? ' · Updating…' : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {PRESETS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setPreset(item.key)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition',
                preset === item.key
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              )}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCalendarOpen(true)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition',
              preset === 'custom'
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            )}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            {preset === 'custom'
              ? formatRangeLabel(appliedCustom.from, appliedCustom.to)
              : 'Custom'}
          </button>
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {SCENARIOS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setScenario(item.key)}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition',
              scenario === item.key
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-3">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <p className="text-2xl font-semibold text-slate-900">{total}</p>
          <p className="text-xs text-slate-500">
            {scenario === 'overview'
              ? 'combined across the chart lines below'
              : `${SERIES_STYLE[scenario].label.toLowerCase()} in this range`}
          </p>
        </div>
        {scenario === 'overview' ? (
          <p className="mt-1 text-xs text-slate-500">
            {activeKeys
              .map(
                (key) =>
                  `${totalsByKey[key] || 0} ${SERIES_STYLE[key].label.toLowerCase()}`,
              )
              .join(' · ')}
          </p>
        ) : null}
      </div>

      <div className="mt-4 h-72 w-full">
        {trendsQuery.isLoading && !trendsQuery.data ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Loading chart…
          </div>
        ) : trendsQuery.isError && !trendsQuery.data ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-slate-500">
            {isSessionFailure(trendsQuery.error) ? (
              <p>Redirecting to sign in…</p>
            ) : (
              <>
                <p>{(trendsQuery.error as Error).message}</p>
                <button
                  type="button"
                  className="text-primary"
                  onClick={() => trendsQuery.refetch()}
                >
                  Retry
                </button>
              </>
            )}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
              <XAxis
                dataKey="label"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                minTickGap={24}
              />
              <YAxis
                allowDecimals={false}
                width={36}
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
                  fontSize: 12,
                }}
                labelFormatter={(_, payload) => {
                  const day = payload?.[0]?.payload?.day
                  return day ? formatDayLabel(String(day)) : ''
                }}
              />
              {activeKeys.length > 1 ? (
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              ) : null}
              {activeKeys.map((key) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={SERIES_STYLE[key].label}
                  stroke={SERIES_STYLE[key].color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <DateRangeCalendarModal
        open={calendarOpen}
        from={appliedCustom.from}
        to={appliedCustom.to}
        onClose={() => setCalendarOpen(false)}
        onApply={(range) => {
          setAppliedCustom(range)
          setPreset('custom')
          setCalendarOpen(false)
        }}
      />
    </section>
  )
}
