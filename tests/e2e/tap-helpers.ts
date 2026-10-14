import { expect, type Page } from '@playwright/test'
import type { Run, Tag } from '../../lib/app/store'

// Shared harness for the APP-TAP journeys (#27). Every assertion re-reads real IndexedDB rows through the
// real store functions; time only via page.clock.setFixedTime (withTxn settles on a real setTimeout).

export const T0 = new Date('2026-10-12T09:00:00+01:00').getTime() // Europe/London, 2026-10-12
export const MIN = 60_000
export const HOUR = 60 * MIN
export const A = 'aaaaaaaaa1'
export const B = 'bbbbbbbbb2'
export const X = 'abc123def4'
export const TAPPED = '/app?tapped='
export const PROD = !!(process.env.CI || process.env.PW_PROD)

export const storeReady = (page: Page) => page.waitForFunction(() => !!window.__runtagStore)
/** Re-reads rows once the current document has exposed the store (a navigation may have just replaced it). */
export async function runs(page: Page): Promise<Run[]> {
  await storeReady(page)
  return page.evaluate(() => window.__runtagStore!.listRuns())
}
export async function tags(page: Page): Promise<Tag[]> {
  await storeReady(page)
  return page.evaluate(() => window.__runtagStore!.listTags())
}
export const primary = (page: Page) => page.locator('[data-testid=tap-primary][data-primary]')
export const openRuns = async (page: Page) => (await runs(page)).filter((r) => r.status === 'open')
export const byId = async (page: Page, id: string) => (await runs(page)).find((r) => r.id === id)

/** Opens /app at `now` so the database exists, ready for seeding. */
export async function openApp(page: Page, now = T0) {
  await page.clock.setFixedTime(now)
  await page.goto('/app')
  await storeReady(page)
}

/** A known tag planted an hour before `now` (outside setup grace). */
export async function seedTag(page: Page, id: string, createdAt = T0 - HOUR) {
  const tag: Tag = { id, name: `Tag ${id}`, createdAt, graceUntil: createdAt + 600_000 }
  await page.evaluate((t) => window.__runtagStore!.withTxn('readwrite', (s) => window.__runtagStore!.req(s.tags.put(t))), tag)
  return tag
}

export async function seedRun(page: Page, run: Run) {
  await page.evaluate((r) => window.__runtagStore!.withTxn('readwrite', (s) => window.__runtagStore!.req(s.runs.put(r))), run)
  return run
}

export const openRunAt = (id: string, tagInId: string, startedAt: number): Run => ({
  id,
  status: 'open',
  tagInId,
  startedAt,
  localDay: '2026-10-12',
  tzOffsetMin: 60,
  lastTapAt: startedAt,
  lastTransition: 'in',
})

/** A page load of /t/{id} at `now` (a fresh 'navigate' document). */
export async function tap(page: Page, id: string, now: number) {
  await page.clock.setFixedTime(now)
  await page.goto(`/t/${id}`)
}

/** Waits for the address bar to equal `expected` (path + query). */
export async function expectPath(page: Page, expected: string) {
  await expect.poll(() => {
    const u = new URL(page.url())
    return u.pathname + u.search
  }).toBe(expected)
}

/** In-page chain from the real functions: computeChain(listRuns(), localDayOf(Date.now())). */
export const chainInPage = (page: Page) =>
  page.evaluate(async () => {
    const s = window.__runtagStore!
    return s.computeChain(await s.listRuns(), s.localDayOf(Date.now()))
  })

/** After a tap-out or Undo: goto /app, reload, and re-read chain-value against the in-page chain. */
export async function expectChainAfterReload(page: Page, expected: number) {
  await page.goto('/app')
  await page.reload()
  await storeReady(page)
  await expect(page.getByTestId('chain-value')).toHaveText(String(expected))
  expect(await chainInPage(page)).toBe(expected)
}

const FORBIDDEN = ['pace', 'km/h', 'mph', 'calories', 'bpm', 'heart rate', 'distance', 'split', 'cadence', 'stride']

/** AC-TAP-17 + AC-TAP-18 on the visible view: no metrics/durations/countdowns, exactly one primary. */
export async function checkView(page: Page, label: string) {
  await expect(primary(page), `${label}: one primary`).toHaveCount(1)
  const text = (await page.locator('body').innerText()).toLowerCase()
  expect(text, label).not.toMatch(/\b\d{1,2}:\d{2}\b/)
  expect(text, label).not.toMatch(/\b\d+\s?(min|mins|minutes|h|hr|hrs|hours|s|sec|secs|seconds)\b/)
  for (const term of FORBIDDEN) expect(text, `${label} ${term}`).not.toMatch(new RegExp(`\\b${term}\\b`))
}
