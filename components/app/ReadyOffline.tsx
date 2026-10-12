'use client'

import { useEffect, useState } from 'react'

const POLL_MS = 2000

/**
 * "Ready offline ✓" iff the service worker confirms the shell and every precache entry are cached
 * (AC-SHELL-7). Keeps asking while mounted and applies both answers, so cache loss hides it again.
 */
export function ReadyOffline() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    let stopped = false
    const ask = async () => {
      const reg = await navigator.serviceWorker.ready
      const worker = reg.active
      if (!worker || stopped) return
      const channel = new MessageChannel()
      channel.port1.onmessage = (e) => {
        if (!stopped) setReady(e.data?.ready === true)
      }
      worker.postMessage({ type: 'STATUS' }, [channel.port2])
    }
    ask()
    const timer = window.setInterval(ask, POLL_MS)
    return () => {
      stopped = true
      window.clearInterval(timer)
    }
  }, [])

  return ready ? <p data-testid="ready-offline" className="app-ready">Ready offline ✓</p> : null
}
