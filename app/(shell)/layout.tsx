import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'RunTag',
  manifest: '/manifest.webmanifest',
}

export const viewport: Viewport = { themeColor: '#0a0a0a' }

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return children
}
