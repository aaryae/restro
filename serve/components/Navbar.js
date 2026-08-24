'use client'
'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'

const links = [
  { label: 'Features',     href: '#features' },
  { label: 'How It Works', href: '#how' },
  { label: 'Pricing',      href: '#pricing' },
  { label: 'Stories',      href: '#stories' },
  { label: 'FAQ',          href: '#faq' },
]

export default function Navbar() {
  const [scrolled,  setScrolled]  = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [menuOpen,  setMenuOpen]  = useState(false)
  const [activeSection, setActive] = useState('')

  useEffect(() => {
    const onScroll = () => {
      const top      = window.scrollY
      const docH     = document.documentElement.scrollHeight - window.innerHeight
      setProgress((top / docH) * 100)
      setScrolled(top > 30)

      // active section detection
      const sections = links.map(l => l.href.replace('#', ''))
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i])
        if (el && el.getBoundingClientRect().top <= 120) {
          setActive(sections[i]); break
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {/* Progress bar */}
      <div
        className="fixed top-0 left-0 h-[2.5px] bg-gradient-to-r from-caramel via-accent to-accent-dark z-[110] transition-all duration-100"
        style={{ width: `${progress}%` }}
      />

      <nav className={`fixed top-0 left-0 right-0 h-[72px] z-[100] flex items-center justify-between px-[5vw]
        transition-all duration-500
        ${scrolled
          ? 'bg-milk/95 backdrop-blur-xl border-b border-caramel/10 shadow-[0_2px_32px_rgba(26,15,10,0.09)]'
          : 'bg-transparent'
        }`}>

        {/* Logo */}
        <a href="#hero" className="flex items-center">
          <Image
            src="/logo.png"
            alt="SERVE Cafe Management System"
            width={110}
            height={48}
            className="logo-blend object-contain"
            priority
          />
        </a>

        {/* Desktop links */}
        <ul className="hidden md:flex gap-8 list-none m-0 p-0">
          {links.map(l => {
            const id = l.href.replace('#', '')
            return (
              <li key={l.href}>
                <a href={l.href}
                  className={`text-sm no-underline relative pb-[3px] transition-colors duration-200
                    after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[1.5px]
                    after:bg-accent after:transition-all after:duration-300
                    ${activeSection === id
                      ? 'text-espresso after:right-0'
                      : 'text-roast after:right-full hover:text-espresso hover:after:right-0'
                    }`}>
                  {l.label}
                </a>
              </li>
            )
          })}
        </ul>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a href="/login?mode=login"
            className="text-sm text-roast no-underline hover:text-espresso px-2">
            Login
          </a>
          <a href="/login?mode=register"
            className="inline-flex items-center gap-2 px-5 py-[0.6em] rounded-full bg-espresso text-cream
              text-sm font-medium no-underline transition-all duration-200
              hover:-translate-y-[2px] hover:shadow-[0_8px_28px_rgba(26,15,10,0.28)] hover:bg-coffee
              active:translate-y-0 active:scale-[0.98]">
            Get Started
          </a>
        </div>

        {/* Hamburger */}
        <button
          className="md:hidden flex flex-col gap-[5px] p-2 cursor-pointer bg-transparent border-none"
          onClick={() => setMenuOpen(o => !o)}>
          <span className={`block w-6 h-[2px] bg-espresso transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
          <span className={`block w-6 h-[2px] bg-espresso transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-6 h-[2px] bg-espresso transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
        </button>
      </nav>

      {/* Mobile menu */}
      <div className={`fixed inset-0 z-[99] bg-milk/98 backdrop-blur-xl flex flex-col items-center justify-center gap-8
        transition-all duration-500 md:hidden
        ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <Image src="/logo.png" alt="SERVE" width={130} height={56} className="logo-blend mb-4" />
        {links.map((l, i) => (
          <a key={l.href} href={l.href}
            onClick={() => setMenuOpen(false)}
            className="font-syne text-3xl font-bold text-espresso no-underline transition-all duration-200 hover:text-accent"
            style={{ transitionDelay: menuOpen ? `${i * 60}ms` : '0ms',
              opacity: menuOpen ? 1 : 0,
              transform: menuOpen ? 'translateY(0)' : 'translateY(20px)' }}>
            {l.label}
          </a>
        ))}
        <a href="#contact" onClick={() => setMenuOpen(false)}
          className="mt-4 px-10 py-3 rounded-full bg-espresso text-cream text-base font-medium no-underline">
          Book a Demo
        </a>
      </div>
    </>
  )
}