'use client'

import { useCallback, useEffect, useState } from 'react'
import { computeChain, localDayOf } from '@/lib/app/chain'
import { shellNavigate, shellReplace } from '@/lib/app/nav'
import { TAG_ID, TAPPED_PREFIX } from '@/lib/app/route'
import type { Route } from '@/lib/app/route'
import { listRuns, listTags, StoreError } from '@/lib/app/store'
import type { Run, Tag } from '@/lib/app/store'
import { finishOpenRun, startRunExplicit, UNDO_MS, undoTap } from '@/lib/app/tap'
import type { UndoResult } from '@/lib/app/tap'

// Shared by the tap, plant and result views (APP-TAP). Copy never shows durations or countdowns (M-6).

const BUTTON = 'mt-4 block w-full min-h-[48px] rounded-full px-6 font-semibold disabled:opacity-50'

export function Primary({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <button type="button" data-testid="tap-primary" data-primary className={`${BUTTON} bg-[#34c759] text-black`} disabled={disabled} onClick={onPress}>
      {label}
    </button>
  )
}

export function Secondary({ testId, label, onPress, disabled }: { testId: string; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <button type="button" data-testid={testId} className={`${BUTTON} border border-current`} disabled={disabled} onClick={onPress}>
      {label}
    </button>
  )
}

export const goHome = () => shellNavigate('/app')

/** A run abandoned in the last minute, derived from the database so it survives URL changes and reloads (P1-1). */
export function StaleNotice({ runs, now }: { runs: Run[]; now: number }) {
  const recent = runs.some((r) => r.abandonedAt !== undefined && now - r.abandonedAt >= 0 && now - r.abandonedAt < 60_000)
  return recent ? <p data-testid="stale-notice">Your last run wasn&apos;t tapped out, so it didn&apos;t count.</p> : null
}

export type Failure = { kind: StoreError['kind']; retry: () => void }

/** Runs one store action at a time; a failed action can be retried with a fresh Date.now(). */
export function useAction() {
  const [pending, setPending] = useState(false)
  const [failure, setFailure] = useState<Failure | null>(null)
  const run = useCallback((action: (now: number) => Promise<void>) => {
    const attempt = () => {
      setPending(true)
      setFailure(null)
      action(Date.now())
        .catch((e: unknown) => setFailure({ kind: e instanceof StoreError ? e.kind : 'unavailable', retry: attempt }))
        .finally(() => setPending(false))
    }
    attempt()
  }, [])
  return { pending, failure, run, fail: setFailure }
}

export function FailedView({ failure, children }: { failure: Failure; children?: React.ReactNode }) {
  const retryable = failure.kind === 'quota' || failure.kind === 'tx-aborted'
  return (
    <section data-testid="tap-failed">
      {children}
      <h1 className="app-title">This tap wasn&apos;t saved</h1>
      {!retryable && (
        <p data-testid="store-error" role="alert">
          RunTag can&apos;t open its storage on this device ({failure.kind}).
        </p>
      )}
      {retryable ? <Primary label="Retry" onPress={failure.retry} /> : <Primary label="Go" onPress={goHome} />}
    </section>
  )
}

const NOTICE_COPY = {
  'plant-changed': 'Tag saved. Your run changed on another screen, so nothing was tapped out.',
  'plant-already-open': 'Tag saved. A run is already in progress.',
  'finish-changed': 'Your run changed on another screen. Nothing was tapped out.',
  'start-already-open': 'A run is already in progress. Nothing new was started.',
} as const

const UNDO_COPY: Record<Exclude<UndoResult, 'undone'>, string> = {
  changed: "Can't undo — something changed.",
  expired: 'Undo window has passed.',
  'too-late': 'Too late to undo.',
  'other-open': "Can't undo — another run is in progress.",
}

type Data = { runs: Run[]; tags: Tag[] }

/** /app?tapped=… and /app?grace=…: rendered from IndexedDB only, so a reload never re-taps (APP-016). */
export function TappedView({ route }: { route: Route }) {
  const [data, setData] = useState<Data | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [undo, setUndo] = useState<UndoResult | null>(null)
  const { pending, failure, run, fail } = useAction()

  const load = useCallback(
    () =>
      Promise.all([listRuns(), listTags()])
        .then(([runs, tags]) => setData({ runs, tags }))
        .catch((e: unknown) => fail({ kind: e instanceof StoreError ? e.kind : 'unavailable', retry: () => window.location.reload() })),
    [fail],
  )
  useEffect(() => {
    load()
    // Re-check the Undo window from the stored lastTapAt every second (no countdown is shown).
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [load])

  const runId = route.runId
  const tagId = route.scannedTagId ?? route.graceTagId
  const finish = (id: string, tag: string) =>
    run(async (at) => {
      const r = await finishOpenRun(id, tag, at)
      if (r.result === 'ok') return shellReplace(TAPPED_PREFIX + r.run.id)
      shellReplace(r.openRunId ? `${TAPPED_PREFIX}${r.openRunId}&again=1&tag=${tag}&notice=finish-changed` : `${TAPPED_PREFIX}${id}&notice=finish-changed`)
    })
  const start = (tag: string) =>
    run(async (at) => {
      const r = await startRunExplicit(tag, at)
      if (r.result === 'ok') return shellReplace(TAPPED_PREFIX + r.run.id)
      shellReplace(`${TAPPED_PREFIX}${r.openRunId}&again=1&tag=${tag}&notice=start-already-open`)
    })
  const pressUndo = (r: Run) =>
    run(async (at) => {
      setUndo(await undoTap(r.id, r.lastTapAt, at))
      await load()
    })

  if (failure) return <FailedView failure={failure} />
  if (!data) return <section data-testid="tap-result" data-state="loading" />

  const stored = runId ? data.runs.find((r) => r.id === runId) : undefined
  const tagOk = tagId !== undefined && TAG_ID.test(tagId) && data.tags.some((t) => t.id === tagId)
  const stale = <StaleNotice runs={data.runs} now={now} />
  const tapAgain = (
    <section data-testid="tap-result" data-state="tap-again">
      <p>Tap your tag again.</p>
      <Primary label="Go" onPress={goHome} />
    </section>
  )

  if (undo === 'undone') {
    return (
      <section data-testid="tap-result" data-state="undone">
        <p>{stored ? 'Tap-out undone. Your run is still going.' : 'Tap undone.'}</p>
        <Primary label="Go" onPress={goHome} />
      </section>
    )
  }

  // Finish/Start act on the scanned tag from the URL; without a valid, known one there is no action (F-GUARD-TAG).
  const actionFor = (kind: 'finish' | 'start') => {
    if (!tagOk) return null
    if (kind === 'start') return <Primary label="Start run" disabled={pending} onPress={() => start(tagId!)} />
    return runId ? <Primary label="Finish run" disabled={pending} onPress={() => finish(runId, tagId!)} /> : null
  }

  if (route.notice) {
    const goOnly = route.notice === 'finish-changed' && !route.again
    const action = goOnly ? <Primary label="Go" onPress={goHome} /> : actionFor(route.notice === 'plant-changed' && !runId ? 'start' : 'finish')
    if (!action) return tapAgain
    return (
      <section data-testid="tap-result" data-state={route.notice} data-run-id={runId}>
        <p role="status">{NOTICE_COPY[route.notice]}</p>
        {stale}
        {action}
      </section>
    )
  }

  if (route.view === 'grace') {
    const action = actionFor(runId ? 'finish' : 'start')
    if (!action) return tapAgain
    return (
      <section data-testid="tap-result" data-state="grace" data-run-id={runId}>
        <h1 className="app-title">Tag works ✓</h1>
        {stale}
        {action}
      </section>
    )
  }

  if (!stored) {
    return (
      <section data-testid="tap-result" data-state="missing">
        <p data-testid="tapped-run" data-run-id={runId}>This tap was undone or isn&apos;t on this phone.</p>
        <Primary label="Go" onPress={goHome} />
      </section>
    )
  }
  if (stored.status === 'abandoned') {
    return (
      <section data-testid="tap-result" data-state="abandoned">
        <p data-testid="tapped-run" data-run-id={stored.id}>Your last run wasn&apos;t tapped out, so it didn&apos;t count.</p>
        <Primary label="Go" onPress={goHome} />
      </section>
    )
  }

  const tappedIn = stored.status === 'open'
  const age = now - stored.lastTapAt
  const canUndo = age >= 0 && age < UNDO_MS && stored.lastTransition === (tappedIn ? 'in' : 'out')
  const undoButton = canUndo && !undo ? <Secondary testId="tap-undo" label="Undo" disabled={pending} onPress={() => pressUndo(stored)} /> : null
  const undoMessage = undo ? <p role="status">{UNDO_COPY[undo]}</p> : null

  if (route.again) {
    const primary = tappedIn ? (tagOk ? <Primary label="Finish run" disabled={pending} onPress={() => finish(stored.id, tagId!)} /> : null) : tagOk ? <Primary label="Start another run" disabled={pending} onPress={() => start(tagId!)} /> : null
    if (!primary) return tapAgain
    return (
      <section data-testid="tap-guard" data-state={tappedIn ? 'guard-in' : 'guard-out'}>
        <p data-testid="tapped-run" data-run-id={stored.id}>{tappedIn ? "You're in. Now go." : 'Run saved.'}</p>
        {stale}
        {primary}
        {undoButton}
        {undoMessage}
      </section>
    )
  }

  const chain = computeChain(data.runs, localDayOf(now))
  return (
    <section data-testid="tap-result" data-state={tappedIn ? 'in' : 'out'}>
      {tappedIn ? (
        <>
          <h1 className="app-title">TAGGED</h1>
          <p>Run started</p>
          <p data-testid="tapped-run" data-run-id={stored.id}>You&apos;re in. Now go.</p>
        </>
      ) : (
        <p data-testid="tapped-run" data-run-id={stored.id}>{chain > 0 ? `Day ${chain}. Chain unbroken.` : 'Run saved.'}</p>
      )}
      {stale}
      {tappedIn ? <Primary label="Go" onPress={goHome} /> : <Primary label="Done" onPress={goHome} />}
      {undoButton}
      {undoMessage}
    </section>
  )
}
