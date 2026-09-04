'use client'
'use client'
import { useReveal } from './useReveal'

const problems = [
  { icon: '📋', title: 'Paper-based orders',      desc: "KOTs get lost, kitchen misreads handwriting, orders are forgotten. Every mistake costs trust and revenue." },
  { icon: '😵', title: 'Staff confusion',          desc: "No clear roles, no accountability. Staff don't know what's been ordered, served, or who's responsible." },
  { icon: '📊', title: 'Zero sales visibility',    desc: "End of day, you're guessing. No real-time reports, no top-seller data, no clear picture of your business." },
  { icon: '📁', title: 'Unstructured reporting',   desc: "Expenses in notebooks, income in Excel, records in WhatsApp. Chaos at tax time every single month." },
  { icon: '📈', title: 'Scaling feels impossible', desc: "You want to grow — but you can't get a handle on the one cafe you have right now." },
]

export default function Problem() {
  const ref = useReveal()

  return (
    <section id="problem" ref={ref} className="relative overflow-hidden bg-espresso py-28 text-cream">

      <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(245,239,230,1) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="site-wrap relative z-10">
      <div className="grid grid-cols-1 items-start gap-16 md:grid-cols-2">
        <div data-reveal="left">
          <div className="section-label" style={{ color: '#c4763a' }}>The Problem</div>
          <h2 className="mb-4 font-syne text-[clamp(2rem,4vw,3.2rem)] font-extrabold leading-[1.08] tracking-tight text-cream">
            Running a cafe without a system is brutal
          </h2>
          <div className="section-rule" />
        </div>
        <div data-reveal="right" data-delay="2">
          <p className="mt-6 max-w-[480px] text-[1.05rem] leading-relaxed font-light"
            style={{ color: 'rgba(245,239,230,0.6)' }}>
            Most cafe owners are expert at coffee — not spreadsheets, manual KOTs, WhatsApp orders, and guessing month-end numbers. SERVE was built because we lived this chaos.
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-14 grid grid-cols-1 overflow-hidden rounded-3xl sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        style={{ gap: '1.5px', background: 'rgba(245,239,230,0.06)' }}>
        {problems.map((p, i) => (
          <div key={p.title}
            data-reveal data-delay={`${i + 1}`}
            className="group bg-espresso p-8 xl:p-10 transition-all duration-500 cursor-default hover:bg-coffee">
            <div className="w-11 h-11 rounded-[10px] flex items-center justify-center text-xl mb-5
              transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
              style={{ background: 'rgba(196,118,58,0.15)' }}>
              {p.icon}
            </div>
            <h3 className="font-syne text-[1rem] font-bold text-cream mb-2 group-hover:text-caramel transition-colors duration-300">{p.title}</h3>
            <p className="text-[0.88rem] leading-relaxed font-light transition-colors duration-300"
              style={{ color: 'rgba(245,239,230,0.5)' }}>{p.desc}</p>
          </div>
        ))}
      </div>
      </div>
    </section>
  )
}