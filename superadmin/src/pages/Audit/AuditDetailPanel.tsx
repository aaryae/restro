import { useEffect, useState } from 'react'
import { Info, X } from 'lucide-react'
import type { AuditLog } from '@/types'
import {
  formatAuditAction,
  formatAuditDetailSections,
  formatDateTime,
} from '@/lib/format'
import { cn } from '@/lib/utils'
import { useBodyScrollLock } from '@/lib/useBodyScrollLock'

const EXIT_MS = 320

type Props = {
  log: AuditLog | null
  onClose: () => void
}

export function AuditDetailPanel({ log, onClose }: Props) {
  const [active, setActive] = useState<AuditLog | null>(null)
  const [open, setOpen] = useState(false)

  useBodyScrollLock(Boolean(active))

  useEffect(() => {
    if (log) {
      setActive(log)
      setOpen(false)
      // Paint closed state first, then open so CSS transition can run.
      const id = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setOpen(true))
      })
      return () => window.cancelAnimationFrame(id)
    }

    setOpen(false)
    const timer = window.setTimeout(() => setActive(null), EXIT_MS)
    return () => window.clearTimeout(timer)
  }, [log])

  useEffect(() => {
    if (!active) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, onClose])

  if (!active) return null

  const sections = formatAuditDetailSections(active.meta)

  return (
    <div className="fixed inset-0 z-[90]">
      <button
        type="button"
        className={cn(
          'absolute inset-0 bg-slate-900/35 transition-opacity duration-300 ease-out',
          open ? 'opacity-100' : 'opacity-0',
        )}
        aria-label="Close details"
        onClick={onClose}
      />
      <aside
        className={cn(
          'absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl will-change-transform',
          'transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          'pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="audit-detail-title"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Audit detail
            </p>
            <h2
              id="audit-detail-title"
              className="mt-1 text-base font-semibold text-slate-900"
            >
              {formatAuditAction(active.action)}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {formatDateTime(active.createdAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
              Event
            </p>
            <dl className="grid gap-3 text-sm">
              <Row
                label="Actor"
                value={
                  active.actorName
                    ? `${active.actorName} (@${active.actor})`
                    : active.actor
                }
              />
              <Row label="Action" value={formatAuditAction(active.action)} />
              <Row label="Cafe" value={active.cafeName || '—'} />
              {active.cafeSlug ? (
                <Row label="Cafe slug" value={active.cafeSlug} />
              ) : null}
            </dl>
          </section>

          {sections.length ? (
            sections.map((section) => (
              <section
                key={section.title}
                className="rounded-xl border border-slate-200 p-4"
              >
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
                  {section.title}
                </p>
                <ul className="space-y-2.5">
                  {section.rows.map((row, i) => (
                    <li
                      key={`${section.title}-${row.label}-${i}`}
                      className="flex flex-col gap-0.5"
                    >
                      <span className="text-xs font-medium text-slate-400">
                        {row.label}
                      </span>
                      <span
                        className={cn(
                          'text-sm leading-5 text-slate-800',
                          row.tone === 'add' && 'font-medium text-emerald-700',
                          row.tone === 'remove' && 'font-medium text-red-600',
                        )}
                      >
                        {row.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          ) : (
            <p className="text-sm text-slate-500">No extra details recorded.</p>
          )}
        </div>
      </aside>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-800">{value}</dd>
    </div>
  )
}

export function AuditInfoButton({
  onClick,
  disabled,
}: {
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
      aria-label="View details"
      title="View details"
    >
      <Info className="h-4 w-4" />
    </button>
  )
}
