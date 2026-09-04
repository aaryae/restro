'use client'
'use client'
import { useReveal } from './useReveal'

const stories = [
  { initials:'SR', name:'Suman Rai',      role:'Owner, The Coffee Nest — Pokhara',    quote:"Before SERVE, we had paper KOTs everywhere and the kitchen kept getting wrong orders. Now everything is digital and our error rate dropped to almost zero." },
  { initials:'PM', name:'Priya Maharjan', role:'Co-owner, Brew & Bite — Patan',       quote:"I used to do end-of-day calculations manually every night. Now SERVE gives me a full daily report in one click. I finally know if I'm actually making money." },
  { initials:'RK', name:'Raju Karki',     role:'Owner, Hillside Cafe — Lalitpur',     quote:"Managing 4 staff members used to be a headache. SERVE's role system means everyone knows their job and I can see everything without hovering all day." },
  { initials:'AS', name:'Anita Shrestha', role:'Owner, Mornings & More — Bhaktapur',  quote:"The table management feature alone was worth it. I can see which tables are occupied from my phone and plan better during rush hours." },
  { initials:'BP', name:'Bikram Pandey',  role:'Owner, Urban Roast — Kathmandu',      quote:"Setup took one afternoon. The team sat with us, configured everything, and trained our staff. It felt like they were part of our team from day one." },
  { initials:'NK', name:'Nisha Khadka',   role:'Owner, Sip & Work — Thamel',          quote:"I now know exactly which items sell the most every week. Redesigned my menu based on SERVE's insights and revenue went up noticeably in the first month." },
]

function Stars() {
  return (
    <div className="flex gap-1 mb-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="w-[14px] h-[14px] bg-accent"
          style={{ clipPath: 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)' }} />
      ))}
    </div>
  )
}

export default function Stories() {
  const ref = useReveal()

  return (
    <section id="stories" ref={ref} className="relative overflow-hidden bg-cream py-28">

      <div className="pointer-events-none absolute top-0 left-0 h-[400px] w-[400px] rounded-full opacity-60"
        style={{ background: 'radial-gradient(circle, rgba(196,118,58,0.07), transparent 70%)', transform: 'translate(-30%,-30%)' }} />

      <div className="site-wrap relative">
      <div data-reveal>
        <div className="section-label">Success Stories</div>
        <h2 className="section-headline">Cafes that made the switch</h2>
        <p className="section-sub">Real stories from real owners who moved from chaos to clarity.</p>
        <div className="section-rule" />
      </div>

      <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stories.map((s, i) => (
          <div key={s.name}
            data-reveal data-delay={`${(i % 3) + 1}`}
            className="site-card group cursor-default p-8">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
              style={{ background: 'linear-gradient(135deg, rgba(232,135,58,0.03), transparent 60%)' }} />
            <Stars />
            <p className="text-[0.95rem] leading-relaxed text-coffee mb-6 italic font-light relative z-10">"{s.quote}"</p>
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-11 h-11 rounded-full bg-espresso flex items-center justify-center
                font-syne text-[0.9rem] font-bold text-cream flex-shrink-0
                transition-transform duration-300 group-hover:scale-110">
                {s.initials}
              </div>
              <div>
                <div className="font-medium text-[0.9rem] text-ink">{s.name}</div>
                <div className="text-[0.8rem] text-muted font-light">{s.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>
    </section>
  )
}