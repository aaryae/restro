import { cn } from '@/lib/utils'

export type FieldErrors<T extends string = string> = Partial<Record<T, string>>

export function firstError(errors: FieldErrors) {
  return Object.values(errors).find(Boolean) || ''
}

export function hasErrors(errors: FieldErrors) {
  return Object.values(errors).some(Boolean)
}

export function requiredText(value: string, label: string, min = 1) {
  const trimmed = value.trim()
  if (!trimmed) return `${label} is required`
  if (trimmed.length < min) return `${label} must be at least ${min} characters`
  return ''
}

export function optionalMin(value: string, label: string, min: number) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (trimmed.length < min) return `${label} must be at least ${min} characters`
  return ''
}

export function emailText(value: string, label = 'Email') {
  const trimmed = value.trim()
  if (!trimmed) return `${label} is required`
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return `Enter a valid ${label.toLowerCase()}`
  }
  return ''
}

export function usernameText(value: string) {
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) return 'Username is required'
  if (trimmed.length < 3) return 'Username must be at least 3 characters'
  if (trimmed.length > 64) return 'Username must be at most 64 characters'
  if (!/^[a-z0-9._-]+$/.test(trimmed)) {
    return 'Username can only use letters, numbers, ., _, and -'
  }
  return ''
}

/** POS owner username: keep spaces and casing as typed. */
export function optionalOwnerUsernameText(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (trimmed.length < 2) return 'Username must be at least 2 characters'
  if (trimmed.length > 64) return 'Username must be at most 64 characters'
  return ''
}

export function passwordText(
  value: string,
  opts: { required?: boolean; min?: number; label?: string } = {},
) {
  const { required = true, min = 6, label = 'Password' } = opts
  const trimmed = value.trim()
  if (!trimmed) return required ? `${label} is required` : ''
  if (trimmed.length < min) return `${label} must be at least ${min} characters`
  return ''
}

export function slugText(value: string) {
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) return ''
  if (trimmed.length < 2) return 'Slug must be at least 2 characters'
  if (trimmed.length > 50) return 'Slug must be at most 50 characters'
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmed)) {
    return 'Slug must be lowercase letters, numbers, and hyphens'
  }
  return ''
}

export function phoneText(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (!/^[+]?[\d\s()-]{7,20}$/.test(trimmed)) {
    return 'Enter a valid phone number'
  }
  return ''
}

export function intInRange(
  value: string,
  label: string,
  min: number,
  max: number,
) {
  if (!String(value).trim()) return `${label} is required`
  const n = Number(value)
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    return `${label} must be a whole number`
  }
  if (n < min || n > max) return `${label} must be between ${min} and ${max}`
  return ''
}

export function fieldInputClass(hasError?: boolean, className?: string) {
  return cn(
    'h-10 w-full rounded-lg border px-3 text-sm outline-none transition',
    hasError
      ? 'border-red-400 focus:border-red-500'
      : 'border-slate-200 focus:border-primary',
    className,
  )
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-red-600">{message}</p>
}
