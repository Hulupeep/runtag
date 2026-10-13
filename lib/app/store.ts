// On-device store (APP-010, APP-020). IndexedDB 'runtag' v1: tags, runs, meta.

import { localDayOf, newRunId, tzOffsetOf } from './chain'

export interface Tag { id: string; name: string; createdAt: number; graceUntil: number }
export interface Run {
  id: string
  status: 'open' | 'done' | 'abandoned'
  tagInId: string
  tagOutId?: string
  startedAt: number
  endedAt?: number
  abandonedAt?: number
  localDay: string
  tzOffsetMin: number
  lastTapAt: number
}
export interface Meta { schemaVersion: 1; persistResult?: boolean; lastExportAt?: number; backupNudgeDismissedUntil?: number }
export interface ExportFile { schemaVersion: 1; exportedAt: number; tags: Tag[]; runs: Run[]; meta: Meta }
export interface Stores { tags: IDBObjectStore; runs: IDBObjectStore; meta: IDBObjectStore }

export const SETUP_GRACE_MS = 600_000

type StoreErrorKind = 'quota' | 'blocked' | 'newer-schema' | 'unavailable' | 'tx-aborted'
export class StoreError extends Error {
  constructor(public kind: StoreErrorKind, message?: string) {
    super(message ?? kind)
    this.name = 'StoreError'
  }
}

const DB_NAME = 'runtag'
const DB_VERSION = 1
const META_KEY = 'meta'
let dbPromise: Promise<IDBDatabase> | null = null

export function openStore(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new StoreError('unavailable'))
    const open = indexedDB.open(DB_NAME, DB_VERSION)
    open.onupgradeneeded = () => {
      const db = open.result
      db.createObjectStore('tags', { keyPath: 'id' })
      const runs = db.createObjectStore('runs', { keyPath: 'id' })
      runs.createIndex('status', 'status')
      runs.createIndex('localDay', 'localDay')
      db.createObjectStore('meta').put({ schemaVersion: 1 } satisfies Meta, META_KEY)
    }
    open.onblocked = () => reject(new StoreError('blocked'))
    open.onerror = () =>
      reject(new StoreError(open.error?.name === 'VersionError' ? 'newer-schema' : 'unavailable', open.error?.message))
    open.onsuccess = () => {
      const db = open.result
      db.onversionchange = () => {
        db.close()
        dbPromise = null
      }
      resolve(db)
    }
  })
  dbPromise.catch(() => {
    dbPromise = null
  })
  return dbPromise
}

export function req<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error)
  })
}

const errorKind = (e: unknown): StoreErrorKind =>
  (e as { name?: string })?.name === 'QuotaExceededError' ? 'quota' : 'tx-aborted'

/**
 * Runs `fn` in one transaction over all stores. Resolves with fn's value only after `complete`
 * (committed). If fn throws/rejects or a request fails, the transaction is aborted, every write
 * rolls back, and this rejects with StoreError. Inside fn, await only IDB requests.
 */
export async function withTxn<T>(mode: IDBTransactionMode, fn: (s: Stores) => Promise<T>): Promise<T> {
  const db = await openStore()
  return new Promise<T>((resolve, reject) => {
    let tx: IDBTransaction
    try {
      tx = db.transaction(['tags', 'runs', 'meta'], mode)
    } catch (e) {
      return reject(new StoreError(errorKind(e), (e as Error)?.message))
    }
    let value: T
    let failure: unknown = null
    // Settle on the task after `complete` finishes dispatching, so every complete listener has run first (AC-SHELL-18).
    tx.oncomplete = () => setTimeout(() => (failure ? reject(new StoreError(errorKind(failure))) : resolve(value)), 0)
    tx.onabort = () => reject(new StoreError(errorKind(failure ?? tx.error), (tx.error ?? (failure as Error))?.message))
    tx.onerror = (ev) => ev.preventDefault() // surfaced through onabort
    const stores: Stores = { tags: tx.objectStore('tags'), runs: tx.objectStore('runs'), meta: tx.objectStore('meta') }
    Promise.resolve()
      .then(() => fn(stores))
      .then(
        (v) => {
          value = v
        },
        (e) => {
          failure = e ?? new Error('aborted')
          try {
            tx.abort()
          } catch {
            /* already finished; onabort/oncomplete reports */
          }
        },
      )
  })
}

export async function getOpenRunIn(s: Stores): Promise<Run | undefined> {
  const open = await req(s.runs.index('status').getAll('open'))
  return (open as Run[]).sort((a, b) => b.startedAt - a.startedAt)[0]
}

/** Composable: runs inside the caller's transaction and opens none of its own (APP-020). */
export async function startRunIfNoneOpenIn(s: Stores, tagId: string, now: number): Promise<{ run: Run; created: boolean }> {
  const existing = await getOpenRunIn(s)
  if (existing) return { run: existing, created: false }
  const run: Run = {
    id: newRunId(),
    status: 'open',
    tagInId: tagId,
    startedAt: now,
    localDay: localDayOf(now),
    tzOffsetMin: tzOffsetOf(now),
    lastTapAt: now,
  }
  await req(s.runs.add(run))
  return { run, created: true }
}

export function startRunIfNoneOpen(tagId: string, now: number): Promise<{ run: Run; created: boolean }> {
  return withTxn('readwrite', (s) => startRunIfNoneOpenIn(s, tagId, now))
}

export const listTags = () => withTxn('readonly', async (s) => (await req(s.tags.getAll())) as Tag[])
export const listRuns = () => withTxn('readonly', async (s) => (await req(s.runs.getAll())) as Run[])
export const getTag = (id: string) => withTxn('readonly', async (s) => (await req(s.tags.get(id))) as Tag | undefined)
export const getOpenRun = () => withTxn('readonly', (s) => getOpenRunIn(s))
export const getMeta = () => withTxn('readonly', async (s) => (await req(s.meta.get(META_KEY))) as Meta)
