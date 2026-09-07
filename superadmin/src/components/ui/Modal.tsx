import {
  useEffect,
  type ReactNode,
} from 'react'
import { X } from 'lucide-react'
import { useBodyScrollLock } from '@/lib/useBodyScrollLock'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

const SIZE_CLASS = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
} as const

type ModalSize = keyof typeof SIZE_CLASS

type ModalProps = {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  /** When true, panel scrolls as one block. When false, body scrolls (forms). */
  scrollBody?: boolean
  size?: ModalSize
  busy?: boolean
  showClose?: boolean
  className?: string
  bodyClassName?: string
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  scrollBody = true,
  size = 'md',
  busy = false,
  showClose = true,
  className,
  bodyClassName,
}: ModalProps) {
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

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0"
        onClick={() => !busy && onClose()}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative w-full border border-slate-200 bg-white shadow-xl',
          'rounded-t-2xl sm:rounded-2xl',
          scrollBody
            ? 'max-h-[min(100dvh,100%)] overflow-y-auto'
            : 'flex max-h-[min(100dvh,100%)] flex-col overflow-hidden sm:max-h-[min(90dvh,880px)]',
          SIZE_CLASS[size],
          className,
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {description ? (
              <div className="mt-1 text-sm text-slate-500">{description}</div>
            ) : null}
          </div>
          {showClose ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={onClose}
              className="shrink-0 px-2 text-slate-400 hover:text-slate-700"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>

        <div
          className={cn(
            scrollBody
              ? 'px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]'
              : 'min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4',
            bodyClassName,
          )}
        >
          {children}
        </div>

        {footer ? (
          <div
            className={cn(
              'flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-100 px-5 pt-4',
              scrollBody
                ? 'pb-[max(1rem,env(safe-area-inset-bottom))]'
                : 'pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4',
            )}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}

type ModalFooterProps = {
  children: ReactNode
  className?: string
}

/** Use inside Modal `footer` or at the bottom of a form body. */
export function ModalActions({ children, className }: ModalFooterProps) {
  return (
    <div
      className={cn(
        'flex w-full flex-wrap items-center justify-end gap-2',
        className,
      )}
    >
      {children}
    </div>
  )
}
