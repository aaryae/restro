import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Ban, CheckCircle2, Clock3, LogIn } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/Table/DataTable'
import { LoadingScreen, PageError } from '@/components/LoadingScreen'
import { useAuth } from '@/auth/AuthContext'
import {
  CafeActionConfirmModal,
  type CafeActionKind,
} from '@/pages/Cafes/CafeActionConfirmModal'
import {
  activateCafe,
  extendCafeTrial,
  fetchCafe,
  impersonateCafe,
  suspendCafe,
} from '@/api/platform'
import { queryKeys } from '@/lib/queryClient'
import { formatDate, formatDateTime } from '@/lib/format'
import { ApiError } from '@/api/client'
import { useToast } from '@/components/ui/Toast'
import { useState } from 'react'

export default function CafeDetailPage() {
  const { id } = useParams()
  const { can } = useAuth()
  const { toast } = useToast()
  const canView = can('cafes.view')
  const canActivate = can('cafes.activate')
  const canExtend = can('cafes.extend')
  const canSuspend = can('cafes.suspend')
  const canImpersonate = can('cafes.impersonate')
  const queryClient = useQueryClient()
  const [confirmAction, setConfirmAction] = useState<CafeActionKind | null>(
    null,
  )

  const cafeQuery = useQuery({
    queryKey: queryKeys.cafe(id || ''),
    queryFn: () => fetchCafe(id!),
    enabled: Boolean(id) && canView,
  })

  function showToast(message: string, tone?: 'default' | 'error') {
    toast(message, tone === 'error' ? 'error' : 'default')
  }

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.cafe(id || '') })
    queryClient.invalidateQueries({ queryKey: ['platform', 'cafes'] })
    queryClient.invalidateQueries({ queryKey: queryKeys.stats })
    queryClient.invalidateQueries({ queryKey: ['platform', 'audit'] })
  }

  const activateMut = useMutation({
    mutationFn: (_vars: { kind: 'activate' | 'unsuspend' }) =>
      activateCafe(Number(id)),
    onSuccess: (cafe, vars) => {
      showToast(
        vars.kind === 'unsuspend'
          ? `Unsuspended ${cafe.name}`
          : `Activated ${cafe.name}`,
      )
      setConfirmAction(null)
      invalidate()
    },
    onError: (err) =>
      showToast(
        err instanceof ApiError ? err.message : 'Activate failed',
        'error',
      ),
  })
  const suspendMut = useMutation({
    mutationFn: (reason: string) => suspendCafe(Number(id), reason),
    onSuccess: (cafe) => {
      showToast(`Suspended ${cafe.name}`)
      setConfirmAction(null)
      invalidate()
    },
    onError: (err) =>
      showToast(
        err instanceof ApiError ? err.message : 'Suspend failed',
        'error',
      ),
  })
  const extendMut = useMutation({
    mutationFn: () => extendCafeTrial(Number(id), 7),
    onSuccess: (cafe) => {
      showToast(`Extended trial for ${cafe.name}`)
      setConfirmAction(null)
      invalidate()
    },
    onError: (err) =>
      showToast(
        err instanceof ApiError ? err.message : 'Extend failed',
        'error',
      ),
  })
  const impersonateMut = useMutation({
    mutationFn: () => impersonateCafe(Number(id)),
    onSuccess: (data) => {
      showToast(`Opening ${data.cafe.name} POS…`)
      setConfirmAction(null)
      window.open(data.pos.url, '_blank', 'noopener,noreferrer')
      invalidate()
    },
    onError: (err) =>
      showToast(
        err instanceof ApiError ? err.message : 'Impersonate failed',
        'error',
      ),
  })

  function runConfirmedAction(notes?: string) {
    if (!confirmAction) return
    if (confirmAction === 'activate' || confirmAction === 'unsuspend') {
      activateMut.mutate({ kind: confirmAction })
    } else if (confirmAction === 'extend') extendMut.mutate()
    else if (confirmAction === 'suspend') suspendMut.mutate(notes || '')
    else if (confirmAction === 'impersonate') impersonateMut.mutate()
  }

  if (!canView) {
    return <PageError message="You do not have permission to view cafes." />
  }
  if (cafeQuery.isLoading) return <LoadingScreen label="Loading cafe…" />
  if (cafeQuery.isError) {
    return (
      <PageError
        message={(cafeQuery.error as Error).message}
        onRetry={() => cafeQuery.refetch()}
      />
    )
  }

  const cafe = cafeQuery.data?.cafe
  const jobs = cafeQuery.data?.jobs || []
  if (!cafe) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
        Cafe not found.{' '}
        <Link to="/cafes" className="text-primary">
          Back to list
        </Link>
      </div>
    )
  }

  const busy =
    activateMut.isPending ||
    suspendMut.isPending ||
    extendMut.isPending ||
    impersonateMut.isPending

  return (
    <div>
      <PageHeader
        title={cafe.name}
        subtitle={`${cafe.slug}.servecafe.app`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/cafes">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            {canActivate && cafe.status !== 'active' ? (
              <Button
                disabled={busy}
                onClick={() =>
                  setConfirmAction(
                    cafe.status === 'suspended' ? 'unsuspend' : 'activate',
                  )
                }
              >
                <CheckCircle2 className="h-4 w-4" />
                {cafe.status === 'suspended' ? 'Unsuspend' : 'Activate'}
              </Button>
            ) : null}
            {canExtend ? (
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => setConfirmAction('extend')}
              >
                <Clock3 className="h-4 w-4" />
                Extend trial
              </Button>
            ) : null}
            {canSuspend && cafe.status !== 'suspended' ? (
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => setConfirmAction('suspend')}
              >
                <Ban className="h-4 w-4" />
                Suspend
              </Button>
            ) : null}
            {canImpersonate ? (
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => setConfirmAction('impersonate')}
              >
                <LogIn className="h-4 w-4" />
                Open POS
              </Button>
            ) : null}
          </div>
        }
      />

      <CafeActionConfirmModal
        open={Boolean(confirmAction)}
        action={confirmAction}
        cafeName={cafe.name}
        busy={busy}
        onClose={() => {
          if (!busy) setConfirmAction(null)
        }}
        onConfirm={runConfirmedAction}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-800">Cafe details</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <Item label="Status" value={<StatusBadge status={cafe.status} />} />
            <Item label="Business type" value={cafe.businessType || '—'} />
            <Item label="Owner email" value={cafe.ownerEmail || '—'} />
            <Item label="Owner phone" value={cafe.ownerPhone || '—'} />
            <Item label="Address" value={cafe.address || '—'} />
            <Item label="Created" value={formatDateTime(cafe.createdAt)} />
            <Item label="Trial ends" value={formatDate(cafe.trialEndsAt)} />
            <Item label="Activated" value={formatDate(cafe.activatedAt)} />
          </dl>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">Quick links</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>
              Public URL:{' '}
              <span className="font-medium text-slate-900">
                {cafe.slug}.servecafe.app
              </span>
            </li>
            <li>
              Local POS:{' '}
              <span className="font-medium text-slate-900">
                localhost:7001/?tenant={cafe.slug}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <section className="mt-6 min-w-0">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">
          Provisioning history
        </h2>
        <DataTable
          headers={['Job ID', 'Status', 'Started', 'Finished', 'Error']}
          rows={jobs.map((job) => [
            `#${job.id}`,
            <StatusBadge key={job.id} status={job.status} />,
            formatDateTime(job.startedAt),
            formatDateTime(job.finishedAt),
            job.errorMessage || '—',
          ])}
          emptyMessage="No provisioning jobs for this cafe."
        />
      </section>
    </div>
  )
}

function Item({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm text-slate-800">{value}</dd>
    </div>
  )
}
