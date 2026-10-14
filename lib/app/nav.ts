// In-shell navigation. The shell is one page; views switch on the address bar.

const NAVIGATE = 'runtag:navigate'

export function shellNavigate(path: string): void {
  window.history.pushState(null, '', path)
  window.dispatchEvent(new Event(NAVIGATE))
}

/** Replaces the current history entry, so Back and reload never return to it (APP-016). Call only after an awaited store call. */
export function shellReplace(path: string): void {
  window.history.replaceState(null, '', path)
  window.dispatchEvent(new Event(NAVIGATE))
}

export function subscribeLocation(onChange: () => void): () => void {
  window.addEventListener('popstate', onChange)
  window.addEventListener(NAVIGATE, onChange)
  return () => {
    window.removeEventListener('popstate', onChange)
    window.removeEventListener(NAVIGATE, onChange)
  }
}

export function locationKey(): string {
  return window.location.pathname + window.location.search
}
