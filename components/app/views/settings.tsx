'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { localDayOf } from '@/lib/app/chain'
import { choiceKey, exportFile, importBackup, longDay, NUDGE_MS, planImport, requestPersistence, shouldNudge, updateMeta, validateBackup } from '@/lib/app/backup'
import { TAG_ORIGIN } from '@/lib/app/origin'
import type { Choices, Plan } from '@/lib/app/backup'
import { getMeta, StoreError } from '@/lib/app/store'
import type { ExportFile, Meta, Run, Tag } from '@/lib/app/store'
import { useSilo } from '@/lib/app/silo'
import type { Silo } from '@/lib/app/silo'
import { AppNav } from '../AppNav'
import { useAction } from './tapped'
import type { Failure } from './tapped'

// Settings (APP-DURABLE): export, import with conflicts, persistence status. Also the shared durability pieces
// used by home, the tags view and the plant view: silo notices, last backup, the nudge card, the download.

const BTN = 'min-h-[48px] min-w-[48px] rounded-full border border-current px-4 font-semibold disabled:opacity-50'
const kindOf = (e: unknown): Failure['kind'] => (e instanceof StoreError ? e.kind : 'unavailable')
const BLOCKED = "Plant tags in Safari. Tags planted in the Home Screen app can't be read when you tap them."
const IN_APP = "This browser keeps its own storage, so taps won't find these tags. Open RunTag in Safari or your default browser."

/** Starts the browser download of a backup file named for the local day. */
export function downloadBackup(file: ExportFile, now: number) {
  const blob = new Blob([JSON.stringify(file, null, 1)], { type: 'application/json' })
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = href
  a.download = `runtag-backup-${localDayOf(now)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(href), 10_000)
}

/** Retry only what can succeed again; otherwise the store error. */
export function BackupFailure({ failure }: { failure: Failure }) {
  if (failure.kind === 'quota' || failure.kind === 'tx-aborted') {
    return (
      <p data-testid="backup-failed" role="alert">
        That wasn&apos;t saved{' '}
        <button type="button" data-testid="backup-retry" className={BTN} onClick={failure.retry}>
          Retry
        </button>
      </p>
    )
  }
  return (
    <p data-testid="store-error" role="alert">
      RunTag can&apos;t open its storage on this device ({failure.kind}).
    </p>
  )
}

/** Silo notice shown on load: blocked (Home Screen app) or the in-app warning with a copy-link fix. */
export function SiloNotice({ silo, link, blockedRef }: { silo: Silo; link: string; blockedRef?: React.RefObject<HTMLParagraphElement> }) {
  const [copied, setCopied] = useState<'copied' | 'fallback' | null>(null)
  if (silo === 'standalone') {
    return (
      <p data-testid="silo-blocked" role="alert" tabIndex={-1} ref={blockedRef}>
        {BLOCKED}
      </p>
    )
  }
  if (silo !== 'in-app') return null
  const copy = () => {
    const clip = navigator.clipboard
    if (!clip?.writeText) return setCopied('fallback')
    clip.writeText(link).then(
      () => setCopied('copied'),
      () => setCopied('fallback'),
    )
  }
  return (
    <div data-testid="silo-warning" role="alert">
      <p>{IN_APP}</p>
      <button type="button" data-testid="silo-copy" className={BTN} onClick={copy}>
        Copy link
      </button>
      {copied === 'copied' && <p role="status">Link copied</p>}
      {copied === 'fallback' && (
        <label className="block">
          Copy this link:
          <input aria-label="RunTag link" readOnly value={link} className="mt-1 block w-full rounded-lg border border-current bg-transparent px-3 py-2" />
        </label>
      )}
    </div>
  )
}

export function lastBackupText(meta: Meta | undefined) {
  return meta?.lastExportAt === undefined ? 'Last backup: never' : `Last backup: ${longDay(localDayOf(meta.lastExportAt))}`
}

const PERSIST_WARNING = 'Your phone may clear this data. Export a backup.'

/** Home's backup-status content: silo notice, last backup and the nudge card (from home's single load). */
export function BackupStatus({ meta, runs, now, silo, reload }: { meta: Meta | undefined; runs: Run[]; now: number; silo: Silo; reload: () => void }) {
  const act = useAction()
  const exportNow = async () => {
    const at = Date.now()
    let file: ExportFile
    try {
      file = await exportFile(at)
    } catch (e) {
      return act.fail({ kind: kindOf(e), retry: () => void exportNow() })
    }
    downloadBackup(file, at)
    act.run(async () => {
      await updateMeta({ lastExportAt: at }) // Retry saves again; it never downloads twice
      reload()
    })
  }
  const dismiss = () =>
    act.run(async (at) => {
      await updateMeta({ backupNudgeDismissedUntil: at + NUDGE_MS })
      reload()
    })
  return (
    <>
      {silo === 'standalone' && <SiloNotice silo={silo} link="" />}
      <p data-testid="last-backup">{lastBackupText(meta)}</p>
      {shouldNudge(meta, runs, now) && (
        <div data-testid="backup-nudge" className="mt-3 rounded-2xl border border-current p-4">
          <p className="font-semibold">Back up your chain</p>
          {meta?.persistResult === false && <p data-testid="persist-warning">{PERSIST_WARNING}</p>}
          <button type="button" data-testid="backup-nudge-export" className={BTN} disabled={act.pending} onClick={() => void exportNow()}>
            Back up now
          </button>{' '}
          <button type="button" data-testid="backup-nudge-dismiss" className={BTN} disabled={act.pending} onClick={dismiss}>
            Not now
          </button>
        </div>
      )}
      {act.failure && <BackupFailure failure={act.failure} />}
    </>
  )
}

const RUN_STATE: Record<Run['status'], string> = { done: 'finished', open: 'in progress', abandoned: "didn't count" }

function conflictText(c: Plan['conflicts'][number]) {
  if (c.kind === 'tag') return `Tag: ${(c.local as Tag).name} (yours) / ${(c.backup as Tag).name} (backup)`
  const mine = c.local as Run
  const theirs = c.backup as Run
  return `Run on ${longDay(mine.localDay)}: yours ${RUN_STATE[mine.status]}, backup ${RUN_STATE[theirs.status]}`
}

type Pending = { file: ExportFile; plan: Plan; choices: Choices }

export function SettingsView() {
  const silo = useSilo()
  const [meta, setMeta] = useState<Meta | null>(null)
  const [loadError, setLoadError] = useState<Failure['kind'] | null>(null)
  const [invalid, setInvalid] = useState(false)
  const [pending, setPending] = useState<Pending | null>(null)
  const [changed, setChanged] = useState(false)
  const [done, setDone] = useState<Plan | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [askConfirm, setAskConfirm] = useState(false)
  const act = useAction()
  const fileInput = useRef<HTMLInputElement>(null)

  const reload = useCallback(() => {
    getMeta().then(
      (m) => setMeta(m ?? ({ schemaVersion: 1 } as Meta)),
      (e: unknown) => setLoadError(kindOf(e)),
    )
  }, [])
  useEffect(() => reload(), [reload])

  const exportNow = async () => {
    const at = Date.now()
    let file: ExportFile
    try {
      file = await exportFile(at)
    } catch (e) {
      return act.fail({ kind: kindOf(e), retry: () => void exportNow() })
    }
    downloadBackup(file, at)
    act.run(async () => {
      await updateMeta({ lastExportAt: at }) // Retry saves again; it never downloads twice
      reload()
    })
  }

  // Each selection takes a token; a later selection invalidates every earlier read, plan and retry.
  const selection = useRef(0)
  const plan = (file: ExportFile, token: number) =>
    act.run(async () => {
      const p = await planImport(file)
      if (token !== selection.current) return // an obsolete selection never restores its plan
      const choices: Choices = {}
      for (const c of p.conflicts) choices[choiceKey(c)] = { choice: 'mine', seen: c.seen }
      setPending({ file, plan: p, choices })
    })

  const onFile = async (input: HTMLInputElement) => {
    const f = input.files?.[0]
    input.value = ''
    if (!f) return
    const token = ++selection.current
    setPending(null)
    act.fail(null)
    setInvalid(false)
    setChanged(false)
    setDone(null)
    setConfirmed(false)
    setAskConfirm(false)
    const text = await f.text()
    if (token !== selection.current) return
    const file = validateBackup(text)
    if (!file) return setInvalid(true)
    plan(file, token)
  }

  const apply = (confirmedNow = confirmed) => {
    if (!pending) return
    if (silo === 'in-app' && !confirmedNow) return setAskConfirm(true)
    const { file, choices } = pending
    act.run(async (at) => {
      const r = await importBackup(file, choices, at)
      if (r.status === 'changed') {
        setChanged(true)
        return plan(file, selection.current)
      }
      setDone(pending.plan)
      setPending(null)
      setConfirmed(false)
      setAskConfirm(false)
      void requestPersistence() // after a restore too (APP-012); never blocks or fails the import
      reload()
    })
  }

  const setChoice = (key: string, choice: 'mine' | 'backup') =>
    setPending((p) => (p ? { ...p, choices: { ...p.choices, [key]: { ...p.choices[key], choice } } } : p))

  if (loadError) {
    return (
      <section className="mx-auto max-w-md px-4 py-6">
        <h1 className="app-title">Settings</h1>
        <p data-testid="store-error" role="alert">
          RunTag can&apos;t open its storage on this device ({loadError}).
        </p>
        <AppNav />
      </section>
    )
  }

  const summary = (p: Plan) => `New: ${p.added.tags} tags, ${p.added.runs} runs. Already here: ${p.identical}.`
  return (
    <section className="mx-auto max-w-md px-4 py-6">
      <h1 className="app-title">Settings</h1>
      <SiloNotice silo={silo === 'standalone' ? silo : null} link="" />
      <p data-testid="last-backup">{lastBackupText(meta ?? undefined)}</p>
      {meta?.persistResult === false && <p data-testid="persist-warning">{PERSIST_WARNING}</p>}
      {meta?.persistResult === true && <p data-testid="persist-ok">This phone keeps your data.</p>}

      <button type="button" data-testid="backup-export" className={`${BTN} mt-4`} disabled={act.pending} onClick={() => void exportNow()}>
        Export backup
      </button>
      <p>Saved to your Downloads or Files. If you cancelled, export again.</p>

      {silo === 'standalone' ? (
        <p className="mt-6">Restore your backup in Safari.</p>
      ) : (
        <div className="mt-6">
          <button type="button" className={BTN} onClick={() => fileInput.current?.click()}>
            Import backup
          </button>
          <input
            aria-label="Backup file"
            data-testid="backup-import"
            ref={fileInput}
            type="file"
            accept=".json,application/json,text/plain"
            className="sr-only"
            onChange={(e) => void onFile(e.currentTarget)}
          />
        </div>
      )}
      {invalid && (
        <p data-testid="backup-invalid" role="alert">
          This isn&apos;t a RunTag backup
        </p>
      )}
      {changed && (
        <p data-testid="backup-changed" role="alert">
          Your data changed. Check the list again.
        </p>
      )}
      {pending && (
        <div className="mt-4">
          <p data-testid="backup-summary">{summary(pending.plan)}</p>
          <ul>
            {pending.plan.conflicts.map((c) => {
              const key = choiceKey(c)
              const choice = pending.choices[key]?.choice ?? 'mine'
              return (
                <li key={key} data-testid="backup-conflict" data-kind={c.kind} data-id={c.id} className="mt-3">
                  <p>{conflictText(c)}</p>
                  <label className="mr-4 inline-flex min-h-[48px] items-center gap-2">
                    <input aria-label="Keep mine" data-testid="backup-keep" type="radio" name={key} checked={choice === 'mine'} onChange={() => setChoice(key, 'mine')} />
                    Keep mine
                  </label>
                  <label className="inline-flex min-h-[48px] items-center gap-2">
                    <input aria-label="Use backup" data-testid="backup-use" type="radio" name={key} checked={choice === 'backup'} onChange={() => setChoice(key, 'backup')} />
                    Use backup
                  </label>
                </li>
              )
            })}
          </ul>
          {silo === 'in-app' && <SiloNotice silo={silo} link={`${TAG_ORIGIN}/app/settings`} />}
          <button type="button" data-testid="backup-apply" className={BTN} disabled={act.pending} onClick={() => apply()}>
            Apply
          </button>{' '}
          {askConfirm && (
            <button
              type="button"
              data-testid="silo-confirm"
              className={BTN}
              disabled={act.pending}
              onClick={() => {
                setConfirmed(true)
                setAskConfirm(false)
                apply(true)
              }}
            >
              Restore here anyway
            </button>
          )}{' '}
          <button
            type="button"
            data-testid="backup-cancel"
            className={BTN}
            onClick={() => {
              setPending(null)
              setAskConfirm(false)
            }}
          >
            Cancel
          </button>
        </div>
      )}
      {done && (
        <p data-testid="backup-done" role="status">
          Backup restored. {summary(done)}
        </p>
      )}
      {act.failure && <BackupFailure failure={act.failure} />}
      <AppNav />
    </section>
  )
}
