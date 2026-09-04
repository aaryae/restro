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
    <section id="features" ref={ref} className="bg-milk py-28">
      <div className="site-wrap">
      <div data-reveal>
        <div className="section-label">Features</div>
        <h2 className="section-headline">Everything your cafe needs,<br />nothing it doesn't</h2>
        <p className="section-sub">Designed from scratch for real cafe operations — not adapted from a generic POS system.</p>
        <div className="section-rule" />
      </div>

      <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <div key={f.title}
            data-reveal data-delay={`${(i % 3) + 1}`}
            className="site-card group cursor-default p-8">

            <div className="absolute inset-0 opacity-0 transition-opacity duration-400 pointer-events-none group-hover:opacity-100"
              style={{ background: 'radial-gradient(circle at 20% 20%, rgba(232,135,58,0.05), transparent 60%)' }} />

            <div className="relative z-10 mb-5 flex h-12 w-12 items-center justify-center rounded-xl text-[1.4rem] transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
              style={{ background: 'rgba(232,135,58,0.1)' }}>
              {f.icon}
            </div>
            <h3 className="relative z-10 mb-2 font-syne text-base font-bold text-ink transition-colors duration-300 group-hover:text-accent">{f.title}</h3>
            <p className="relative z-10 text-[0.88rem] leading-relaxed font-light text-muted">{f.desc}</p>
          </div>
        ))}
      </div>
      </div>
    </section>
  )
}