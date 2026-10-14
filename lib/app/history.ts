// The 14-day history behind the chain (APP-CHAIN). Pure: no DOM, no storage.

import { previousDay } from './chain'
import type { Run } from './store'

export type DayState = 'done' | 'missed' | 'today-pending' | 'neutral'
export type HistoryDay = { day: string; state: DayState }

export const HISTORY_DAYS = 14

/**
 * `today−13 … today`, oldest → newest. Days are enumerated only by `previousDay` (calendar arithmetic),
 * never by subtracting milliseconds, so DST never repeats or skips a day.
 * Precedence: done → today-pending (today only) → neutral (before the first done run, or none) → missed.
 */
export function buildHistory(runs: Run[], today: string): HistoryDay[] {
  const doneDays = new Set(runs.filter((r) => r.status === 'done' && r.localDay <= today).map((r) => r.localDay))
  const first = [...doneDays].sort()[0]
  const days = [today]
  while (days.length < HISTORY_DAYS) days.unshift(previousDay(days[0]))
  return days.map((day) => {
    if (doneDays.has(day)) return { day, state: 'done' }
    if (day === today) return { day, state: 'today-pending' }
    if (first === undefined || day < first) return { day, state: 'neutral' }
    return { day, state: 'missed' }
  })
}

/** At risk: yesterday is done and today has no done run yet. */
export function isAtRisk(history: HistoryDay[]): boolean {
  const [yesterday, today] = history.slice(-2)
  return yesterday?.state === 'done' && today?.state !== 'done'
}

/** Labels from the stored calendar day itself (UTC), so every device zone shows the same date. */
function utcDate(day: string): Date {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export function weekdayShort(day: string): string {
  return part(day, { weekday: 'short' })
}

const STATE_TEXT: Record<DayState, string> = { done: 'Ran', missed: 'Missed', 'today-pending': 'Not yet', neutral: '' }

const part = (day: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(undefined, { ...opts, timeZone: 'UTC' }).format(utcDate(day))

/** Accessible name "{weekday long} {day} {month long}: {state text}" (no state text for neutral days). */
export function dayLabel(h: HistoryDay): string {
  const date = `${part(h.day, { weekday: 'long' })} ${Number(h.day.slice(8))} ${part(h.day, { month: 'long' })}`
  return STATE_TEXT[h.state] ? `${date}: ${STATE_TEXT[h.state]}` : date
}
