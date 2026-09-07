import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export function FormAlert({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  if (!children) return null
  return (
    <div
      role="alert"
      className={cn(
        'rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function FormSuccess({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  if (!children) return null
  return (
    <div
      className={cn(
        'rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800',
        className,
      )}
    >
      {children}
    </div>
  )
}
