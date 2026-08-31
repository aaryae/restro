/** @type {import('next').NextConfig} */
const apiProxy = process.env.API_PROXY_TARGET || 'http://api:8080'

const nextConfig = {
  reactCompiler: true,
  agentRules: false,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiProxy}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
