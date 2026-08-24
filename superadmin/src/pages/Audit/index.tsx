import { useEffect, useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/PageHeader'
import { DataTable } from '@/components/Table/DataTable'
import { LoadingScreen, PageError } from '@/components/LoadingScreen'
import { useAuth } from '@/auth/AuthContext'
import { fetchAuditLogs } from '@/api/platform'
import { queryKeys } from '@/lib/queryClient'
import {
  AUDIT_ACTION_FILTER_OPTIONS,
  formatAuditAction,
  formatDateTime,
} from '@/lib/format'
import type { AuditLog } from '@/types'
import {
  AuditDetailPanel,
  AuditInfoButton,
} from '@/pages/Audit/AuditDetailPanel'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(id)
  }, [value, delayMs])

  return debounced
}

const filterInputClass =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary'

export default function AuditPage() {
  const { can } = useAuth()
  const canAudit = can('audit.read')
  const [page, setPage] = useState(1)
  const [actorInput, setActorInput] = useState('')
  const [cafeInput, setCafeInput] = useState('')
  const [action, setAction] = useState('')
  const [selected, setSelected] = useState<AuditLog | null>(null)

  const actor = useDebouncedValue(actorInput.trim(), SEARCH_DEBOUNCE_MS)
  const cafe = useDebouncedValue(cafeInput.trim(), SEARCH_DEBOUNCE_MS)

  useEffect(() => {
    setPage(1)
  }, [actor, cafe, action])

  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      actor: actor || undefined,
      cafe: cafe || undefined,
      action: action || undefined,
    }),
    [page, actor, cafe, action],
  )

  const auditQuery = useQuery({
    queryKey: queryKeys.audit(params),
    queryFn: () => fetchAuditLogs(params),
    placeholderData: keepPreviousData,
    enabled: canAudit,
  })

  if (!canAudit) {
    return <PageError message="You do not have access to Audit logs." />
  }

  if (auditQuery.isLoading && !auditQuery.data) {
    return <LoadingScreen label="Loading audit logs…" />
  }
  if (auditQuery.isError && !auditQuery.data) {
    return (
      <PageError
        message={(auditQuery.error as Error).message}
        onRetry={() => auditQuery.refetch()}
      />
    )
  }

  const items = auditQuery.data?.items || []
  const total = auditQuery.data?.pagination.total || 0

  return (
    <div>
      <PageHeader title="Audit logs" />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">
            Actor
          </span>
          <input
            value={actorInput}
            onChange={(e) => setActorInput(e.target.value)}
            placeholder="Search username or name…"
            className={filterInputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">
            Action
          </span>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className={filterInputClass}
          >
            <option value="">All actions</option>
            {AUDIT_ACTION_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2 lg:col-span-1">
          <span className="mb-1 block text-xs font-medium text-slate-500">
            Cafe
          </span>
          <input
            value={cafeInput}
            onChange={(e) => setCafeInput(e.target.value)}
            placeholder="Search cafe name or slug…"
            className={filterInputClass}
          />
        </label>
      </div>

      <div className="relative">
        {auditQuery.isFetching ? (
          <div className="pointer-events-none absolute right-0 top-0 z-10 -mt-1 text-xs text-slate-400">
            Updating…
          </div>
        ) : null}
        <DataTable
          headers={['When', 'Actor', 'Action', 'Cafe', 'Details']}
          page={page}
          limit={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          emptyMessage="No audit events match these filters"
          rows={items.map((log) => [
            formatDateTime(log.createdAt),
            log.actor,
            <span
              key={`${log.id}-action`}
              className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
            >
              {formatAuditAction(log.action)}
            </span>,
            log.cafeName || '—',
            <AuditInfoButton
              key={`${log.id}-info`}
              onClick={() => setSelected(log)}
            />,
          ])}
        />
      </div>

      <AuditDetailPanel log={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
