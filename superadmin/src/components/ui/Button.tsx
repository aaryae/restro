import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-white hover:bg-[#a87432] shadow-sm shadow-primary/20',
  secondary:
    'bg-secondary text-slate-900 hover:bg-[#e6a800] shadow-sm',
  outline:
    'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100',
  danger: 'bg-red-600 text-white hover:bg-red-700',
}

type Props = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant
    size?: 'sm' | 'md'
  }
>

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: Props) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
