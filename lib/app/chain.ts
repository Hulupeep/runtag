// Pure RunTag logic: local days, the chain, and ids. No DOM, no storage.

import type { Run } from './store'

const pad = (n: number) => String(n).padStart(2, '0')

/** The ONLY source of `localDay` and "today": YYYY-MM-DD in the device zone (or a given offset). */
export function localDayOf(epochMs: number, tzOffsetMin?: number): string {
  if (tzOffsetMin === undefined) {
    const d = new Date(epochMs)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }
  const d = new Date(epochMs + tzOffsetMin * 60_000)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

/** Minutes east of UTC for the device zone at `epochMs`. */
export function tzOffsetOf(epochMs: number): number {
  return -new Date(epochMs).getTimezoneOffset()
}

/** Calendar day before `day` (YYYY-MM-DD), computed in UTC so DST never shifts it. */
export function previousDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number)
  const t = Date.UTC(y, m - 1, d) - 86_400_000
  return localDayOf(t, 0)
}

/** APP-007: consecutive days with a done run, ending today, or yesterday if today has none. */
export function computeChain(runs: Run[], todayLocalDay: string): number {
  const days = new Set(runs.filter((r) => r.status === 'done').map((r) => r.localDay))
  let day = days.has(todayLocalDay) ? todayLocalDay : previousDay(todayLocalDay)
  let chain = 0
  while (days.has(day)) {
    chain++
    day = previousDay(day)
  }
  return chain
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

/** `^[a-z0-9]{10}$` from crypto.getRandomValues, rejection-sampled to avoid modulo bias. */
export function newTagId(): string {
  let id = ''
  const buf = new Uint8Array(16)
  while (id.length < 10) {
    crypto.getRandomValues(buf)
    for (const b of buf) {
      if (b < 252 && id.length < 10) id += ALPHABET[b % 36]
    }
  }
  return id
}

export function newRunId(): string {
  return crypto.randomUUID()
}
