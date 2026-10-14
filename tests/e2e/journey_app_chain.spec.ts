import { test, expect, type Page } from '@playwright/test'
import type { Run } from '../../lib/app/store'
import { A, HOUR, MIN, PROD, T0, chainInPage, openApp, openRunAt, runs, seedRun, seedTag, storeReady, tags } from './tap-helpers'

// J-APP-CHAIN (docs/contracts/journey_app_chain.yml): the chain home at /app (APP-CHAIN #29).
// Rows are re-read through the real store; time only via page.clock.setFixedTime; zone Europe/London.

test.use({ timezoneId: 'Europe/London' })

const TODAY = '2026-10-12' // T0 = 2026-10-12T09:00:00+01:00

/** Calendar day `offset` days from `from` (UTC arithmetic, like previousDay). */
function day(offset: number, from = TODAY): string {
  const [y, m, d] = from.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + offset)).toISOString().slice(0, 10)
}

/** A done run whose stored localDay is `localDay` (09:00 London that day). */
function doneRun(localDay: string, id = `done-${localDay}`): Run {
  const startedAt = new Date(`${localDay}T09:00:00+01:00`).getTime()
  return { ...openRunAt(id, A, startedAt), localDay, status: 'done', endedAt: startedAt + 30 * MIN, tagOutId: A, lastTapAt: startedAt + 30 * MIN, lastTransition: 'out' }
}

async function seed(page: Page, rows: Run[]) {
  for (const r of rows) await seedRun(page, r)
  return rows
}

/** Re-render /app at the current clock and wait for the loaded home. */
async function reloadHome(page: Page) {
  await page.reload()
  await storeReady(page)
  await expect(page.getByTestId('history-day').first()).toBeVisible()
}

const states = (page: Page) =>
  page.getByTestId('history-day').evaluateAll((els) => els.map((e) => [e.getAttribute('data-day'), e.getAttribute('data-state')]))

const FORBIDDEN = ['pace', 'km/h', 'mph', 'calories', 'bpm', 'heart rate', 'distance', 'split', 'cadence', 'stride']
/** AC-CHAIN-11 on the rendered home: no metrics, clock times or durations. */
async function noMetrics(page: Page, label: string) {
  const text = (await page.locator('body').innerText()).toLowerCase()
  expect(text, label).not.toMatch(/\b\d{1,2}:\d{2}\b/)
  expect(text, label).not.toMatch(/\b\d+\s?(min|mins|minutes|h|hr|hrs|hours|s|sec|secs|seconds)\b/)
  for (const term of FORBIDDEN) expect(text, `${label} ${term}`).not.toMatch(new RegExp(`\\b${term}\\b`))
}

/** AC-CHAIN-1 oracle: chain-value equals the in-page chain, data-count its 30-capped link count. */
async function expectChain(page: Page, expected: number) {
  const inPage = await chainInPage(page)
  expect(inPage).toBe(expected)
  await expect(page.getByTestId('chain-value')).toHaveText(String(inPage))
  await expect(page.getByTestId('chain-visual')).toHaveAttribute('data-count', String(Math.min(inPage, 30)))
}

test.describe('AC-CHAIN-1 the rendered chain is computeChain over the stored runs', () => {
  const fixtures: Array<[string, number[], number]> = [
    ['5 consecutive days incl. today', [-4, -3, -2, -1, 0], 5],
    ['days −3, −2 and today, not −1', [-3, -2, 0], 1],
    ['days −2 and −1, not today', [-2, -1], 2],
  ]
  for (const [name, offsets, expected] of fixtures) {
    test(name, async ({ page }) => {
      await openApp(page)
      await seed(page, offsets.map((o) => doneRun(day(o))))
      await reloadHome(page)
      await expectChain(page, expected)
      await noMetrics(page, name)
    })
  }

  test('a run produced by the app joins the seeded days', async ({ page }) => {
    await openApp(page)
    await seedTag(page, A)
    await seed(page, [doneRun(day(-2)), doneRun(day(-1))])
    expect(await page.evaluate(() => window.__runtagStore!.tapAtTag('aaaaaaaaa1', Date.now()).then((o) => o.kind))).toBe('in')
    await page.clock.setFixedTime(T0 + 30 * MIN)
    expect(await page.evaluate(() => window.__runtagStore!.tapAtTag('aaaaaaaaa1', Date.now()).then((o) => o.kind))).toBe('out')
    await page.goto('/app')
    await reloadHome(page)
    await expectChain(page, 3)
    await noMetrics(page, 'app-produced run')
  })
})

test('AC-CHAIN-2 a chain of 40 renders 30 links and the number 40, without horizontal scroll', async ({ page }) => {
  await openApp(page)
  await seed(page, Array.from({ length: 40 }, (_, i) => doneRun(day(-i))))
  await reloadHome(page)
  await expect(page.locator('[data-testid=chain-visual] [data-testid^=chain-day-]')).toHaveCount(30)
  await expect(page.getByTestId('chain-visual')).toHaveAttribute('data-count', '30')
  await expect(page.getByTestId('chain-value')).toHaveText('40')
  expect(await chainInPage(page)).toBe(40)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
  await noMetrics(page, 'chain 40')
})

test.describe('AC-CHAIN-3 the 14-day history follows the precedence rule', () => {
  const n = (k: number) => Array<string>(k).fill('neutral')
  const window14 = (to = TODAY) => Array.from({ length: 14 }, (_, i) => day(i - 13, to))

  test('(a) no runs: 13 neutral days and today pending', async ({ page }) => {
    await openApp(page)
    await reloadHome(page)
    expect(await states(page)).toEqual(window14().map((d, i) => [d, [...n(13), 'today-pending'][i]]))
    await noMetrics(page, 'history (a)')
  })

  test('(b) first done run on day −2, nothing on −1', async ({ page }) => {
    await openApp(page)
    await seed(page, [doneRun(day(-2))])
    await reloadHome(page)
    expect(await states(page)).toEqual(window14().map((d, i) => [d, [...n(11), 'done', 'missed', 'today-pending'][i]]))
    await noMetrics(page, 'history (b)')
  })

  test('(c) a done run dated after today is ignored', async ({ page }) => {
    await openApp(page)
    await seed(page, [doneRun(day(1))])
    await reloadHome(page)
    expect(await states(page)).toEqual(window14().map((d, i) => [d, [...n(13), 'today-pending'][i]]))
    await noMetrics(page, 'history (c)')
  })

  test('(d) a day with only an abandoned run is missed', async ({ page }) => {
    await openApp(page)
    const abandoned: Run = { ...openRunAt('ab-1', A, new Date(`${day(-1)}T09:00:00+01:00`).getTime()), localDay: day(-1), status: 'abandoned', abandonedAt: T0 - 12 * HOUR }
    await seed(page, [doneRun(day(-3)), abandoned])
    await reloadHome(page)
    expect(await states(page)).toEqual(window14().map((d, i) => [d, [...n(10), 'done', 'missed', 'missed', 'today-pending'][i]]))
    await noMetrics(page, 'history (d)')
  })

  test('(e) across the DST change every day appears once', async ({ page }) => {
    await openApp(page, Date.parse('2026-10-25T23:30:00Z'))
    await reloadHome(page)
    const days = (await states(page)).map(([d]) => d)
    expect(days).toEqual(window14('2026-10-25'))
    expect(new Set(days).size).toBe(14)
    await noMetrics(page, 'history (e) DST')
  })
})

test.describe('AC-CHAIN-4 at-risk iff yesterday is done and today is not', () => {
  const cases: Array<[string, number[], boolean, boolean]> = [
    ['done −1 only', [-1], false, true],
    ['done −1 and today', [-1, 0], false, false],
    ['done −2 only (chain 0)', [-2], false, false],
    ['no runs', [], false, false],
    ['done −1 plus an open run today', [-1], true, true],
  ]
  for (const [name, offsets, openToday, atRisk] of cases) {
    test(name, async ({ page }) => {
      await openApp(page)
      await seed(page, offsets.map((o) => doneRun(day(o))))
      if (openToday) await seedRun(page, openRunAt('open-today', A, T0 - HOUR))
      await reloadHome(page)
      if (atRisk) await expect(page.getByTestId('at-risk')).toHaveText('Run today to keep your chain.')
      else await expect(page.getByTestId('at-risk')).toHaveCount(0)
      await noMetrics(page, name)
    })
  }
})

test.describe('AC-CHAIN-5 stale open runs are abandoned on /app and never count', () => {
  const stale: Array<[string, Run]> = [
    ['R6 exactly 6 h old', openRunAt('r6', A, T0 - 6 * HOUR)],
    ['R9 7 h old, dated yesterday', { ...openRunAt('r9', A, T0 - 7 * HOUR), localDay: day(-1) }],
    ['RF dated in the future', openRunAt('rf', A, T0 + 3 * HOUR)],
  ]
  for (const [name, run] of stale) {
    test(name, async ({ page }) => {
      await openApp(page)
      await seed(page, [doneRun(day(-2)), doneRun(day(-1))])
      await seedRun(page, run)
      await reloadHome(page) // this render abandons the stale run
      expect((await runs(page)).find((r) => r.id === run.id)).toEqual({ ...run, status: 'abandoned', abandonedAt: T0 })
      await expect(page.getByTestId('chain-value')).toHaveText('2')
      await expect(page.getByTestId('open-run-banner')).toHaveCount(0)
      await expect(page.getByTestId('stale-notice')).toHaveText("Your last run wasn't tapped out, so it didn't count.")
      await noMetrics(page, `${name} stale notice`)
      await reloadHome(page) // same clock: still within the minute
      await expect(page.getByTestId('stale-notice')).toBeVisible()
      await page.clock.setFixedTime(T0 + 61_000)
      await reloadHome(page)
      await expect(page.getByTestId('stale-notice')).toHaveCount(0)
      await noMetrics(page, `${name} after the notice`)
      expect((await runs(page)).find((r) => r.id === run.id)).toEqual({ ...run, status: 'abandoned', abandonedAt: T0 })
    })
  }

  test('a fresh open run stays open and shows the banner', async ({ page }) => {
    await openApp(page)
    const fresh = await seedRun(page, openRunAt('fresh', A, T0 - 5 * HOUR))
    await reloadHome(page)
    await expect(page.getByTestId('open-run-banner')).toHaveText('Run in progress — tap your tag to finish')
    expect((await runs(page)).find((r) => r.id === fresh.id)).toEqual(fresh)
    await noMetrics(page, 'open run')
  })
})

test('AC-CHAIN-6 empty state on a fresh device', async ({ page }) => {
  await openApp(page)
  await reloadHome(page)
  await expect(page.getByTestId('chain-value')).toHaveText('0')
  await expect(page.getByTestId('chain-visual')).toHaveAttribute('data-count', '0')
  await expect(page.getByTestId('empty-state')).toContainText('plant')
  expect((await tags(page)).length).toBe(0)
  expect(await page.evaluate(() => window.__runtagStore!.getMeta().then((m) => m.schemaVersion))).toBe(1)
  await noMetrics(page, 'empty')
  await page.getByTestId('empty-plant-link').click()
  await expect(page.getByTestId('view')).toHaveAttribute('data-view', 'tags')
  expect(new URL(page.url()).pathname).toBe('/app/tags')
})

test('AC-CHAIN-7 time-zone travel keeps the chain and the stored days', async ({ page, context, browser }, testInfo) => {
  const seededAt = Date.parse('2026-10-12T15:00:00+01:00')
  await openApp(page, seededAt)
  const seeded = await seed(page, [doneRun('2026-10-10'), doneRun('2026-10-11'), doneRun('2026-10-12')])
  const state = await context.storageState({ indexedDB: true })

  const use = testInfo.project.use
  const ny = await browser.newContext({
    baseURL: use.baseURL, viewport: use.viewport, userAgent: use.userAgent, deviceScaleFactor: use.deviceScaleFactor,
    isMobile: use.isMobile, hasTouch: use.hasTouch, timezoneId: 'America/New_York', storageState: state,
  })
  const p = await ny.newPage()
  await p.clock.setFixedTime(seededAt)
  await p.goto('/app')
  await storeReady(p)
  expect((await runs(p)).sort((a, b) => a.id.localeCompare(b.id))).toEqual(seeded) // the transfer happened
  await reloadHome(p)
  await expect(p.getByTestId('chain-value')).toHaveText('3')
  expect(await p.getByTestId('history-day').last().getAttribute('aria-label')).toMatch(/^Monday 12 October/)
  await noMetrics(p, 'New York, same date')

  // 21:30 in New York is already 13 October in London: today is the device's date, not the stored offset's.
  await p.clock.setFixedTime(Date.parse('2026-10-12T21:30:00-04:00'))
  await reloadHome(p)
  await expect(p.getByTestId('history-day').last()).toHaveAttribute('data-day', '2026-10-12')
  await expect(p.getByTestId('history-day').last()).toHaveAttribute('data-state', 'done')
  await expect(p.getByTestId('chain-value')).toHaveText('3')
  await expect(p.getByTestId('at-risk')).toHaveCount(0)
  await noMetrics(p, 'New York, London already next day')
  await ny.close()
})

test('AC-CHAIN-8 DST: days 24, 25 and 26 October are a chain of 3', async ({ page }) => {
  await openApp(page, Date.parse('2026-10-26T12:00:00Z'))
  await seed(page, [doneRun('2026-10-24'), doneRun('2026-10-25'), doneRun('2026-10-26')])
  await reloadHome(page)
  await expect(page.getByTestId('chain-value')).toHaveText('3')
  expect(await chainInPage(page)).toBe(3)
  await noMetrics(page, 'DST chain')
})

test('AC-CHAIN-9 a run tapped in at 23:55 and out at 00:20 counts for the day it started', async ({ page }) => {
  const tapIn = Date.parse('2026-10-11T23:55:00+01:00')
  await openApp(page, tapIn - HOUR)
  await seedTag(page, A, tapIn - HOUR)
  await page.clock.setFixedTime(tapIn)
  expect(await page.evaluate(() => window.__runtagStore!.tapAtTag('aaaaaaaaa1', Date.now()).then((o) => o.kind))).toBe('in')
  await page.clock.setFixedTime(Date.parse('2026-10-12T00:20:00+01:00'))
  expect(await page.evaluate(() => window.__runtagStore!.tapAtTag('aaaaaaaaa1', Date.now()).then((o) => o.kind))).toBe('out')
  expect(await runs(page)).toEqual([expect.objectContaining({ status: 'done', localDay: '2026-10-11', startedAt: tapIn })])

  await page.clock.setFixedTime(T0)
  await page.goto('/app')
  await reloadHome(page)
  await expect(page.locator('[data-testid=history-day][data-day="2026-10-11"]')).toHaveAttribute('data-state', 'done')
  await expect(page.locator('[data-testid=history-day][data-day="2026-10-12"]')).toHaveAttribute('data-state', 'today-pending')
  await expect(page.getByTestId('at-risk')).toBeVisible()
  await expect(page.getByTestId('chain-value')).toHaveText('1')
  await noMetrics(page, 'late-night run')
})

test.describe('AC-CHAIN-10 the chain home keeps Ready offline (production service worker)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'SW interception is Chromium-only in Playwright')
  test.skip(!PROD, 'the generated service worker exists only in production builds (run with PW_PROD=1 after npm run build)')

  test('Ready offline iff every precache entry is cached', async ({ page }) => {
    await openApp(page)
    await expect(page.getByTestId('ready-offline')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByTestId('history-day')).toHaveCount(14) // the replaced home view
    const audit = await page.evaluate(async () => {
      const sw = await (await fetch('/sw.js')).text()
      const precache: string[] = JSON.parse(sw.match(/const PRECACHE = (\[[\s\S]*?\])\n/)![1])
      const buildId = sw.match(/const BUILD_ID = '([^']+)'/)![1]
      const cache = await caches.open(`runtag-shell-${buildId}`)
      const missing: string[] = []
      for (const u of precache) if (!(await cache.match(u))) missing.push(u)
      return { buildId, total: precache.length, missing }
    })
    expect(audit.total).toBeGreaterThan(4)
    expect(audit.missing).toEqual([])
    await noMetrics(page, 'ready offline')
    await page.evaluate(async (id) => (await caches.open(`runtag-shell-${id}`)).delete('/manifest.webmanifest'), audit.buildId)
    await expect(page.getByTestId('ready-offline')).toHaveCount(0, { timeout: 6_000 })
    await noMetrics(page, 'cache incomplete')
  })
})

test('AC-CHAIN-13 a failed home load writes nothing and shows the store error', async ({ page }) => {
  // Armed through sessionStorage, read by the init script of each new document, after the database exists.
  await page.addInitScript(() => {
    for (const m of ['put', 'add'] as const) {
      const real = IDBObjectStore.prototype[m]
      IDBObjectStore.prototype[m] = function (this: IDBObjectStore, ...args: unknown[]) {
        if (sessionStorage.getItem('runtag-fail-writes') === '1') throw new DOMException('full', 'QuotaExceededError')
        return (real as (...a: unknown[]) => IDBRequest).apply(this, args)
      } as never
    }
  })
  await openApp(page)
  const seeded = await seed(page, [doneRun(day(-2)), doneRun(day(-1)), { ...openRunAt('r9', A, T0 - 7 * HOUR), localDay: day(-1) }])
  await page.evaluate(() => sessionStorage.setItem('runtag-fail-writes', '1'))
  await page.goto('/app')
  await expect(page.getByTestId('store-error')).toContainText('quota')
  await expect(page.getByTestId('chain-value')).toHaveCount(0)
  await expect(page.getByTestId('stale-notice')).toHaveCount(0)
  await noMetrics(page, 'failed load')
  expect((await runs(page)).sort((a, b) => a.id.localeCompare(b.id))).toEqual([...seeded].sort((a, b) => a.id.localeCompare(b.id)))

  await page.evaluate(() => sessionStorage.removeItem('runtag-fail-writes'))
  await reloadHome(page)
  expect((await runs(page)).find((r) => r.id === 'r9')).toMatchObject({ status: 'abandoned', abandonedAt: T0 })
  await expect(page.getByTestId('chain-value')).toHaveText('2')
  await noMetrics(page, 'recovered load')
})
