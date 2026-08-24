import { useEffect, useState } from 'react'
import { DayPicker, type DateRange } from 'react-day-picker'
import { X } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { useBodyScrollLock } from '@/lib/useBodyScrollLock'
import { useMediaQuery } from '@/lib/useMediaQuery'
import 'react-day-picker/style.css'

type Props = {
  open: boolean
  from: string
  to: string
  onClose: () => void
  onApply: (range: { from: string; to: string }) => void
}

function toDayKey(date: Date) {
  return format(date, 'yyyy-MM-dd')
}

function parseDay(value: string) {
  try {
    return parseISO(value)
  } catch {
    return undefined
  }
}

export function DateRangeCalendarModal({
  open,
  from,
  to,
  onClose,
  onApply,
}: Props) {
  const [range, setRange] = useState<DateRange | undefined>()
  const [rangeError, setRangeError] = useState('')
  // Two months only on real desktop widths (tablet stays single-month sheet).
  const showTwoMonths = useMediaQuery('(min-width: 768px)')

  useBodyScrollLock(open)

  useEffect(() => {
    if (!open) return
    setRange({
      from: parseDay(from),
      to: parseDay(to),
    })
    setRangeError('')
  }, [open, from, to])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const today = new Date()
  today.setHours(23, 59, 59, 999)

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center bg-slate-900/45 md:items-center md:p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close calendar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="date-range-title"
        className="serve-date-range-modal relative flex h-[min(92dvh,100%)] w-full flex-col rounded-t-2xl border border-slate-200 bg-white shadow-xl md:h-auto md:w-auto md:max-w-fit md:rounded-2xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:px-5 md:py-4">
          <div>
            <h2
              id="date-range-title"
              className="text-base font-semibold text-slate-900"
            >
              Custom date range
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Select a start date, then an end date.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="shrink-0 px-4 pt-3 md:px-5">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-slate-100 px-3 py-2 text-slate-600">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                From
              </p>
              <p className="mt-0.5 font-semibold text-slate-900">
                {range?.from ? format(range.from, 'MMM d, yyyy') : '—'}
              </p>
            </div>
            <div className="rounded-lg bg-slate-100 px-3 py-2 text-slate-600">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                To
              </p>
              <p className="mt-0.5 font-semibold text-slate-900">
                {range?.to ? format(range.to, 'MMM d, yyyy') : '—'}
              </p>
            </div>
          </div>
          {rangeError ? (
            <p className="mt-2 text-xs text-red-600">{rangeError}</p>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 md:flex-none md:overflow-visible md:px-5 md:pb-2">
          <div className="serve-day-picker w-full rounded-xl border border-slate-200 bg-slate-50/80 p-2 md:w-auto md:p-3">
            <DayPicker
              mode="range"
              navLayout="around"
              numberOfMonths={showTwoMonths ? 2 : 1}
              selected={range}
              onSelect={(next) => {
                setRange(next)
                if (rangeError) setRangeError('')
              }}
              disabled={{ after: today }}
              defaultMonth={range?.from || parseDay(from) || today}
              className="w-full md:w-auto"
            />
          </div>
        </div>

        <div className="flex shrink-0 gap-2 border-t border-slate-100 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:justify-end md:px-5 md:pb-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1 md:flex-none"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1 md:flex-none"
            onClick={() => {
              if (!range?.from || !range?.to) {
                setRangeError('Select both a start and end date.')
                return
              }
              const start = range.from
              const end = range.to
              const days =
                Math.floor(
                  (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
                ) + 1
              if (days > 366) {
                setRangeError('Custom range cannot exceed 366 days.')
                return
              }
              onApply({
                from: toDayKey(start),
                to: toDayKey(end),
              })
            }}
          >
            Apply range
          </Button>
        </div>
      </div>
    </div>
  )
}
