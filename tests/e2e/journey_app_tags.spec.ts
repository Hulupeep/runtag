import { test, expect, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import type { Tag } from '../../lib/app/store'
import { A, B, HOUR, MIN, PROD, T0, TAPPED, expectPath, noMetrics, openApp, runs, seedTag, storeReady, tags, tap } from './tap-helpers'

// J-APP-TAGS (docs/contracts/journey_app_tags.yml): create, copy, write and rename tags at /app/tags (APP-TAGS #31).
// Rows are re-read through the real store; time only via page.clock.setFixedTime. The NDEFReader below is a
// test harness that records calls; it is never evidence of physical writing (A11 is a real-device check).

test.use({ timezoneId: 'Europe/London' })

const URL_OF = (id: string) => `https://runtag.vercel.app/t/${id}`
const row = (page: Page, id: string) => page.locator(`[data-testid=tag-row][data-tag-id="${id}"]`)
const byId = (rows: Tag[]) => [...rows].sort((a, b) => a.id.localeCompare(b.id))

/** Web NFC harness, armed per test through sessionStorage['runtag-ndef']: resolve | pending | reject:<DOMException name>. */
function ndefHarness() {
  const w = window as unknown as { __ndefCalls: unknown[]; __ndefResolve: () => void; NDEFReader: unknown }
  w.__ndefCalls = []
  let pending: (() => void) | null = null
  w.__ndefResolve = () => pending?.()
  w.NDEFReader = class {
    async write(message: unknown, options?: { signal?: AbortSignal }) {
      w.__ndefCalls.push({ message: JSON.parse(JSON.stringify(message)), signalPresent: !!options?.signal, active: (navigator as { userActivation?: { isActive: boolean } }).userActivation?.isActive ?? null })
      const mode = sessionStorage.getItem('runtag-ndef') || 'resolve'
      if (mode.startsWith('reject:')) throw new DOMException('harness', mode.slice(7))
      if (mode === 'pending') {
        return new Promise<void>((resolve, reject) => {
          pending = resolve
          options?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
        })
      }
    }
  }
}

/** Write failures armed through sessionStorage after the database exists. */
function failureHarness() {
  for (const m of ['put', 'add'] as const) {
    const real = IDBObjectStore.prototype[m]
    IDBObjectStore.prototype[m] = function (this: IDBObjectStore, ...args: unknown[]) {
      if (sessionStorage.getItem('runtag-fail-writes') === '1') throw new DOMException('full', 'QuotaExceededError')
      if (m === 'put' && sessionStorage.getItem('runtag-fail-next-put') === '1') {
        sessionStorage.removeItem('runtag-fail-next-put')
        throw new DOMException('full', 'QuotaExceededError')
      }
      return (real as (...a: unknown[]) => IDBRequest).apply(this, args)
    } as never
  }
}

const calls = (page: Page) => page.evaluate(() => (window as unknown as { __ndefCalls: { message: unknown; signalPresent: boolean; active: boolean | null }[] }).__ndefCalls)

async function openTags(page: Page, now = T0) {
  await openApp(page, now)
  await page.goto('/app/tags')
  await storeReady(page)
  await expect(page.getByTestId('tag-create')).toBeVisible()
}

async function createThroughUi(page: Page, name: string) {
  const before = (await tags(page)).map((t) => t.id)
  await page.getByTestId('tag-create-name').fill(name)
  await page.getByTestId('tag-create').click()
  await expect(page.getByText('Tag created')).toBeVisible()
  const created = (await tags(page)).filter((t) => !before.includes(t.id))
  expect(created.map((t) => t.name)).toEqual([name])
  return created[0]
}

/** The tap decision sees a re-armed tag as setup grace: grace view, Start run, no run row. */
async function expectGraceTap(page: Page, id: string, at: number) {
  await tap(page, id, at)
  await expectPath(page, `/app?grace=${id}`)
  await expect(page.locator('[data-testid=tap-result][data-state=grace]')).toContainText('Tag works ✓')
  await expect(page.locator('[data-testid=tap-primary][data-primary]')).toHaveText('Start run')
  expect((await runs(page)).length).toBe(0)
}

test('AC-TAGS-1 create a tag on a fresh device; its link survives reload; home leaves the empty state', async ({ page }) => {
  await openTags(page)
  await noMetrics(page, 'empty tags view')
  const tag = await createThroughUi(page, 'Oak at gate')
  expect(tag).toEqual({ id: expect.stringMatching(/^[a-z0-9]{10}$/), name: 'Oak at gate', createdAt: T0, graceUntil: T0 + 600_000 })
  await page.reload()
  await expect(row(page, tag.id).getByTestId('tag-url')).toHaveText(URL_OF(tag.id))
  await noMetrics(page, 'one tag')
  await page.goto('/app')
  await page.reload()
  await expect(page.getByTestId('history-day').first()).toBeVisible()
  await expect(page.getByTestId('empty-state')).toHaveCount(0)
  await expect(page.getByTestId('chain-value')).toHaveText('0')
  expect((await tags(page)).length).toBe(1)
})

test('AC-TAGS-1 an id collision draws a new id and never overwrites', async ({ page }) => {
  await page.addInitScript(() => {
    const real = Crypto.prototype.getRandomValues
    Crypto.prototype.getRandomValues = function (this: Crypto, a: Uint8Array) {
      if (sessionStorage.getItem('runtag-collide') === '1' && a instanceof Uint8Array) {
        sessionStorage.removeItem('runtag-collide')
        a.fill(0) // newTagId → 'aaaaaaaaaa'
        return a
      }
      return real.call(this, a)
    } as never
  })
  await openTags(page)
  const seeded = await seedTag(page, 'aaaaaaaaaa')
  await page.evaluate(() => sessionStorage.setItem('runtag-collide', '1'))
  await page.getByTestId('tag-create-name').fill('Second')
  await page.getByTestId('tag-create').click()
  await expect(page.getByText('Tag created')).toBeVisible()
  const rows = await tags(page)
  expect(rows.find((t) => t.id === 'aaaaaaaaaa')).toEqual(seeded)
  expect(rows.filter((t) => t.id !== 'aaaaaaaaaa')).toEqual([expect.objectContaining({ name: 'Second', id: expect.stringMatching(/^[a-z0-9]{10}$/) })])
})

test('AC-TAGS-2 name rule, field reset and one press makes one tag', async ({ page }) => {
  await openTags(page)
  const input = page.getByTestId('tag-create-name')
  await expect(input).toHaveValue('My tag')
  await expect(input).toHaveAttribute('maxlength', '40')
  for (const blank of ['', '   ']) {
    await input.fill(blank)
    await expect(page.getByTestId('tag-create')).toBeDisabled()
  }
  const forty = 'Riverside path by the old stone bridge xy'.slice(0, 40)
  expect(forty.length).toBe(40)
  const long = await createThroughUi(page, forty)
  expect(long.name).toBe(forty)
  await expect(input).toHaveValue('')
  await expect(page.getByTestId('tag-create')).toBeDisabled()
  await input.fill('  Gate  ')
  await page.getByTestId('tag-create').click()
  await expect(page.getByText('Tag created')).toBeVisible()
  expect((await tags(page)).map((t) => t.name).sort()).toEqual([forty, 'Gate'].sort())
  const before = (await tags(page)).length
  await input.fill('Twice')
  await page.getByTestId('tag-create').dblclick()
  await expect.poll(async () => (await tags(page)).length).toBe(before + 1)
  await page.waitForTimeout(500)
  expect((await tags(page)).length).toBe(before + 1)
})

test.describe('AC-TAGS-3 copy link re-arms the setup grace', () => {
  test('clipboard read-back (chromium)', async ({ page, context, browserName }) => {
    test.skip(browserName === 'webkit', 'Playwright WebKit cannot grant clipboard-write (wkPage _grantPermissions)')
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await openTags(page)
    const tag = await seedTag(page, A, T0 - HOUR)
    await page.reload()
    await row(page, tag.id).getByTestId('tag-copy').click()
    await expect(row(page, tag.id).getByTestId('tag-copied')).toHaveText('Link copied')
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(URL_OF(tag.id))
    await expect.poll(async () => (await tags(page)).find((t) => t.id === tag.id)?.graceUntil).toBe(T0 + 600_000)
    await noMetrics(page, 'copied')
    await expectGraceTap(page, tag.id, T0 + 5 * MIN)
  })

  for (const branch of ['reject', 'unavailable'] as const) {
    test(`${branch} clipboard: the link is shown to copy by hand, also after reload`, async ({ page }) => {
      await page.addInitScript((b) => {
        if (b === 'reject') Clipboard.prototype.writeText = () => Promise.reject(new DOMException('no', 'NotAllowedError'))
        else Object.defineProperty(Navigator.prototype, 'clipboard', { get: () => undefined, configurable: true })
      }, branch)
      await openTags(page)
      const tag = await seedTag(page, A, T0 - HOUR)
      await page.reload()
      for (let i = 0; i < 2; i++) {
        await row(page, tag.id).getByTestId('tag-copy').click()
        await expect(row(page, tag.id)).toContainText('Copy this link:')
        await expect(row(page, tag.id).getByTestId('tag-copy-fallback')).toHaveValue(URL_OF(tag.id))
        await expect(row(page, tag.id).getByTestId('tag-error')).toHaveCount(0)
        if (i === 0) {
          await noMetrics(page, 'copy fallback')
          await page.reload()
        }
      }
      await expect.poll(async () => (await tags(page)).find((t) => t.id === tag.id)?.graceUntil).toBe(T0 + 600_000)
      await expectGraceTap(page, tag.id, T0 + 5 * MIN)
    })
  }
})

test('AC-TAGS-4 no Web NFC shows the writer-app steps; the harness is the positive control', async ({ page, context }) => {
  await openTags(page)
  const seeded = [await seedTag(page, A), await seedTag(page, B)]
  await page.reload()
  expect(await page.evaluate(() => 'NDEFReader' in window)).toBe(false)
  await expect(page.getByTestId('tag-row')).toHaveCount(2)
  await expect(page.getByTestId('tag-write')).toHaveCount(0)
  const steps = page.getByTestId('nfc-instructions')
  for (const s of ['Install a free NFC writer app (for example NFC Tools).', 'Choose Write, then Add a record, then URL.', 'Paste your tag link.', 'Tap Write and hold the phone on the sticker.', "Tap the sticker once with your phone to test it. You'll see 'Tag works ✓'."])
    await expect(steps).toContainText(s)
  await page.reload()
  expect(byId(await tags(page))).toEqual(byId(seeded))

  const withNfc = await context.newPage()
  await withNfc.addInitScript(ndefHarness)
  await withNfc.goto('/app/tags')
  await expect(withNfc.getByTestId('tag-write')).toHaveCount(2)
  await expect(withNfc.getByTestId('nfc-instructions')).toHaveCount(0)
})

test('AC-TAGS-5 a successful write arms, writes, re-arms; the auto-read and a later tap are setup grace', async ({ page, browserName }) => {
  await page.addInitScript(ndefHarness)
  await openTags(page)
  const tag = await seedTag(page, A, T0 - HOUR)
  expect(tag.graceUntil).toBeLessThan(T0) // precondition: grace long expired
  await page.reload()
  await row(page, tag.id).getByTestId('tag-write').click()
  await expect(row(page, tag.id).getByTestId('tag-ready')).toHaveText('Tag ready')
  const recorded = await calls(page)
  expect(recorded).toEqual([expect.objectContaining({ message: { records: [{ recordType: 'url', data: URL_OF(tag.id) }] }, signalPresent: true })])
  if (browserName === 'chromium') expect(recorded[0].active).toBe(true)
  expect((await tags(page)).find((t) => t.id === tag.id)).toEqual({ ...tag, graceUntil: T0 + 600_000 })
  await noMetrics(page, 'tag ready')
  await expectGraceTap(page, tag.id, T0)
  await expectGraceTap(page, tag.id, T0 + 2 * MIN)
})

test.describe('AC-TAGS-6 write errors, pending and cancel', () => {
  const messages: Record<string, string> = {
    NotAllowedError: 'NFC permission was refused. Allow NFC for this site, or copy the link instead.',
    NotSupportedError: "This phone or sticker can't be written here. Copy the link instead.",
    NotReadableError: "NFC is switched off. Turn on NFC in your phone's settings, then try again, or copy the link instead.",
    InvalidStateError: 'Keep RunTag open on screen while writing, then try again.',
    NetworkError: "Couldn't write the tag. Hold the phone still on the sticker and try again, or copy the link instead.",
  }
  for (const [name, message] of Object.entries(messages)) {
    test(name, async ({ page }) => {
      await page.addInitScript(ndefHarness)
      await openTags(page)
      const tag = await seedTag(page, A, T0 - HOUR)
      await page.evaluate((n) => sessionStorage.setItem('runtag-ndef', `reject:${n}`), name)
      await page.reload()
      await row(page, tag.id).getByTestId('tag-write').click()
      await expect(row(page, tag.id).getByTestId('tag-error')).toHaveText(message)
      await expect(row(page, tag.id).getByTestId('tag-copy')).toBeVisible()
      await expect(page.getByTestId('tag-ready')).toHaveCount(0)
      expect((await tags(page)).find((t) => t.id === tag.id)).toEqual({ ...tag, graceUntil: T0 + 600_000 }) // armed
      await noMetrics(page, name)
    })
  }

  test('pending write: one at a time, Cancel aborts', async ({ page }) => {
    await page.addInitScript(ndefHarness)
    await openTags(page)
    const [a, b] = [await seedTag(page, A, T0 - HOUR), await seedTag(page, B, T0 - HOUR)]
    await page.evaluate(() => sessionStorage.setItem('runtag-ndef', 'pending'))
    await page.reload()
    await row(page, a.id).getByTestId('tag-write').click()
    await expect(row(page, a.id).getByTestId('tag-writing')).toContainText('Hold your phone on the sticker.')
    await expect(row(page, b.id).getByTestId('tag-write')).toBeDisabled()
    await noMetrics(page, 'writing')
    await row(page, a.id).getByTestId('tag-write-cancel').click()
    await expect(row(page, a.id).getByTestId('tag-error')).toHaveText('Writing was cancelled.')
    await expect(row(page, a.id).getByTestId('tag-writing')).toHaveCount(0)
    await expect(page.getByTestId('tag-write')).toHaveCount(2)
    for (const btn of await page.getByTestId('tag-write').all()) await expect(btn).toBeEnabled()
    expect(await page.evaluate(() => (window as unknown as { __ndefCalls: unknown[] }).__ndefCalls.length)).toBe(1)
  })
})

test('AC-TAGS-7 newest first; rename keeps other fields and another page’s grace', async ({ page, context }) => {
  await openTags(page)
  const made: Tag[] = []
  for (const [i, name] of ['Gate', 'Oak', 'Pier'].entries()) {
    await page.clock.setFixedTime(T0 + i * MIN)
    made.push(await createThroughUi(page, name))
  }
  await page.reload()
  await expect(page.getByTestId('tag-row')).toHaveCount(3) // the list renders after its async load
  expect(await page.getByTestId('tag-row').evaluateAll((els) => els.map((e) => e.getAttribute('data-tag-id')))).toEqual(made.map((t) => t.id).reverse())

  // Page 2 writes Gate (re-arming its grace) after page 1 rendered the list; page 1 then renames Gate.
  const p2 = await context.newPage()
  await p2.addInitScript(ndefHarness)
  await p2.goto('/app/tags')
  await row(p2, made[0].id).getByTestId('tag-write').click()
  await expect(row(p2, made[0].id).getByTestId('tag-ready')).toBeVisible()
  const written = (await tags(p2)).find((t) => t.id === made[0].id)!

  await row(page, made[0].id).getByTestId('tag-rename').click()
  await page.getByTestId('tag-rename-input').fill('Bridge')
  await noMetrics(page, 'rename open')
  await page.getByTestId('tag-rename-save').click()
  await expect(row(page, made[0].id).getByTestId('tag-row-name')).toHaveText('Bridge')
  await page.reload()
  const after = await tags(page)
  expect(after.find((t) => t.id === made[0].id)).toEqual({ ...written, name: 'Bridge' })
  expect(byId(after.filter((t) => t.id !== made[0].id))).toEqual(byId(made.slice(1)))
})

test('AC-TAGS-8 a failed save writes nothing; Retry after the cause clears; a newer schema shows the store error', async ({ page }) => {
  await page.addInitScript(failureHarness)
  await openTags(page)
  const existing = await seedTag(page, A, T0 - HOUR)
  await page.reload()
  await page.evaluate(() => sessionStorage.setItem('runtag-fail-writes', '1'))
  await page.getByTestId('tag-create-name').fill('Gate')
  await page.getByTestId('tag-create').click()
  await expect(page.getByTestId('tag-failed')).toContainText("That wasn't saved")
  await noMetrics(page, 'failure')
  expect(await tags(page)).toEqual([existing])
  await page.evaluate(() => sessionStorage.removeItem('runtag-fail-writes'))
  await page.getByTestId('tag-retry').click()
  await expect(page.getByText('Tag created')).toBeVisible()
  expect((await tags(page)).map((t) => t.name).sort()).toEqual(['Gate', existing.name].sort())

  await page.evaluate(() => sessionStorage.setItem('runtag-fail-writes', '1'))
  await row(page, existing.id).getByTestId('tag-rename').click()
  await page.getByTestId('tag-rename-input').fill('Renamed')
  await page.getByTestId('tag-rename-save').click()
  await expect(row(page, existing.id).getByTestId('tag-failed')).toBeVisible()
  expect((await tags(page)).find((t) => t.id === existing.id)).toEqual(existing)
  await page.evaluate(() => sessionStorage.removeItem('runtag-fail-writes'))
  await row(page, existing.id).getByTestId('tag-retry').click()
  await expect.poll(async () => (await tags(page)).find((t) => t.id === existing.id)?.name).toBe('Renamed')
})

test('AC-TAGS-8 a newer database version shows the store error and no create', async ({ page }) => {
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
  await page.goto('/app/tags')
  await expect(page.getByTestId('store-error')).toContainText('newer-schema')
  await expect(page.getByTestId('tag-create')).toHaveCount(0)
  await expect(page.getByTestId('nav-tags')).toBeVisible()
})

test('AC-TAGS-9 accessible controls of at least 48 × 48 px; feature detection only', async ({ page }) => {
  await page.addInitScript(ndefHarness)
  await openTags(page)
  await seedTag(page, A, T0 - HOUR)
  await page.reload()
  await row(page, A).getByTestId('tag-rename').click()
  for (const input of await page.locator('main input').all()) expect(await input.getAttribute('aria-label')).toBeTruthy()
  for (const btn of await page.locator('main button').all()) {
    const box = (await btn.boundingBox())!
    expect(box.width, await btn.innerText()).toBeGreaterThanOrEqual(48)
    expect(box.height, await btn.innerText()).toBeGreaterThanOrEqual(48)
  }
  const root = path.join(__dirname, '..', '..')
  for (const f of ['lib/app/tags.ts', 'components/app/views/tags.tsx']) {
    const src = fs.readFileSync(path.join(root, f), 'utf8')
    expect(src, f).not.toContain('userAgent')
  }
  expect(fs.readFileSync(path.join(root, 'components/app/views/tags.tsx'), 'utf8')).toContain("'NDEFReader' in window")
})

test.describe('AC-TAGS-11 the write is bounded and the grace protects it', () => {
  test('(a) a failed arm never writes', async ({ page }) => {
    await page.addInitScript(ndefHarness)
    await page.addInitScript(failureHarness)
    await openTags(page)
    const tag = await seedTag(page, A, T0 - HOUR)
    await page.reload()
    await page.evaluate(() => sessionStorage.setItem('runtag-fail-writes', '1'))
    await row(page, tag.id).getByTestId('tag-write').click()
    await expect(row(page, tag.id).getByTestId('tag-failed')).toContainText("That wasn't saved")
    expect((await calls(page)).length).toBe(0)
    await expect(page.getByTestId('tag-ready')).toHaveCount(0)
    expect((await tags(page)).find((t) => t.id === tag.id)).toEqual(tag)
  })

  test('(b) a write completing later with a failed save keeps the armed grace', async ({ page }) => {
    await page.addInitScript(ndefHarness)
    await page.addInitScript(failureHarness)
    await openTags(page)
    const tag = await seedTag(page, A, T0 - HOUR)
    await page.evaluate(() => sessionStorage.setItem('runtag-ndef', 'pending'))
    await page.reload()
    await row(page, tag.id).getByTestId('tag-write').click()
    await expect(row(page, tag.id).getByTestId('tag-writing')).toBeVisible()
    expect((await tags(page)).find((t) => t.id === tag.id)?.graceUntil).toBe(T0 + 600_000)
    await page.clock.setFixedTime(T0 + 90_000)
    await page.evaluate(() => {
      sessionStorage.setItem('runtag-fail-next-put', '1')
      ;(window as unknown as { __ndefResolve: () => void }).__ndefResolve()
    })
    await expect(row(page, tag.id).getByTestId('tag-error')).toHaveText("Tag written. That wasn't saved")
    await expect(page.getByTestId('tag-ready')).toHaveCount(0)
    expect((await tags(page)).find((t) => t.id === tag.id)).toEqual({ ...tag, graceUntil: T0 + 600_000 })
    await expectGraceTap(page, tag.id, T0 + 90_000)
    await expectGraceTap(page, tag.id, T0 + 9 * MIN)
  })

  test('(c) a write cannot outlive its deadline', async ({ page }) => {
    await page.addInitScript(ndefHarness)
    await openTags(page)
    const tag = await seedTag(page, A, T0 - HOUR)
    await page.evaluate(() => sessionStorage.setItem('runtag-ndef', 'pending'))
    await page.reload()
    await row(page, tag.id).getByTestId('tag-write').click()
    await expect(row(page, tag.id).getByTestId('tag-writing')).toBeVisible()
    await page.clock.setFixedTime(T0 + 121_000)
    await expect(row(page, tag.id).getByTestId('tag-error')).toHaveText('Writing timed out. Hold the phone on the sticker and try again.', { timeout: 3_000 })
    await expect(row(page, tag.id).getByTestId('tag-writing')).toHaveCount(0)
    await page.evaluate(() => (window as unknown as { __ndefResolve: () => void }).__ndefResolve()) // a late resolution
    await page.waitForTimeout(300)
    await expect(page.getByTestId('tag-ready')).toHaveCount(0)
    expect((await tags(page)).find((t) => t.id === tag.id)?.graceUntil).toBe(T0 + 600_000)
  })

  test('(d) hiding the page aborts the write', async ({ page }) => {
    await page.addInitScript(ndefHarness)
    await openTags(page)
    const tag = await seedTag(page, A, T0 - HOUR)
    await page.evaluate(() => sessionStorage.setItem('runtag-ndef', 'pending'))
    await page.reload()
    await row(page, tag.id).getByTestId('tag-write').click()
    await expect(row(page, tag.id).getByTestId('tag-writing')).toBeVisible()
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await expect(row(page, tag.id).getByTestId('tag-writing')).toHaveCount(0)
    await expect(page.getByTestId('tag-ready')).toHaveCount(0)
    await expect(row(page, tag.id).getByTestId('tag-error')).toBeVisible()
  })
})

test.describe('AC-TAGS-10 create-only grace expires; the list works offline (production service worker)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'SW interception is Chromium-only in Playwright')
  test.skip(!PROD, 'the generated service worker exists only in production builds (run with PW_PROD=1 after npm run build)')

  test('A2 and A5', async ({ page, context }) => {
    await openApp(page)
    await expect(page.getByTestId('ready-offline')).toBeVisible({ timeout: 30_000 })
    await page.goto('/app/tags')
    const gateA = await createThroughUi(page, 'Gate A')
    await page.clock.setFixedTime(T0 + MIN)
    await createThroughUi(page, 'Gate B')
    await page.clock.setFixedTime(T0 + 12 * MIN)
    for (const t of await tags(page)) expect(t.graceUntil).toBeLessThan(T0 + 12 * MIN)
    await tap(page, gateA.id, T0 + 12 * MIN)
    await expect(page.getByText('TAGGED')).toBeVisible()
    const [run] = await runs(page)
    expect(run).toMatchObject({ tagInId: gateA.id, status: 'open' })
    await expectPath(page, TAPPED + run.id)

    await context.setOffline(true)
    await page.goto('/app')
    await page.getByTestId('nav-tags').click()
    await expect(page.getByTestId('tag-row-name')).toHaveText(['Gate B', 'Gate A'])
    expect((await tags(page)).length).toBe(2)
  })
})
