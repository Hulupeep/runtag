// Maps the address bar to a shell view. The shell never reads Next route params.

export type View = 'home' | 'tags' | 'settings' | 'tap' | 'tapped' | 'invalid-tag' | 'not-found'
export type Route = { view: View; tagId?: string; runId?: string }

export const TAG_ID = /^[a-z0-9]{10}$/
/** APP-TAP replaces the tap URL with this so reload/Back never re-taps (APP-016). */
export const TAPPED_PREFIX = '/app?tapped='

export function resolveRoute(loc: { pathname: string; search: string }): Route {
  const path = loc.pathname.replace(/\/+$/, '') || '/'

  if (path === '/app') {
    const runId = new URLSearchParams(loc.search).get('tapped')
    return runId ? { view: 'tapped', runId } : { view: 'home' }
  }
  if (path === '/app/tags') return { view: 'tags' }
  if (path === '/app/settings') return { view: 'settings' }

  if (path === '/t' || path.startsWith('/t/')) {
    const rest = path.slice(3)
    return TAG_ID.test(rest) ? { view: 'tap', tagId: rest } : { view: 'invalid-tag' }
  }
  return { view: 'not-found' }
}
