'use client'

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useEffect, useState } from 'react'
import HeroDiagram from './HeroDiagram'

const ease = [0.22, 1, 0.36, 1]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
}

export default function Hero() {
  const reduce = useReducedMotion()
  const [desktop, setDesktop] = useState(false)
  const { scrollY } = useScroll()

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const sync = () => setDesktop(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  // Desktop: snappier move. Below 1024: longer scroll range so it doesn't finish early.
  const watermarkX = useTransform(
    scrollY,
    desktop ? [0, 520] : [0, 1200],
    [0, reduce ? 0 : desktop ? -420 : -220],
  )
  const watermarkY = useTransform(
    scrollY,
    desktop ? [0, 520] : [0, 1200],
    [0, reduce ? 0 : desktop ? 56 : 40],
  )

  return (
    <section
      id="hero"
      className="relative flex min-h-[100svh] flex-col overflow-hidden pt-[76px] md:pt-[80px]"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="hero-canvas absolute inset-0" />
        <div className="hero-grain absolute inset-0 opacity-[0.28]" />
        <div className="absolute -top-[18%] right-[-6%] h-[65vmin] w-[65vmin] rounded-full bg-accent/[0.09] blur-[90px]" />
        <div className="absolute bottom-[-8%] left-[-10%] h-[45vmin] w-[45vmin] rounded-full bg-espresso/[0.04] blur-[70px]" />

        <motion.div
          className="absolute right-[-6%] -bottom-[4%] select-none will-change-transform font-syne text-[clamp(6rem,28vw,18rem)] font-extrabold leading-none tracking-[-0.06em] text-espresso/[0.04] lg:right-[-2%] lg:bottom-[4%] lg:text-[clamp(8rem,22vw,18rem)]"
          style={reduce ? undefined : { x: watermarkX, y: watermarkY }}
        >
          SERVE
        </motion.div>
      </div>

      <motion.div
        className="site-wrap relative z-10 flex flex-1 flex-col justify-center py-8 md:py-10 lg:py-12"
        variants={container}
        initial={reduce ? false : 'hidden'}
        animate="show"
      >
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] lg:gap-10 xl:gap-14">
          <div>
            <motion.p
              variants={fadeUp}
              className="inline-flex items-center gap-2.5 font-dmono text-[0.72rem] uppercase tracking-[0.2em] text-caramel"
            >
              <span className="hero-dot h-1.5 w-1.5 rounded-full bg-accent" />
              Cafe operating system
            </motion.p>

            <motion.h1
              variants={fadeUp}
              className="mt-6 max-w-[11ch] font-syne text-[clamp(3rem,7vw,5.75rem)] font-extrabold leading-[0.92] tracking-[-0.04em] text-ink"
            >
              <span className="block">Paper out.</span>
              <span className="relative mt-1 inline-block text-accent">
                Order in.
                <span className="hero-underline absolute -bottom-1 left-0 h-[3px] rounded-full bg-accent/50" />
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-7 max-w-[28rem] text-[1.1rem] leading-[1.7] font-light text-muted md:text-[1.15rem]"
            >
              SERVE replaces scribbled KOTs, scattered sheets, and WhatsApp chaos with one clear
              system for billing, orders, staff, and reports.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center gap-3">
              <a
                href="#contact"
                className="inline-flex items-center gap-2.5 rounded-full bg-espresso px-8 py-3.5 text-[0.95rem] font-medium text-cream no-underline transition-transform duration-200 hover:-translate-y-0.5 hover:bg-coffee active:scale-[0.98]"
              >
                Book a Demo
                <svg
                  className="hero-arrow h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
              <a
                href="https://wa.me/9779869028924?text=Hi%2C%20I%20want%20to%20know%20more%20about%20SERVE"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-full px-5 py-3.5 text-[0.95rem] font-medium text-roast no-underline transition-colors duration-200 hover:text-espresso"
              >
                <svg className="h-[18px] w-[18px] fill-[#25D366]" viewBox="0 0 24 24" aria-hidden>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp us
              </a>
            </motion.div>
          </div>

          <motion.div
            variants={fadeUp}
            className="flex w-full items-center justify-center lg:justify-end"
          >
            <HeroDiagram />
          </motion.div>
        </div>

        <motion.div
          variants={fadeUp}
          className="mt-12 flex flex-wrap items-center border-t border-caramel/12 pt-6 md:mt-16 md:pt-7"
        >
          {['NPR 5K setup', 'Live in 1 day', 'Human support 7/7'].map((label, i) => (
            <div key={label} className="flex items-center py-1">
              {i > 0 && (
                <span className="mx-5 hidden h-3 w-px bg-caramel/20 sm:mx-7 sm:block" aria-hidden />
              )}
              <span className="font-dmono text-[0.65rem] uppercase tracking-[0.16em] text-caramel/80">
                {label}
              </span>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
