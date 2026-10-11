'use client'

import { shellNavigate } from '@/lib/app/nav'

const LINKS = [
  { href: '/app', label: 'Chain', testId: 'nav-chain' },
  { href: '/app/tags', label: 'Tags', testId: 'nav-tags' },
  { href: '/app/settings', label: 'Settings', testId: 'nav-settings' },
]

export function AppNav() {
  return (
    <nav aria-label="RunTag" className="app-nav">
      {LINKS.map((l) => (
        <a
          key={l.href}
          href={l.href}
          data-testid={l.testId}
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
