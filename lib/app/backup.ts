// Backups and durability (APP-012, APP-022): export, validated merge-by-id import, persistence, nudge.

import { cleanTagName } from './tags'
import { getMeta, req, withTxn } from './store'
import type { ExportFile, Meta, Run, Tag } from './store'
import { abandonStaleIn } from './tap'

export const NUDGE_MS = 604_800_000
const META_KEY = 'meta'
const TAG_ID = /^[a-z0-9]{10}$/
const LOCAL_DAY = /^\d{4}-\d{2}-\d{2}$/

const byId = <T extends { id: string }>(rows: T[]) => [...rows].sort((a, b) => (a.id < b.id ? -1 : 1))

/** Canonical JSON: keys sorted, undefined values dropped. */
export function fingerprint(row: object): string {
  const entries = Object.entries(row)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : 1))
  return JSON.stringify(Object.fromEntries(entries))
}

const without = (row: object, keys: string[]) => Object.fromEntries(Object.entries(row).filter(([k]) => !keys.includes(k)))

/**
 * One predicate for planning, drift and skipping: identical; a tag differing only in graceUntil; or a backup
 * run that is open while the local copy is the same run already abandoned (the abandonment is newer knowledge).
 */
export function equivalent(backupRow: Tag | Run, localRow: Tag | Run): boolean {
  if (fingerprint(backupRow) === fingerprint(localRow)) return true
  if ('graceUntil' in backupRow && 'graceUntil' in localRow)
    return fingerprint(without(backupRow, ['graceUntil'])) === fingerprint(without(localRow, ['graceUntil']))
  if ('status' in backupRow && 'status' in localRow && backupRow.status === 'open' && localRow.status === 'abandoned')
    return fingerprint(without(backupRow, ['status', 'abandonedAt'])) === fingerprint(without(localRow, ['status', 'abandonedAt']))
  return false
}

export function exportFile(now: number): Promise<ExportFile> {
  return withTxn('readonly', async (s) => {
    const [tags, runs, meta] = await Promise.all([req(s.tags.getAll()), req(s.runs.getAll()), req(s.meta.get(META_KEY))])
    return { schemaVersion: 1, exportedAt: now, tags: byId(tags as Tag[]), runs: byId(runs as Run[]), meta: meta as Meta }
  })
}

// ---- validation (M-4): every rule must hold, else the whole file is rejected -------------------------------

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v)
const onlyKeys = (o: Record<string, unknown>, required: string[], optional: string[] = []) =>
  required.every((k) => k in o) && Object.keys(o).every((k) => required.includes(k) || optional.includes(k))

function validTag(t: unknown): t is Tag {
  return (
    isObj(t) && onlyKeys(t, ['id', 'name', 'createdAt', 'graceUntil']) &&
    typeof t.id === 'string' && TAG_ID.test(t.id) &&
    typeof t.name === 'string' && cleanTagName(t.name) === t.name &&
    num(t.createdAt) && num(t.graceUntil)
  )
}

function validRun(r: unknown): r is Run {
  if (!isObj(r) || !onlyKeys(r, ['id', 'status', 'tagInId', 'startedAt', 'localDay', 'tzOffsetMin', 'lastTapAt'], ['tagOutId', 'endedAt', 'abandonedAt', 'lastTransition'])) return false
  return (
    typeof r.id === 'string' && r.id.length > 0 &&
    (r.status === 'open' || r.status === 'done' || r.status === 'abandoned') &&
    typeof r.tagInId === 'string' && TAG_ID.test(r.tagInId) &&
    num(r.startedAt) && num(r.tzOffsetMin) && num(r.lastTapAt) &&
    typeof r.localDay === 'string' && LOCAL_DAY.test(r.localDay) &&
    (r.tagOutId === undefined || (typeof r.tagOutId === 'string' && TAG_ID.test(r.tagOutId))) &&
    (r.endedAt === undefined || num(r.endedAt)) &&
    (r.abandonedAt === undefined || num(r.abandonedAt)) &&
    (r.lastTransition === undefined || r.lastTransition === 'in' || r.lastTransition === 'out')
  )
}

const unique = (rows: { id: string }[]) => new Set(rows.map((r) => r.id)).size === rows.length

/** A RunTag backup, or null ("This isn't a RunTag backup"). Opens no transaction. */
export function validateBackup(text: string): ExportFile | null {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return null
  }
  if (!isObj(data) || !onlyKeys(data, ['schemaVersion', 'exportedAt', 'tags', 'runs', 'meta'])) return null
  if (data.schemaVersion !== 1 || !num(data.exportedAt) || !isObj(data.meta)) return null
  if (!Array.isArray(data.tags) || !Array.isArray(data.runs)) return null
  if (!data.tags.every(validTag) || !data.runs.every(validRun)) return null
  if (!unique(data.tags as Tag[]) || !unique(data.runs as Run[])) return null
  return data as unknown as ExportFile
}

// ---- import: plan (read-only), then apply in one transaction that re-merges and rejects drift --------------

export type Conflict = { kind: 'tag' | 'run'; id: string; local: Tag | Run; backup: Tag | Run; seen: string }
export type Plan = { added: { tags: number; runs: number }; identical: number; conflicts: Conflict[] }
export type Choices = Record<string, { choice: 'mine' | 'backup'; seen: string }>
export type ImportResult = { status: 'changed' } | { status: 'applied'; added: number; replaced: number; abandoned: number }

export const choiceKey = (c: { kind: 'tag' | 'run'; id: string }) => `${c.kind}:${c.id}`

export function planImport(file: ExportFile): Promise<Plan> {
  return withTxn('readonly', async (s) => {
    const tags = new Map(((await req(s.tags.getAll())) as Tag[]).map((t) => [t.id, t]))
    const runs = new Map(((await req(s.runs.getAll())) as Run[]).map((r) => [r.id, r]))
    const plan: Plan = { added: { tags: 0, runs: 0 }, identical: 0, conflicts: [] }
    const visit = (kind: 'tag' | 'run', rows: (Tag | Run)[], local: Map<string, Tag | Run>) => {
      for (const backup of rows) {
        const mine = local.get(backup.id)
        if (!mine) plan.added[kind === 'tag' ? 'tags' : 'runs']++
        else if (equivalent(backup, mine)) plan.identical++
        else plan.conflicts.push({ kind, id: backup.id, local: mine, backup, seen: fingerprint(mine) })
      }
    }
    visit('tag', file.tags, tags as Map<string, Tag | Run>)
    visit('run', file.runs, runs as Map<string, Tag | Run>)
    return plan
  })
}

export function importBackup(file: ExportFile, choices: Choices, now: number): Promise<ImportResult> {
  return withTxn('readwrite', async (s): Promise<ImportResult> => {
    const localTags = new Map(((await req(s.tags.getAll())) as Tag[]).map((t) => [t.id, t]))
    const localRuns = new Map(((await req(s.runs.getAll())) as Run[]).map((r) => [r.id, r]))
    type Step = { store: IDBObjectStore; row: Tag | Run; op: 'add' | 'put' }
    const steps: Step[] = []
    // Drift is checked for every row before the first write; on drift nothing is written.
    const visit = (kind: 'tag' | 'run', rows: (Tag | Run)[], local: Map<string, Tag | Run>, store: IDBObjectStore) => {
      for (const backup of rows) {
        const mine = local.get(backup.id)
        const choice = choices[choiceKey({ kind, id: backup.id })]
        if (!mine) {
          steps.push({ store, row: backup, op: 'add' })
          continue
        }
        if (choice) {
          if (choice.seen !== fingerprint(mine)) return false
          if (choice.choice === 'backup' && !equivalent(backup, mine)) steps.push({ store, row: backup, op: 'put' })
          continue
        }
        if (!equivalent(backup, mine)) return false
      }
      return true
    }
    if (!visit('tag', file.tags, localTags as Map<string, Tag | Run>, s.tags) || !visit('run', file.runs, localRuns as Map<string, Tag | Run>, s.runs)) {
      return { status: 'changed' }
    }
    for (const step of steps) await req(step.op === 'add' ? step.store.add(step.row) : step.store.put(step.row))
    const openBefore = (await req(s.runs.index('status').getAll('open'))).length
    await abandonStaleIn(s, now)
    // At most one open run: the newest startedAt stays open.
    const open = ((await req(s.runs.index('status').getAll('open'))) as Run[]).sort((a, b) => b.startedAt - a.startedAt)
    for (const older of open.slice(1)) await req(s.runs.put({ ...older, status: 'abandoned', abandonedAt: now } satisfies Run))
    const stillOpen = open.length > 0 ? 1 : 0
    return {
      status: 'applied',
      added: steps.filter((x) => x.op === 'add').length,
      replaced: steps.filter((x) => x.op === 'put').length,
      abandoned: openBefore - stillOpen,
    }
  })
}

// ---- meta, persistence, nudge -------------------------------------------------------------------------------

/** The only meta writer: read-modify-write, so pages never revert each other's fields. */
export function updateMeta(patch: Partial<Meta>): Promise<Meta> {
  return withTxn('readwrite', async (s) => {
    const row = ((await req(s.meta.get(META_KEY))) ?? {}) as Meta
    const next: Meta = { ...row, ...patch, schemaVersion: 1 }
    await req(s.meta.put(next, META_KEY))
    return next
  })
}

let persisting: Promise<boolean | undefined> | null = null

/**
 * Asks the browser to keep this site's storage, once: after a plant or an import commits. Never throws, never
 * blocks the caller; a failed meta write leaves persistResult undefined so the next plant or import asks again.
 */
export function requestPersistence(): Promise<boolean | undefined> {
  if (persisting) return persisting
  const attempt = async (): Promise<boolean | undefined> => {
    try {
      const meta = await getMeta()
      if (meta?.persistResult !== undefined) return meta.persistResult
    } catch {
      return undefined
    }
    let result = false
    try {
      const storage = (navigator as Navigator & { storage?: { persist?: () => Promise<boolean> } }).storage
      result = storage?.persist ? (await storage.persist()) === true : false
    } catch {
      result = false
    }
    try {
      await updateMeta({ persistResult: result })
      return result
    } catch {
      return undefined
    }
  }
  persisting = attempt().finally(() => {
    persisting = null
  })
  return persisting
}

export function shouldNudge(meta: Meta | undefined, runs: Run[], now: number): boolean {
  if (meta?.backupNudgeDismissedUntil !== undefined && meta.backupNudgeDismissedUntil > now) return false
  if (meta?.persistResult === false) return true
  const done = runs.filter((r) => r.status === 'done').length
  return done >= 3 && (meta?.lastExportAt === undefined || now - meta.lastExportAt > NUDGE_MS)
}

/** "Monday 12 October" for a stored local day (UTC parts, so every device zone shows the same date). */
export function longDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  const part = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(undefined, { ...o, timeZone: 'UTC' }).format(date)
  return `${part({ weekday: 'long' })} ${d} ${part({ month: 'long' })}`
}
