import { test, expect, type Page } from '@playwright/test'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'

// APP-SHELL #24. Store assertions re-read real IndexedDB rows through the real store functions.

const PROD = !!(process.env.CI || process.env.PW_PROD)
const ROOT = path.join(__dirname, '..', '..')
const T0 = new Date('2026-10-12T09:00:00+01:00')

const view = (page: Page) => page.getByTestId('view')
const storeReady = (page: Page) => page.waitForFunction(() => !!window.__runtagStore)

test.describe('AC-SHELL-1 hard loads resolve from the address bar', () => {
  const cases: Array<[string, string]> = [
    ['/app', 'home'],
    ['/app/tags', 'tags'],
    ['/app/settings', 'settings'],
    ['/t/abc123def4', 'tap'],
    ['/t/ABC123def4', 'invalid-tag'],
    ['/t/a/b', 'invalid-tag'],
    ['/app/nope', 'not-found'],
    ['/shell', 'not-found'],
  ]
  for (const [url, expected] of cases) {
    test(`${url} → ${expected}`, async ({ page }) => {
      const problems: string[] = []
      page.on('console', (m) => /hydrat|did not match/i.test(m.text()) && problems.push(m.text()))
      await page.goto(url)
      await expect(view(page)).toHaveAttribute('data-view', expected)
      expect(problems.join('\n'), `${url}: React hydration warnings`).toBe('')
    })
  }
})

test('AC-SHELL-1B online in-shell navigation and back', async ({ page }) => {
  await page.goto('/app')
  await expect(view(page)).toHaveAttribute('data-view', 'home')
  await page.getByTestId('nav-tags').click()
  await expect(view(page)).toHaveAttribute('data-view', 'tags')
  expect(new URL(page.url()).pathname).toBe('/app/tags')
  await page.goBack()
  await expect(view(page)).toHaveAttribute('data-view', 'home')
  expect(new URL(page.url()).pathname).toBe('/app')
})

test('AC-SHELL-2 tag id comes from the URL for consecutive loads', async ({ page }) => {
  for (const id of ['abc123def4', 'zzzzzzzzz9']) {
    await page.goto(`/t/${id}`)
    await expect(page.getByTestId('tap-tag-id')).toHaveAttribute('data-tag-id', id)
  }
})

test('AC-SHELL-3 store round trip survives reload', async ({ page }) => {
  await page.clock.setFixedTime(T0) // pins Date.now() without faking timers
  await page.goto('/app')
  await storeReady(page)
  const created = await page.evaluate(() => window.__runtagStore!.startRunIfNoneOpen('abc123def4', Date.now()))
  expect(created.created).toBe(true)
  expect(created.run).toMatchObject({ status: 'open', tagInId: 'abc123def4', startedAt: T0.getTime(), lastTapAt: T0.getTime() })
  expect(created.run.localDay).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  await page.reload()
  await storeReady(page)
  const rows = await page.evaluate(() => window.__runtagStore!.listRuns())
  expect(rows).toEqual([created.run])
})

test('AC-SHELL-5 two pages starting a run at once leave exactly one open run', async ({ context }) => {
  const [a, b] = [await context.newPage(), await context.newPage()]
  await Promise.all([a.goto('/app'), b.goto('/app')])
  await Promise.all([storeReady(a), storeReady(b)])
  const now = Date.now()
  const results = await Promise.all(
    [a, b].map((p) => p.evaluate((t) => window.__runtagStore!.startRunIfNoneOpen('abc123def4', t), now)),
  )
  expect(results.map((r) => r.created).sort()).toEqual([false, true])
  const rows = await a.evaluate(() => window.__runtagStore!.listRuns())
  expect(rows.filter((r) => r.status === 'open')).toHaveLength(1)
})

test('AC-SHELL-5B store is not exposed to non-automated browsers', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }))
  await page.goto('/app')
  await expect(view(page)).toHaveAttribute('data-view', 'home')
  expect(await page.evaluate(() => typeof window.__runtagStore)).toBe('undefined')
})

test('AC-SHELL-15 quota failure rejects with StoreError and writes nothing', async ({ page }) => {
  // Injected by init script but armed only after the store is open, so it simulates a full disk during a write.
  await page.addInitScript(() => {
    const g = globalThis as { __failIdbWrites?: boolean }
    for (const m of ['put', 'add'] as const) {
      const real = IDBObjectStore.prototype[m]
      IDBObjectStore.prototype[m] = function (this: IDBObjectStore, ...args: unknown[]) {
        if (g.__failIdbWrites) throw new DOMException('full', 'QuotaExceededError')
        return (real as (...a: unknown[]) => IDBRequest).apply(this, args)
      } as never
    }
  })
  await page.goto('/app')
  await storeReady(page)
  await page.evaluate(() => window.__runtagStore!.listRuns()) // store open and upgraded
  await page.evaluate(() => ((globalThis as { __failIdbWrites?: boolean }).__failIdbWrites = true))
  const outcome = await page.evaluate(() =>
    window.__runtagStore!.startRunIfNoneOpen('abc123def4', Date.now()).then(
      () => 'resolved',
      (e: { name?: string; kind?: string }) => `${e.name}:${e.kind}`,
    ),
  )
  expect(outcome).toBe('StoreError:quota')
  expect(await page.evaluate(() => window.__runtagStore!.listRuns())).toHaveLength(0)
})

test('AC-SHELL-16 a newer database version shows a store error and changes nothing', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const r = indexedDB.open('runtag', 2)
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
  await page.goto('/app')
  await expect(page.getByTestId('store-error')).toBeVisible()
  const counts = await page.evaluate(
    () =>
      new Promise<number[]>((resolve) => {
        const r = indexedDB.open('runtag')
        r.onsuccess = () => {
          const tx = r.result.transaction(['tags', 'runs'])
          const a = tx.objectStore('tags').count()
          const b = tx.objectStore('runs').count()
          tx.oncomplete = () => resolve([a.result, b.result, r.result.version])
        }
      }),
  )
  expect(counts).toEqual([0, 0, 2])
})

test('AC-SHELL-17 a failing transaction rolls back every write', async ({ page }) => {
  await page.goto('/app')
  await storeReady(page)
  const outcome = await page.evaluate(() => {
    const s = window.__runtagStore!
    return s
      .withTxn('readwrite', async (stores) => {
        await s.req(stores.runs.add({ id: 'r-rollback', status: 'open', tagInId: 'abc123def4', startedAt: 1, localDay: '2026-10-12', tzOffsetMin: 0, lastTapAt: 1 }))
        throw new Error('boom')
      })
      .then(
        () => 'resolved',
        (e: { name?: string; kind?: string }) => `${e.name}:${e.kind}`,
      )
  })
  expect(outcome).toBe('StoreError:tx-aborted')
  await page.reload()
  await storeReady(page)
  expect(await page.evaluate(() => window.__runtagStore!.listRuns())).toHaveLength(0)
})

test('AC-SHELL-18 withTxn resolves only after the real transaction completes', async ({ page }) => {
  await page.goto('/app')
  await storeReady(page)
  const result = await page.evaluate(async () => {
    const s = window.__runtagStore!
    let completed = false
    const out = await s.withTxn('readwrite', (stores) => {
      stores.runs.transaction.addEventListener('complete', () => {
        completed = true
      })
      return s.startRunIfNoneOpenIn(stores, 'abc123def4', Date.now())
    })
    const completedAtResolve = completed // read before any other transaction starts
    const rows = await s.listRuns()
    return { completedAtResolve, runId: out.run.id, ids: rows.map((r) => r.id), open: rows.filter((r) => r.status === 'open').length }
  })
  expect(result.completedAtResolve).toBe(true)
  expect(result.ids).toContain(result.runId)
  expect(result.open).toBe(1)
})

test('AC-SHELL-11 app screens render no metrics', async ({ page }) => {
  const forbidden = ['pace', 'km/h', 'mph', 'calories', 'bpm', 'heart rate', 'distance']
  for (const url of ['/app', '/app/tags', '/app/settings', '/t/abc123def4']) {
    await page.goto(url)
    await expect(view(page)).not.toHaveAttribute('data-view', 'loading')
    const text = (await page.locator('body').innerText()).toLowerCase()
    expect(text, url).not.toMatch(/\b\d{1,2}:\d{2}\b/)
    expect(text, url).not.toMatch(/\b\d+\s?(min|mins|minutes|h|hr|hrs|hours|s|sec|secs|seconds)\b/)
    for (const term of forbidden) expect(text, `${url} ${term}`).not.toMatch(new RegExp(`\\b${term}\\b`))
  }
})

test('AC-SHELL-13 manifest and icons; demo head has no manifest link', async ({ page, request }) => {
  const res = await request.get('/manifest.webmanifest')
  expect(res.status()).toBe(200)
  const m = await res.json()
  expect(m).toMatchObject({ id: '/app', start_url: '/app', scope: '/', display: 'standalone' })
  for (const icon of m.icons) expect((await request.get(icon.src)).status()).toBe(200)
  expect(m.icons.map((i: { sizes: string }) => i.sizes).sort()).toEqual(['192x192', '512x512'])
  await page.goto('/')
  await expect(page.locator('link[rel="manifest"]')).toHaveCount(0)
  await page.goto('/app')
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest')
})

test.describe('production build only', () => {
  test.skip(!PROD, 'redirects and the generated service worker exist only in production builds (run with PW_PROD=1 after npm run build)')

  test('AC-SHELL-8B GET /sw.js carries the current BUILD_ID', async ({ request }) => {
    const buildId = fs.readFileSync(path.join(ROOT, '.next/BUILD_ID'), 'utf8').trim()
    const sw = await (await request.get('/sw.js')).text()
    expect(sw).toContain(`const BUILD_ID = '${buildId}'`)
  })

  test('AC-SHELL-10 alias hosts get a path- and query-preserving 308; localhost does not', async ({ baseURL }) => {
    const base = new URL(baseURL!)
    const get = (p: string, host: string) =>
      new Promise<{ status: number; location?: string }>((resolve, reject) => {
        http
          .request({ hostname: base.hostname, port: base.port, path: p, method: 'GET', headers: { Host: host } }, (res) => {
            res.resume()
            resolve({ status: res.statusCode!, location: res.headers.location })
          })
          .on('error', reject)
          .end()
      })
    const cases: Array<[string, string]> = [
      ['/app', 'https://runtag.vercel.app/app'],
      ['/app/tags?x=1', 'https://runtag.vercel.app/app/tags?x=1'],
      ['/t/abc123def4', 'https://runtag.vercel.app/t/abc123def4'],
    ]
    for (const [p, location] of cases) {
      expect(await get(p, 'runtag-floutlabs.vercel.app'), p).toEqual({ status: 308, location })
      expect((await get(p, `localhost:${base.port}`)).status, p).toBe(200)
    }
  })
})
