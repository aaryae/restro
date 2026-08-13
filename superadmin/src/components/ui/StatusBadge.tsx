import type { CafeStatus } from '@/types'
import { cn } from '@/lib/utils'

const styles: Record<CafeStatus, string> = {
  provisioning: 'bg-sky-50 text-sky-700 border-sky-200',
  trial: 'bg-amber-50 text-amber-800 border-amber-200',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  expired: 'bg-slate-100 text-slate-600 border-slate-200',
  suspended: 'bg-orange-50 text-orange-700 border-orange-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
  deleted: 'bg-slate-100 text-slate-500 border-slate-200',
}

export function StatusBadge({ status }: { status: CafeStatus | string }) {
  const key = status as CafeStatus
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        styles[key] || 'bg-slate-50 text-slate-600 border-slate-200',
      )}
    >
      {status}
    </span>
  )
}
