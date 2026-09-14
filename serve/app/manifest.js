export default function manifest() {
  return {
    name: 'SERVE Cafe Management System',
    short_name: 'SERVE',
    description:
      'Cafe management software for billing, KOT orders, staff, tables, and sales reports.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#21160f',
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
