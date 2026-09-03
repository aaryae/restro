'use client'

import { useEffect, useRef, useState } from 'react'

const ORBS = [
  { label: 'Billing', x: '50%', y: '0%' },
  { label: 'Orders', x: '100%', y: '50%' },
  { label: 'Staff', x: '50%', y: '100%' },
  { label: 'Reports', x: '0%', y: '50%' },
]

function HeroOrbs() {
  return (
    <aside aria-label="SERVE covers billing, orders, staff and reports" className="hero-orbs hero-orbs-in mx-auto">
      <div className="hero-orbs-ring" />
      <div className="hero-orbs-core">
        <span className="font-dmono text-[0.58rem] uppercase tracking-[0.16em] text-cream/80">Serve</span>
        <span className="mt-0.5 font-syne text-[0.82rem] font-bold leading-tight text-cream">One system</span>
      </div>
      {ORBS.map((orb) => (
        <div
          key={orb.label}
          className="hero-orbs-node"
          style={{ left: orb.x, top: orb.y }}
        >
          <span className="font-dm text-[0.72rem] font-medium text-espresso">{orb.label}</span>
        </div>
      ))}
    </aside>
  )
}

function useCountUp(target, suffix = '', duration = 2000, start = false) {
  const [val, setVal] = useState('0')
  useEffect(() => {
    if (!start) return
    const isNum = !Number.isNaN(parseInt(target, 10))
    if (!isNum) { setVal(target); return }
    const end = parseInt(target, 10)
    let startTime = null
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - (1 - progress) ** 3
      setVal(Math.floor(eased * end) + suffix)
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [start, target, suffix, duration])
  return val
}

const stats = [
  { raw: '30', suffix: '+', label: 'Features built-in', display: null },
  { raw: '5', suffix: 'K', label: 'Setup cost', display: 'NPR' },
  { raw: '1', suffix: ' Day', label: 'Setup & onboarding', display: null },
  { raw: '7 ', suffix: '/ 7', label: 'Days support available', display: null },
]

function StatItem({ raw, suffix, label, display, started }) {
  const val = useCountUp(raw, suffix, 1800, started)
  return (
    <div>
      <div className="font-syne text-[clamp(1.75rem,2.5vw,2rem)] font-bold leading-none tracking-tight text-espresso">
        {display ? `${display} ${val}` : val}
      </div>
      <div className="mt-1.5 text-[0.82rem] font-light text-muted">{label}</div>
    </div>
  )
}

function WaIcon() {
  return (
    <svg className="h-5 w-5 shrink-0 fill-white" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function HeroPanel() {
  return <HeroOrbs />
}

export default function Hero() {
  const statsRef = useRef(null)
  const [countersStarted, setCountersStarted] = useState(false)
  const [parallaxY, setParallaxY] = useState(0)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setCountersStarted(true); obs.disconnect() }
    }, { threshold: 0.5 })
    if (statsRef.current) obs.observe(statsRef.current)

    const onScroll = () => setParallaxY(window.scrollY * 0.3)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { obs.disconnect(); window.removeEventListener('scroll', onScroll) }
  }, [])

  return (
    <section
      id="hero"
      className="relative flex min-h-screen flex-col justify-center overflow-hidden px-[5vw] pt-[calc(80px+5vh)] pb-[8vh]"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="hero-canvas absolute inset-0" />

        <div className="absolute inset-0" style={{ transform: `translateY(${parallaxY * 0.35}px)` }}>
          {[560, 820, 1080].map((size, i) => (
            <div
              key={size}
              className="hero-ring-pulse absolute rounded-full border border-caramel/10"
              style={{
                width: size,
                height: size,
                top: -size / 3.2,
                right: -size / 3.5,
                opacity: 1 - i * 0.22,
                animationDelay: `${i * 2}s`,
              }}
            />
          ))}
        </div>

        <div
          className="hero-dot-field absolute right-0 bottom-0 h-[min(55vh,560px)] w-[min(55vw,560px)]"
          style={{ transform: `translateY(${-parallaxY * 0.12}px)` }}
        />
      </div>

      <div className="site-wrap relative z-10 w-full">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.85fr)] lg:gap-12 xl:gap-16">
          <div className="max-w-[720px]">
            <div className="hero-badge inline-flex items-center gap-2 rounded-full border border-caramel/25 bg-white/60 px-4 py-1.5 text-[0.82rem] font-medium tracking-wide text-caramel backdrop-blur-sm">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent animate-hero-blink" />
              Software Built by Cafe Owners
            </div>

            <h1 className="hero-h1 mt-8 font-syne text-[clamp(2.6rem,5vw,4.6rem)] font-extrabold leading-[1.04] tracking-[-0.03em] text-ink">
              Stop running your
              <br />
              cafe on{' '}
              <span className="relative inline-block text-accent">
                paper &amp; chaos
                <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 300 6" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M0,5 Q75,0 150,5 Q225,10 300,5" stroke="#e8873a" strokeWidth="2.5" fill="none" strokeOpacity="0.4" />
                </svg>
              </span>
            </h1>

            <p className="hero-desc mt-6 max-w-[540px] text-[1.08rem] leading-relaxed font-light text-muted">
              SERVE gives small and mid-scale cafes everything they need — billing, orders, staff, reports — all in one system that actually fits your workflow.
            </p>

            <div className="hero-ctas mt-10 flex flex-wrap gap-4">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 rounded-full bg-espresso px-8 py-3.5 text-base font-medium text-cream no-underline transition-all duration-200 hover:-translate-y-0.5 hover:bg-coffee hover:shadow-[0_10px_32px_rgba(26,15,10,0.3)] active:scale-[0.97]"
              >
                Book a Demo
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
              <a
                href="https://wa.me/9779869028924?text=Hi%2C%20I%20want%20to%20know%20more%20about%20SERVE"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-8 py-3.5 text-base font-medium text-white no-underline transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1fba59] hover:shadow-[0_10px_32px_rgba(37,211,102,0.4)] active:scale-[0.97]"
              >
                <WaIcon />
                Chat on WhatsApp
              </a>
            </div>
          </div>

          <div className="hidden lg:flex lg:items-center lg:justify-center">
            <HeroPanel />
          </div>
        </div>

        <div
          ref={statsRef}
          className="hero-stats mt-14 grid grid-cols-2 gap-x-8 gap-y-8 border-t border-caramel/15 pt-8 sm:grid-cols-4 lg:mt-16 lg:gap-x-12"
        >
          {stats.map((s) => (
            <StatItem key={s.label} {...s} started={countersStarted} />
          ))}
        </div>
      </div>
    </section>
  )
}
