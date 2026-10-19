import { test, expect, type Browser, type Page, type TestInfo } from '@playwright/test'
import fs from 'node:fs'
import type { Run, Tag } from '../../lib/app/store'
import {
  A, B, HOUR, MIN, T0, chainInPage, expectPath, metaOf, noMetrics, openApp, openRunAt, runs, seedMeta, seedRun, seedTag, storeReady, tags, tap,
} from './tap-helpers'

// J-APP-BACKUP (docs/contracts/journey_app_backup.yml): export, validated import, persistence, silo guard and
// the backup nudge (APP-DURABLE #33). Rows re-read through the real store; time only via page.clock.setFixedTime;
// context injection only by addInitScript property overrides or the context userAgent option.

test.use({ timezoneId: 'Europe/London' })

const NUDGE_MS = 604_800_000
const C = 'cccccccccc'
const D = 'dddddddddd'
const TAG_URL = (id: string) => `https://runtag.vercel.app/t/${id}`
const byId = <T extends { id: string }>(rows: T[]) => [...rows].sort((a, b) => (a.id < b.id ? -1 : 1))

/** Calendar day `offset` days from 2026-10-12. */
const day = (offset: number) => new Date(Date.UTC(2026, 9, 12 + offset)).toISOString().slice(0, 10)
const doneRun = (localDay: string, id = `done-${localDay}`): Run => {
  const startedAt = new Date(`${localDay}T07:00:00+01:00`).getTime()
  return { ...openRunAt(id, A, startedAt), localDay, status: 'done', endedAt: startedAt + 30 * MIN, tagOutId: B, lastTapAt: startedAt + 30 * MIN, lastTransition: 'out' }
}

/** A context with the project's device emulation (and optionally a different user agent). */
async function newCtx(browser: Browser, testInfo: TestInfo, userAgent?: string) {
  const u = testInfo.project.use
  return browser.newContext({
    baseURL: u.baseURL, viewport: u.viewport, userAgent: userAgent ?? u.userAgent, deviceScaleFactor: u.deviceScaleFactor,
    isMobile: u.isMobile, hasTouch: u.hasTouch, timezoneId: 'Europe/London',
  })
}

async function openSettings(page: Page) {
  await page.goto('/app/settings')
  await storeReady(page)
  await expect(page.getByTestId('backup-export')).toBeVisible()
}

/** Export through Settings (or the nudge card); returns the parsed file, its name and its path. */
async function exportBackup(page: Page, testId = 'backup-export') {
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByTestId(testId).click()])
  const filePath = await dl.path()
  return { name: dl.suggestedFilename(), path: filePath, json: JSON.parse(fs.readFileSync(filePath, 'utf8')) }
}

function writeFile(testInfo: TestInfo, name: string, content: unknown) {
  const p = testInfo.outputPath(name)
  fs.writeFileSync(p, typeof content === 'string' ? content : JSON.stringify(content))
  return p
}

const chooseFile = (page: Page, filePath: string) => page.getByTestId('backup-import').setInputFiles(filePath)

/** Persistence override (works in WebKit, which has no navigator.storage). */
function persistHarness() {
  Object.defineProperty(Navigator.prototype, 'storage', {
    configurable: true,
    get: () => ({
      persist: () => {
        sessionStorage.setItem('runtag-persist-calls', String(Number(sessionStorage.getItem('runtag-persist-calls') ?? 0) + 1))
        return Promise.resolve(sessionStorage.getItem('runtag-persist') === 'true')
      },
      estimate: () => Promise.resolve({}),
    }),
  })
}
const persistCalls = (page: Page) => page.evaluate(() => sessionStorage.getItem('runtag-persist-calls'))

/** Store writes fail while armed (all writes, or meta puts only), armed after the database exists. */
function failureHarness() {
  for (const m of ['put', 'add'] as const) {
    const real = IDBObjectStore.prototype[m]
    IDBObjectStore.prototype[m] = function (this: IDBObjectStore, ...args: unknown[]) {
      if (sessionStorage.getItem('runtag-fail-writes') === '1') throw new DOMException('full', 'QuotaExceededError')
      if (m === 'put' && this.name === 'meta' && sessionStorage.getItem('runtag-fail-meta') === '1') throw new DOMException('full', 'QuotaExceededError')
      return (real as (...a: unknown[]) => IDBRequest).apply(this, args)
    } as never
  }
}
const standalone = () => Object.defineProperty(Navigator.prototype, 'standalone', { configurable: true, get: () => true })

const fileOf = (t: Tag[], r: Run[], extra: Record<string, unknown> = {}) => ({ schemaVersion: 1, exportedAt: T0, tags: t, runs: r, meta: { schemaVersion: 1 }, ...extra })

test('AC-DUR-1 round trip: restore from the plant view, chain kept, re-export equal, re-import idempotent', async ({ page, browser }, testInfo) => {
  await openApp(page)
  const seededTags = [await seedTag(page, A), await seedTag(page, B), await seedTag(page, C)]
  for (let i = -7; i <= 0; i++) await seedRun(page, doneRun(day(i)))
  await seedRun(page, { ...openRunAt('gone-1', A, T0 - 9 * 24 * HOUR), localDay: day(-9), status: 'abandoned', abandonedAt: T0 - 8 * 24 * HOUR })
  await seedRun(page, openRunAt('open-1', A, T0 - 30 * MIN))
  // (1) chain 8; export A.
  await page.reload()
  await expect(page.getByTestId('chain-value')).toHaveText('8')
  await openSettings(page)
  const fileA = await exportBackup(page)
  expect(fileA.name).toBe('runtag-backup-2026-10-12.json')
  expect(fileA.json.exportedAt).toBe(T0)
  expect(fileA.json.tags).toEqual(byId(seededTags))
  await noMetrics(page, 'settings after export')

  // (2) a new phone: the plant view's restore link → Settings → import → Apply.
  const ctx = await newCtx(browser, testInfo)
  const p2 = await ctx.newPage()
  await p2.clock.setFixedTime(T0 + MIN)
  await p2.goto(`/t/${A}`)
  await expect(p2.getByTestId('tap-plant')).toBeVisible()
  await p2.getByText('Restore from backup').click()
  await expect(p2.getByTestId('view')).toHaveAttribute('data-view', 'settings')
  await chooseFile(p2, fileA.path)
  await expect(p2.getByTestId('backup-summary')).toHaveText('New: 3 tags, 10 runs. Already here: 0.')
  await noMetrics(p2, 'summary')
  await p2.getByTestId('backup-apply').click()
  await expect(p2.getByTestId('backup-done')).toContainText('Backup restored.')
  await p2.goto('/app')
  await p2.reload()
  await expect(p2.getByTestId('chain-value')).toHaveText('8')
  expect(await chainInPage(p2)).toBe(8)
  expect(byId(await runs(p2))).toEqual(fileA.json.runs)

  // (3) re-export equals the first (meta and exportedAt excluded).
  await openSettings(p2)
  const fileB = await exportBackup(p2)
  expect(fileB.json.tags).toEqual(fileA.json.tags)
  expect(fileB.json.runs).toEqual(fileA.json.runs)

  // (4) importing the same file again changes nothing.
  await chooseFile(p2, fileA.path)
  await expect(p2.getByTestId('backup-summary')).toHaveText('New: 0 tags, 0 runs. Already here: 13.')
  await p2.getByTestId('backup-apply').click()
  await expect(p2.getByTestId('backup-done')).toBeVisible()
  expect(byId(await tags(p2))).toEqual(fileA.json.tags)
  expect(byId(await runs(p2))).toEqual(fileA.json.runs)

  // (5) only now: the restored tag is recognised (this tap may change runs; nothing is compared after it).
  await p2.clock.setFixedTime(T0 + 2 * MIN)
  await p2.goto(`/t/${A}`)
  await expect.poll(() => new URL(p2.url()).pathname).toBe('/app')
  await expect(p2.getByTestId('tap-plant')).toHaveCount(0)
  await ctx.close()

  // (6) the file name is the local day, not the UTC date.
  const ctx3 = await newCtx(browser, testInfo)
  const p3 = await ctx3.newPage()
  await openApp(p3, Date.parse('2026-10-13T00:30:00+01:00'))
  await seedTag(p3, A)
  await openSettings(p3)
  expect((await exportBackup(p3)).name).toBe('runtag-backup-2026-10-13.json')
  await ctx3.close()
})

test('AC-DUR-2 files that are not RunTag backups write nothing', async ({ page }, testInfo) => {
  await openApp(page)
  const tagA = await seedTag(page, A)
  const r1 = await seedRun(page, doneRun(day(-1), 'r1'))
  await seedMeta(page, { lastExportAt: T0 - 24 * HOUR })
  const before = { tags: await tags(page), runs: await runs(page), meta: await metaOf(page) }
  const good = fileOf([tagA], [r1])
  const cases: Record<string, unknown> = {
    'not json': '{ nope',
    'top-level array': [],
    'schemaVersion 2': { ...good, schemaVersion: 2 },
    'exportedAt missing': (({ exportedAt: _e, ...rest }) => rest)(good),
    'meta null': { ...good, meta: null },
    'tag id ABC': { ...good, tags: [{ ...tagA, id: 'ABC' }] },
    '41-character name': { ...good, tags: [{ ...tagA, name: 'x'.repeat(41) }] },
    'duplicate tag id': { ...good, tags: [tagA, tagA] },
    'run status paused': { ...good, runs: [{ ...r1, status: 'paused' }] },
    'run localDay 12/10/2026': { ...good, runs: [{ ...r1, localDay: '12/10/2026' }] },
    'run missing startedAt': { ...good, runs: [(({ startedAt: _s, ...rest }) => rest)(r1)] },
    "run lastTransition 'x'": { ...good, runs: [{ ...r1, lastTransition: 'x' }] },
    "run tagOutId 'BAD'": { ...good, runs: [{ ...r1, tagOutId: 'BAD' }] },
    'extra key on a run': { ...good, runs: [{ ...r1, x: 1 }] },
  }
  await openSettings(page)
  for (const [name, content] of Object.entries(cases)) {
    await chooseFile(page, writeFile(testInfo, `${name.replace(/\W+/g, '-')}.json`, content))
    await expect(page.getByTestId('backup-invalid'), name).toHaveText("This isn't a RunTag backup")
    await expect(page.getByTestId('backup-summary')).toHaveCount(0)
    expect(await tags(page), name).toEqual(before.tags)
    expect(await runs(page), name).toEqual(before.runs)
    expect(await metaOf(page), name).toEqual(before.meta)
  }
  await noMetrics(page, 'invalid')
})

test('AC-DUR-3 conflicts: keep mine by default, cancel, repeat, use backup; abandoned runs stay settled', async ({ page }, testInfo) => {
  await openApp(page)
  const gate = await seedTag(page, A)
  await page.evaluate((t) => window.__runtagStore!.withTxn('readwrite', (s) => window.__runtagStore!.req(s.tags.put(t))), { ...gate, name: 'Gate' })
  const rearmed = await seedTag(page, D)
  await page.evaluate((t) => window.__runtagStore!.withTxn('readwrite', (s) => window.__runtagStore!.req(s.tags.put(t))), { ...rearmed, graceUntil: T0 + 600_000 })
  const r1 = await seedRun(page, doneRun(day(0), 'r1'))
  await seedMeta(page, { lastExportAt: T0 - 24 * HOUR })
  const metaBefore = await metaOf(page)
  const newTag = { id: B, name: 'Bench', createdAt: T0 - HOUR, graceUntil: T0 - HOUR + 600_000 }
  const backupRun = { ...r1, status: 'abandoned' as const, abandonedAt: T0 - MIN }
  const file = writeFile(testInfo, 'conflicts.json', fileOf([{ ...gate, name: 'Bridge' }, newTag, rearmed], [backupRun]))
  await openSettings(page)
  const before = { tags: await tags(page), runs: await runs(page) }

  await chooseFile(page, file)
  await expect(page.getByTestId('backup-summary')).toHaveText('New: 1 tags, 0 runs. Already here: 1.')
  await expect(page.getByTestId('backup-conflict')).toHaveCount(2)
  await expect(page.locator('[data-testid=backup-conflict][data-kind=tag]')).toHaveAttribute('data-id', A)
  await expect(page.locator('[data-testid=backup-conflict][data-kind=run]')).toContainText(`Run on Monday 12 October: yours finished, backup didn't count`)
  for (const keep of await page.getByTestId('backup-keep').all()) await expect(keep).toBeChecked()
  await noMetrics(page, 'conflicts')
  await page.getByTestId('backup-cancel').click()
  expect(await tags(page)).toEqual(before.tags)
  expect(await runs(page)).toEqual(before.runs)

  await chooseFile(page, file)
  await page.getByTestId('backup-apply').click()
  await expect(page.getByTestId('backup-done')).toBeVisible()
  const afterKeep = await tags(page)
  expect(afterKeep.find((t) => t.id === A)?.name).toBe('Gate')
  expect(afterKeep.find((t) => t.id === B)).toEqual(newTag)

  // An immediate repeat with Keep mine changes nothing.
  const beforeRepeat = { tags: await tags(page), runs: await runs(page) }
  await chooseFile(page, file)
  await expect(page.getByTestId('backup-conflict')).toHaveCount(2)
  await page.getByTestId('backup-apply').click()
  await expect(page.getByTestId('backup-done')).toBeVisible()
  expect(await tags(page)).toEqual(beforeRepeat.tags)
  expect(await runs(page)).toEqual(beforeRepeat.runs)

  // Repeat choosing Use backup replaces the tag.
  await chooseFile(page, file)
  await page.locator(`[data-testid=backup-conflict][data-id="${A}"] [data-testid=backup-use]`).check()
  await page.getByTestId('backup-apply').click()
  await expect(page.getByTestId('backup-done')).toBeVisible()
  expect((await tags(page)).find((t) => t.id === A)?.name).toBe('Bridge')
  const metaAfter = await metaOf(page)
  expect({ ...metaAfter, persistResult: undefined }).toEqual({ ...metaBefore, persistResult: undefined }) // import never changes meta
})

test('AC-DUR-3 a future-dated open run imported twice stays abandoned once', async ({ page }, testInfo) => {
  await openApp(page)
  await seedTag(page, A)
  const rf = openRunAt('rf-1', A, T0 + HOUR)
  const file = writeFile(testInfo, 'future.json', fileOf([], [rf]))
  await openSettings(page)
  await chooseFile(page, file)
  await page.getByTestId('backup-apply').click()
  await expect(page.getByTestId('backup-done')).toBeVisible()
  expect((await runs(page)).find((r) => r.id === 'rf-1')).toEqual({ ...rf, status: 'abandoned', abandonedAt: T0 })
  const afterFirst = await runs(page)

  await page.clock.setFixedTime(T0 + 1)
  await chooseFile(page, file)
  await expect(page.getByTestId('backup-summary')).toHaveText('New: 0 tags, 0 runs. Already here: 1.')
  await expect(page.getByTestId('backup-conflict')).toHaveCount(0)
  await page.getByTestId('backup-apply').click()
  await expect(page.getByTestId('backup-done')).toBeVisible()
  await expect(page.getByTestId('backup-changed')).toHaveCount(0)
  expect(await runs(page)).toEqual(afterFirst)
})

test.describe('AC-DUR-4 at most one open run; changes after the plan are caught', () => {
  test('(a) the newer open run wins; (b) a future-dated backup run never displaces a valid one', async ({ page }, testInfo) => {
    await openApp(page)
    await seedTag(page, A)
    const r1 = await seedRun(page, openRunAt('r1', A, T0 - HOUR))
    const r2 = openRunAt('r2', A, T0 - 30 * MIN)
    await openSettings(page)
    await chooseFile(page, writeFile(testInfo, 'newer.json', fileOf([], [r2])))
    await page.getByTestId('backup-apply').click()
    await expect(page.getByTestId('backup-done')).toBeVisible()
    let rows = await runs(page)
    expect(rows.find((r) => r.id === 'r2')).toEqual(r2)
    expect(rows.find((r) => r.id === 'r1')).toEqual({ ...r1, status: 'abandoned', abandonedAt: T0 })
    expect(rows.filter((r) => r.status === 'open').map((r) => r.id)).toEqual(['r2'])

    const r3 = await seedRun(page, openRunAt('r3', A, T0 - 10 * MIN)) // a valid local open run after the test above
    await page.evaluate((r) => window.__runtagStore!.withTxn('readwrite', (s) => window.__runtagStore!.req(s.runs.put(r))), { ...r2, status: 'done', endedAt: T0 - 20 * MIN, lastTransition: 'out' })
    const future = openRunAt('rf', A, T0 + HOUR)
    await chooseFile(page, writeFile(testInfo, 'future.json', fileOf([], [future])))
    await page.getByTestId('backup-apply').click()
    await expect(page.getByTestId('backup-done')).toBeVisible()
    rows = await runs(page)
    expect(rows.find((r) => r.id === 'r3')).toEqual(r3)
    expect(rows.find((r) => r.id === 'rf')).toEqual({ ...future, status: 'abandoned', abandonedAt: T0 })
  })

  test('(c) a tap on another page between plan and Apply leaves exactly one open run', async ({ context }, testInfo) => {
    const [p1, p2] = [await context.newPage(), await context.newPage()]
    await openApp(p1)
    await seedTag(p1, A)
    const r2 = openRunAt('r2', A, T0 - 30 * MIN)
    await openSettings(p1)
    await chooseFile(p1, writeFile(testInfo, 'r2.json', fileOf([], [r2])))
    await expect(p1.getByTestId('backup-summary')).toBeVisible()
    await tap(p2, A, T0)
    await expect(p2.getByText('TAGGED')).toBeVisible()
    const [r3] = (await runs(p2)).filter((r) => r.status === 'open')
    await p1.getByTestId('backup-apply').click()
    await expect(p1.getByTestId('backup-done')).toBeVisible()
    const rows = await runs(p1)
    expect(rows.filter((r) => r.status === 'open')).toEqual([r3])
    expect(rows.find((r) => r.id === 'r2')).toEqual({ ...r2, status: 'abandoned', abandonedAt: T0 })
  })

  for (const choice of ['keep', 'use'] as const) {
    test(`(c) a rename after the plan is caught (${choice})`, async ({ context }, testInfo) => {
      const [p1, p2] = [await context.newPage(), await context.newPage()]
      await openApp(p1)
      const gate = await seedTag(p1, A)
      await openSettings(p1)
      await chooseFile(p1, writeFile(testInfo, 'bridge.json', fileOf([{ ...gate, name: 'Bridge' }], [])))
      await expect(p1.getByTestId('backup-conflict')).toHaveCount(1)
      if (choice === 'use') await p1.getByTestId('backup-use').check()
      await p2.goto('/app/tags')
      await p2.locator(`[data-testid=tag-row][data-tag-id="${A}"] [data-testid=tag-rename]`).click()
      await p2.getByTestId('tag-rename-input').fill('Pier')
      await p2.getByTestId('tag-rename-save').click()
      await expect.poll(async () => (await tags(p1)).find((t) => t.id === A)?.name).toBe('Pier')
      const page2State = { tags: await tags(p1), runs: await runs(p1) }
      await p1.getByTestId('backup-apply').click()
      await expect(p1.getByTestId('backup-changed')).toHaveText('Your data changed. Check the list again.')
      expect(await tags(p1)).toEqual(page2State.tags)
      expect(await runs(p1)).toEqual(page2State.runs)
      await expect(p1.getByTestId('backup-conflict')).toContainText('Tag: Pier (yours) / Bridge (backup)')
      await p1.getByTestId('backup-use').check()
      await p1.getByTestId('backup-apply').click()
      await expect(p1.getByTestId('backup-done')).toBeVisible()
      expect((await tags(p1)).find((t) => t.id === A)?.name).toBe('Bridge')
    })
  }
})

test.describe('AC-DUR-5 persistence is requested after a plant or an import', () => {
  test('(a) refused: the warning shows on Settings and in the home card', async ({ page }) => {
    await page.addInitScript(persistHarness)
    await openApp(page)
    await page.goto('/app/tags')
    await storeReady(page)
    await page.getByTestId('tag-create-name').fill('Gate')
    await page.getByTestId('tag-create').click()
    await expect.poll(async () => (await metaOf(page)).persistResult).toBe(false)
    await openSettings(page)
    await expect(page.getByTestId('persist-warning')).toHaveText('Your phone may clear this data. Export a backup.')
    await page.goto('/app')
    await page.reload()
    await expect(page.getByTestId('backup-nudge').getByTestId('persist-warning')).toBeVisible()
    await noMetrics(page, 'home with the card')
  })

  test('(b) granted on the first plant, asked once', async ({ page }) => {
    await page.addInitScript(persistHarness)
    await openApp(page)
    await page.evaluate(() => sessionStorage.setItem('runtag-persist', 'true'))
    await tap(page, C, T0)
    await page.getByTestId('plant-just-save').click()
    await expectPath(page, '/app')
    await expect.poll(async () => (await metaOf(page)).persistResult).toBe(true)
    await openSettings(page)
    await expect(page.getByTestId('persist-ok')).toHaveText('This phone keeps your data.')
    await page.goto('/app/tags')
    await page.getByTestId('tag-create-name').fill('Gate')
    await page.getByTestId('tag-create').click()
    await expect(page.getByText('Tag created')).toBeVisible()
    await page.waitForTimeout(300)
    expect(await persistCalls(page)).toBe('1')
  })

  test('(c) a restore-only phone is asked after the import', async ({ page }, testInfo) => {
    await page.addInitScript(persistHarness)
    await openApp(page)
    await openSettings(page)
    await chooseFile(page, writeFile(testInfo, 'one.json', fileOf([{ id: A, name: 'Gate', createdAt: T0 - HOUR, graceUntil: T0 - HOUR + 600_000 }], [])))
    await page.getByTestId('backup-apply').click()
    await expect(page.getByTestId('backup-done')).toBeVisible()
    await expect.poll(async () => (await metaOf(page)).persistResult).toBe(false)
    expect(await persistCalls(page)).toBe('1')
  })

  test('(d) without the storage API the result is false', async ({ page }) => {
    await openApp(page)
    await page.goto('/app/tags')
    await storeReady(page)
    await page.getByTestId('tag-create-name').fill('Gate')
    await page.getByTestId('tag-create').click()
    await expect.poll(async () => (await metaOf(page)).persistResult).toBe(false)
  })

  test('(e) a failed meta write after the tag commits writes one tag and asks again next time', async ({ page }) => {
    await page.addInitScript(persistHarness)
    await page.addInitScript(failureHarness)
    await openApp(page)
    await page.goto('/app/tags')
    await storeReady(page)
    await page.evaluate(() => sessionStorage.setItem('runtag-fail-meta', '1'))
    await page.getByTestId('tag-create-name').fill('Gate')
    await page.getByTestId('tag-create').click()
    await expect(page.getByText('Tag created')).toBeVisible()
    await expect.poll(() => persistCalls(page)).toBe('1')
    await page.waitForTimeout(300)
    expect((await tags(page)).map((t) => t.name)).toEqual(['Gate'])
    expect((await metaOf(page)).persistResult).toBeUndefined()
    await expect(page.getByTestId('tag-failed')).toHaveCount(0)
    await expect(page.getByTestId('backup-failed')).toHaveCount(0)
    await page.evaluate(() => sessionStorage.removeItem('runtag-fail-meta'))
    await page.getByTestId('tag-create-name').fill('Bench')
    await page.getByTestId('tag-create').click()
    await expect.poll(async () => (await tags(page)).map((t) => t.name).sort()).toEqual(['Bench', 'Gate'])
    await expect.poll(async () => (await metaOf(page)).persistResult).toBe(false)
  })
})

test('AC-DUR-6 Home Screen app: notice on load; planting and restore blocked', async ({ page, browser }, testInfo) => {
  await page.addInitScript(standalone)
  await openApp(page)
  const tagA = await seedTag(page, A)
  const r1 = await seedRun(page, openRunAt('r1', A, T0 - 10 * MIN))
  for (const url of ['/app', '/app/tags', '/app/settings']) {
    await page.goto(url)
    await expect(page.getByTestId('silo-blocked'), url).toHaveText("Plant tags in Safari. Tags planted in the Home Screen app can't be read when you tap them.")
  }
  await expect(page.getByTestId('backup-import')).toHaveCount(0)
  await expect(page.getByText('Restore your backup in Safari.')).toBeVisible()
  await page.goto('/app/tags')
  await page.getByTestId('tag-create-name').fill('Oak at gate')
  await page.getByTestId('tag-create').click()
  await page.waitForTimeout(300)
  expect(await tags(page)).toEqual([tagA])
  await tap(page, C, T0)
  await expect(page.getByTestId('silo-blocked')).toBeVisible()
  for (const id of ['plant-save-tapout', 'plant-just-save']) {
    await page.getByTestId(id).click()
    await page.waitForTimeout(200)
  }
  expect(await tags(page)).toEqual([tagA])
  expect(await runs(page)).toEqual([r1])
  await noMetrics(page, 'plant view blocked')

  // Positive control: the same build without the override plants.
  const ctx = await newCtx(browser, testInfo)
  const p2 = await ctx.newPage()
  await openApp(p2)
  await p2.goto('/app/tags')
  await p2.getByTestId('tag-create-name').fill('Oak at gate')
  await p2.getByTestId('tag-create').click()
  await expect(p2.getByText('Tag created')).toBeVisible()
  expect(await tags(p2)).toEqual([expect.objectContaining({ name: 'Oak at gate', createdAt: T0 })])
  await expect(p2.getByTestId('silo-blocked')).toHaveCount(0)
  await ctx.close()
})

test('AC-DUR-7 AC-DUR-8 in-app browser: warning on load, one confirmation per press, private note', async ({ browser, browserName }, testInfo) => {
  const ctx = await newCtx(browser, testInfo, `${testInfo.project.use.userAgent} Instagram 300.0.0`)
  if (browserName === 'chromium') await ctx.grantPermissions(['clipboard-read', 'clipboard-write'])
  const page = await ctx.newPage()
  await openApp(page)
  const seeded = [await seedTag(page, A)]

  await tap(page, C, T0)
  await expect(page.getByTestId('silo-warning')).toContainText("This browser keeps its own storage, so taps won't find these tags.")
  await expect(page.getByTestId('private-note')).toHaveText('Private tabs forget your chain.')
  await page.getByTestId('plant-name').fill('Bridge')
  await page.getByTestId('plant-just-save').click()
  await expect(page.getByTestId('silo-confirm')).toHaveText('Plant here anyway')
  expect(await tags(page)).toEqual(seeded)
  await expect(page.locator('[data-testid=tap-primary]')).toHaveCount(1)
  await noMetrics(page, 'in-app confirm')
  await page.getByTestId('silo-copy').click()
  if (browserName === 'chromium') expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(TAG_URL(C))
  else await expect(page.getByText(/Link copied|Copy this link:/)).toBeVisible()
  await page.getByTestId('silo-confirm').click()
  await expectPath(page, '/app')
  expect(byId(await tags(page))).toEqual(byId([...seeded, { id: C, name: 'Bridge', createdAt: T0, graceUntil: T0 + 600_000 }]))

  // A double click on the confirmation still plants one tag.
  await tap(page, D, T0 + MIN)
  await page.getByTestId('plant-just-save').click()
  await page.getByTestId('silo-confirm').dblclick()
  await expectPath(page, '/app')
  expect((await tags(page)).length).toBe(3)

  // Save and tap out here + confirmation ends the open run at the new tag.
  const r1 = await seedRun(page, openRunAt('r1', A, T0))
  await tap(page, 'eeeeeeeeee', T0 + 2 * MIN)
  await page.getByTestId('plant-save-tapout').click()
  await expect(page.locator('[data-testid=tap-primary]')).toHaveCount(1)
  await page.getByTestId('silo-confirm').click()
  await expect.poll(async () => (await runs(page)).find((r) => r.id === r1.id)?.status).toBe('done')
  expect((await runs(page)).find((r) => r.id === r1.id)).toMatchObject({ status: 'done', tagOutId: 'eeeeeeeeee' })

  // /app/tags: the first press and Enter only reveal the confirmation.
  await page.goto('/app/tags')
  await expect(page.getByTestId('silo-warning')).toBeVisible()
  await expect(page.getByTestId('private-note')).toBeVisible()
  const count = (await tags(page)).length
  await page.getByTestId('tag-create-name').fill('Pier')
  await page.getByTestId('tag-create').click()
  await page.getByTestId('tag-create-name').press('Enter')
  await page.waitForTimeout(300)
  expect((await tags(page)).length).toBe(count)
  await page.getByTestId('silo-confirm').click()
  await expect(page.getByText('Tag created')).toBeVisible()
  expect((await tags(page)).length).toBe(count + 1)
  await ctx.close()

  // Positive control: the project user agent shows no warning.
  const plain = await newCtx(browser, testInfo)
  const p2 = await plain.newPage()
  await openApp(p2)
  await tap(p2, C, T0)
  await expect(p2.getByTestId('tap-plant')).toBeVisible()
  await expect(p2.getByTestId('silo-warning')).toHaveCount(0)
  await expect(p2.getByTestId('private-note')).toBeVisible()
  await plain.close()
})

test.describe('AC-DUR-9 last backup and the nudge', () => {
  test('never exported with 3 done runs → card; Back up now; boundary; Not now', async ({ page }) => {
    await openApp(page)
    await seedTag(page, A)
    await seedTag(page, B)
    for (const i of [-2, -1, 0]) await seedRun(page, doneRun(day(i)))
    await page.reload()
    await expect(page.getByTestId('last-backup')).toHaveText('Last backup: never')
    await expect(page.getByTestId('backup-nudge')).toContainText('Back up your chain')
    await noMetrics(page, 'home with the nudge')
    const file = await exportBackup(page, 'backup-nudge-export')
    expect(file.json.runs).toHaveProperty('length', 3)
    await expect.poll(async () => (await metaOf(page)).lastExportAt).toBe(T0)
    await expect(page.getByTestId('backup-nudge')).toHaveCount(0)
    await expect(page.getByTestId('last-backup')).toHaveText('Last backup: Monday 12 October')

    await page.clock.setFixedTime(T0 + NUDGE_MS)
    await page.reload()
    await expect(page.getByTestId('history-day').first()).toBeVisible()
    await expect(page.getByTestId('backup-nudge')).toHaveCount(0)
    await page.clock.setFixedTime(T0 + NUDGE_MS + 1)
    await page.reload()
    await expect(page.getByTestId('backup-nudge')).toBeVisible()
    await page.getByTestId('backup-nudge-dismiss').click()
    await expect.poll(async () => (await metaOf(page)).backupNudgeDismissedUntil).toBe(T0 + NUDGE_MS + 1 + NUDGE_MS)
    await page.reload()
    await expect(page.getByTestId('history-day').first()).toBeVisible()
    await expect(page.getByTestId('backup-nudge')).toHaveCount(0)
  })

  test('no card for 2 done runs with persistence granted; card for a refused persistence with no runs', async ({ page }) => {
    await openApp(page)
    for (const i of [-1, 0]) await seedRun(page, doneRun(day(i)))
    await seedMeta(page, { persistResult: true })
    await page.reload()
    await expect(page.getByTestId('last-backup')).toBeVisible()
    await expect(page.getByTestId('backup-nudge')).toHaveCount(0)

    await page.evaluate(() => window.__runtagStore!.withTxn('readwrite', (s) => window.__runtagStore!.req(s.runs.clear())))
    await seedMeta(page, { persistResult: false })
    await page.reload()
    await expect(page.getByTestId('backup-nudge').getByTestId('persist-warning')).toBeVisible()
  })

  test('two pages: Not now and an export keep both fields', async ({ context }) => {
    const [p1, p2] = [await context.newPage(), await context.newPage()]
    await openApp(p1)
    await seedMeta(p1, { persistResult: false })
    await p1.reload()
    await expect(p1.getByTestId('backup-nudge')).toBeVisible()
    await openSettings(p2)
    await p1.getByTestId('backup-nudge-dismiss').click()
    await exportBackup(p2)
    await expect.poll(async () => {
      const m = await metaOf(p1)
      return [m.backupNudgeDismissedUntil, m.lastExportAt]
    }).toEqual([T0 + NUDGE_MS, T0])
  })
})

test.describe('AC-DUR-10 failures write nothing', () => {
  test('Apply, Not now and the export bookkeeping', async ({ page }, testInfo) => {
    await page.addInitScript(failureHarness)
    await openApp(page)
    await seedTag(page, A)
    await seedMeta(page, { persistResult: false })
    const before = { tags: await tags(page), runs: await runs(page), meta: await metaOf(page) }
    await openSettings(page)
    await chooseFile(page, writeFile(testInfo, 'b.json', fileOf([{ id: B, name: 'Bench', createdAt: T0 - HOUR, graceUntil: T0 - HOUR + 600_000 }], [])))
    await page.evaluate(() => sessionStorage.setItem('runtag-fail-writes', '1'))
    await page.getByTestId('backup-apply').click()
    await expect(page.getByTestId('backup-failed')).toContainText("That wasn't saved")
    await noMetrics(page, 'failure')
    expect(await tags(page)).toEqual(before.tags)
    expect(await runs(page)).toEqual(before.runs)
    expect(await metaOf(page)).toEqual(before.meta)
    await page.evaluate(() => sessionStorage.removeItem('runtag-fail-writes'))
    await page.getByTestId('backup-retry').click()
    await expect(page.getByTestId('backup-done')).toBeVisible()
    expect((await tags(page)).map((t) => t.id).sort()).toEqual([A, B])

    // Export bookkeeping: the download happens once; Retry saves without downloading again.
    let downloads = 0
    page.on('download', () => downloads++)
    await page.evaluate(() => sessionStorage.setItem('runtag-fail-writes', '1'))
    const lastBefore = (await metaOf(page)).lastExportAt
    await page.getByTestId('backup-export').click()
    await expect(page.getByTestId('backup-failed')).toBeVisible()
    expect(downloads).toBe(1)
    expect((await metaOf(page)).lastExportAt).toBe(lastBefore)
    await page.evaluate(() => sessionStorage.removeItem('runtag-fail-writes'))
    await page.getByTestId('backup-retry').click()
    await expect.poll(async () => (await metaOf(page)).lastExportAt).toBe(T0)
    expect(downloads).toBe(1)

    // Not now on home: the card stays while armed; Retry dismisses.
    await page.goto('/app')
    await expect(page.getByTestId('backup-nudge')).toBeVisible()
    await page.evaluate(() => sessionStorage.setItem('runtag-fail-writes', '1'))
    await page.getByTestId('backup-nudge-dismiss').click()
    await expect(page.getByTestId('backup-failed')).toBeVisible()
    await expect(page.getByTestId('backup-nudge')).toBeVisible()
    expect((await metaOf(page)).backupNudgeDismissedUntil).toBeUndefined()
    await page.evaluate(() => sessionStorage.removeItem('runtag-fail-writes'))
    await page.getByTestId('backup-retry').click()
    await expect.poll(async () => (await metaOf(page)).backupNudgeDismissedUntil).toBe(T0 + NUDGE_MS)
  })

  test('a newer database version shows the store error on Settings', async ({ page }) => {
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
    await page.goto('/app/settings')
    await expect(page.getByTestId('store-error')).toContainText('newer-schema')
    await expect(page.getByTestId('backup-import')).toHaveCount(0)
    await expect(page.getByTestId('nav-settings')).toBeVisible()
  })
})

test('AC-DUR-11 Settings controls are labelled and at least 48 × 48 px', async ({ page }, testInfo) => {
  await openApp(page)
  const gate = await seedTag(page, A)
  await openSettings(page)
  await chooseFile(page, writeFile(testInfo, 'c.json', fileOf([{ ...gate, name: 'Bridge' }], [])))
  await expect(page.getByTestId('backup-conflict')).toHaveCount(1)
  await noMetrics(page, 'settings with a conflict')
  for (const input of await page.locator('main input').all()) expect(await input.getAttribute('aria-label')).toBeTruthy()
  for (const btn of await page.locator('main button').all()) {
    const box = (await btn.boundingBox())!
    expect(box.width, await btn.innerText()).toBeGreaterThanOrEqual(48)
    expect(box.height, await btn.innerText()).toBeGreaterThanOrEqual(48)
  }
})
