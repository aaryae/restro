import { forwardRef, type ReactNode, type SelectHTMLAttributes } from 'react'
import { FieldShell, controlClassName } from '@/components/ui/Field'
import { cn } from '@/lib/utils'

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: ReactNode
  error?: string
  hint?: ReactNode
  selectClassName?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    error,
    hint,
    required,
    className,
    selectClassName,
    id,
    disabled,
    children,
    ...props
  },
  ref,
) {
  const selectId = id || props.name

  return (
    <FieldShell
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={className}
      htmlFor={selectId}
    >
      <select
        {...props}
        id={selectId}
        ref={ref}
        required={required}
        disabled={disabled}
        className={cn(
          controlClassName(Boolean(error), cn('bg-white', selectClassName)),
          disabled && 'cursor-not-allowed bg-slate-50 text-slate-700',
        )}
      >
        {children}
      </select>
    </FieldShell>
  )
})
