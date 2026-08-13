import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastTone = 'default' | 'success' | 'error'

type ToastItem = {
  id: number
  message: string
  tone: ToastTone
  leaving?: boolean
}

type ToastContextValue = {
  toast: (message: string, tone?: ToastTone) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)
const EXIT_MS = 180
const AUTO_DISMISS_MS = 3000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const timersRef = useRef(new Map<number, number>())

  const remove = useCallback((id: number) => {
    const timer = timersRef.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timersRef.current.delete(id)
    }
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const dismiss = useCallback(
    (id: number) => {
      const existing = timersRef.current.get(id)
      if (existing) {
        window.clearTimeout(existing)
        timersRef.current.delete(id)
      }

      setItems((prev) => {
        const target = prev.find((item) => item.id === id)
        if (!target || target.leaving) return prev
        return prev.map((item) =>
          item.id === id ? { ...item, leaving: true } : item,
        )
      })

      const exitTimer = window.setTimeout(() => remove(id), EXIT_MS)
      timersRef.current.set(id, exitTimer)
    },
    [remove],
  )

  const toast = useCallback(
    (message: string, tone: ToastTone = 'default') => {
      const id = Date.now() + Math.floor(Math.random() * 1000)
      setItems((prev) => [...prev, { id, message, tone }])
      const timer = window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
      timersRef.current.set(id, timer)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className={cn(
          'pointer-events-none fixed z-[120] flex flex-col gap-2',
          /* Mobile: full inset, avoid right-6 + w-full clipping */
          'inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))]',
          'sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-full sm:max-w-sm',
        )}
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              'pointer-events-auto flex w-full items-start gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg shadow-black/25',
              item.tone === 'error' ? 'bg-red-700' : 'bg-slate-900',
              item.leaving ? 'animate-toast-out' : 'animate-toast-in',
            )}
            role="status"
          >
            <p className="min-w-0 flex-1 leading-5">{item.message}</p>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              className="shrink-0 rounded p-0.5 text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
