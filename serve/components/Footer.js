'use client'
import Image from 'next/image'

const links = [
  { label: 'Features',     href: '#features' },
  { label: 'How It Works', href: '#how' },
  { label: 'Pricing',      href: '#pricing' },
  { label: 'Stories',      href: '#stories' },
  { label: 'FAQ',          href: '#faq' },
]

function FooterHeading({ children }) {
  return (
    <h4 className="font-syne text-[0.82rem] font-bold tracking-[0.1em] uppercase mb-5 text-white">
      {children}
      <span
        aria-hidden
        className="mt-2.5 block h-[2px] w-[20%] rounded-full bg-gradient-to-r from-caramel to-transparent"
      />
    </h4>
  )
}

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
          <p className="text-[0.88rem] font-light leading-relaxed max-w-[260px] text-white">
            The cafe management system built by people who actually ran cafes. Simple, powerful, and built to scale with you.
          </p>
        </div>

        {/* Links */}
        <div>
          <FooterHeading>Navigation</FooterHeading>
          <ul className="list-none flex flex-col gap-3">
            {links.map(l => (
              <li key={l.href}>
                <a href={l.href}
                  className="text-[0.88rem] font-light text-white no-underline transition-colors duration-200 hover:text-caramel">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <FooterHeading>Get In Touch</FooterHeading>
          <div className="flex flex-col gap-3">
            {[
              { icon: '📱', val: '+977 9869028924' },
              { icon: '✉️', val: 'serve@technirvana.com.np' },
              { icon: '🕘', val: '9 AM – 6 PM · 7 days' },
            ].map(d => (
              <div key={d.val} className="flex items-center gap-3 text-[0.88rem] font-light text-white">
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
        <p className="text-[0.78rem] font-light text-white">
          © 2026 - SERVE Cafe Management System. All rights reserved. Designed & Developed by{' '}
          <span className="text-caramel font-medium transition-colors duration-200 cursor-default hover:text-accent">
            <a href="https://www.technirvana.com.np"> Tech Nirvana </a>
          </span>
        </p>
      </div>
    </footer>
  )
}
