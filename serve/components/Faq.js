'use client'
import { useState } from 'react'
import { useReveal } from './useReveal'

const faqs = [
  { q: 'Is SERVE easy to use for non-technical owners?',    a: "Absolutely. SERVE is specifically designed for cafe owners and staff who have zero technical background. The interface is intuitive, with large clear buttons and simple workflows. Most staff get comfortable within their first shift." },
  { q: 'How long does setup take?',                         a: "Typically under one day. Our team comes to your cafe, configures the system with your actual menu, tables, floor plan, and staff roles, then trains your team on-site. By evening, you're live." },
  { q: 'Can I add more features later?',                    a: "Yes. SERVE's add-on system lets you bolt on inventory management, QR table ordering, or an online ordering system whenever you're ready. No need to migrate or start over." },
  { q: "Is my cafe's data secure?",                         a: "Yes. Your data is stored on secure cloud servers, backed up regularly, and only accessible by you and your designated staff accounts. We never share your data with anyone." },
  { q: 'What happens if something breaks or I need help?',  a: "Call or WhatsApp us directly between 9 AM and 6 PM. You'll reach a real person — not a bot — who understands cafe operations. For cafes needing 24/7 coverage, dedicated support is available under a custom agreement." },
  { q: 'Does the NPR 5,000 cover everything I need?',       a: "The one-time setup fee includes the full core system — POS, KOT, billing, table management, staff management, reports, customer tracking, and one year of hosting. Inventory management, QR ordering, and online ordering are optional add-ons available separately." },
  { q: "What's included in the annual maintenance fee?",    a: "The NPR 5,000 per year maintenance fee covers hosting renewal, software maintenance, basic feature updates, and continued business hours support. It keeps your system running, updated, and supported all year." },
]

function Chevron({ open }) {
  return (
    <svg
      className={`h-3.5 w-3.5 transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'rotate-180' : ''}`}
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
    >
      <path d="M2.5 5L7 9.5L11.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Faq() {
  const [open, setOpen] = useState(0)
  const ref = useReveal()

  return (
    <section id="faq" ref={ref} className="relative overflow-hidden bg-milk py-28">
      <div
        className="pointer-events-none absolute -left-24 top-20 h-[420px] w-[420px] rounded-full opacity-70"
        style={{ background: 'radial-gradient(circle, rgba(232,135,58,0.08), transparent 70%)' }}
      />

      <div className="site-wrap relative">
        <div data-reveal>
          <div className="section-label">FAQ</div>
          <h2 className="section-headline">Questions we get asked</h2>
          <p className="section-sub">Everything you need to know before making the switch.</p>
          <div className="section-rule" />
        </div>

        <div className="mt-14 max-w-[780px] flex flex-col gap-3" data-reveal data-delay="2">
          {faqs.map((f, i) => {
            const isOpen = open === i
            return (
              <div
                key={f.q}
                className={`group rounded-2xl border transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]
                  ${isOpen
                    ? 'border-accent/25 bg-white shadow-[0_12px_40px_rgba(26,15,10,0.08)]'
                    : 'border-caramel/10 bg-white/70 hover:border-caramel/25 hover:bg-white hover:shadow-[0_8px_28px_rgba(26,15,10,0.05)]'}`}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full bg-transparent px-5 py-5 sm:px-6 text-left flex items-start gap-4
                    cursor-pointer border-none"
                >
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg
                      font-dmono text-[0.72rem] font-medium tracking-wide transition-all duration-300
                      ${isOpen
                        ? 'bg-accent text-white shadow-[0_4px_14px_rgba(232,135,58,0.35)]'
                        : 'bg-caramel/10 text-caramel group-hover:bg-caramel/15'}`}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  <span className="flex-1 min-w-0 pt-0.5">
                    <span
                      className={`block font-syne text-[0.98rem] font-semibold leading-snug transition-colors duration-300
                        ${isOpen ? 'text-espresso' : 'text-ink group-hover:text-espresso'}`}
                    >
                      {f.q}
                    </span>
                  </span>

                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full
                      transition-all duration-300
                      ${isOpen
                        ? 'bg-accent text-white shadow-[0_4px_16px_rgba(232,135,58,0.35)]'
                        : 'bg-caramel/10 text-caramel group-hover:bg-caramel/18'}`}
                  >
                    <Chevron open={isOpen} />
                  </span>
                </button>

                <div
                  className="grid transition-[grid-template-rows] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden min-h-0">
                    <div
                      className={`px-5 sm:px-6 pb-5 sm:pb-6 pl-[3.75rem] sm:pl-[4.25rem] transition-all duration-400
                        ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}`}
                    >
                      <div className="mb-3 h-px w-10 rounded-full bg-gradient-to-r from-accent to-transparent" />
                      <p className="text-[0.92rem] text-muted leading-relaxed font-light">
                        {f.a}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
