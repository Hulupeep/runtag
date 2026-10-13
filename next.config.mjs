/** @type {import('next').NextConfig} */

// Tag stickers point at this origin forever; on-device data is bound to it (APP-001).
const CANONICAL = 'https://runtag.vercel.app'

// Any host except the canonical one and local test servers is redirected (S-7, C1).
const missing = [
  { type: 'host', value: 'runtag\\.vercel\\.app' },
  { type: 'host', value: 'localhost|127\\.0\\.0\\.1' },
]

const nextConfig = {
  async rewrites() {
    // One static client shell serves every app URL (S-3).
    return [
      { source: '/app', destination: '/shell' },
      { source: '/app/:path*', destination: '/shell' },
      { source: '/t/:path*', destination: '/shell' },
    ]
  },
  async redirects() {
    if (process.env.NODE_ENV !== 'production' || process.env.VERCEL_ENV === 'preview') return []
    return [
      { source: '/app', missing, destination: `${CANONICAL}/app`, permanent: true },
      { source: '/app/:path*', missing, destination: `${CANONICAL}/app/:path*`, permanent: true },
      { source: '/t/:path*', missing, destination: `${CANONICAL}/t/:path*`, permanent: true },
    ]
  },
  async headers() {
    // The service worker must always be revalidated so a new build is picked up.
    return [{ source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }] }]
  },
}

export default nextConfig
