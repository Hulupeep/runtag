// Storage-silo guard (APP-013, S-12): contexts whose storage is not where tag taps will land.

import { useState } from 'react'

export type Silo = 'standalone' | 'in-app' | null
type Nav = { standalone?: boolean; userAgent: string }

/** The closed list: iOS Home Screen app, and these in-app browsers. Private mode is not detectable. */
const IN_APP_TOKENS = ['Instagram', 'FBAN', 'FBAV', 'Line/', 'musical_ly', 'BytedanceWebview']

export function detectSilo(nav: Nav): Silo {
  if (nav.standalone === true) return 'standalone'
  return IN_APP_TOKENS.some((t) => nav.userAgent.includes(t)) ? 'in-app' : null
}

/** blocked: never plant here; confirm: plant only after a second confirmation; ok: plant. */
export function guardPlant(nav: Nav): 'blocked' | 'confirm' | 'ok' {
  const silo = detectSilo(nav)
  return silo === 'standalone' ? 'blocked' : silo === 'in-app' ? 'confirm' : 'ok'
}

/** The views render client-side only (the shell's server snapshot is empty), so navigator exists here. */
export function useSilo(): Silo {
  const [silo] = useState<Silo>(() => (typeof navigator === 'undefined' ? null : detectSilo(navigator as Navigator & Nav)))
  return silo
}
