import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  label: string
  value: string | number
  hint?: string
  icon: LucideIcon
  tone?: 'default' | 'success' | 'warning' | 'danger'
}

const tones = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'default',
}: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
          {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
        </div>
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl',
            tones[tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
