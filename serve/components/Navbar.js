'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

const links = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Stories', href: '#stories' },
  { label: 'FAQ', href: '#faq' },
]

const DARK_SECTIONS = ['ticker', 'problem', 'about', 'site-footer']

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [progress, setProgress] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeSection, setActive] = useState('')
  const [onDark, setOnDark] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const top = window.scrollY
      const docH = document.documentElement.scrollHeight - window.innerHeight
      setProgress(docH > 0 ? (top / docH) * 100 : 0)
      setScrolled(top > 24)

      const overDark = DARK_SECTIONS.some((id) => {
        const el = document.getElementById(id)
        if (!el) return false
        const box = el.getBoundingClientRect()
        return box.top <= 80 && box.bottom > 0
      })
      setOnDark(overDark)

      const sections = links.map((l) => l.href.replace('#', ''))
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i])
        if (el && el.getBoundingClientRect().top <= 120) {
          setActive(sections[i])
          break
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <>
      <div
        className="fixed top-0 left-0 z-110 h-[2px] bg-linear-to-r from-caramel via-accent to-accent-dark"
        style={{ width: `${progress}%` }}
      />

      <header
        className={`fixed top-0 right-0 left-0 z-100 border-b transition-all duration-400 ${
          scrolled
            ? onDark
              ? 'border-cream/10 bg-espresso/95 backdrop-blur-xl'
              : 'border-caramel/10 bg-milk/96 backdrop-blur-xl shadow-[0_1px_0_rgba(26,15,10,0.04)]'
            : 'border-transparent bg-transparent'
        }`}
      >
        <div className="site-wrap flex h-[76px] items-center justify-between px-[5vw] md:h-[80px]">
          <a href="#hero" className="flex items-center py-1" onClick={() => setMenuOpen(false)}>
            <Image
              src="/logo-tight.png"
              alt="SERVE Cafe Management System"
              width={916}
              height={444}
              className={`h-10 w-auto md:h-12 ${onDark ? 'logo-invert' : ''}`}
              priority
            />
          </a>

          <ul className="m-0 hidden list-none items-center gap-9 p-0 md:flex">
            {links.map((l) => {
              const id = l.href.replace('#', '')
              const active = activeSection === id
              return (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className={`relative font-dm text-[0.9rem] tracking-[0.01em] no-underline transition-colors duration-200 after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:rounded-full after:bg-accent after:transition-all after:duration-300 ${
                      active
                        ? `${onDark ? 'text-cream' : 'text-espresso'} after:w-full`
                        : `${onDark ? 'text-cream/55 hover:text-cream' : 'text-roast hover:text-espresso'} after:w-0 hover:after:w-full`
                    }`}
                  >
                    {l.label}
                  </a>
                </li>
              )
            })}
          </ul>

          <div className="hidden items-center gap-4 md:flex">
            <a
              href="/login?mode=login"
              className={`font-dm text-sm no-underline transition-colors ${
                onDark ? 'text-cream/60 hover:text-cream' : 'text-roast hover:text-espresso'
              }`}
            >
              Login
            </a>
            <a
              href="/login?mode=register"
              className={`rounded-full px-5 py-2.5 font-dm text-sm font-medium no-underline transition-all duration-200 hover:-translate-y-px ${
                onDark
                  ? 'bg-cream text-espresso hover:bg-white'
                  : 'bg-espresso text-cream hover:bg-coffee hover:shadow-[0_6px_20px_rgba(26,15,10,0.2)]'
              }`}
            >
              Get Started
            </a>
          </div>

          <button
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="flex cursor-pointer flex-col gap-1.25 border-none bg-transparent p-2 md:hidden"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className={`block h-0.5 w-6 transition-all duration-300 ${menuOpen ? 'translate-y-[7px] rotate-45 bg-espresso' : onDark ? 'bg-cream' : 'bg-espresso'}`} />
            <span className={`block h-0.5 w-6 transition-all duration-300 ${menuOpen ? 'opacity-0' : onDark ? 'bg-cream' : 'bg-espresso'}`} />
            <span className={`block h-0.5 w-6 transition-all duration-300 ${menuOpen ? '-translate-y-[7px] -rotate-45 bg-espresso' : onDark ? 'bg-cream' : 'bg-espresso'}`} />
          </button>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-99 flex flex-col items-center justify-center gap-8 bg-milk/98 backdrop-blur-xl transition-all duration-500 md:hidden ${
          menuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <Image src="/logo-tight.png" alt="SERVE" width={916} height={444} className="mb-4 h-12 w-auto" />
        {links.map((l, i) => (
          <a
            key={l.href}
            href={l.href}
            onClick={() => setMenuOpen(false)}
            className="font-syne text-3xl font-bold text-espresso no-underline transition-all hover:text-accent"
            style={{
              transitionDelay: menuOpen ? `${i * 60}ms` : '0ms',
              opacity: menuOpen ? 1 : 0,
              transform: menuOpen ? 'translateY(0)' : 'translateY(20px)',
            }}
          >
            {l.label}
          </a>
        ))}
        <a
          href="#contact"
          onClick={() => setMenuOpen(false)}
          className="mt-4 rounded-full bg-espresso px-10 py-3 text-base font-medium text-cream no-underline"
        >
          Book a Demo
        </a>
      </div>
    </>
  )
}
