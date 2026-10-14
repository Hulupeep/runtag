// The tap state machine (APP-023): every decision is one readwrite transaction over the on-device store.

import { getOpenRunIn, req, SETUP_GRACE_MS, startRunIfNoneOpenIn, withTxn } from './store'
import type { Run, Stores, Tag } from './store'
import { TAG_ID } from './route'

export const STALE_MS = 21_600_000
export const GUARD_MS = 60_000
export const UNDO_MS = 60_000

export type TapOutcome =
  | { kind: 'unknown'; openRunId?: string }
  | { kind: 'grace'; openRunId?: string }
  | { kind: 'guard'; run: Run }
  | { kind: 'in' | 'out'; run: Run }

export type PlantAction = 'start' | 'save' | 'tap-out'
export type PlantResult = { tag: Tag; run?: Run; openRunId?: string; result: 'ok' | 'changed' | 'already-open' }
export type FinishResult = { result: 'ok'; run: Run } | { result: 'changed'; run?: Run; openRunId?: string }
export type StartResult = { result: 'ok'; run: Run } | { result: 'already-open'; openRunId: string }
export type UndoResult = 'undone' | 'changed' | 'expired' | 'too-late' | 'other-open'

export const isStale = (run: Run, now: number) => now - run.startedAt >= STALE_MS || run.startedAt > now

/**
 * Abandons every open run that is 6 h old or dated in the future. Composable: runs inside the caller's
 * transaction and opens none of its own. Returns true iff it changed a row. Shared with APP-CHAIN.
 */
export async function abandonStaleIn(s: Stores, now: number): Promise<boolean> {
  const open = (await req(s.runs.index('status').getAll('open'))) as Run[]
  let changed = false
  for (const run of open) {
    if (!isStale(run, now)) continue
    await req(s.runs.put({ ...run, status: 'abandoned', abandonedAt: now } satisfies Run))
    changed = true
  }
  return changed
}

async function finishIn(s: Stores, run: Run, tagId: string, now: number): Promise<Run> {
  const done: Run = { ...run, status: 'done', endedAt: now, tagOutId: tagId, lastTapAt: now, lastTransition: 'out' }
  await req(s.runs.put(done))
  return done
}

/** The most recent open or done run, if its tap was 0 ≤ age < GUARD_MS ago (abandoned and future taps never guard). */
async function guardRunIn(s: Stores, now: number): Promise<Run | undefined> {
  const runs = ((await req(s.runs.getAll())) as Run[]).filter(
    (r) => r.status !== 'abandoned' && now - r.lastTapAt >= 0 && now - r.lastTapAt < GUARD_MS,
  )
  return runs.sort((a, b) => b.lastTapAt - a.lastTapAt)[0]
}

/** A page load of /t/{tagId}: the APP-023 decision order, first match wins. */
export function tapAtTag(tagId: string, now: number): Promise<TapOutcome> {
  if (!TAG_ID.test(tagId)) return Promise.reject(new TypeError('Not a RunTag tag id'))
  return withTxn('readwrite', async (s): Promise<TapOutcome> => {
    await abandonStaleIn(s, now)
    const tag = (await req(s.tags.get(tagId))) as Tag | undefined
    const open = await getOpenRunIn(s)
    if (!tag) return { kind: 'unknown', openRunId: open?.id }
    if (now < tag.graceUntil) return { kind: 'grace', openRunId: open?.id }
    const guard = await guardRunIn(s, now)
    if (guard) return { kind: 'guard', run: guard }
    if (open) return { kind: 'out', run: await finishIn(s, open, tagId, now) }
    return { kind: 'in', run: (await startRunIfNoneOpenIn(s, tagId, now)).run }
  })
}

/** Plant-view buttons: bypass grace and guard; never overwrite an existing tag. */
export function plantTag(tagId: string, name: string, action: PlantAction, now: number, displayedOpenRunId?: string): Promise<PlantResult> {
  if (!TAG_ID.test(tagId)) return Promise.reject(new TypeError('Not a RunTag tag id'))
  const clean = name.trim().slice(0, 40) || 'My tag'
  return withTxn('readwrite', async (s): Promise<PlantResult> => {
    await abandonStaleIn(s, now)
    let tag = (await req(s.tags.get(tagId))) as Tag | undefined
    if (!tag) {
      tag = { id: tagId, name: clean, createdAt: now, graceUntil: now + SETUP_GRACE_MS }
      await req(s.tags.add(tag))
    }
    const open = await getOpenRunIn(s)
    if (action === 'save') return { tag, openRunId: open?.id, result: 'ok' }
    if (action === 'start') {
      if (open) return { tag, openRunId: open.id, result: 'already-open' }
      return { tag, run: (await startRunIfNoneOpenIn(s, tagId, now)).run, result: 'ok' }
    }
    if (open && open.id === displayedOpenRunId) return { tag, run: await finishIn(s, open, tagId, now), result: 'ok' }
    return { tag, openRunId: open?.id, result: 'changed' }
  })
}

/** Explicit "Finish run" for the displayed run, tapped out at the scanned tag. */
export function finishOpenRun(runId: string, tagId: string, now: number): Promise<FinishResult> {
  return withTxn('readwrite', async (s): Promise<FinishResult> => {
    await abandonStaleIn(s, now)
    const open = await getOpenRunIn(s)
    if (open && open.id === runId) return { result: 'ok', run: await finishIn(s, open, tagId, now) }
    const run = (await req(s.runs.get(runId))) as Run | undefined
    return { result: 'changed', run, openRunId: open?.id }
  })
}

/** Explicit "Start run" / "Start another run" at the scanned tag. */
export function startRunExplicit(tagId: string, now: number): Promise<StartResult> {
  return withTxn('readwrite', async (s): Promise<StartResult> => {
    await abandonStaleIn(s, now)
    const open = await getOpenRunIn(s)
    if (open) return { result: 'already-open', openRunId: open.id }
    return { result: 'ok', run: (await startRunIfNoneOpenIn(s, tagId, now)).run }
  })
}

/** Compare-and-set Undo of the run's last transition (APP-018, S-13). */
export function undoTap(runId: string, expectedLastTapAt: number, now: number): Promise<UndoResult> {
  return withTxn('readwrite', async (s): Promise<UndoResult> => {
    const run = (await req(s.runs.get(runId))) as Run | undefined
    if (!run || run.lastTapAt !== expectedLastTapAt) return 'changed'
    const inWindow = now - run.lastTapAt >= 0 && now - run.lastTapAt < UNDO_MS
    if (run.status === 'open' && run.lastTransition === 'in') {
      if (!inWindow) return 'expired'
      await req(s.runs.delete(run.id))
      return 'undone'
    }
    if (run.status === 'done' && run.lastTransition === 'out') {
      if (!inWindow) return 'expired'
      if (now - run.startedAt >= STALE_MS) return 'too-late'
      if (await getOpenRunIn(s)) return 'other-open'
      const reopened: Run = { ...run, status: 'open', lastTapAt: run.startedAt, lastTransition: 'in' }
      delete reopened.endedAt
      delete reopened.tagOutId
      await req(s.runs.put(reopened))
      return 'undone'
    }
    return 'changed'
  })
}
