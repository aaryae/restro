import { forwardRef, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { FieldShell, controlClassName } from '@/components/ui/Field'
import { cn } from '@/lib/utils'

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: ReactNode
  error?: string
  hint?: ReactNode
  textareaClassName?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      label,
      error,
      hint,
      required,
      className,
      textareaClassName,
      id,
      disabled,
      ...props
    },
    ref,
  ) {
    const textareaId = id || props.name

    return (
      <FieldShell
        label={label}
        error={error}
        hint={hint}
        required={required}
        className={className}
        htmlFor={textareaId}
      >
        <textarea
          {...props}
          id={textareaId}
          ref={ref}
          required={required}
          disabled={disabled}
          className={cn(
            controlClassName(
              Boolean(error),
              cn('min-h-[120px] resize-y py-2.5', textareaClassName),
            ),
            disabled && 'cursor-not-allowed bg-slate-50 text-slate-700',
          )}
        />
      </FieldShell>
    )
  },
)
