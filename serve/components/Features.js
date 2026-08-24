'use client'
'use client'
import { useReveal } from './useReveal'

const features = [
  { icon: '🎫', title: 'KOT-Based Order System',         desc: 'Kitchen Order Tickets sent department-wise — kitchen, bar, bakery — for zero-confusion service and faster fulfillment.' },
  { icon: '👥', title: 'Staff Role Management',           desc: 'Assign roles, set permissions, and track staff activity. Full accountability with no extra overhead.' },
  { icon: '📅', title: 'Daily Sales Reports',             desc: 'Automated daily summaries with total sales, discounts, voids, and shift comparisons on your screen.' },
  { icon: '🪑', title: 'Table-wise Reporting',            desc: 'Know which tables earn the most, average spend per cover, and peak seating times — all automatic.' },
  { icon: '🗺️', title: 'Floor & Table Management',       desc: 'Visual floor plan with live table status — reserved, occupied, or available — at a glance.' },
  { icon: '🍽️', title: 'Menu Management',                desc: 'Add, edit, categorize, and toggle items live. Perfect for daily specials or sold-out items.' },
  { icon: '🛒', title: 'Purchase & Expense Tracking',     desc: 'Log all purchases and operational expenses. Know exactly where your money goes every day.' },
  { icon: '👤', title: 'Customer Records',                desc: 'Build a database with visit history, preferences, and order data for loyalty and better service.' },
  { icon: '🏆', title: 'Top-Selling Insights',           desc: 'See your best-performing items by period, category, or revenue. Optimize your menu with real data.' },
  { icon: '📉', title: 'Business Analytics',              desc: 'Revenue trends, growth comparisons, profit margins — a real dashboard that tells you how you\'re really doing.' },
]

export default function Features() {
  const ref = useReveal(0.08)

  return (
    <section id="features" ref={ref} className="py-28 px-[5vw] bg-milk">
      <div data-reveal>
        <div className="section-label">Features</div>
        <h2 className="section-headline">Everything your cafe needs,<br />nothing it doesn't</h2>
        <p className="section-sub">Designed from scratch for real cafe operations — not adapted from a generic POS system.</p>
        <div className="w-16 h-[3px] bg-accent rounded-sm mt-4" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-16">
        {features.map((f, i) => (
          <div key={f.title}
            data-reveal data-delay={`${(i % 3) + 1}`}
            className="group bg-white border border-caramel/10 rounded-[20px] p-8
              transition-all duration-400 cursor-default relative overflow-hidden
              hover:-translate-y-[5px] hover:shadow-[0_16px_48px_rgba(26,15,10,0.10)]
              hover:border-caramel/30">

            {/* Hover gradient */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
              style={{ background: 'radial-gradient(circle at 20% 20%, rgba(232,135,58,0.05), transparent 60%)' }} />

            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[1.4rem] mb-5 relative z-10
              transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
              style={{ background: 'rgba(232,135,58,0.1)' }}>
              {f.icon}
            </div>
            <h3 className="font-syne text-base font-bold text-ink mb-2 relative z-10
              group-hover:text-accent transition-colors duration-300">{f.title}</h3>
            <p className="text-[0.88rem] text-muted leading-relaxed font-light relative z-10">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}