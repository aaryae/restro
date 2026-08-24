'use client'
'use client'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

function useCountUp(target, suffix = '', duration = 2000, start = false) {
  const [val, setVal] = useState('0')
  useEffect(() => {
    if (!start) return
    const isNum = !isNaN(parseInt(target))
    if (!isNum) { setVal(target); return }
    const end = parseInt(target)
    let startTime = null
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setVal(Math.floor(eased * end) + suffix)
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [start, target, suffix, duration])
  return val
}

const stats = [
  { raw: '30', suffix: '+',    label: 'Features built-in',      display: null },
  { raw: '5',  suffix: 'K',    label: 'Setup cost',          display: 'NPR' },
  { raw: '1',  suffix: ' Day', label: 'Setup & onboarding',      display: null },
  { raw: '7 ',  suffix: '/ 7',   label: 'Days support available',  display: null },
]

function StatItem({ raw, suffix, label, display, started }) {
  const val = useCountUp(raw, suffix, 1800, started)
  return (
    <div>
      <div className="font-syne text-[2rem] font-bold text-espresso tracking-tight leading-none">
        {display ? `${display} ${val}` : val}
      </div>
      <div className="text-[0.82rem] text-muted mt-1 font-light">{label}</div>
    </div>
  )
}

const WaIcon = () => (
  <svg className="w-5 h-5 fill-white flex-shrink-0" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

export default function Hero() {
  const statsRef  = useRef(null)
  const parallaxRef = useRef(null)
  const [countersStarted, setCountersStarted] = useState(false)
  const [parallaxY, setParallaxY] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Counter trigger
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setCountersStarted(true); obs.disconnect() }
    }, { threshold: 0.5 })
    if (statsRef.current) obs.observe(statsRef.current)

    // Parallax
    const onScroll = () => {
      setParallaxY(window.scrollY * 0.3)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { obs.disconnect(); window.removeEventListener('scroll', onScroll) }
  }, [])

  return (
    <section id="hero"
      className="min-h-screen flex flex-col justify-center pt-[calc(72px+5vh)] pb-[8vh] px-[5vw] relative overflow-hidden">

      {/* Parallax rings */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ transform: `translateY(${parallaxY * 0.4}px)` }}>
        {[600, 900, 1200].map((size, i) => (
          <div key={i}
            className="absolute rounded-full border border-caramel/10"
            style={{
              width: size, height: size,
              top: -size / 3, right: -size / 3,
              opacity: 1 - i * 0.25,
              animation: `ring-pulse 8s ease-in-out ${i * 2}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Dot grid parallax */}
      <div className="absolute bottom-0 right-0 w-[520px] h-[520px] pointer-events-none"
        style={{
          transform: `translateY(${-parallaxY * 0.15}px)`,
          backgroundImage: 'radial-gradient(circle, rgba(196,118,58,0.22) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          WebkitMaskImage: 'radial-gradient(ellipse at bottom right, black 20%, transparent 70%)',
          maskImage: 'radial-gradient(ellipse at bottom right, black 20%, transparent 70%)',
        }}
      />

      {/* Gradient blob */}
      <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(232,135,58,0.08) 0%, transparent 70%)',
          transform: `translateY(${-parallaxY * 0.1}px)`,
        }}
      />

      <style>{`
        @keyframes ring-pulse {
          0%,100% { transform:scale(1); }
          50% { transform:scale(1.04); }
        }
        @keyframes fade-up {
          from { opacity:0; transform:translateY(28px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes blink {
          0%,100% { opacity:1; } 50% { opacity:0.25; }
        }
        .hero-badge  { animation: fade-up 0.7s 0.05s ease both; }
        .hero-h1     { animation: fade-up 0.7s 0.15s ease both; }
        .hero-desc   { animation: fade-up 0.7s 0.25s ease both; }
        .hero-ctas   { animation: fade-up 0.7s 0.35s ease both; }
        .hero-stats  { animation: fade-up 0.7s 0.45s ease both; }
      `}</style>

      <div className="relative z-10 max-w-[740px]">

        {/* Badge */}
        <div className="hero-badge inline-flex items-center gap-2 bg-caramel/10 border border-caramel/25
          px-4 py-[6px] rounded-full text-[0.82rem] font-medium text-caramel mb-8 tracking-wide">
          <span className="w-[6px] h-[6px] bg-accent rounded-full flex-shrink-0"
            style={{ animation: 'blink 2s ease-in-out infinite' }} />
          Software Built by Cafe Owners
        </div>

        {/* Headline */}
        <h1 className="hero-h1 font-syne text-[clamp(2.8rem,6vw,5rem)] font-extrabold leading-[1.04]
          tracking-[-0.03em] text-ink mb-6">
          Stop running your<br />cafe on{' '}
          <span className="relative inline-block text-accent">
            paper & chaos
            <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 300 6" preserveAspectRatio="none">
              <path d="M0,5 Q75,0 150,5 Q225,10 300,5" stroke="#e8873a" strokeWidth="2.5" fill="none" strokeOpacity="0.4"/>
            </svg>
          </span>
        </h1>

        {/* Desc */}
        <p className="hero-desc text-[1.1rem] text-muted max-w-[540px] leading-relaxed mb-10 font-light">
          SERVE gives small and mid-scale cafes everything they need — billing, orders, staff, reports — all in one system that actually fits your workflow.
        </p>

        {/* CTAs */}
        <div className="hero-ctas flex gap-4 flex-wrap">
          <a href="#contact"
            className="magnetic inline-flex items-center gap-2 px-8 py-[0.88em] rounded-full
              bg-espresso text-cream text-base font-medium no-underline transition-all duration-200
              hover:-translate-y-[2px] hover:shadow-[0_10px_32px_rgba(26,15,10,0.3)] hover:bg-coffee
              active:scale-[0.97]">
            Book a Demo
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
          <a href="https://wa.me/9779869028924?text=Hi%2C%20I%20want%20to%20know%20more%20about%20SERVE"
            target="_blank"
            className="inline-flex items-center gap-2 px-8 py-[0.88em] rounded-full
              bg-[#25D366] text-white text-base font-medium no-underline transition-all duration-200
              hover:-translate-y-[2px] hover:bg-[#1fba59] hover:shadow-[0_10px_32px_rgba(37,211,102,0.4)]
              active:scale-[0.97]">
            <WaIcon />
            Chat on WhatsApp
          </a>
        </div>

        {/* Stats with counters */}
        <div ref={statsRef} className="hero-stats flex gap-10 flex-wrap mt-20 pt-8
          border-t border-caramel/15">
          {stats.map((s, i) => (
            <StatItem key={i} {...s} started={countersStarted} />
          ))}
        </div>
      </div>
    </section>
  )
}