import { test, expect } from '@playwright/test'
import {
  A, HOUR, MIN, T0, TAPPED, X,
  byId, checkView, expectPath, openApp, openRunAt, openRuns, primary, runs, seedRun, seedTag, storeReady, tags, tap,
} from './tap-helpers'

// J-APP-PLANT, tap part (docs/contracts/journey_app_plant.yml): first scan of a tag on this phone (APP-TAP #27).

test.use({ timezoneId: 'Europe/London' })

test('AC-TAP-1 AC-TAP-2 AC-TAP-5 plant a new tag, start a run, then the next load is setup grace', async ({ page }) => {
  await openApp(page)
  await tap(page, X, T0)
  await expect(page.getByTestId('tap-plant')).toBeVisible()
  await expect(page.getByTestId('tap-tag-id')).toHaveAttribute('data-tag-id', X)
  await expect(page.getByText('Plant this tag')).toBeVisible()
  await expect(page.getByTestId('plant-name')).toHaveValue('My tag')
  await expect(page.getByTestId('plant-save-start')).toBeVisible()
  await expect(page.getByTestId('plant-just-save')).toBeVisible()
  await expect(page.getByText('Restore from backup')).toBeVisible()
  await expect(page.getByTestId('plant-save-tapout')).toHaveCount(0)
  await checkView(page, 'plant, no run')
  expect(await tags(page)).toHaveLength(0)

  await page.getByTestId('plant-name').fill('Oak at gate')
  await page.getByTestId('plant-save-start').click()
  await expect(page.getByText('TAGGED')).toBeVisible()
  const [run] = await runs(page)
  await expectPath(page, TAPPED + run.id)

  await page.reload()
  await storeReady(page)
  expect(await tags(page)).toEqual([{ id: X, name: 'Oak at gate', createdAt: T0, graceUntil: T0 + 600_000 }])
  const rows = await runs(page)
  expect(rows).toEqual([expect.objectContaining({ id: run.id, status: 'open', tagInId: X, startedAt: T0, lastTransition: 'in' })])

  // Gherkin: 2 minutes later the same tag is inside setup grace — nothing changes.
  await tap(page, X, T0 + 2 * MIN)
  await expectPath(page, `${TAPPED}${run.id}&grace=${X}`)
  await expect(page.getByText('Tag works ✓')).toBeVisible()
  await expect(primary(page)).toHaveText('Finish run')
  await checkView(page, 'grace, run open')
  expect(await runs(page)).toEqual(rows)
})

test('AC-TAP-3 AC-TAP-5 Just save stores the tag only; grace without a run offers Start run', async ({ page }) => {
  await openApp(page)
  await tap(page, X, T0)
  await page.getByTestId('plant-name').fill('Bridge')
  await page.getByTestId('plant-just-save').click()
  await expectPath(page, '/app')
  await storeReady(page)
  expect(await tags(page)).toEqual([{ id: X, name: 'Bridge', createdAt: T0, graceUntil: T0 + 600_000 }])
  expect(await runs(page)).toHaveLength(0)

  await tap(page, X, T0 + MIN)
  await expectPath(page, `/app?grace=${X}`)
  await expect(page.getByText('Tag works ✓')).toBeVisible()
  await expect(primary(page)).toHaveText('Start run')
  await checkView(page, 'grace, no run')
  expect(await runs(page)).toHaveLength(0)

  // Grace applies to page loads only: the explicit button starts a run at once.
  await primary(page).click()
  await expect(page.getByText('TAGGED')).toBeVisible()
  const rows = await runs(page)
  expect(rows).toEqual([expect.objectContaining({ status: 'open', tagInId: X, startedAt: T0 + MIN })])
  await expectPath(page, TAPPED + rows[0].id)
})

test('AC-TAP-4 unknown tag while a run is open: Save and tap out here finishes it at the new tag', async ({ page }) => {
  await openApp(page)
  await seedTag(page, A)
  const r1 = await seedRun(page, openRunAt('run-1', A, T0 - 30 * MIN))
  await tap(page, X, T0)
  await expect(page.getByTestId('plant-save-tapout')).toBeVisible()
  await expect(page.getByTestId('plant-save-start')).toHaveCount(0)
  await checkView(page, 'plant, run open')
  await page.getByTestId('plant-save-tapout').click()
  await expectPath(page, TAPPED + r1.id)
  await expect(page.getByText('Day 1. Chain unbroken.')).toBeVisible()
  expect(await byId(page, r1.id)).toMatchObject({ status: 'done', tagOutId: X, endedAt: T0, lastTapAt: T0, lastTransition: 'out' })
  expect((await tags(page)).map((t) => t.id).sort()).toEqual([A, X])
})

test('AC-TAP-4 plant tap-out race: the displayed run changed on another screen, nothing is tapped out', async ({ context }) => {
  const [page1, page2] = [await context.newPage(), await context.newPage()]
  await openApp(page1)
  await seedTag(page1, A)
  const r1 = await seedRun(page1, openRunAt('run-1', A, T0 - 30 * MIN))
  await tap(page1, X, T0)
  await expect(page1.getByTestId('plant-save-tapout')).toBeVisible()

  // Page 2 finishes R1 at A, then starts R2 at A.
  await tap(page2, A, T0 + 2 * MIN)
  await expect(page2.getByText('Day 1. Chain unbroken.')).toBeVisible()
  await tap(page2, A, T0 + 4 * MIN)
  await expect(page2.getByText('TAGGED')).toBeVisible()
  const before = await byId(page2, r1.id)
  const [r2] = await openRuns(page2)

  await page1.getByTestId('plant-save-tapout').click()
  await expectPath(page1, `${TAPPED}${r2.id}&grace=${X}&notice=plant-changed`)
  await expect(page1.getByText('Tag saved. Your run changed on another screen, so nothing was tapped out.')).toBeVisible()
  await expect(page1.getByText('Run started')).toHaveCount(0)
  await checkView(page1, 'plant-changed')
  expect(await byId(page1, r1.id)).toEqual(before)
  expect(before).toMatchObject({ status: 'done', tagOutId: A })
  expect(await openRuns(page1)).toEqual([r2])
  expect((await tags(page1)).map((t) => t.id).sort()).toEqual([A, X])
})

test('AC-TAP-21 plant start race: a run started elsewhere, so the plant start opens nothing', async ({ context }) => {
  const [page1, page2] = [await context.newPage(), await context.newPage()]
  await openApp(page1)
  await seedTag(page1, A)
  await tap(page1, X, T0)
  await expect(page1.getByTestId('plant-save-start')).toBeVisible()

  await tap(page2, A, T0 + MIN)
  await expect(page2.getByText('TAGGED')).toBeVisible()
  const [r2] = await openRuns(page2)

  await page1.getByTestId('plant-save-start').click()
  await expectPath(page1, `${TAPPED}${r2.id}&again=1&tag=${X}&notice=plant-already-open`)
  await expect(page1.getByText('Tag saved. A run is already in progress.')).toBeVisible()
  await expect(page1.getByText('TAGGED')).toHaveCount(0)
  await expect(page1.getByText('Run started')).toHaveCount(0)
  await expect(primary(page1)).toHaveText('Finish run')
  await checkView(page1, 'plant-already-open')
  expect(await runs(page1)).toEqual([r2])
  expect((await tags(page1)).map((t) => t.id).sort()).toEqual([A, X])
})

test('AC-TAP-11 forgotten tap-out with an unknown tag: the stale run is abandoned and cannot be tapped out', async ({ page }) => {
  await openApp(page)
  await seedTag(page, A)
  const stale = await seedRun(page, openRunAt('stale-1', A, T0 - 7 * HOUR))
  await tap(page, 'bbbbbbbbbb', T0)
  await expect(page.getByTestId('tap-plant')).toBeVisible()
  await expect(page.getByTestId('plant-save-tapout')).toHaveCount(0)
  await expect(page.getByTestId('plant-save-start')).toBeVisible()
  await expect(page.getByTestId('stale-notice')).toBeVisible()
  expect(await byId(page, stale.id)).toEqual({ ...stale, status: 'abandoned', abandonedAt: T0 })
})
