import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

type Variant =
  | 'primary'
  | 'dark'
  | 'outline'
  | 'ghost'
  | 'success'
  | 'warning'
  | 'danger'

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'

const variants: Record<Variant, string> = {
  primary: cn(
    'border border-primary bg-primary font-semibold text-white',
    'hover:bg-[#111113] hover:border-[#111113] focus-visible:ring-zinc-500',
  ),
  dark: cn(
    'border border-zinc-800 bg-zinc-800 font-semibold text-white',
    'hover:bg-zinc-900 hover:border-zinc-900 focus-visible:ring-zinc-500',
  ),
  outline: cn(
    'border border-slate-200 bg-white text-slate-700',
    'hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-300',
  ),
  ghost: 'text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-300',
  success: cn(
    'border border-[#064d06] bg-[#064d06] font-semibold text-white',
    'hover:border-[#053805] hover:bg-[#053805] focus-visible:ring-[#064d06]/40',
  ),
  warning: cn(
    'border border-[#a55400] bg-[#a55400] font-semibold text-white',
    'hover:border-[#8f4700] hover:bg-[#8f4700] focus-visible:ring-[#a55400]/40',
  ),
  danger: cn(
    'border border-[#850a0a] bg-[#850a0a] font-semibold text-white',
    'hover:border-[#6d0808] hover:bg-[#6d0808] focus-visible:ring-[#850a0a]/40',
  ),
}

type Props = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant
    size?: 'sm' | 'md' | 'icon'
    loading?: boolean
  }
>

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  type = 'button',
  ...props
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        base,
        size === 'sm' && 'px-2.5 py-1.5 text-xs',
        size === 'md' && 'px-4 py-2 text-sm',
        size === 'icon' && 'h-8 w-8 shrink-0 p-0',
        variants[variant],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  )
}
