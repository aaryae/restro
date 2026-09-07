import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { FieldShell, controlClassName } from '@/components/ui/Field'
import { cn } from '@/lib/utils'

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label?: ReactNode
  error?: string
  hint?: ReactNode
  inputClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    hint,
    required,
    className,
    inputClassName,
    id,
    disabled,
    ...props
  },
  ref,
) {
  const inputId = id || props.name

  return (
    <FieldShell
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={className}
      htmlFor={inputId}
    >
      <input
        {...props}
        id={inputId}
        ref={ref}
        required={required}
        disabled={disabled}
        className={cn(
          controlClassName(Boolean(error), inputClassName),
          (disabled || props.readOnly) &&
            'cursor-not-allowed bg-slate-50 text-slate-700',
        )}
      />
    </FieldShell>
  )
})
