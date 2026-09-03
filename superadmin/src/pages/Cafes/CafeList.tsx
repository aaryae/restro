import { useEffect, useMemo, useState } from 'react'
import { Eye, Ban, CheckCircle2, Clock3, LogIn, Loader2, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { PageHeader, PageToolbarSearch } from '@/components/PageHeader'
import { DataTable, type SortDir } from '@/components/Table/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { LoadingScreen, PageError } from '@/components/LoadingScreen'
import { CreateCafeModal } from '@/pages/Cafes/CreateCafeModal'
import { cafePosUrl } from '@/utils/cafePosUrl'
import {
  CafeActionConfirmModal,
  type CafeActionKind,
} from '@/pages/Cafes/CafeActionConfirmModal'
import { useAuth } from '@/auth/AuthContext'
import {
  activateCafe,
  extendCafeTrial,
  fetchCafes,
  impersonateCafe,
  suspendCafe,
} from '@/api/platform'
import { queryKeys } from '@/lib/queryClient'
import { formatDate } from '@/lib/format'
import type { Cafe, CafeStatus } from '@/types'
import { ApiError } from '@/api/client'
import { useToast } from '@/components/ui/Toast'

const FILTERS: Array<'all' | CafeStatus> = [
  'all',
  'trial',
  'active',
  'expired',
  'suspended',
  'failed',
]

const DEFAULT_PAGE_SIZE = 10
const DEFAULT_SORT_BY = 'createdAt'
const DEFAULT_SORT_DIR: SortDir = 'desc'
const DEFAULT_STATUS: (typeof FILTERS)[number] = 'all'

export default function CafeListPage() {
  const { can } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const canSection = can('cafes.section')
  const canCreate = can('cafes.create')
  const canView = can('cafes.view')
  const canActivate = can('cafes.activate')
  const canExtend = can('cafes.extend')
  const canSuspend = can('cafes.suspend')
  const canImpersonate = can('cafes.impersonate')
  const [searchInput, setSearchInput] = useState('')
  const query = searchInput.trim()
  const [status, setStatus] = useState<(typeof FILTERS)[number]>(DEFAULT_STATUS)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE)
  const [sortBy, setSortBy] = useState(DEFAULT_SORT_BY)
  const [sortDir, setSortDir] = useState<SortDir>(DEFAULT_SORT_DIR)
  const [createOpen, setCreateOpen] = useState(false)
  const [confirm, setConfirm] = useState<{
    action: CafeActionKind
    cafe: Cafe
  } | null>(null)

  useEffect(() => {
    setPage(1)
  }, [query])

  const params = useMemo(
    () => ({
      page,
      limit,
      q: query || undefined,
      status,
      sortBy,
      sortDir,
    }),
    [page, query, status, sortBy, sortDir, limit],
  )

  const cafesQuery = useQuery({
    queryKey: queryKeys.cafes(params),
    queryFn: () => fetchCafes(params),
    placeholderData: keepPreviousData,
    enabled: canSection,
  })

  function showToast(message: string, tone?: 'default' | 'success' | 'error') {
    toast(message, tone === 'error' ? 'error' : 'default')
  }

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['platform', 'cafes'] })
    queryClient.invalidateQueries({ queryKey: queryKeys.stats })
    queryClient.invalidateQueries({ queryKey: ['platform', 'audit'] })
  }

  const activateMut = useMutation({
    mutationFn: ({
      id,
    }: {
      id: number
      kind: 'activate' | 'unsuspend'
    }) => activateCafe(id),
    onSuccess: (cafe, vars) => {
      showToast(
        vars.kind === 'unsuspend'
          ? `Unsuspended ${cafe.name}`
          : `Activated ${cafe.name}`,
      )
      setConfirm(null)
      invalidate()
    },
    onError: (err) =>
      showToast(
        err instanceof ApiError ? err.message : 'Activate failed',
        'error',
      ),
  })

  const suspendMut = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      suspendCafe(id, reason),
    onSuccess: (cafe) => {
      showToast(`Suspended ${cafe.name}`)
      setConfirm(null)
      invalidate()
    },
    onError: (err) =>
      showToast(
        err instanceof ApiError ? err.message : 'Suspend failed',
        'error',
      ),
  })

  const extendMut = useMutation({
    mutationFn: (id: number) => extendCafeTrial(id, 7),
    onSuccess: (cafe) => {
      showToast(`Extended trial for ${cafe.name}`)
      setConfirm(null)
      invalidate()
    },
    onError: (err) =>
      showToast(
        err instanceof ApiError ? err.message : 'Extend failed',
        'error',
      ),
  })

  const impersonateMut = useMutation({
    mutationFn: impersonateCafe,
    onSuccess: (data) => {
      showToast(`Opening ${data.cafe.name} POS…`)
      setConfirm(null)
      window.open(data.pos.url, '_blank', 'noopener,noreferrer')
      invalidate()
    },
    onError: (err) =>
      showToast(
        err instanceof ApiError ? err.message : 'Impersonate failed',
        'error',
      ),
  })

  function requestAction(action: CafeActionKind, cafe: Cafe) {
    setConfirm({ action, cafe })
  }

  function runConfirmedAction(notes?: string) {
    if (!confirm) return
    const { action, cafe } = confirm
    if (action === 'activate' || action === 'unsuspend') {
      activateMut.mutate({ id: cafe.id, kind: action })
    } else if (action === 'extend') extendMut.mutate(cafe.id)
    else if (action === 'suspend') {
      suspendMut.mutate({ id: cafe.id, reason: notes || '' })
    } else if (action === 'impersonate') impersonateMut.mutate(cafe.id)
  }

  function resetFilters() {
    setSearchInput('')
    setStatus(DEFAULT_STATUS)
    setSortBy(DEFAULT_SORT_BY)
    setSortDir(DEFAULT_SORT_DIR)
    setPage(1)
  }

  const hasActiveFilters =
    Boolean(searchInput.trim()) ||
    status !== DEFAULT_STATUS ||
    sortBy !== DEFAULT_SORT_BY ||
    sortDir !== DEFAULT_SORT_DIR

  if (!canSection) {
    return (
      <PageError message="You do not have access to the Cafes section." />
    )
  }

  const items = cafesQuery.data?.items ?? []
  const total = cafesQuery.data?.pagination.total ?? 0
  const isInitialLoad = cafesQuery.isLoading && !cafesQuery.data
  const isFilterFetching = cafesQuery.isFetching && !isInitialLoad

  const busy =
    activateMut.isPending ||
    suspendMut.isPending ||
    extendMut.isPending ||
    impersonateMut.isPending

  if (isInitialLoad) {
    return <LoadingScreen label="Loading cafes…" />
  }
  if (cafesQuery.isError && !cafesQuery.data) {
    return (
      <PageError
        error={cafesQuery.error}
        onRetry={() => cafesQuery.refetch()}
      />
    )
  }

  return (
    <div>
      <PageHeader
        title="Cafes"
        actions={
          canCreate ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Create cafe
            </Button>
          ) : null
        }
      />

      {canCreate ? (
        <CreateCafeModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={({ cafeName, slug, ownerUsername, ownerPassword }) => {
            invalidate()
            setPage(1)
            const who = ownerUsername ? ` · username: ${ownerUsername}` : ''
            const posLink = cafePosUrl(slug)
            showToast(
              ownerPassword
                ? `Created ${cafeName}. POS: ${posLink}${who} · temp password: ${ownerPassword}`
                : `Created ${cafeName}. Sign in at ${posLink}${who} with the password you set.`,
            )
          }}
        />
      ) : null}

      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:gap-4">
        <div className="min-w-0 flex-1">
          <PageToolbarSearch
            value={searchInput}
            onChange={setSearchInput}
            onReset={resetFilters}
            resetDisabled={!hasActiveFilters}
            placeholder="Search name, slug, email…"
            className="max-w-none"
          />
        </div>
        <div className="flex shrink-0 flex-wrap gap-1.5">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setStatus(item)
                setPage(1)
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-all duration-200 ${
                status === item
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div
        className={`relative transition-opacity duration-200 ${
          isFilterFetching ? 'opacity-60' : 'opacity-100'
        }`}
      >
        {isFilterFetching ? (
          <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3 py-1 text-xs text-slate-500 shadow-sm">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              Updating…
            </span>
          </div>
        ) : null}

        <DataTable
          headers={[
            { label: 'Cafe', sortKey: 'name' },
            { label: 'Owner', sortKey: 'ownerEmail' },
            { label: 'Status', sortKey: 'status' },
            { label: 'Trial ends', sortKey: 'trialEndsAt' },
            { label: 'Created', sortKey: 'createdAt' },
            { label: 'Actions', align: 'center' },
          ]}
          page={page}
          limit={limit}
          total={total}
          onPageChange={setPage}
          onLimitChange={(nextLimit) => {
            setLimit(nextLimit)
            setPage(1)
          }}
          sortBy={sortBy}
          sortDir={sortDir}
          onSortChange={(nextSortBy, nextSortDir) => {
            setSortBy(nextSortBy)
            setSortDir(nextSortDir)
            setPage(1)
          }}
          emptyMessage={
            query || status !== 'all'
              ? 'No cafes match this search or filter'
              : 'No cafes yet'
          }
          rows={items.map((cafe) => [
            <div key={`${cafe.id}-cafe`}>
              <Link
                to={`/cafes/${cafe.id}`}
                className="font-medium text-slate-900 hover:text-primary"
              >
                {cafe.name}
              </Link>
              <p className="text-xs text-slate-400">{cafe.slug}.servecafe.app</p>
            </div>,
            <div key={`${cafe.id}-owner`}>
              <p>{cafe.ownerEmail || '—'}</p>
              <p className="text-xs text-slate-400">{cafe.ownerPhone || '—'}</p>
            </div>,
            <StatusBadge key={`${cafe.id}-status`} status={cafe.status} />,
            formatDate(cafe.trialEndsAt),
            formatDate(cafe.createdAt),
            <div key={`${cafe.id}-actions`} className="inline-flex gap-1">
              {canView ? (
                <Link to={`/cafes/${cafe.id}`}>
                  <Button variant="outline" size="sm" title="View">
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              ) : null}
              {canActivate && cafe.status !== 'active' ? (
                <Button
                  variant="outline"
                  size="sm"
                  title={
                    cafe.status === 'suspended' ? 'Unsuspend' : 'Activate'
                  }
                  disabled={busy}
                  onClick={() =>
                    requestAction(
                      cafe.status === 'suspended' ? 'unsuspend' : 'activate',
                      cafe,
                    )
                  }
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                </Button>
              ) : null}
              {canExtend && cafe.status !== 'suspended' ? (
                <Button
                  variant="outline"
                  size="sm"
                  title="Extend trial +7d"
                  disabled={busy}
                  onClick={() => requestAction('extend', cafe)}
                >
                  <Clock3 className="h-3.5 w-3.5 text-amber-600" />
                </Button>
              ) : null}
              {canSuspend && cafe.status !== 'suspended' ? (
                <Button
                  variant="outline"
                  size="sm"
                  title="Suspend"
                  disabled={busy}
                  onClick={() => requestAction('suspend', cafe)}
                >
                  <Ban className="h-3.5 w-3.5 text-orange-600" />
                </Button>
              ) : null}
              {canImpersonate ? (
                <Button
                  variant="outline"
                  size="sm"
                  title="Open POS"
                  disabled={busy}
                  onClick={() => requestAction('impersonate', cafe)}
                >
                  <LogIn className="h-3.5 w-3.5 text-primary" />
                </Button>
              ) : null}
            </div>,
          ])}
        />
      </div>

      <CafeActionConfirmModal
        open={Boolean(confirm)}
        action={confirm?.action || null}
        cafeName={confirm?.cafe.name || ''}
        busy={busy}
        onClose={() => {
          if (!busy) setConfirm(null)
        }}
        onConfirm={runConfirmedAction}
      />
    </div>
  )
}
