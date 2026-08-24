import { useState, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  inputClassName?: string
}

export function PasswordInput({
  className,
  inputClassName,
  ...props
}: Props) {
  const [visible, setVisible] = useState(false)

  return (
    <div className={cn('relative w-full', className)}>
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={cn(
          'h-10 w-full rounded-lg border border-slate-200 px-3 pr-14 text-sm outline-none focus:border-primary disabled:bg-slate-50',
          inputClassName,
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
  )
}
