import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { forceLoginRedirect, isSessionFailure } from '@/api/client'

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
  error,
  onRetry,
}: {
  message?: string
  error?: unknown
  onRetry?: () => void
}) {
  const sessionExpired =
    (error && isSessionFailure(error)) ||
    (message ? isSessionFailure({ message, status: 0 }) : false)

  useEffect(() => {
    if (sessionExpired) forceLoginRedirect()
  }, [sessionExpired])

  if (sessionExpired) {
    return <LoadingScreen label="Redirecting to sign in…" />
  }

  const text =
    message ?? (error instanceof Error ? error.message : 'Request failed')

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center">
      <p className="text-sm text-red-700">{text}</p>
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
