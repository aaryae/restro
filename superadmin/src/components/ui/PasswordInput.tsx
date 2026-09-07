import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { FieldShell, controlClassName } from '@/components/ui/Field'
import { cn } from '@/lib/utils'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & {
  label?: ReactNode
  error?: string
  hint?: ReactNode
  inputClassName?: string
}

export function PasswordInput({
  className,
  inputClassName,
  label,
  error,
  hint,
  required,
  id,
  disabled,
  ...props
}: Props) {
  const [visible, setVisible] = useState(false)
  const autoId = useId()
  const inputId = id || props.name || autoId

  return (
    <FieldShell
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={className}
      htmlFor={inputId}
    >
      <div className="relative w-full">
        <input
          {...props}
          id={inputId}
          type={visible ? 'text' : 'password'}
          required={required}
          disabled={disabled}
          className={cn(
            controlClassName(Boolean(error), cn('pr-14', inputClassName)),
            disabled && 'cursor-not-allowed bg-slate-50 text-slate-700',
          )}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-800"
          tabIndex={-1}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
    </FieldShell>
  )
}
