import { test, expect, type Page } from '@playwright/test'

// J-APP-OFFLINE (docs/contracts/journey_app_offline.yml): the app works at a trailhead with no signal.
// Playwright supports service-worker interception on Chromium only; iOS offline is a real-device check (APP-LINK).

const PROD = !!(process.env.CI || process.env.PW_PROD)

test.describe('J-APP-OFFLINE', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'SW interception is Chromium-only in Playwright')
  test.skip(!PROD, 'the generated service worker exists only in production builds (run with PW_PROD=1 after npm run build)')

  async function becomeReadyOffline(page: Page) {
    await page.goto('/app')
    await expect(page.getByTestId('ready-offline')).toBeVisible({ timeout: 30_000 })
  }

  /** Re-read the real Cache Storage: every precache entry and every asset the cached shell references. */
  async function cacheAudit(page: Page, sw?: string) {
    sw ??= await page.evaluate(async () => (await fetch('/sw.js')).text())
    return page.evaluate(async (sw) => {
      const precache: string[] = JSON.parse(sw.match(/const PRECACHE = (\[[\s\S]*?\])\n/)![1])
      const buildId = sw.match(/const BUILD_ID = '([^']+)'/)![1]
      const cache = await caches.open(`runtag-shell-${buildId}`)
      const missing: string[] = []
      for (const u of precache) if (!(await cache.match(u))) missing.push(u)
      const shell = await (await cache.match('/shell'))!.text()
      const referenced = [...new Set(shell.match(/\/_next\/static\/[^"'\s)\\]+/g) || [])]
      const unreferenced: string[] = []
      for (const u of referenced) if (!(await cache.match(u))) unreferenced.push(u)
      const keys = (await cache.keys()).map((r) => new URL(r.url).pathname)
      return { buildId, total: precache.length, missing, unreferenced, tKeys: keys.filter((k) => k.startsWith('/t/')) }
    }, sw)
  }

  test('AC-SHELL-7 Ready offline iff the shell and every precache entry are cached', async ({ page }) => {
    await becomeReadyOffline(page)
    const audit = await cacheAudit(page)
    expect(audit.total).toBeGreaterThan(4)
    expect(audit.missing).toEqual([])
    expect(audit.unreferenced).toEqual([])

    // Converse: remove one entry and the indicator must not claim readiness.
    await page.evaluate(async (buildId) => {
      const cache = await caches.open(`runtag-shell-${buildId}`)
      await cache.delete('/manifest.webmanifest')
    }, audit.buildId)
    await page.reload()
    await expect(page.getByTestId('view')).toHaveAttribute('data-view', 'home')
    await page.waitForTimeout(4_500) // two STATUS polls
    await expect(page.getByTestId('ready-offline')).toHaveCount(0)
  })

  test('AC-SHELL-6 never-loaded tag URLs work offline, each with its own id', async ({ page, context }) => {
    await becomeReadyOffline(page)
    const sw = await page.evaluate(async () => (await fetch('/sw.js')).text()) // read before going offline
    await context.setOffline(true)

    const warmUp = await page.goto('/t/warmupid01') // one unmeasured warm-up navigation is allowed
    expect(warmUp?.fromServiceWorker()).toBe(true)

    for (const id of ['qqqqqqqqq1', 'zzzzzzzzz9']) {
      const t0 = performance.now()
      const response = await page.goto(`/t/${id}`)
      await expect(page.getByTestId('tap-tag-id')).toHaveAttribute('data-tag-id', id)
      const elapsed = performance.now() - t0
      expect(response?.fromServiceWorker(), id).toBe(true)
      expect(elapsed, `${id} offline view time`).toBeLessThan(1000)
    }

    const audit = await cacheAudit(page, sw)
    expect(audit.tKeys).toEqual([])

    await page.goto('/app')
    await expect(page.getByTestId('view')).toHaveAttribute('data-view', 'home')
    await page.getByTestId('nav-tags').click()
    await expect(page.getByTestId('view')).toHaveAttribute('data-view', 'tags')
  })

  test('AC-SHELL-6B online navigations are served cache-first even when the network is slow', async ({ page, context }) => {
    await becomeReadyOffline(page)
    await context.route('**/*', async (route) => {
      if (route.request().isNavigationRequest()) await new Promise((r) => setTimeout(r, 30_000))
      await route.continue()
    })
    const t0 = performance.now()
    const response = await page.goto('/app/settings')
    await expect(page.getByTestId('view')).toHaveAttribute('data-view', 'settings')
    expect(response?.fromServiceWorker()).toBe(true)
    expect(performance.now() - t0).toBeLessThan(1000)
  })
})
