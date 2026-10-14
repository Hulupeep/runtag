// Maps the address bar to a shell view. The shell never reads Next route params.

export type View = 'home' | 'tags' | 'settings' | 'tap' | 'tapped' | 'grace' | 'invalid-tag' | 'not-found'
export type Notice = 'plant-changed' | 'plant-already-open' | 'finish-changed' | 'start-already-open'
export type Route = {
  view: View
  tagId?: string
  runId?: string
  /** `again=1`: the double-read guard answered this tap (APP-TAP). */
  again?: boolean
  /** `grace={tagId}`: the scanned tag inside its setup grace. */
  graceTagId?: string
  /** `tag={tagId}`: the scanned tag of a guard view, kept in the URL so a reload keeps it. */
  scannedTagId?: string
  notice?: Notice
}

export const TAG_ID = /^[a-z0-9]{10}$/
/** APP-TAP replaces the tap URL with this so reload/Back never re-taps (APP-016). */
export const TAPPED_PREFIX = '/app?tapped='

const NOTICES: readonly Notice[] = ['plant-changed', 'plant-already-open', 'finish-changed', 'start-already-open']

export function resolveRoute(loc: { pathname: string; search: string }): Route {
  const path = loc.pathname.replace(/\/+$/, '') || '/'

  if (path === '/app') {
    const q = new URLSearchParams(loc.search)
    const runId = q.get('tapped') ?? undefined
    const graceTagId = q.get('grace') ?? undefined
    const extra = {
      again: q.get('again') === '1' || undefined,
      scannedTagId: q.get('tag') ?? undefined,
      notice: NOTICES.find((n) => n === q.get('notice')),
    }
    if (graceTagId !== undefined) return { view: 'grace', runId, graceTagId, ...extra }
    if (runId) return { view: 'tapped', runId, ...extra }
    return { view: 'home' }
  }
  if (path === '/app/tags') return { view: 'tags' }
  if (path === '/app/settings') return { view: 'settings' }

  if (path === '/t' || path.startsWith('/t/')) {
    const rest = path.slice(3)
    return TAG_ID.test(rest) ? { view: 'tap', tagId: rest } : { view: 'invalid-tag' }
  }
  return { view: 'not-found' }
}
