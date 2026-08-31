'use client'
import { useEffect, useRef } from 'react'

export function useReveal(threshold = 0.12, rootMargin = '0px 0px -50px 0px') {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const targets = el.querySelectorAll('[data-reveal]')
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.setAttribute('data-visible', 'true')
          obs.unobserve(entry.target)
        }
      })
    }, { threshold, rootMargin })

    targets.forEach(t => obs.observe(t))
    return () => obs.disconnect()
  }, [threshold, rootMargin])

  return ref
}