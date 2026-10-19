'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChainVisual } from '@/components/ChainVisual'
import { computeChain, localDayOf } from '@/lib/app/chain'
import { buildHistory, dayLabel, isAtRisk, weekdayShort } from '@/lib/app/history'
import { shellNavigate } from '@/lib/app/nav'
import { req, StoreError, withTxn } from '@/lib/app/store'
import type { Meta, Run, Tag } from '@/lib/app/store'
import { useSilo } from '@/lib/app/silo'
import { abandonStaleIn } from '@/lib/app/tap'
import { AppNav } from '../AppNav'
import { ReadyOffline } from '../ReadyOffline'
import { BackupStatus } from './settings'

const VISUAL_CAP = 30
const STALE_NOTICE_MS = 60_000

type Loaded = { now: number; runs: Run[]; tags: Tag[]; meta: Meta | undefined }

/** One readwrite transaction, one `now`: abandon stale runs, then read what the view renders (APP-006). */
function loadHome(now: number): Promise<Loaded> {
  return withTxn('readwrite', async (s) => {
    await abandonStaleIn(s, now)
    const [runs, tags, meta] = await Promise.all([req(s.runs.getAll()), req(s.tags.getAll()), req(s.meta.get('meta'))])
    return { now, runs: runs as Run[], tags: tags as Tag[], meta: meta as Meta | undefined }
  })
}

const DAY_MARK: Record<string, string> = { done: '✓', missed: '✕', 'today-pending': '○', neutral: '·' }

/** The chain home (APP-CHAIN): the one number that matters, and the days behind it. */
export function ChainHome() {
  const silo = useSilo()
  const [data, setData] = useState<Loaded | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    loadHome(Date.now()).then(setData, (e: unknown) => setError(e instanceof StoreError ? e.kind : 'unavailable'))
  }, [])

  useEffect(() => {
    load()
    // Activate a waiting service worker only from the idle home view, then reload once (M-9).
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg?.waiting) return
        navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true })
        reg.waiting.postMessage({ type: 'SKIP_WAITING' })
      })
    }
  }, [load])

  // A home view left open past midnight reloads when it becomes visible on a new day.
  useEffect(() => {
    if (!data) return
    const onVisible = () => {
      if (document.visibilityState === 'visible' && localDayOf(Date.now()) !== localDayOf(data.now)) load()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [data, load])

  if (error) {
    return (
      <section className="app-home">
        <h1 className="app-title">RunTag</h1>
        <p data-testid="store-error" role="alert">RunTag can&apos;t open its storage on this device ({error}).</p>
        <ReadyOffline />
        <AppNav />
      </section>
    )
  }
  if (!data) {
    return (
      <section className="app-home">
        <h1 className="app-title">RunTag</h1>
        <ReadyOffline />
        <AppNav />
      </section>
    )
  }

  const today = localDayOf(data.now)
  const chain = computeChain(data.runs, today)
  const history = buildHistory(data.runs, today)
  const open = data.runs.find((r) => r.status === 'open')
  const stale = data.runs.some((r) => r.abandonedAt !== undefined && data.now - r.abandonedAt >= 0 && data.now - r.abandonedAt < STALE_NOTICE_MS)
  const empty = data.runs.length === 0 && data.tags.length === 0

  return (
    <section className="app-home mx-auto max-w-md px-4 py-6">
      <h1 className="app-title">RunTag</h1>
      {stale && <p data-testid="stale-notice">Your last run wasn&apos;t tapped out, so it didn&apos;t count.</p>}
      {open && <p data-testid="open-run-banner" role="status">Run in progress — tap your tag to finish</p>}
      <p className="app-chain mt-4 text-2xl">
        Chain <strong data-testid="chain-value">{chain}</strong> days
      </p>
      <div aria-hidden="true" className="mt-3">
        <ChainVisual count={Math.min(chain, VISUAL_CAP)} className="flex-wrap" />
      </div>
      {isAtRisk(history) && (
        <p data-testid="at-risk" className="mt-3">
          Run today to keep your chain.
        </p>
      )}
      {empty && (
        <div data-testid="empty-state" className="mt-6">
          <h2 className="text-xl">Plant your first tag</h2>
          <p>Stick a tag where you start running, then plant it here.</p>
          <a
            href="/app/tags"
            data-testid="empty-plant-link"
            onClick={(e) => {
              e.preventDefault()
              shellNavigate('/app/tags')
            }}
          >
            Plant a tag
          </a>
        </div>
      )}
      <ol aria-label="Last 14 days" className="mt-6 grid grid-cols-7 gap-2">
        {history.map((h) => (
          <li key={h.day} data-testid="history-day" data-day={h.day} data-state={h.state} aria-label={dayLabel(h)} className="flex flex-col items-center">
            <span aria-hidden="true">{weekdayShort(h.day)}</span>
            <span aria-hidden="true">{DAY_MARK[h.state]}</span>
          </li>
        ))}
      </ol>
      <div data-testid="backup-status" className="mt-6">
        <BackupStatus meta={data.meta} runs={data.runs} now={data.now} silo={silo} reload={load} />
      </div>
      <ReadyOffline />
      <AppNav />
    </section>
  )
}

/** Shell entry point for `/app` (kept under its APP-SHELL name). */
export const HomeView = ChainHome
