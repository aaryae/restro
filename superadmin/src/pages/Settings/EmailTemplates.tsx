import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Pencil, RotateCcw } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import {
  PageHeader,
  PageToolbarSearch,
} from '@/components/PageHeader'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/Table/DataTable'
import { LoadingScreen, PageError } from '@/components/LoadingScreen'
import { useAuth } from '@/auth/AuthContext'
import {
  fetchCafeEmailTemplates,
  fetchPlatformSmtp,
  resetCafeEmailTemplate,
} from '@/api/platform'
import { queryKeys } from '@/lib/queryClient'
import { ApiError } from '@/api/client'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import type { CafeEmailTemplate } from '@/types'

export default function EmailTemplatesPage() {
  const { can } = useAuth()
  const canManage = can('users.manage')
  const { toast } = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const templatesQuery = useQuery({
    queryKey: queryKeys.emailTemplates,
    queryFn: fetchCafeEmailTemplates,
    enabled: canManage,
  })

  const smtpQuery = useQuery({
    queryKey: queryKeys.smtp,
    queryFn: fetchPlatformSmtp,
    enabled: canManage,
  })

  const items = templatesQuery.data?.items || []

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.key.toLowerCase().includes(q) ||
        item.trigger.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q),
    )
  }, [items, search])

  const pageRows = useMemo(() => {
    const start = (page - 1) * limit
    return filtered.slice(start, start + limit)
  }, [filtered, page, limit])

  const resetMut = useMutation({
    mutationFn: (key: string) => resetCafeEmailTemplate(key),
    onSuccess: (template) => {
      toast(`Reset ${template.label} to default`)
      queryClient.invalidateQueries({ queryKey: queryKeys.emailTemplates })
    },
    onError: (err) =>
      toast(err instanceof ApiError ? err.message : 'Reset failed', 'error'),
  })

  const smtpConfigured = Boolean(
    smtpQuery.data && smtpQuery.data.configured === true,
  )

  if (!canManage) {
    return (
      <PageError message="You do not have permission to manage templates." />
    )
  }

  if (templatesQuery.isLoading && !templatesQuery.data) {
    return <LoadingScreen label="Loading email templates…" />
  }

  if (templatesQuery.isError && !templatesQuery.data) {
    return (
      <PageError
        error={templatesQuery.error}
        onRetry={() => templatesQuery.refetch()}
      />
    )
  }

  function statusCell(item: CafeEmailTemplate) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium',
          item.isCustom
            ? 'bg-sky-50 text-sky-800 ring-1 ring-sky-200/80'
            : 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80',
        )}
      >
        <span
          className={cn(
            'h-2 w-2 rounded-full',
            item.isCustom ? 'bg-sky-500' : 'bg-emerald-500',
          )}
        />
        {item.isCustom ? 'Custom' : 'Default'}
      </span>
    )
  }

  return (
    <div className="pb-8">
      <PageHeader
        title="Email templates"
        subtitle="Owner notifications for cafe create, activate, suspend, and trial changes."
        actions={
          smtpConfigured ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200/80">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              SMTP ready
            </span>
          ) : (
            <Link
              to="/settings/smtp"
              className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 ring-1 ring-amber-200/80 hover:bg-amber-100"
            >
              Connect SMTP
            </Link>
          )
        }
      />

      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <PageToolbarSearch
          value={search}
          onChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
          onReset={() => {
            setSearch('')
            setPage(1)
          }}
          resetDisabled={!search.trim()}
          placeholder="Search name, key, trigger…"
          className="max-w-md"
        />
        <Button
          type="button"
          variant="outline"
          disabled={templatesQuery.isFetching}
          onClick={() => templatesQuery.refetch()}
        >
          {templatesQuery.isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RotateCcw className="h-4 w-4" />
          )}
          Reload
        </Button>
      </div>

      <DataTable
        headers={[
          { label: 'Name' },
          { label: 'Key' },
          { label: 'Trigger' },
          { label: 'Status', align: 'center' },
          { label: 'Actions', align: 'center' },
        ]}
        page={page}
        limit={limit}
        total={filtered.length}
        onPageChange={setPage}
        onLimitChange={(next) => {
          setLimit(next)
          setPage(1)
        }}
        emptyMessage="No email templates match your search."
        rows={pageRows.map((item) => [
          <div key={`${item.key}-name`} className="min-w-[180px] max-w-xs">
            <p className="font-medium text-slate-900">{item.label}</p>
            <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
              {item.description}
            </p>
          </div>,
          <code
            key={`${item.key}-key`}
            className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700"
          >
            {item.key}
          </code>,
          <span key={`${item.key}-trigger`} className="text-slate-600">
            {item.trigger}
          </span>,
          <div key={`${item.key}-status`} className="flex justify-center">
            {statusCell(item)}
          </div>,
          <div
            key={`${item.key}-actions`}
            className="flex items-center justify-center gap-1.5"
          >
            <button
              type="button"
              title="Edit template"
              onClick={() => navigate(`/settings/email-templates/${item.key}`)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white transition hover:bg-slate-800"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Reset to default"
              disabled={!item.isCustom || resetMut.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    `Reset “${item.label}” to the default Serve wording?`,
                  )
                ) {
                  resetMut.mutate(item.key)
                }
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>,
        ])}
      />
    </div>
  )
}
