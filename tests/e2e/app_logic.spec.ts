import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { computeChain, localDayOf, previousDay, newTagId } from '../../lib/app/chain'
import { resolveRoute } from '../../lib/app/route'
import { tagUrl, TAG_ORIGIN } from '../../lib/app/origin'
import type { Run } from '../../lib/app/store'

// Node-side checks of pure logic (APP-SHELL #24). No page is opened.

const run = (localDay: string, status: Run['status'] = 'done'): Run => ({
  id: `${localDay}-${status}-${Math.random()}`,
  status,
  tagInId: 'abc123def4',
  startedAt: Date.UTC(2026, 9, 12),
  localDay,
  tzOffsetMin: 0,
  lastTapAt: Date.UTC(2026, 9, 12),
})

test.describe('AC-SHELL-4 computeChain (APP-007)', () => {
  const today = '2026-10-12'
  const cases: Array<[string, Run[], number]> = [
    ['no runs', [], 0],
    ['today only', [run('2026-10-12')], 1],
    ['yesterday + today', [run('2026-10-11'), run('2026-10-12')], 2],
    ['-3, -2, today (missed -1)', [run('2026-10-09'), run('2026-10-10'), run('2026-10-12')], 1],
    ['-2, -1, no today', [run('2026-10-10'), run('2026-10-11')], 2],
    ['-3, -2 only', [run('2026-10-09'), run('2026-10-10')], 0],
    ['open and abandoned ignored', [run('2026-10-12', 'open'), run('2026-10-11', 'abandoned')], 0],
    ['two runs same day count once', [run('2026-10-12'), run('2026-10-12')], 1],
  ]
  for (const [name, runs, expected] of cases) {
    test(name, () => {
      expect(computeChain(runs, today)).toBe(expected)
    })
  }
  test('month boundary 2026-09-30, 2026-10-01', () => {
    expect(computeChain([run('2026-09-30'), run('2026-10-01')], '2026-10-01')).toBe(2)
  })
})

test.describe('local days', () => {
  test('localDayOf with an explicit offset', () => {
    const t = Date.UTC(2026, 9, 12, 23, 30) // 23:30 UTC
    expect(localDayOf(t, 0)).toBe('2026-10-12')
    expect(localDayOf(t, 60)).toBe('2026-10-13') // UTC+1
    expect(localDayOf(t, -300)).toBe('2026-10-12') // UTC-5
  })
  test('previousDay crosses months, years and the London DST change', () => {
    expect(previousDay('2026-10-01')).toBe('2026-09-30')
    expect(previousDay('2027-01-01')).toBe('2026-12-31')
    expect(previousDay('2026-10-26')).toBe('2026-10-25')
  })
})

test('newTagId matches ^[a-z0-9]{10}$ and is not constant', () => {
  const ids = Array.from({ length: 200 }, newTagId)
  for (const id of ids) expect(id).toMatch(/^[a-z0-9]{10}$/)
  expect(new Set(ids).size).toBe(200)
})

test('AC-SHELL-9 tag URLs only from TAG_ORIGIN', () => {
  expect(TAG_ORIGIN).toBe('https://runtag.vercel.app')
  expect(tagUrl('abc123def4')).toBe('https://runtag.vercel.app/t/abc123def4')
})

test('resolveRoute maps the address bar to views', () => {
  const v = (pathname: string, search = '') => resolveRoute({ pathname, search })
  expect(v('/app')).toEqual({ view: 'home' })
  expect(v('/app/')).toEqual({ view: 'home' })
  expect(v('/app', '?tapped=r1')).toEqual({ view: 'tapped', runId: 'r1' })
  expect(v('/app/tags')).toEqual({ view: 'tags' })
  expect(v('/app/settings')).toEqual({ view: 'settings' })
  expect(v('/app/nope')).toEqual({ view: 'not-found' })
  expect(v('/t/abc123def4')).toEqual({ view: 'tap', tagId: 'abc123def4' })
  expect(v('/t/ABC123def4')).toEqual({ view: 'invalid-tag' })
  expect(v('/t/a/b')).toEqual({ view: 'invalid-tag' })
  expect(v('/shell')).toEqual({ view: 'not-found' })
})

test.describe('AC-SHELL-8 / AC-SHELL-8B service worker build', () => {
  const root = path.join(__dirname, '..', '..')
  const template = fs.readFileSync(path.join(root, 'scripts/sw/sw.template.js'), 'utf8')

  test('cache name carries the build ID; install never skips waiting; SKIP_WAITING handled', () => {
    expect(template).toContain('`runtag-shell-${BUILD_ID}`')
    const install = template.slice(template.indexOf("addEventListener('install'"), template.indexOf("addEventListener('activate'"))
    expect(install).not.toContain('skipWaiting')
    expect(template).toMatch(/msg\.type === 'SKIP_WAITING'[\s\S]*self\.skipWaiting\(\)/)
  })

  test('two builds with different BUILD_IDs render byte-different sw.js', async () => {
    const { renderSw } = await import('../../scripts/sw/build-sw.mjs')
    const a = renderSw({ buildId: 'buildA', precache: ['/shell'], template })
    const b = renderSw({ buildId: 'buildB', precache: ['/shell'], template })
    expect(a).not.toBe(b)
    expect(a).toContain("const BUILD_ID = 'buildA'")
    expect(b).toContain("const BUILD_ID = 'buildB'")
  })
})

test('service worker matches build assets ignoring the ?dpl= deployment query (Vercel skew protection)', () => {
  const template = fs.readFileSync(path.join(__dirname, '..', '..', 'scripts/sw/sw.template.js'), 'utf8')
  const assets = template.slice(template.indexOf('// Build assets'), template.indexOf("self.addEventListener('message'"))
  expect(assets).toContain('ignoreSearch: true')
})


test('AC-CHAIN-12 the chain home keeps the service-worker update path', () => {
  const home = fs.readFileSync(path.join(__dirname, '..', '..', 'components/app/views/home.tsx'), 'utf8')
  expect(home).toMatch(/postMessage\(\{\s*type:\s*'SKIP_WAITING'\s*\}\)/)
  expect(home).toMatch(/controllerchange/)
  expect(home).toContain('data-testid="store-error"')
})
