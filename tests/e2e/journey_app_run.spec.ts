import { test, expect, type Page } from '@playwright/test'
import {
  A, B, HOUR, MIN, PROD, T0, TAPPED,
  byId, chainInPage, checkView, expectChainAfterReload, expectPath, openApp, openRunAt, openRuns, primary, runs, seedRun, seedTag, storeReady, tap,
} from './tap-helpers'

// J-APP-RUN (docs/contracts/journey_app_run.yml): tap in, tap out, guard, Undo, races and failures (APP-TAP #27).

test.use({ timezoneId: 'Europe/London' })

/** Tap in at A at `now` and return the new run. */
async function tapIn(page: Page, now = T0) {
  await tap(page, A, now)
  await expect(page.getByText('TAGGED')).toBeVisible()
  const open = await openRuns(page)
  expect(open).toEqual([expect.objectContaining({ status: 'open', tagInId: A, startedAt: now })])
  return open[0]
}

test('AC-TAP-6 AC-TAP-7 AC-TAP-8 AC-TAP-9 AC-TAP-10 tap in, reload, guard, tap out, guard again', async ({ page }) => {
  await openApp(page)
  await seedTag(page, A)
  expect(await runs(page)).toHaveLength(0)

  // Tap in: TAGGED only once the row is committed; URL replaced so reload never re-taps.
  await tap(page, A, T0)
  await expect(page.getByText('TAGGED')).toBeVisible()
  const rows = await runs(page)
  expect(rows).toEqual([expect.objectContaining({ status: 'open', tagInId: A })])
  await expectPath(page, TAPPED + rows[0].id)
  expect(rows[0]).toMatchObject({ status: 'open', tagInId: A, localDay: '2026-10-12', startedAt: T0, lastTapAt: T0, lastTransition: 'in' })
  await expect(page.getByText("You're in. Now go.")).toBeVisible()
  await checkView(page, 'tap-in result')

  // AC-TAP-7: reload reads the stored result; Undo visible inside the window.
  await page.clock.setFixedTime(T0 + 30_000)
  await page.reload()
  await expect(page.getByTestId('tapped-run')).toHaveAttribute('data-run-id', rows[0].id)
  await expect(page.getByTestId('tap-undo')).toBeVisible()
  expect(await runs(page)).toEqual(rows)

  // AC-TAP-8: a second read inside a minute changes nothing and offers Finish run (+ Undo of the tap-in).
  await tap(page, A, T0 + 40_000)
  await expectPath(page, `${TAPPED}${rows[0].id}&again=1&tag=${A}`)
  await expect(primary(page)).toHaveText('Finish run')
  await expect(page.getByTestId('tap-undo')).toBeVisible()
  await checkView(page, 'guard after tap-in')
  expect(await runs(page)).toEqual(rows)

  // Window passed: the stored result no longer offers Undo.
  await page.clock.setFixedTime(T0 + 61_000)
  await page.goto(TAPPED + rows[0].id)
  await expect(page.getByTestId('tap-result')).toHaveAttribute('data-state', 'in')
  await expect(page.getByTestId('tap-undo')).toHaveCount(0)

  // AC-TAP-9: tap out 40 minutes later.
  await tap(page, A, T0 + 40 * MIN)
  await expectPath(page, TAPPED + rows[0].id)
  const done = await byId(page, rows[0].id)
  expect(done).toMatchObject({ status: 'done', endedAt: T0 + 40 * MIN, tagOutId: A, lastTapAt: T0 + 40 * MIN, lastTransition: 'out' })
  const n = await chainInPage(page) // N comes from the real functions, never a copied literal
  expect(n).toBe(1)
  await expect(page.getByText(`Day ${n}. Chain unbroken.`)).toBeVisible()
  await checkView(page, 'tap-out result')

  // AC-TAP-10: a double read after tap-out starts nothing and offers Start another run.
  await tap(page, A, T0 + 40 * MIN + 5_000)
  await expectPath(page, `${TAPPED}${rows[0].id}&again=1&tag=${A}`)
  await expect(page.getByText('Run saved.')).toBeVisible()
  await expect(primary(page)).toHaveText('Start another run')
  await expect(page.getByTestId('tap-undo')).toBeVisible()
  await checkView(page, 'guard after tap-out')
  expect(await runs(page)).toEqual([done])

  await expectChainAfterReload(page, 1)
})

test('AC-TAP-8 cross-tag guard after tap-in survives reload and finishes at the scanned tag', async ({ page }) => {
  await openApp(page)
  await seedTag(page, A)
  await seedTag(page, B)
  const run = await tapIn(page)
  await tap(page, B, T0 + 10_000)
  const guardUrl = `${TAPPED}${run.id}&again=1&tag=${B}`
  await expectPath(page, guardUrl)
  await page.reload()
  await expect(primary(page)).toHaveText('Finish run')
  expect(await byId(page, run.id)).toEqual(run) // lastTapAt unchanged before the press

  // Missing, malformed or unknown scanned tag: no action is possible.
  for (const bad of [`${TAPPED}${run.id}&again=1`, `${TAPPED}${run.id}&again=1&tag=NOTATAG`, `${TAPPED}${run.id}&again=1&tag=zzzzzzzzzz`]) {
    await page.goto(bad)
    await expect(page.getByText('Tap your tag again.')).toBeVisible()
    await expect(primary(page)).toHaveText('Go')
    await expect(page.getByText('Finish run')).toHaveCount(0)
    await checkView(page, 'tap again')
  }

  await page.goto(guardUrl)
  await page.clock.setFixedTime(T0 + 20_000)
  await primary(page).click()
  await expectPath(page, TAPPED + run.id)
  expect(await byId(page, run.id)).toMatchObject({ status: 'done', tagOutId: B, endedAt: T0 + 20_000, lastTransition: 'out' })
})

test('AC-TAP-10 cross-tag guard after tap-out survives reload and starts at the scanned tag', async ({ page }) => {
  await openApp(page)
  await seedTag(page, A)
  await seedTag(page, B)
  const run = await tapIn(page)
  await tap(page, A, T0 + 2 * MIN)
  await expect(page.getByText('Day 1. Chain unbroken.')).toBeVisible()
  await tap(page, B, T0 + 2 * MIN + 10_000)
  await expectPath(page, `${TAPPED}${run.id}&again=1&tag=${B}`)
  await page.reload()
  await expect(primary(page)).toHaveText('Start another run')
  expect(await runs(page)).toHaveLength(1)
  await primary(page).click()
  await expect(page.getByText('TAGGED')).toBeVisible()
  const [next] = await openRuns(page)
  expect(next).toMatchObject({ tagInId: B, startedAt: T0 + 2 * MIN + 10_000 })
  await expectPath(page, TAPPED + next.id)
  expect(await runs(page)).toHaveLength(2)
})

test.describe('AC-TAP-11 stale and future-dated runs', () => {
  test('an open run aged 7 h is abandoned on the next tap, which then taps in', async ({ page }) => {
    await openApp(page)
    await seedTag(page, A)
    const stale = await seedRun(page, openRunAt('stale-1', A, T0 - 7 * HOUR))
    await tap(page, A, T0)
    await expect(page.getByText('TAGGED')).toBeVisible()
    await expect(page.getByTestId('stale-notice')).toBeVisible()
    expect(await byId(page, stale.id)).toEqual({ ...stale, status: 'abandoned', abandonedAt: T0 })
    const [open] = await openRuns(page)
    expect(open).toMatchObject({ tagInId: A, startedAt: T0 })
    await page.reload()
    await expect(page.getByTestId('stale-notice')).toBeVisible() // derived from the database
    await page.clock.setFixedTime(T0 + 61_000)
    await page.reload()
    await expect(page.getByTestId('tap-result')).toBeVisible()
    await expect(page.getByTestId('stale-notice')).toHaveCount(0)
  })

  test('an open run dated in the future is abandoned', async ({ page }) => {
    await openApp(page)
    await seedTag(page, A)
    const future = await seedRun(page, openRunAt('future-1', A, T0 + HOUR))
    await tap(page, A, T0)
    await expect(page.getByText('TAGGED')).toBeVisible()
    expect(await byId(page, future.id)).toEqual({ ...future, status: 'abandoned', abandonedAt: T0 })
  })

  test('a done run with a future lastTapAt never guards', async ({ page }) => {
    await openApp(page)
    await seedTag(page, A)
    const done = await seedRun(page, {
      ...openRunAt('done-1', A, T0 - HOUR), status: 'done', endedAt: T0 + 30_000, tagOutId: A, lastTapAt: T0 + 30_000, lastTransition: 'out',
    })
    await tap(page, A, T0)
    await expect(page.getByText('TAGGED')).toBeVisible()
    expect(await byId(page, done.id)).toEqual(done)
    expect(await openRuns(page)).toHaveLength(1)
  })
})

test.describe('AC-TAP-12 Undo', () => {
  test('tap-in Undo deletes the run; the chain is unchanged', async ({ page }) => {
    await openApp(page)
    await seedTag(page, A)
    await tapIn(page)
    await page.clock.setFixedTime(T0 + 10_000)
    await page.getByTestId('tap-undo').click()
    await expect(page.getByText('Tap undone.')).toBeVisible()
    await checkView(page, 'undone')
    expect(await runs(page)).toHaveLength(0)
    await expectChainAfterReload(page, 0)
  })

  test('tap-out Undo reopens the run and the chain goes back', async ({ page }) => {
    await openApp(page)
    await seedTag(page, A)
    const run = await tapIn(page)
    await tap(page, A, T0 + 30 * MIN)
    await expect(page.getByText('Day 1. Chain unbroken.')).toBeVisible()
    await page.clock.setFixedTime(T0 + 30 * MIN + 10_000)
    await page.getByTestId('tap-undo').click()
    await expect(page.getByText('Tap-out undone. Your run is still going.')).toBeVisible()
    expect(await byId(page, run.id)).toEqual({ ...run, status: 'open', lastTapAt: T0, lastTransition: 'in' })
    await expectChainAfterReload(page, 0)
  })

  test('something changed: compare-and-set refuses', async ({ page }) => {
    await openApp(page)
    await seedTag(page, A)
    const run = await tapIn(page)
    const changed = await seedRun(page, { ...run, lastTapAt: T0 + 1 })
    await page.clock.setFixedTime(T0 + 10_000)
    await page.getByTestId('tap-undo').click()
    await expect(page.getByText("Can't undo — something changed.")).toBeVisible()
    expect(await runs(page)).toEqual([changed])
  })

  test('window passed: Undo hides, and a late press is refused', async ({ page }) => {
    await openApp(page)
    await seedTag(page, A)
    const run = await tapIn(page)
    await expect(page.getByTestId('tap-undo')).toBeVisible()
    // Late press: the click lands before the once-a-second re-check hides the button.
    await page.clock.setFixedTime(T0 + 61_000)
    const pressed = await page.evaluate(() => {
      const b = document.querySelector<HTMLButtonElement>('[data-testid=tap-undo]')
      b?.click()
      return !!b
    })
    expect(pressed, 'late press landed before the once-a-second re-check').toBe(true)
    await expect(page.getByText('Undo window has passed.')).toBeVisible()
    await expect(page.getByTestId('tap-undo')).toHaveCount(0)
    expect(await page.evaluate((r) => window.__runtagStore!.undoTap(r.id, r.lastTapAt, Date.now()), run)).toBe('expired')
    expect(await runs(page)).toEqual([run])
  })

  test('tap-out Undo of a run aged 6 h is too late', async ({ page }) => {
    await openApp(page)
    await seedTag(page, A)
    const run = await seedRun(page, openRunAt('long-1', A, T0 - 6 * HOUR + 30_000))
    await tap(page, A, T0)
    await expect(page.getByText(/Chain unbroken/)).toBeVisible()
    const done = await byId(page, run.id)
    await page.clock.setFixedTime(T0 + 40_000)
    await page.getByTestId('tap-undo').click()
    await expect(page.getByText('Too late to undo.')).toBeVisible()
    expect(await byId(page, run.id)).toEqual(done)
  })

  test('two pages: Undo of a tap-out while another run is open is refused', async ({ context }) => {
    const [page1, page2] = [await context.newPage(), await context.newPage()]
    await openApp(page1)
    await seedTag(page1, A)
    const r1 = await seedRun(page1, openRunAt('run-1', A, T0 - HOUR))
    await tap(page1, A, T0)
    await expect(page1.getByText('Day 1. Chain unbroken.')).toBeVisible()
    await tap(page2, A, T0 + 10_000)
    await expect(primary(page2)).toHaveText('Start another run')
    await primary(page2).click()
    await expect(page2.getByText('TAGGED')).toBeVisible()
    const [r2] = await openRuns(page2)
    const r1Done = await byId(page2, r1.id)

    await page1.getByTestId('tap-undo').click()
    await expect(page1.getByText("Can't undo — another run is in progress.")).toBeVisible()
    expect(await byId(page1, r1.id)).toEqual(r1Done)
    expect(r1Done).toMatchObject({ status: 'done' })
    expect(await openRuns(page1)).toEqual([r2])
  })
})

test('AC-TAP-13 storage failure: nothing saved, Retry records the tap', async ({ page }) => {
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
  await seedTag(page, A)
  await page.evaluate(() => sessionStorage.setItem('runtag-fail-writes', '1'))
  await tap(page, A, T0)
  await expect(page.getByText("This tap wasn't saved")).toBeVisible()
  await expect(primary(page)).toHaveText('Retry')
  await expect(page.getByText('TAGGED')).toHaveCount(0)
  await checkView(page, 'failure')
  expect(await runs(page)).toHaveLength(0) // same context, re-read

  await page.evaluate(() => sessionStorage.removeItem('runtag-fail-writes'))
  await page.clock.setFixedTime(T0 + 5_000)
  await primary(page).click()
  await expect(page.getByText('TAGGED')).toBeVisible()
  const [run] = await runs(page)
  expect(run).toMatchObject({ status: 'open', tagInId: A, startedAt: T0 + 5_000 })
  await expectPath(page, TAPPED + run.id)
})

test('AC-TAP-13 AC-TAP-18 a store that cannot open shows the failure with the store error and Go', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const r = indexedDB.open('runtag', 2) // a newer schema than this build understands
        r.onupgradeneeded = () => {
          r.result.createObjectStore('tags', { keyPath: 'id' })
          r.result.createObjectStore('runs', { keyPath: 'id' })
        }
        r.onsuccess = () => {
          r.result.close()
          resolve()
        }
        r.onerror = () => reject(r.error)
      }),
  )
  await tap(page, A, T0)
  await expect(page.getByText("This tap wasn't saved")).toBeVisible()
  await expect(page.getByTestId('store-error')).toContainText('newer-schema')
  await expect(primary(page)).toHaveText('Go')
  await expect(page.getByText('TAGGED')).toHaveCount(0)
  await checkView(page, 'failure, newer schema')
  const counts = await page.evaluate(
    () =>
      new Promise<number[]>((resolve) => {
        const r = indexedDB.open('runtag', 2)
        r.onsuccess = () => {
          const tx = r.result.transaction(['tags', 'runs'])
          const c = [tx.objectStore('tags').count(), tx.objectStore('runs').count()]
          tx.oncomplete = () => resolve(c.map((q) => q.result))
        }
      }),
  )
  expect(counts).toEqual([0, 0])
})

test('AC-TAP-14 two pages loading the same tag at once leave exactly one open run', async ({ context }) => {
  const setup = await context.newPage()
  await openApp(setup)
  await seedTag(setup, A)
  const [p1, p2] = [await context.newPage(), await context.newPage()]
  await Promise.all([p1.goto(`/t/${A}`), p2.goto(`/t/${A}`)])
  for (const p of [p1, p2]) await expect.poll(() => new URL(p.url()).pathname).toBe('/app')
  const open = await openRuns(setup)
  expect(open).toEqual([expect.objectContaining({ status: 'open', tagInId: A })])
  const urls = [p1, p2].map((p) => new URL(p.url())).map((u) => u.pathname + u.search).sort()
  expect(urls).toEqual([TAPPED + open[0].id, `${TAPPED}${open[0].id}&again=1&tag=${A}`].sort())
})

test.describe('AC-TAP-15 AC-TAP-19 a tap is decided once per document', () => {
  test('prerendering defers the decision until prerenderingchange', async ({ page }) => {
    await openApp(page)
    await seedTag(page, A)
    await page.addInitScript(() => {
      const w = window as unknown as { __pr: boolean }
      w.__pr = true
      Object.defineProperty(document, 'prerendering', { configurable: true, get: () => w.__pr })
    })
    await tap(page, A, T0)
    await expect(page.getByTestId('tap-tag-id')).toHaveAttribute('data-tag-id', A)
    await page.waitForTimeout(500)
    expect(await runs(page)).toHaveLength(0)
    await page.evaluate(() => {
      ;(window as unknown as { __pr: boolean }).__pr = false
      document.dispatchEvent(new Event('prerenderingchange'))
    })
    await expect(page.getByText('TAGGED')).toBeVisible()
    expect(await openRuns(page)).toHaveLength(1)
  })

  for (const observer of ['silent', 'unavailable'] as const) {
    test(`without navigation evidence (no timeline entry, ${observer} observer) a load never decides`, async ({ page }) => {
      await openApp(page)
      await seedTag(page, A)
      // An old finished run: any tap decision would add an open run next to it.
      await seedRun(page, { ...openRunAt('old-1', A, T0 - 2 * HOUR), status: 'done', endedAt: T0 - HOUR, tagOutId: A, lastTapAt: T0 - HOUR, lastTransition: 'out' })
      const before = await runs(page)
      await page.addInitScript((mode) => {
        const real = performance.getEntriesByType.bind(performance)
        performance.getEntriesByType = (t: string) => (t === 'navigation' ? [] : real(t))
        if (mode === 'unavailable') {
          ;(window as unknown as { PerformanceObserver: unknown }).PerformanceObserver = function () {
            throw new TypeError('PerformanceObserver unavailable')
          }
        } else {
          ;(window as unknown as { PerformanceObserver: unknown }).PerformanceObserver = class {
            observe() {}
            disconnect() {}
          }
        }
      }, observer)
      // Fresh load, reload and back/forward: none is a confirmed 'navigate', so each is a non-deciding revisit.
      await tap(page, A, T0)
      await expectPath(page, '/app')
      expect(await runs(page)).toEqual(before)
      await page.goto(`/t/${A}`)
      await page.reload()
      await expectPath(page, '/app')
      expect(await runs(page)).toEqual(before)
      await page.goto('/app/settings')
      await page.goBack()
      await expectPath(page, '/app')
      expect(await runs(page)).toEqual(before)
    })
  }

  test('a confirmed navigate load still records exactly one transition', async ({ page }) => {
    await openApp(page)
    await seedTag(page, A)
    await tap(page, A, T0)
    await expect(page.getByText('TAGGED')).toBeVisible()
    expect(await runs(page)).toEqual([expect.objectContaining({ status: 'open', tagInId: A, startedAt: T0, lastTransition: 'in' })])
  })

  test('a reload of /t/ and an in-shell Back to /t/ record nothing', async ({ page }) => {
    await openApp(page)
    await tap(page, A, T0)
    await expect(page.getByTestId('tap-plant')).toBeVisible() // decision made: unknown tag
    await seedTag(page, A) // now known, as if planted on another screen
    await page.reload() // 'reload' navigation: never decides
    await expectPath(page, '/app')
    expect(await runs(page)).toHaveLength(0)

    await tap(page, B, T0 + MIN)
    await expect(page.getByTestId('tap-plant')).toBeVisible()
    await page.getByText('Restore from backup').click()
    await expect(page.getByTestId('view')).toHaveAttribute('data-view', 'settings')
    await seedTag(page, B)
    await page.goBack() // in-shell Back to the former /t/ entry
    await expectPath(page, '/app')
    expect(await runs(page)).toHaveLength(0)
  })

  test('restoring guard, grace and result URLs 40 minutes later records nothing', async ({ page }) => {
    await openApp(page)
    await seedTag(page, A)
    await seedTag(page, B, T0 - MIN) // B is inside its setup grace
    const run = await tapIn(page)
    await tap(page, A, T0 + 10_000)
    await expectPath(page, `${TAPPED}${run.id}&again=1&tag=${A}`)
    const guardUrl = page.url()
    await tap(page, B, T0 + 20_000)
    await expectPath(page, `${TAPPED}${run.id}&grace=${B}`)
    const graceUrl = page.url()
    const before = await runs(page)
    expect(before).toEqual([run])
    await page.clock.setFixedTime(T0 + 40 * MIN)
    for (const url of [guardUrl, graceUrl, new URL(TAPPED + run.id, guardUrl).href]) {
      await page.goto(url)
      await page.reload()
      await expect(page.getByTestId('view')).not.toHaveAttribute('data-view', 'loading')
      await storeReady(page)
      expect(await runs(page), url).toEqual(before)
    }
  })
})

test.describe('AC-TAP-22 AC-TAP-23 explicit actions after another screen changed the run', () => {
  test('Finish run when the displayed run was finished and another started', async ({ context }) => {
    const [page1, page2] = [await context.newPage(), await context.newPage()]
    await openApp(page1)
    await seedTag(page1, A)
    await seedTag(page1, B)
    const r1 = await tapIn(page1)
    await tap(page1, B, T0 + 10_000)
    await expect(primary(page1)).toHaveText('Finish run')

    await tap(page2, A, T0 + 2 * MIN)
    await expect(page2.getByText('Day 1. Chain unbroken.')).toBeVisible()
    await tap(page2, A, T0 + 4 * MIN)
    await expect(page2.getByText('TAGGED')).toBeVisible()
    const r1Done = await byId(page2, r1.id)
    const [r2] = await openRuns(page2)

    await primary(page1).click()
    await expectPath(page1, `${TAPPED}${r2.id}&again=1&tag=${B}&notice=finish-changed`)
    await expect(page1.getByText('Your run changed on another screen. Nothing was tapped out.')).toBeVisible()
    await expect(page1.getByText(/Day \d/)).toHaveCount(0)
    await expect(page1.getByText('Run saved.')).toHaveCount(0)
    await expect(primary(page1)).toHaveText('Finish run')
    await checkView(page1, 'finish-changed, run open')
    expect(await byId(page1, r1.id)).toEqual(r1Done)
    expect(r1Done).toMatchObject({ status: 'done', tagOutId: A, endedAt: T0 + 2 * MIN })
    expect(await openRuns(page1)).toEqual([r2])
  })

  test('Finish run when the displayed run was finished and nothing is open', async ({ context }) => {
    const [page1, page2] = [await context.newPage(), await context.newPage()]
    await openApp(page1)
    await seedTag(page1, A)
    await seedTag(page1, B)
    const r1 = await tapIn(page1)
    await tap(page1, B, T0 + 10_000)
    await tap(page2, A, T0 + 2 * MIN)
    await expect(page2.getByText('Day 1. Chain unbroken.')).toBeVisible()
    const r1Done = await byId(page2, r1.id)

    await primary(page1).click()
    await expectPath(page1, `${TAPPED}${r1.id}&notice=finish-changed`)
    await expect(page1.getByText('Your run changed on another screen. Nothing was tapped out.')).toBeVisible()
    await expect(page1.getByText(/Day \d/)).toHaveCount(0)
    await expect(primary(page1)).toHaveText('Go')
    await checkView(page1, 'finish-changed, none open')
    expect(await runs(page1)).toEqual([r1Done])
  })

  test('Start another run when a run was started elsewhere', async ({ context }) => {
    const [page1, page2] = [await context.newPage(), await context.newPage()]
    await openApp(page1)
    await seedTag(page1, A)
    await seedTag(page1, B)
    await tapIn(page1)
    await tap(page1, A, T0 + 2 * MIN)
    await expect(page1.getByText('Day 1. Chain unbroken.')).toBeVisible()
    await tap(page1, B, T0 + 2 * MIN + 10_000)
    await expect(primary(page1)).toHaveText('Start another run')

    await tap(page2, A, T0 + 4 * MIN)
    await expect(page2.getByText('TAGGED')).toBeVisible()
    const before = await runs(page2)
    const [r2] = await openRuns(page2)

    await primary(page1).click()
    await expectPath(page1, `${TAPPED}${r2.id}&again=1&tag=${B}&notice=start-already-open`)
    await expect(page1.getByText('A run is already in progress. Nothing new was started.')).toBeVisible()
    await expect(page1.getByText('TAGGED')).toHaveCount(0)
    await expect(page1.getByText('Run started')).toHaveCount(0)
    await checkView(page1, 'start-already-open')
    expect(await runs(page1)).toEqual(before)
  })
})

test('AC-TAP-17 AC-TAP-18 stored-result views: missing and abandoned runs', async ({ page }) => {
  await openApp(page)
  await seedTag(page, A)
  await page.goto(`${TAPPED}no-such-run`)
  await expect(page.getByText("This tap was undone or isn't on this phone.")).toBeVisible()
  await checkView(page, 'missing run')
  const gone = await seedRun(page, { ...openRunAt('gone-1', A, T0 - 8 * HOUR), status: 'abandoned', abandonedAt: T0 - HOUR })
  await page.goto(TAPPED + gone.id)
  await expect(page.getByText("Your last run wasn't tapped out, so it didn't count.")).toBeVisible()
  await checkView(page, 'abandoned run')
})

test.describe('offline and slow network (production service worker)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'SW interception is Chromium-only in Playwright')
  test.skip(!PROD, 'the generated service worker exists only in production builds (run with PW_PROD=1 after npm run build)')

  async function readyOffline(page: Page) {
    await openApp(page)
    await expect(page.getByTestId('ready-offline')).toBeVisible({ timeout: 30_000 })
  }

  test('AC-TAP-16 offline: two never-loaded tag URLs tap in then out with their own ids', async ({ page, context }) => {
    await readyOffline(page)
    const [inTag, outTag] = ['offlinein1', 'offlineou2']
    await seedTag(page, inTag)
    await seedTag(page, outTag)
    await context.setOffline(true)

    await page.clock.setFixedTime(T0)
    let t = performance.now()
    await page.goto(`/t/${inTag}`)
    await expect(page.getByText('TAGGED')).toBeVisible()
    expect(performance.now() - t, 'offline tap-in result').toBeLessThan(1000)

    await page.clock.setFixedTime(T0 + 30 * MIN)
    t = performance.now()
    await page.goto(`/t/${outTag}`)
    await expect(page.getByText('Day 1. Chain unbroken.')).toBeVisible()
    expect(performance.now() - t, 'offline tap-out result').toBeLessThan(1000)

    const [run] = await runs(page)
    expect(run).toMatchObject({ status: 'done', tagInId: inTag, tagOutId: outTag })
  })

  test('AC-TAP-20 online with navigations delayed 30 s, a tap still commits and shows TAGGED at once', async ({ page, context }) => {
    await readyOffline(page)
    await seedTag(page, A)
    await context.route('**/*', async (route) => {
      if (route.request().isNavigationRequest()) await new Promise((r) => setTimeout(r, 30_000))
      await route.continue()
    })
    const t = performance.now()
    await page.goto(`/t/${A}`)
    await expect(page.getByText('TAGGED')).toBeVisible()
    expect(performance.now() - t).toBeLessThan(1000)
    expect(await openRuns(page)).toHaveLength(1)
  })
})
