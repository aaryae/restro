'use client'

import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

const TICKETS = [
  {
    id: 't12',
    table: '12',
    zone: 'Floor A',
    items: ['2× Cappuccino', '1× Croissant'],
    status: 'Preparing',
    tone: 'warm',
    time: '03:40',
  },
  {
    id: 't07',
    table: '07',
    zone: 'Window',
    items: ['Flat white', 'Banana bread'],
    status: 'Ready',
    tone: 'ready',
    time: '01:12',
  },
  {
    id: 't19',
    table: '19',
    zone: 'Patio',
    items: ['Iced latte', 'Cookie'],
    status: 'Queued',
    tone: 'quiet',
    time: '00:48',
  },
]

const toneClass = {
  warm: 'bg-accent/15 text-accent',
  ready: 'bg-[#25D366]/15 text-[#1a9f4a]',
  quiet: 'bg-espresso/8 text-muted',
}

export default function HeroDiagram() {
  const reduce = useReducedMotion()
  const [focus, setFocus] = useState(0)

  useEffect(() => {
    if (reduce) return
    const id = setInterval(() => setFocus((v) => (v + 1) % TICKETS.length), 2600)
    return () => clearInterval(id)
  }, [reduce])

  return (
    <div className="hero-diagram w-full max-w-[520px] lg:max-w-none lg:w-full">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/5 bg-espresso shadow-[0_32px_64px_-24px_rgba(26,15,10,0.55)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(232,135,58,0.12),transparent_55%)]"
        />

        {/* Header */}
        <div className="relative flex items-center justify-between border-b border-white/8 px-5 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              {!reduce && (
                <span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-45" />
              )}
              <span className="relative h-2 w-2 rounded-full bg-accent" />
            </span>
            <div>
              <p className="m-0 font-syne text-[0.95rem] font-bold tracking-tight text-cream">
                The Pass
              </p>
              <p className="m-0 font-dmono text-[0.58rem] uppercase tracking-[0.14em] text-caramel">
                Kitchen · Live
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="m-0 font-dmono text-[0.58rem] uppercase tracking-[0.12em] text-cream/40">
              Open tickets
            </p>
            <p className="m-0 font-syne text-lg font-bold text-cream">0{TICKETS.length}</p>
          </div>
        </div>

        {/* Rail + tickets */}
        <div className="relative px-4 pt-5 pb-2 sm:px-5">
          <div
            aria-hidden
            className="relative mx-1 h-2.5 rounded-full bg-linear-to-b from-[#5c4334] via-[#3d2a1c] to-[#1a0f0a] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
          >
            <div className="absolute inset-x-3 top-[3px] h-px bg-white/10" />
          </div>

          <div className="relative -mt-1 grid grid-cols-3 gap-2.5 sm:gap-3.5">
            {TICKETS.map((ticket, i) => {
              const on = i === focus
              return (
                <motion.button
                  key={ticket.id}
                  type="button"
                  onClick={() => setFocus(i)}
                  className="group relative cursor-pointer border-none bg-transparent p-0 text-left"
                  animate={
                    reduce
                      ? undefined
                      : { y: on ? 6 : 14, rotate: on ? -1.5 : i === 0 ? 1.5 : i === 2 ? -2 : 0.5 }
                  }
                  transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                >
                  <span
                    aria-hidden
                    className="absolute top-0 left-1/2 z-20 h-4 w-3 -translate-x-1/2 -translate-y-[70%] rounded-sm bg-[#3d2a1c] shadow-sm"
                  />

                  <div
                    className={`relative overflow-hidden rounded-md bg-[#faf6f0] px-2.5 pt-4 pb-3 shadow-[0_14px_28px_-14px_rgba(26,15,10,0.45)] transition-shadow duration-300 sm:px-3 sm:pt-5 sm:pb-3.5 ${
                      on ? 'ring-2 ring-accent/40 shadow-[0_18px_36px_-12px_rgba(26,15,10,0.5)]' : ''
                    }`}
                  >
                    <div
                      aria-hidden
                      className="absolute inset-x-0 top-0 h-2 opacity-40"
                      style={{
                        background:
                          'radial-gradient(circle, #c4a882 1.1px, transparent 1.2px) 0 2px / 7px 7px repeat-x',
                      }}
                    />

                    <div className="flex items-baseline justify-between gap-1">
                      <span className="font-syne text-[1.35rem] font-extrabold leading-none tracking-tight text-espresso sm:text-[1.55rem]">
                        {ticket.table}
                      </span>
                      <span className="font-dmono text-[0.55rem] text-muted">{ticket.time}</span>
                    </div>
                    <p className="mt-1 m-0 font-dmono text-[0.52rem] uppercase tracking-[0.1em] text-caramel">
                      {ticket.zone}
                    </p>

                    <ul className="mt-2.5 m-0 list-none space-y-1 p-0">
                      {ticket.items.map((item) => (
                        <li
                          key={item}
                          className="font-dm text-[0.72rem] leading-snug text-espresso/75 sm:text-[0.78rem]"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>

                    <div
                      className={`mt-3 inline-flex rounded-md px-1.5 py-0.5 font-dmono text-[0.52rem] uppercase tracking-[0.08em] ${toneClass[ticket.tone]}`}
                    >
                      {ticket.status}
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="relative mt-4 flex items-center justify-between border-t border-white/8 px-5 py-3 sm:px-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={TICKETS[focus].id}
              initial={reduce ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="m-0 font-dm text-[0.82rem] text-cream/55"
            >
              Table <span className="font-semibold text-cream">{TICKETS[focus].table}</span>
              {' · '}
              {TICKETS[focus].status.toLowerCase()} on the pass
            </motion.p>
          </AnimatePresence>
          <span className="hidden font-dmono text-[0.58rem] uppercase tracking-[0.12em] text-caramel sm:inline">
            SERVE KDS
          </span>
        </div>
      </div>
    </div>
  )
}
