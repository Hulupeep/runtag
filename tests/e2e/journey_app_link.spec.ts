import { test, expect, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// J-APP-LINK (docs/contracts/journey_app_link.yml): the demo leads to the real app, and the release documents
// carry the corrected texts and a Gate D-ready device checklist (APP-LINK #35).

const ROOT = path.join(__dirname, '..', '..')
const read = (f: string) => fs.readFileSync(path.join(ROOT, f), 'utf8')
// A mutation run may point the checklist check at a modified copy (CHECKLIST_PATH, absolute); normal runs read the repo file.
const CHECKLIST = process.env.CHECKLIST_PATH ?? path.join(ROOT, 'docs/release/runtag-app-v1-device-checklist.md')

const R1 = 'Vercel request logs record tag ID, IP, user agent and time for online taps (plan retention); no analytics scripts on `/t/*` or `/app*`.'
const R2 = 'Every tap screen shows one primary button (hypothesised WebKit user-interaction signal; confirmed or refuted by the §7 8-day iOS check).'
const R3 = 'Revenue: none in v1; validation only. Alternative today: calendar/streak app or iOS Shortcuts NFC automation; delta: no install, no typing, metric-free chain.'
const R4 = "Private browsing is not detected (no reliable signal); the plant screen states 'Private tabs forget your chain.'"

/** Scene 8 by testids (no copy-coupled labels): start → tap in → run → tap out → continue → continue. */
async function toScene8(page: Page, isMobile: boolean) {
  const press = (l: ReturnType<Page['getByTestId']>) => (isMobile ? l.tap() : l.click())
  await page.goto('/')
  await press(page.getByTestId('start-demo-button'))
  await press(page.getByTestId('nfc-tag'))
  await expect(page.getByTestId('scene-5')).toBeVisible({ timeout: 10_000 })
  await press(page.getByTestId('nfc-tag'))
  await press(page.getByTestId('scene-6').getByRole('button'))
  await press(page.getByTestId('scene-7').getByRole('button'))
  await expect(page.getByTestId('scene-8')).toBeVisible()
}

test('AC-LINK-1 scene 8 adds Start for real; the £19 button and the waitlist stay; the link loads /app', async ({ page, isMobile }) => {
  await toScene8(page, isMobile)
  const link = page.getByTestId('start-for-real')
  await expect(link).toHaveText('Start for real')
  await expect(link).toHaveAttribute('href', '/app')
  await expect(page.getByRole('button', { name: 'Get Starter Kit – £19' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Email address' })).toBeVisible()
  await (isMobile ? link.tap() : link.click())
  await expect(page.getByTestId('view')).toHaveAttribute('data-view', 'home')
  expect(new URL(page.url()).pathname).toBe('/app')
  expect(await page.evaluate(() => (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming).name)).toMatch(/\/app$/)
})

test('AC-LINK-1 the link sits outside both waitlist branches, so it stays after a signup', () => {
  const src = read('components/scenes/Scene8CTA.tsx')
  const branchEnd = src.indexOf('You&apos;re on the list!')
  const link = src.indexOf('data-testid="start-for-real"')
  const socialProof = src.indexOf('COPY.scene8.socialProof')
  expect(branchEnd).toBeGreaterThan(0)
  expect(link).toBeGreaterThan(branchEnd)
  expect(link).toBeLessThan(socialProof)
  const between = src.slice(branchEnd, link)
  expect(between).toMatch(/\)\}\s*\n/) // the {!submitted ? … : …} expression closes before the link
  const tag = src.slice(src.lastIndexOf('<', link), link)
  expect(tag).toMatch(/^<a\s/) // a plain anchor, not a motion element
  expect(src).not.toMatch(/from\s+['"]next\/link['"]/)
})

test('AC-LINK-2 reachable by Tab after the £19 button, at least 48 × 48, in the pinned order', async ({ page, isMobile }) => {
  await toScene8(page, isMobile)
  const box = (await page.getByTestId('start-for-real').boundingBox())!
  expect(box.width).toBeGreaterThanOrEqual(48)
  expect(box.height).toBeGreaterThanOrEqual(48)
  const order = await page.getByTestId('scene-8').evaluate((scene) => {
    const form = scene.querySelector('form')!
    const link = scene.querySelector('[data-testid=start-for-real]')!
    const proof = [...scene.querySelectorAll('p')].find((p) => /chains unbroken this week/.test(p.textContent ?? ''))!
    const restart = scene.querySelector('[data-testid=restart-button]')!
    const before = (a: Node, b: Node) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)
    return [before(form, link), before(link, proof), before(proof, restart)]
  })
  expect(order).toEqual([true, true, true])
  await page.getByRole('textbox', { name: 'Email address' }).focus()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Get Starter Kit – £19' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByTestId('start-for-real')).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('view')).toHaveAttribute('data-view', 'home')
  expect(await page.evaluate(() => (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming).name)).toMatch(/\/app$/)
})

test('AC-LINK-4 the release notes carry R1–R4 exactly and never the replaced sentence', () => {
  const lines = read('docs/release/runtag-app-v1.md').split('\n')
  for (const r of [R1, R2, R3, R4]) expect(lines, r.slice(0, 40)).toContain(r)
  expect(lines.join('\n')).not.toContain('contain only random tag IDs')
})

test('AC-LINK-5 the device checklist is complete and Gate D ready', () => {
  const doc = fs.readFileSync(CHECKLIST, 'utf8')
  const sections = doc.split(/^### /m).slice(1)
  expect(sections.map((s) => Number(s.split('.')[0]))).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  const fields = ['Hop:', 'Expected:', 'Evidence:', 'Result:', 'Date:', 'Phone / OS / browser:']
  const field = (s: string, f: string) => s.split('\n').find((l) => l.startsWith(f)) ?? ''
  for (const s of sections) {
    const at = fields.map((f) => s.split('\n').findIndex((l) => l.startsWith(f)))
    expect(at.every((i) => i >= 0), s.slice(0, 30)).toBe(true)
    expect([...at].sort((a, b) => a - b), s.slice(0, 30)).toEqual(at) // in this order
    for (const f of fields) expect(field(s, f).slice(f.length).trim(), `${s.slice(0, 20)} ${f}`).not.toBe('') // unexecuted fields carry 'pending — owner'
  }
  const hop = (n: number) => field(sections[n - 1], 'Hop:').slice(4).trim()
  expect([hop(2), hop(4), hop(5), hop(6)]).toEqual(['I16', 'I17', 'A11', 'A12'])
  const evidence = (n: number) => field(sections[n - 1], 'Evidence:').match(/`[^`]+`/g)!.map((e) => e.slice(1, -1))
  for (let n = 1; n <= 10; n++) for (const e of evidence(n)) expect(e, `item ${n}`).toMatch(/\.(png|txt|json)$/)
  for (const n of [2, 3, 4, 5, 6, 7, 8, 9, 10]) expect(evidence(n).some((e) => /\.(txt|json)$/.test(e)), `item ${n}`).toBe(true)
  expect(evidence(2)).toContain('I16-timeline.txt')
  expect(evidence(6)).toEqual(expect.arrayContaining(['A12-anonymous.txt', 'A12-signed-in.txt']))
  expect(evidence(9)).toContain('demo-link.txt')
  expect(sections[3]).toMatch(/^APP-021 hypothesis:/m)

  // The delegated DoD texts, extracted between the first quote after "verbatim:" and the last quote on that line.
  const delegated = (file: string) => {
    const line = read(file).split('\n').filter((l) => l.includes('APP-LINK #19 device checklist') && l.includes('verbatim:'))
    expect(line, file).toHaveProperty('length', 1)
    const l = line[0]
    return l.slice(l.indexOf('"', l.indexOf('verbatim:')) + 1, l.lastIndexOf('"'))
  }
  expect(field(sections[4], 'Expected:')).toContain(delegated('docs/specs/app/APP-TAGS.md'))
  expect(field(sections[3], 'Expected:')).toContain(delegated('docs/specs/app/APP-DURABLE.md'))
})
