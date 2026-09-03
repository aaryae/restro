'use client'
'use client'
import Image from 'next/image'
import { useReveal } from './useReveal'

const values = [
  { icon:'🎯', title:'Built for simplicity',  desc:"If your non-tech staff can't figure it out in 10 minutes, it doesn't ship. Every screen is designed for real cafe people." },
  { icon:'🔒', title:'Your data stays yours', desc:"Secure, cloud-hosted, and backed up. Your sales records, customer data, and reports are always safe and accessible." },
  { icon:'⚡', title:'Ready to scale',        desc:"Start with one cafe. Add QR ordering, inventory, or online orders when you're ready — the system grows with you." },
  { icon:'🤝', title:'Real human support',    desc:"Not a helpdesk ticket system. Call us, WhatsApp us, and a real person who knows cafes will help you." },
]

export default function About() {
  const ref = useReveal()

  return (
    <section id="about" ref={ref} className="py-28 px-[5vw] bg-espresso text-cream relative overflow-hidden">

      {/* Watermark logo */}
      <div className="absolute inset-0 flex items-center justify-end pointer-events-none opacity-[0.04] pr-[5vw]">
        <Image src="/logo.png" alt="" width={600} height={260} className="object-contain" />
      </div>

      {/* BG dots */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(245,239,230,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

      <div className="site-wrap relative z-10">
      <div className="grid grid-cols-1 items-center gap-20 md:grid-cols-2">
        <div data-reveal="left">
          <div className="section-label" style={{ color: '#c4763a' }}>About SERVE</div>
          <h2 className="font-syne text-[clamp(2rem,4vw,3.2rem)] font-extrabold tracking-tight leading-[1.08] text-cream mb-5">
            Built by people who<br />actually ran cafes
          </h2>
          <p className="text-[1.05rem] leading-relaxed font-light mb-4 max-w-[440px]"
            style={{ color: 'rgba(245,239,230,0.6)' }}>
            SERVE wasn't designed by a software company that consulted some cafes. It was designed by cafe operators who got frustrated enough to build the tool they needed themselves.
          </p>
          <p className="text-[1.05rem] leading-relaxed font-light max-w-[440px]"
            style={{ color: 'rgba(245,239,230,0.6)' }}>
            Every feature exists because it solves a real, daily problem — not because it looked good on a product roadmap.
          </p>
          <div className="mt-10">
            <a href="#contact"
              className="inline-flex items-center gap-2 px-8 py-[0.88em] rounded-full bg-accent text-white
                text-base font-medium no-underline transition-all duration-300
                hover:bg-accent-dark hover:-translate-y-[2px] hover:shadow-[0_10px_32px_rgba(232,135,58,0.45)]">
              Let's Talk About Your Cafe →
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-4" data-reveal="right" data-delay="2">
          {values.map((v, i) => (
            <div key={v.title}
              className="group flex gap-4 items-start p-5 rounded-xl border transition-all duration-300 cursor-default"
              style={{ background: 'rgba(245,239,230,0.04)', borderColor: 'rgba(245,239,230,0.07)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,239,230,0.09)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(245,239,230,0.04)'}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0
                transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
                style={{ background: 'rgba(196,118,58,0.2)' }}>
                {v.icon}
              </div>
              <div>
                <h4 className="font-syne text-[0.95rem] font-bold text-cream mb-1">{v.title}</h4>
                <p className="text-[0.85rem] font-light leading-relaxed" style={{ color: 'rgba(245,239,230,0.5)' }}>{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </section>
  )
}