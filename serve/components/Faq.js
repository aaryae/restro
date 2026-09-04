'use client'
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

export default function Faq() {
  const [open, setOpen] = useState(null)
  const ref = useReveal()

  return (
    <section id="faq" ref={ref} className="bg-milk py-28">
      <div className="site-wrap">
      <div data-reveal>
        <div className="section-label">FAQ</div>
        <h2 className="section-headline">Questions we get asked</h2>
        <p className="section-sub">Everything you need to know before making the switch.</p>
        <div className="section-rule" />
      </div>

      <div className="mt-16 max-w-[780px] border border-caramel/12 rounded-[24px] overflow-hidden
        shadow-[0_4px_32px_rgba(26,15,10,0.05)] bg-white"
        data-reveal data-delay="2">
        {faqs.map((f, i) => (
          <div key={i} className={i < faqs.length - 1 ? 'border-b border-caramel/08' : ''}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full bg-transparent px-8 py-6 text-left flex justify-between items-center gap-4
                text-[0.98rem] font-medium text-ink transition-colors duration-200 cursor-pointer border-none
                hover:bg-caramel/[0.025]">
              {f.q}
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-lg flex-shrink-0
                font-light transition-all duration-300
                ${open === i
                  ? 'bg-accent text-white rotate-45 shadow-[0_4px_16px_rgba(232,135,58,0.35)]'
                  : 'text-caramel'}`}
                style={{ background: open === i ? undefined : 'rgba(196,118,58,0.12)' }}>
                +
              </span>
            </button>
            <div className={`overflow-hidden transition-all duration-400 ease-in-out
              ${open === i ? 'max-h-[300px]' : 'max-h-0'}`}>
              <div className="px-8 pb-6">
                <p className="text-[0.92rem] text-muted leading-relaxed font-light">{f.a}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>
    </section>
  )
}