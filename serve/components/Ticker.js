'use client'
const items = [
  '☕ KOT Order System',
  '📊 Daily Sales Reports',
  '🪑 Table Management',
  '👥 Staff Roles',
  '🍽️ Menu Management',
  '🛒 Expense Tracking',
  '📈 Analytics',
  '👤 Customer Records',
  '🏆 Top-Seller Insights',
  '🔒 Secure & Cloud-hosted',
]

export default function Ticker() {
  const repeated = [...items, ...items]

  return (
    <div id="ticker" className="bg-espresso py-4 overflow-hidden border-y border-caramel/20 select-none">
      <div className="ticker-track flex gap-0 whitespace-nowrap" style={{ width: 'max-content' }}>
        {repeated.map((item, i) => (
          <div key={i} className="inline-flex items-center gap-3 px-8">
            <span className="text-[0.82rem] font-dmono tracking-[0.1em] uppercase text-cream/70">{item}</span>
            <span className="w-1 h-1 rounded-full bg-caramel/50 flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}