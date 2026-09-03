import { useEffect, useState, type ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { cn } from '@/lib/utils'

type Props = {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, actions }: Props) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}

export function PageFilterResetButton({
  onReset,
  disabled,
  title = 'Reset filters',
}: {
  onReset: () => void
  disabled?: boolean
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onReset}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={cn(
        'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors',
        'hover:bg-slate-50 hover:text-slate-800',
        'disabled:cursor-not-allowed disabled:opacity-40',
      )}
    >
      <RotateCcw className="h-4 w-4" />
    </button>
  )
}

export function PageToolbarSearch({
  value,
  onChange,
  onReset,
  resetDisabled,
  debounceMs = 300,
  placeholder = 'Search…',
  className,
}: {
  value: string
  onChange: (value: string) => void
  onReset?: () => void
  resetDisabled?: boolean
  debounceMs?: number
  placeholder?: string
  className?: string
}) {
  const [draft, setDraft] = useState(value)
  const debouncedDraft = useDebouncedValue(draft, debounceMs)

  useEffect(() => {
    setDraft(value)
  }, [value])

  useEffect(() => {
    onChange(debouncedDraft)
  }, [debouncedDraft, onChange])

  return (
    <div className={cn('flex w-full max-w-xs items-center gap-2', className)}>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary"
      />
      {onReset ? (
        <PageFilterResetButton
          onReset={onReset}
          disabled={resetDisabled ?? !draft.trim()}
        />
      ) : null}
    </div>
  )
}

export { Button }
