'use client'
'use client'
import Link from 'next/link'
import { useReveal } from './useReveal'

const included = [
  'Full system setup & configuration',
  'POS + billing + KOT system',
  'Table & floor management',
  'Staff role management',
  'Complete menu system',
  'Reports & analytics dashboard',
  'Customer tracking',
  'Purchase & expense tracking',
  '1 year hosting included',
  'Staff onboarding & training',
]
const maintenance = ['Hosting renewal','Software maintenance','Basic feature updates','Business hours support']
const addons      = ['Inventory management system','QR-based table ordering','Online ordering system','Dedicated support (custom agreement)']

function Check({ dark }) {
  return (
    <span className={`inline-flex items-center justify-center w-[18px] h-[18px] rounded-full text-[0.6rem] font-bold flex-shrink-0 mt-[2px]
      ${dark ? 'bg-caramel/20 text-caramel' : 'bg-green-100 text-green-800'}`}>✓</span>
  )
}

export default function Pricing() {
  const ref = useReveal()

  return (
    <section id="pricing" ref={ref} className="relative overflow-hidden bg-milk px-[5vw] py-28">

      <div className="pointer-events-none absolute top-0 right-0 h-[600px] w-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(232,135,58,0.05) 0%, transparent 65%)', transform: 'translate(30%,-30%)' }} />

      <div className="site-wrap relative">
      <div data-reveal>
        <div className="section-label">Pricing</div>
        <h2 className="section-headline">Simple, transparent pricing</h2>
        <p className="section-sub">No hidden fees. No surprise subscriptions. One honest cost to get your cafe running properly.</p>
        <div className="section-rule" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">

        {/* Featured */}
        <div data-reveal="left"
          className="bg-espresso rounded-[32px] p-10 relative overflow-hidden group">
          <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full transition-transform duration-700 group-hover:scale-125"
            style={{ background: 'rgba(196,118,58,0.1)' }} />
          <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full opacity-50"
            style={{ background: 'rgba(196,118,58,0.06)' }} />

          <span className="relative z-10 inline-block bg-caramel/20 text-caramel font-dmono text-[0.72rem] tracking-[0.08em] uppercase px-3 py-1 rounded-full mb-5">One-Time Setup</span>
          <div className="relative z-10 font-syne text-[2.8rem] font-extrabold tracking-[-0.04em] text-cream leading-none mb-1">NPR 5,000</div>
          <div className="relative z-10 text-[0.82rem] font-light mb-8" style={{ color: 'rgba(245,239,230,0.5)' }}>+ VAT &nbsp;|&nbsp; Includes 1 year hosting</div>

          <ul className="relative z-10 flex flex-col gap-3 mb-8 list-none">
            {included.map(item => (
              <li key={item} className="flex items-start gap-3 text-[0.92rem] leading-snug font-light text-cream/80">
                <Check dark /> {item}
              </li>
            ))}
          </ul>

          <Link href="/login?mode=register"
            className="relative z-10 flex items-center justify-center w-full py-[0.88em] rounded-full bg-accent text-white
              text-base font-medium no-underline transition-all duration-300
              hover:bg-accent-dark hover:-translate-y-[2px] hover:shadow-[0_10px_32px_rgba(232,135,58,0.45)]
              active:scale-[0.98]">
            Get Started →
          </Link>
        </div>
    

        {/* Right column */}
        <div className="flex flex-col gap-6">
          <div data-reveal="right" data-delay="2"
            className="bg-white border border-caramel/12 rounded-[24px] p-8 hover:border-caramel/25
              hover:shadow-[0_8px_32px_rgba(26,15,10,0.07)] transition-all duration-300">
            <span className="inline-block bg-caramel/10 text-caramel font-dmono text-[0.72rem] tracking-[0.08em] uppercase px-3 py-1 rounded-full mb-5">Annual Maintenance</span>
            <div className="font-syne text-[2.4rem] font-extrabold tracking-[-0.04em] text-ink leading-none mb-1">NPR 5,000</div>
            <div className="text-[0.82rem] text-muted font-light mb-6">+ VAT per year</div>
            <ul className="flex flex-col gap-3 list-none">
              {maintenance.map(item => (
                <li key={item} className="flex items-start gap-3 text-[0.92rem] font-light text-coffee">
                  <Check /> {item}
                </li>
              ))}
            </ul>
          </div>

          <div data-reveal="right" data-delay="3"
            className="border border-dashed border-caramel/25 rounded-[20px] p-6 transition-all duration-300
              hover:border-caramel/40"
            style={{ background: 'rgba(196,118,58,0.04)' }}>
            <h4 className="font-dmono text-[0.78rem] tracking-[0.08em] uppercase text-caramel mb-3">Available Add-ons</h4>
            <ul className="list-none flex flex-col gap-2">
              {addons.map(a => (
                <li key={a} className="text-[0.88rem] text-muted font-light pl-4 relative
                  before:content-['+'] before:absolute before:left-0 before:text-caramel before:font-medium">{a}</li>
              ))}
            </ul>
          </div>

          <div data-reveal="right" data-delay="4"
            className="grid grid-cols-1 sm:grid-cols-2 gap-5 bg-steam rounded-[20px] p-7">
            <div>
              <div className="text-xl mb-2">🕘</div>
              <h4 className="font-syne text-[0.95rem] font-bold text-ink mb-1">Business Hours Support</h4>
              <p className="text-[0.82rem] text-muted font-light leading-relaxed">9 AM – 6 PM, call, WhatsApp, or email.</p>
            </div>
            <div>
              <div className="text-xl mb-2">🤝</div>
              <h4 className="font-syne text-[0.95rem] font-bold text-ink mb-1">Dedicated Support</h4>
              <p className="text-[0.82rem] text-muted font-light leading-relaxed">Priority SLAs under a custom agreement.</p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </section>
  )
}