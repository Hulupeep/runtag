'use client'

import { useEffect, useState } from 'react'

/** "Ready offline ✓" only when the service worker confirms the shell and every precache entry are cached (AC-SHELL-7). */
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
        if (!stopped && e.data?.ready === true) setReady(true)
      }
      worker.postMessage({ type: 'STATUS' }, [channel.port2])
    }
    ask()
    const timer = window.setInterval(() => !ready && ask(), 2000)
    return () => {
      stopped = true
      window.clearInterval(timer)
    }
  }, [ready])

  return ready ? <p data-testid="ready-offline" className="app-ready">Ready offline ✓</p> : null
}
