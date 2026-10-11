'use client'

import { shellNavigate } from '@/lib/app/nav'

const LINKS = [
  { href: '/app', label: 'Chain' },
  { href: '/app/tags', label: 'Tags' },
  { href: '/app/settings', label: 'Settings' },
]

export function AppNav() {
  return (
    <nav aria-label="RunTag" className="app-nav">
      {LINKS.map((l) => (
        <a
          key={l.href}
          href={l.href}
          data-testid={`nav-${l.label.toLowerCase()}`}
          onClick={(e) => {
            e.preventDefault()
            shellNavigate(l.href)
          }}
        >
          {l.label}
        </a>
      ))}
    </nav>
  )
}
