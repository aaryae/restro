'use client'
'use client'
import { useReveal } from './useReveal'

const steps = [
  { num: '01', title: 'System Setup',          desc: 'We configure your cafe profile — floors, tables, menu, staff roles — exactly how your cafe operates. No generic templates.' },
  { num: '02', title: 'Staff Onboarding',      desc: 'A short hands-on training session gets your whole team confident using SERVE. No tech background needed.' },
  { num: '03', title: 'Start Billing & Orders',desc: 'Go live immediately. Take orders, send KOTs, generate bills — the whole system works from day one.' },
  { num: '04', title: 'Track & Grow',          desc: 'Access reports, monitor performance, make smarter decisions. Your cafe now runs on data, not guesswork.' },
]

export default function HowItWorks() {
  const ref = useReveal()

  return (
    <section id="how" ref={ref} className="relative overflow-hidden bg-cream py-28">

      <div className="pointer-events-none absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full border border-caramel/8" />
      <div className="pointer-events-none absolute -bottom-48 -left-48 h-[700px] w-[700px] rounded-full border border-caramel/5" />

      <div className="site-wrap relative">
      <div data-reveal>
        <div className="section-label">How It Works</div>
        <h2 className="section-headline">Up and running in<br />less than a day</h2>
        <p className="section-sub">We handle the entire setup so you can focus on what you do best — running your cafe.</p>
        <div className="section-rule" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-16 relative">

        {/* Connector line desktop */}
        <div className="hidden lg:block absolute top-9 left-[calc(1/8*100%)] right-[calc(1/8*100%)] h-px"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(196,118,58,0.3),rgba(196,118,58,0.3),transparent)' }} />

        {steps.map((s, i) => (
          <div key={s.num}
            data-reveal data-delay={`${i + 1}`}
            className="group flex flex-col items-start gap-5 relative z-10">

            <div className="w-[72px] h-[72px] rounded-full bg-espresso text-cream
              font-syne text-[1.4rem] font-extrabold flex items-center justify-center flex-shrink-0
              transition-all duration-400 group-hover:bg-accent group-hover:scale-110
              group-hover:shadow-[0_8px_32px_rgba(232,135,58,0.4)] cursor-default">
              {s.num}
            </div>

            {/* Step line mobile */}
            {i < steps.length - 1 && (
              <div className="lg:hidden w-[1px] h-8 bg-caramel/20 ml-9" />
            )}

            <div>
              <h3 className="font-syne text-[1.05rem] font-bold text-ink mb-2
                group-hover:text-accent transition-colors duration-300">{s.title}</h3>
              <p className="text-[0.9rem] text-muted leading-relaxed font-light">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
      </div>
    </section>
  )
}