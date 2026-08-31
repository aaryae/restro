export default function robots() {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [],
            },
        ],
        sitemap: 'https://servecafe.app/sitemap.xml', // ← replace with your real domain
        host: 'https://servecafe.app',
    }
}