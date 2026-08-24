import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useBodyScrollLock } from '@/lib/useBodyScrollLock'
import { FieldError, requiredText } from '@/lib/formValidation'

export type CafeActionKind =
  | 'activate'
  | 'unsuspend'
  | 'extend'
  | 'suspend'
  | 'impersonate'

type Props = {
  open: boolean
  action: CafeActionKind | null
  cafeName: string
  busy?: boolean
  onClose: () => void
  onConfirm: (notes?: string) => void
}

const COPY: Record<
  CafeActionKind,
  { title: string; body: string; confirm: string; danger?: boolean }
> = {
  activate: {
    title: 'Activate cafe?',
    body: 'This will set the cafe to active and restore normal access.',
    confirm: 'Activate',
  },
  unsuspend: {
    title: 'Unsuspend cafe?',
    body: 'This will lift the suspension and restore access (set status to active).',
    confirm: 'Unsuspend',
  },
  extend: {
    title: 'Extend trial?',
    body: 'This will extend the trial by 7 days.',
    confirm: 'Extend trial',
  },
  suspend: {
    title: 'Suspend cafe?',
    body: 'This will block access for the cafe. Add a note explaining why.',
    confirm: 'Suspend',
    danger: true,
  },
  impersonate: {
    title: 'Open POS?',
    body: 'This opens the cafe POS in a new tab using a temporary platform session.',
    confirm: 'Open POS',
  },
}

export function CafeActionConfirmModal({
  open,
  action,
  cafeName,
  busy = false,
  onClose,
  onConfirm,
}: Props) {
  const [notes, setNotes] = useState('')
  const [notesError, setNotesError] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setNotes('')
    setNotesError('')
    setError('')
  }, [open, action])

  useBodyScrollLock(open)

  useEffect(() => {
    if (!open) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, busy, onClose])

  if (!open || !action) return null

  const copy = COPY[action]

  function handleConfirm() {
    if (action === 'suspend') {
      const notesMsg = requiredText(notes, 'Notes', 5)
      setNotesError(notesMsg)
      if (notesMsg) {
        setError('Please fix the highlighted fields.')
        return
      }
      setError('')
      onConfirm(notes.trim())
      return
    }
    onConfirm()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0"
        onClick={() => !busy && onClose()}
      />
      <div className="relative max-h-[min(100dvh,100%)] w-full max-w-md overflow-y-auto rounded-t-2xl border border-slate-200 bg-white shadow-xl sm:rounded-2xl">
        <div className="border-b border-slate-100 px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-4">
          <h2 className="text-base font-semibold text-slate-900">{copy.title}</h2>
          <p className="mt-1 text-sm text-slate-500">
            <span className="font-medium text-slate-700">{cafeName}</span>
            {' — '}
            {copy.body}
          </p>
        </div>

        <div className="space-y-3 px-5 py-4">
          {action === 'suspend' ? (
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">
                Notes *
              </span>
              <textarea
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value)
                  if (notesError) {
                    setNotesError(requiredText(e.target.value, 'Notes', 5))
                  }
                  if (error) setError('')
                }}
                rows={4}
                placeholder="Why is this cafe being suspended?"
                className={`w-full resize-y rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary ${
                  notesError
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-slate-200'
                }`}
                autoFocus
              />
              <FieldError message={notesError} />
            </label>
          ) : null}

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex gap-2 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] sm:justify-end sm:pb-0">
            <Button
              type="button"
              variant="outline"
              className="flex-1 sm:flex-none"
              disabled={busy}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1 sm:flex-none"
              variant={copy.danger ? 'danger' : 'primary'}
              disabled={busy}
              onClick={handleConfirm}
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Working…
                </>
              ) : (
                copy.confirm
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
