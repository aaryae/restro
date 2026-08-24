import { Loader2 } from 'lucide-react'

export function LoadingScreen({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-3 text-slate-500">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

export function PageError({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center">
      <p className="text-sm text-red-700">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white"
        >
          Retry
        </button>
      ) : null}
    </div>
  )
}
