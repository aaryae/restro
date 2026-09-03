import type { ReactNode } from 'react'
import {
  Ban,
  Building2,
  CheckCircle2,
  Clock3,
  LogIn,
  ShieldAlert,
  Sparkles,
  UserPlus,
  UserRoundPen,
} from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { LoadingScreen, PageError } from '@/components/LoadingScreen'
import { useAuth } from '@/auth/AuthContext'
import { fetchAuditLogs, fetchCafes, fetchStats } from '@/api/platform'
import { queryKeys } from '@/lib/queryClient'
import {
  formatAuditAction,
  formatAuditMetaLines,
  formatRelativeTime,
} from '@/lib/format'
import { DashboardTrendChart } from '@/pages/Dashboard/DashboardTrendChart'
import { cn } from '@/lib/utils'
import type { AuditLog, Cafe } from '@/types'

function cafeInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

function auditIcon(action: string) {
  switch (action) {
    case 'login':
      return LogIn
    case 'login_failed':
      return ShieldAlert
    case 'create':
      return Building2
    case 'activate':
    case 'unsuspend':
      return CheckCircle2
    case 'suspend':
      return Ban
    case 'extend_trial':
      return Clock3
    case 'impersonate':
      return LogIn
    case 'platform_user.create':
      return UserPlus
    case 'platform_user.update':
    case 'platform_user.deactivate':
      return UserRoundPen
    default:
      return Sparkles
  }
}

function auditTone(action: string) {
  if (action === 'suspend' || action === 'platform_user.deactivate') {
    return 'bg-red-50 text-red-700'
  }
  if (action === 'activate' || action === 'unsuspend' || action === 'create') {
    return 'bg-emerald-50 text-emerald-700'
  }
  if (action === 'extend_trial') return 'bg-amber-50 text-amber-700'
  return 'bg-primary/10 text-primary'
}

function CafePulseItem({ cafe }: { cafe: Cafe }) {
  return (
    <Link
      to={`/cafes/${cafe.id}`}
      className="group flex items-center gap-3 rounded-xl px-2.5 py-2 transition hover:bg-slate-50"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-semibold text-primary">
        {cafeInitials(cafe.name) || 'C'}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900 group-hover:text-primary">
          {cafe.name}
        </p>
        <p className="truncate text-xs text-slate-400">@{cafe.slug}</p>
      </div>
      <StatusBadge status={cafe.status} />
    </Link>
  )
}

function ActivityItem({ log }: { log: AuditLog }) {
  const Icon = auditIcon(log.action)
  const detail = formatAuditMetaLines(log.meta)[0]
  return (
    <div className="flex gap-3 px-2.5 py-2.5">
      <div
        className={cn(
          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
          auditTone(log.action),
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-slate-900">
            {formatAuditAction(log.action)}
          </p>
          <span className="shrink-0 text-[11px] text-slate-400">
            {formatRelativeTime(log.createdAt)}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          @{log.actor}
          {log.cafeName ? ` · ${log.cafeName}` : ''}
        </p>
        {detail ? (
          <p className="mt-1 truncate text-xs text-slate-400">{detail}</p>
        ) : null}
      </div>
    </div>
  )
}

function Panel({
  title,
  href,
  children,
  empty,
  loading,
}: {
  title: string
  href: string
  children: ReactNode
  empty: string
  loading?: boolean
}) {
  return (
    <section className="flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        <Link to={href} className="text-xs font-medium text-primary">
          See all
        </Link>
      </div>
      <div className="flex-1 p-1.5">
        {loading ? (
          <p className="px-3 py-8 text-center text-sm text-slate-400">
            Loading…
          </p>
        ) : children ? (
          children
        ) : (
          <p className="px-3 py-8 text-center text-sm text-slate-400">{empty}</p>
        )}
      </div>
    </section>
  )
}

export default function DashboardPage() {
  const { can } = useAuth()
  const canDashboard = can('dashboard.view')
  const canCafes = can('cafes.section')
  const canAudit = can('audit.read')

  const statsQuery = useQuery({
    queryKey: queryKeys.stats,
    queryFn: fetchStats,
    enabled: canDashboard,
  })
  const cafesQuery = useQuery({
    queryKey: queryKeys.cafes({ page: 1, limit: 5 }),
    queryFn: () => fetchCafes({ page: 1, limit: 5 }),
    enabled: canDashboard && canCafes,
  })
  const auditQuery = useQuery({
    queryKey: queryKeys.audit({ page: 1, limit: 5 }),
    queryFn: () => fetchAuditLogs({ page: 1, limit: 5 }),
    enabled: canDashboard && canAudit,
  })

  if (!canDashboard) {
    if (canCafes) return <Navigate to="/cafes" replace />
    if (canAudit) return <Navigate to="/audit" replace />
    return <Navigate to="/settings/operators" replace />
  }

  if (statsQuery.isLoading) return <LoadingScreen label="Loading dashboard…" />
  if (statsQuery.isError) {
    return (
      <PageError
        error={statsQuery.error}
        onRetry={() => statsQuery.refetch()}
      />
    )
  }

  const stats = statsQuery.data!
  const cafes = cafesQuery.data?.items || []
  const audits = auditQuery.data?.items || []
  const showSidePanels = canCafes || canAudit

  return (
    <div>
      <PageHeader
        title="Dashboard"
        actions={
          canCafes ? (
            <Link to="/cafes">
              <Button>View all cafes</Button>
            </Link>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active cafes"
          value={stats.active}
          hint="Paid / activated"
          icon={Building2}
          tone="success"
        />
        <StatCard
          label="On trial"
          value={stats.trial}
          hint="14-day free trials"
          icon={Sparkles}
          tone="warning"
        />
        <StatCard
          label="Expired"
          value={stats.expired}
          hint="Need activation"
          icon={Clock3}
        />
        <StatCard
          label="Suspended"
          value={stats.suspended}
          hint="Blocked access"
          icon={ShieldAlert}
          tone="danger"
        />
      </div>

      <DashboardTrendChart />

      {showSidePanels ? (
        <div
          className={cn(
            'mt-6 grid gap-4',
            canCafes && canAudit ? 'lg:grid-cols-2' : 'grid-cols-1',
          )}
        >
          {canCafes ? (
            <Panel
              title="Cafe pulse"
              href="/cafes"
              loading={cafesQuery.isLoading && !cafesQuery.data}
              empty="No cafes yet"
            >
              {cafes.length
                ? cafes.map((cafe) => (
                    <CafePulseItem key={cafe.id} cafe={cafe} />
                  ))
                : null}
            </Panel>
          ) : null}

          {canAudit ? (
            <Panel
              title="Latest activity"
              href="/audit"
              loading={auditQuery.isLoading && !auditQuery.data}
              empty="No audit events yet"
            >
              {audits.length
                ? audits.map((log) => <ActivityItem key={log.id} log={log} />)
                : null}
            </Panel>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
