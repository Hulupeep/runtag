'use client'

import { useEffect, useState } from 'react'
import { computeChain, localDayOf } from '@/lib/app/chain'
import { listRuns, StoreError } from '@/lib/app/store'
import { AppNav } from '../AppNav'
import { ReadyOffline } from '../ReadyOffline'

// Placeholder home: APP-CHAIN replaces the chain display; it must keep rendering <ReadyOffline/>.
export function HomeView() {
  const [chain, setChain] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listRuns()
      .then((runs) => setChain(computeChain(runs, localDayOf(Date.now()))))
      .catch((e: unknown) => setError(e instanceof StoreError ? e.kind : 'unavailable'))
    // Activate a waiting service worker only from the idle home view, then reload once (M-9).
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg?.waiting) return
        navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true })
        reg.waiting.postMessage({ type: 'SKIP_WAITING' })
      })
    }
  }, [])

  return (
    <section className="app-home">
      <h1 className="app-title">RunTag</h1>
      {error ? (
        <p data-testid="store-error" role="alert">RunTag can&apos;t open its storage on this device ({error}).</p>
      ) : (
        <p className="app-chain">
          Chain <strong data-testid="chain-value">{chain ?? '…'}</strong>
        </p>
      )}
      <ReadyOffline />
      <AppNav />
    </section>
  )
}
