import type { Metadata } from 'next'
import { Bebas_Neue, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'RunTag – Stop Optimizing. Start Moving.',
  description: 'An anti-metric running accountability system. NFC tags, not GPS watches.',
  keywords: ['running', 'accountability', 'NFC', 'habit', 'no metrics', 'chain'],
  openGraph: {
    title: 'RunTag – Stop Optimizing. Start Moving.',
    description: 'An anti-metric running accountability system.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
