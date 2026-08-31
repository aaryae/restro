'use client'

import { useEffect } from 'react'

export default function BlackToast({ message, onClose, duration = 4500 }) {
  useEffect(() => {
    if (!message) return undefined
    const timer = setTimeout(() => onClose?.(), duration)
    return () => clearTimeout(timer)
  }, [message, duration, onClose])

  if (!message) return null

  return (
    <div
      role="alert"
      className="fixed right-5 bottom-5 z-[90] flex max-w-[min(24rem,calc(100vw-2.5rem))] items-start gap-3 rounded-2xl bg-ink px-4 py-3.5 text-cream shadow-[0_16px_40px_rgba(13,9,5,0.35)]">
      <p className="flex-1 text-sm leading-snug">{message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        className="shrink-0 text-cream/55 transition hover:text-cream cursor-pointer">
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          aria-hidden>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  )
}
