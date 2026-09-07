import { cn } from '@/lib/utils'
import { FieldError, fieldInputClass } from '@/lib/formValidation'
import type { ReactNode } from 'react'

export type FieldShellProps = {
  label?: ReactNode
  error?: string
  hint?: ReactNode
  required?: boolean
  className?: string
  htmlFor?: string
  children: ReactNode
}

export function FieldShell({
  label,
  error,
  hint,
  required,
  className,
  htmlFor,
  children,
}: FieldShellProps) {
  return (
    <div className={cn('block w-full', className)}>
      {label ? (
        <label
          htmlFor={htmlFor}
          className="mb-1.5 block text-xs font-medium text-slate-600"
        >
          {label}
          {required ? <span className="ml-0.5 text-red-500">*</span> : null}
        </label>
      ) : null}
      {children}
      <FieldError message={error} />
      {!error && hint ? (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}

export function controlClassName(hasError?: boolean, className?: string) {
  return fieldInputClass(hasError, className)
}
