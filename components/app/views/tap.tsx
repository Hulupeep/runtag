'use client'

import { useEffect, useState } from 'react'
import { locationKey, shellReplace } from '@/lib/app/nav'
import { TAPPED_PREFIX } from '@/lib/app/route'
import { getOpenRun, getTag, StoreError } from '@/lib/app/store'
import { isStale, tapAtTag } from '@/lib/app/tap'
import type { TapOutcome } from '@/lib/app/tap'
import { PlantView } from './plant'
import { FailedView } from './tapped'
import type { Failure } from './tapped'

// The tap decision runs at most once per document, for the document's initial URL, on a 'navigate'
// load, once visible and not prerendering (APP-016, C2). Back/forward, reload and bfcache never decide.
const INITIAL_KEY = typeof window === 'undefined' ? null : locationKey()
let claimed = false
let inflight: { key: string; promise: Promise<TapOutcome | null> } | null = null

/**
 * The document's navigation type. The buffered observer covers browsers (and test clocks) without timeline reads.
 * Without evidence it is 'unknown', which never decides: only a confirmed 'navigate' load may record a tap (AC-TAP-15).
 */
function navigationType(): Promise<string> {
  const entry = performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined
  if (entry) return Promise.resolve(entry.type)
  return new Promise((resolve) => {
    let observer: PerformanceObserver | undefined
    const done = (type: string) => {
      observer?.disconnect()
      clearTimeout(timer)
      resolve(type)
    }
    const timer = setTimeout(() => done('unknown'), 1000)
    try {
      observer = new PerformanceObserver((list) => {
        const e = list.getEntries()[0] as PerformanceNavigationTiming | undefined
        if (e) done(e.type)
      })
      observer.observe({ type: 'navigation', buffered: true })
    } catch {
      done('unknown')
    }
  })
}

function whenActive(): Promise<void> {
  return new Promise((resolve) => {
    const check = () => {
      if ((document as { prerendering?: boolean }).prerendering || document.visibilityState !== 'visible') return
      document.removeEventListener('prerenderingchange', check)
      document.removeEventListener('visibilitychange', check)
      resolve()
    }
    document.addEventListener('prerenderingchange', check)
    document.addEventListener('visibilitychange', check)
    check()
  })
}

type State = { kind: 'reading' } | { kind: 'plant'; openRunId?: string } | { kind: 'failed'; failure: Failure }

export function TapView({ tagId }: { tagId: string }) {
  const [state, setState] = useState<State>({ kind: 'reading' })

  useEffect(() => {
    let live = true
    const key = locationKey()
    const apply = (o: TapOutcome) => {
      if (!live) return
      if (o.kind === 'unknown') return setState({ kind: 'plant', openRunId: o.openRunId })
      if (o.kind === 'grace') return shellReplace(o.openRunId ? `${TAPPED_PREFIX}${o.openRunId}&grace=${tagId}` : `/app?grace=${tagId}`)
      if (o.kind === 'guard') return shellReplace(`${TAPPED_PREFIX}${o.run.id}&again=1&tag=${tagId}`)
      shellReplace(TAPPED_PREFIX + o.run.id)
    }
    const fail = (retry: () => void) => (e: unknown) => {
      if (live) setState({ kind: 'failed', failure: { kind: e instanceof StoreError ? e.kind : 'unavailable', retry } })
    }
    const retry = () => {
      setState({ kind: 'reading' })
      tapAtTag(tagId, Date.now()).then(apply, fail(retry))
    }

    // Revisit without a decision: the plant view if the tag is still unknown, otherwise leave /t/.
    const revisit = () =>
      Promise.all([getTag(tagId), getOpenRun()]).then(([tag, open]) => {
        if (!live) return
        if (tag) return shellReplace('/app')
        setState({ kind: 'plant', openRunId: open && !isStale(open, Date.now()) ? open.id : undefined })
      }, fail(() => window.location.reload()))

    // Only the first view of the document's initial URL may decide; a strict-mode remount shares that decision.
    if (inflight?.key !== key && !claimed && key === INITIAL_KEY) {
      claimed = true
      const promise = navigationType().then((type) => (type === 'navigate' ? whenActive().then(() => tapAtTag(tagId, Date.now())) : null))
      inflight = { key, promise }
      promise.then(
        () => (inflight = null),
        () => (inflight = null),
      )
    }
    if (inflight?.key === key) inflight.promise.then((o) => (o ? apply(o) : revisit()), fail(retry))
    else revisit()
    return () => {
      live = false
    }
  }, [tagId])

  if (state.kind === 'plant') return <PlantView tagId={tagId} openRunId={state.openRunId} />
  const mark = (
    <p data-testid="tap-tag-id" data-tag-id={tagId}>
      Reading your tag.
    </p>
  )
  if (state.kind === 'failed') return <FailedView failure={state.failure}>{mark}</FailedView>
  return <section>{mark}</section>
}
