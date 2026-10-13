'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { locationKey, subscribeLocation } from '@/lib/app/nav'
import { resolveRoute } from '@/lib/app/route'
import * as store from '@/lib/app/store'
import { HomeView } from './views/home'
import { TagsView } from './views/tags'
import { SettingsView } from './views/settings'
import { TapView } from './views/tap'
import { TappedView } from './views/tapped'
import { InvalidTagView } from './views/invalid-tag'
import { NotFoundView } from './views/not-found'

declare global {
  interface Window {
    __runtagStore?: Pick<typeof store, 'startRunIfNoneOpen' | 'startRunIfNoneOpenIn' | 'withTxn' | 'listRuns' | 'listTags' | 'getMeta' | 'req'>
  }
}

export function Shell() {
  // Server snapshot is null, so the prerendered HTML is the same for every URL and hydration never mismatches.
  const key = useSyncExternalStore(subscribeLocation, locationKey, () => null)

  useEffect(() => {
    // Test access to the real store functions, only for automated browsers (P1-3).
    if (navigator.webdriver === true) {
      const { startRunIfNoneOpen, startRunIfNoneOpenIn, withTxn, listRuns, listTags, getMeta, req } = store
      window.__runtagStore = { startRunIfNoneOpen, startRunIfNoneOpenIn, withTxn, listRuns, listTags, getMeta, req }
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => undefined)
    }
  }, [])

  if (key === null) {
    return <main data-testid="view" data-view="loading" className="app-shell" />
  }

  const [pathname, search = ''] = key.split(/(?=\?)/)
  const route = resolveRoute({ pathname, search })

  return (
    <main data-testid="view" data-view={route.view} className="app-shell">
      {route.view === 'home' && <HomeView />}
      {route.view === 'tags' && <TagsView />}
      {route.view === 'settings' && <SettingsView />}
      {route.view === 'tap' && <TapView tagId={route.tagId!} />}
      {route.view === 'tapped' && <TappedView runId={route.runId!} />}
      {route.view === 'invalid-tag' && <InvalidTagView />}
      {route.view === 'not-found' && <NotFoundView />}
    </main>
  )
}
