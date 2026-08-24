import './globals.css';
import { Syne } from 'next/font/google'
import Script from 'next/script'

const GA_ID = 'G-7VY2V54LSP'

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'], // pick what you need
})

export const metadata = {
  // ── Core ──────────────────────────────────────────────
  title: {
    default: 'SERVE – Cafe Management System | Software Built by Cafe Owners',
    template: '%s | SERVE Cafe Management',
  },
  description:
    'SERVE is a cafe management software built for small to mid-scale cafes in Nepal. POS billing, KOT order system, staff management, table management, daily sales reports — starting at NPR 5,000.',
  keywords: [
    'cafe management system Nepal',
    'restaurant POS Nepal',
    'cafe billing software',
    'KOT system Nepal',
    'cafe software Pokhara',
    'cafe software Kathmandu',
    'restaurant management software Nepal',
    'cafe POS Nepal',
    'SERVE cafe management',
    'cafe staff management',
    'table management software',
    'cafe sales report software',
  ],
  authors: [{ name: 'Tech Nirvana', url: 'https://technirvana.com.np' }],
  creator: 'Tech Nirvana',
  publisher: 'SERVE Cafe Management System',

  // ── Canonical & Robots ───────────────────────────────
  metadataBase: new URL('https://servecafe.app'), // ← replace with your real domain
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // ── Open Graph ───────────────────────────────────────
  openGraph: {
    type: 'website',
    locale: 'en_NP',
    url: 'https://servecafe.app',
    siteName: 'SERVE Cafe Management System',
    title: 'SERVE – Cafe Management System | Software Built by Cafe Owners',
    description:
      'Stop running your cafe on paper and chaos. SERVE gives small cafes everything they need — billing, KOT, staff, reports — starting at NPR 5,000.',
    images: [
      {
        url: 'public/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SERVE Cafe Management System – Software Built by Cafe Owners',
        type: 'image/png',
      },
    ],
  },

  // ── Twitter / X Card ─────────────────────────────────
  twitter: {
    card: 'summary_large_image',
    title: 'SERVE – Cafe Management System',
    description:
      'Stop running your cafe on paper and chaos. SERVE gives small cafes everything they need — billing, KOT, staff, reports — starting at NPR 5,000.',
    images: ['/og-image.png'],
    creator: '@technirvana', // ← replace with your Twitter handle or remove
  },

  // ── Favicons ─────────────────────────────────────────
  icons: {
    icon: [
      { url: 'public/favicon.ico', sizes: 'any' },
      { url: 'public/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: 'public/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: 'public/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: 'public/favicon.ico',
  },

  // ── Verification (add when you have these) ───────────
  verification: {
    google: 'REPLACE_WITH_GOOGLE_SEARCH_CONSOLE_TOKEN', // ← from Google Search Console
    // yandex: 'xxx',
    // bing: 'xxx',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" >
      <head>
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', {
              page_path: window.location.pathname,
            });
          `}
        </Script>

        {/* JSON-LD Structured Data */}
        <Script id="structured-data" type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'SERVE Cafe Management System',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            description:
              'SERVE is a cafe management software for small to mid-scale cafes. Includes POS billing, KOT order system, staff management, table management, and business analytics.',
            url: 'https://servecafe.app',
            logo: 'https://servecafe.app/logo.png',
            screenshot: 'https://servecafe.app/og-image.png',
            offers: {
              '@type': 'Offer',
              price: '5000',
              priceCurrency: 'NPR',
              description: 'One-time setup fee including 1 year hosting',
            },
            creator: {
              '@type': 'Organization',
              name: 'Tech Nirvana',
              url: 'https://technirvana.com.np',
            },
            areaServed: {
              '@type': 'Country',
              name: 'Nepal',
            },
            contactPoint: {
              '@type': 'ContactPoint',
              telephone: '+977-9869028924',
              contactType: 'sales',
              availableLanguage: ['English', 'Nepali'],
            },
          })}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  )
}