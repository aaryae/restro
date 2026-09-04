'use client'
import Image from 'next/image'

const links = [
  { label: 'Features',     href: '#features' },
  { label: 'How It Works', href: '#how' },
  { label: 'Pricing',      href: '#pricing' },
  { label: 'Stories',      href: '#stories' },
  { label: 'FAQ',          href: '#faq' },
  { label: 'Contact',      href: '#contact' },
]

export default function Footer() {
  return (
    <footer id="site-footer" className="bg-ink text-cream">

      {/* Main footer */}
      <div className="site-wrap py-16 grid grid-cols-1 md:grid-cols-3 gap-12 border-b border-white/5">

        {/* Brand */}
        <div>
          <Image
            src="/logo.png"
            alt="SERVE Cafe Management System"
            width={120}
            height={52}
            className="logo-invert object-contain mb-4"
          />
          <p className="text-[0.88rem] font-light leading-relaxed max-w-[260px]"
            style={{ color: 'rgba(245,239,230,0.45)' }}>
            The cafe management system built by people who actually ran cafes. Simple, powerful, and built to scale with you.
          </p>
        </div>

        {/* Links */}
        <div>
          <h4 className="font-syne text-[0.82rem] font-bold tracking-[0.1em] uppercase mb-5"
            style={{ color: 'rgba(245,239,230,0.35)' }}>Navigation</h4>
          <ul className="list-none flex flex-col gap-3">
            {links.map(l => (
              <li key={l.href}>
                <a href={l.href}
                  className="text-[0.88rem] font-light no-underline transition-colors duration-200"
                  style={{ color: 'rgba(245,239,230,0.5)' }}
                  onMouseEnter={e => e.target.style.color = '#e8873a'}
                  onMouseLeave={e => e.target.style.color = 'rgba(245,239,230,0.5)'}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-syne text-[0.82rem] font-bold tracking-[0.1em] uppercase mb-5"
            style={{ color: 'rgba(245,239,230,0.35)' }}>Get In Touch</h4>
          <div className="flex flex-col gap-3">
            {[
              { icon: '📱', val: '+977 9869028924' },
              { icon: '✉️', val: 'serve@technirvana.com.np' },
              { icon: '🕘', val: '9 AM – 6 PM · 7 days' },
            ].map(d => (
              <div key={d.val} className="flex items-center gap-3 text-[0.88rem] font-light"
                style={{ color: 'rgba(245,239,230,0.5)' }}>
                <span>{d.icon}</span> {d.val}
              </div>
            ))}
            <a href="https://wa.me/9779869028924" target="_blank"
              className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-full bg-[#25D366]/15
                text-[#25D366] text-[0.82rem] font-medium no-underline border border-[#25D366]/20
                transition-all duration-200 hover:bg-[#25D366]/25 w-fit">
              💬 WhatsApp Us
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="site-wrap py-5 flex flex-wrap items-center justify-between gap-4">
        <p className="text-[0.78rem] font-light" style={{ color: 'rgba(245,239,230,0.3)' }}>
          © 2026 - SERVE Cafe Management System. All rights reserved. Designed & Developed by{' '}
          <span className="text-caramel font-medium transition-colors duration-200 cursor-default hover:text-accent">
            <a href="https://www.technirvana.com.np"> Tech Nirvana </a>
          </span>
        </p>
        <p className="text-[0.78rem] font-light" style={{ color: 'rgba(245,239,230,0.3)' }}>
          
        </p>
      </div>
    </footer>
  )
}