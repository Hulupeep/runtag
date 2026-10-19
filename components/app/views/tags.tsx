'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { tagUrl } from '@/lib/app/origin'
import { listTags, StoreError } from '@/lib/app/store'
import type { Tag } from '@/lib/app/store'
import { cleanTagName, createTag, markTagWritten, renameTag, sortTags, WRITE_DEADLINE_MS } from '@/lib/app/tags'
import { requestPersistence } from '@/lib/app/backup'
import { TAG_ORIGIN } from '@/lib/app/origin'
import { useSilo } from '@/lib/app/silo'
import { AppNav } from '../AppNav'
import { SiloNotice } from './settings'
import { useAction } from './tapped'
import type { Failure } from './tapped'

// Tag setup (APP-TAGS): create, copy, write (Web NFC) and rename. Feature detection only, never user-agent checks.

type NdefWriter = { write(message: { records: { recordType: string; data: string }[] }, options?: { signal?: AbortSignal }): Promise<void> }
declare global {
  interface Window {
    NDEFReader?: new () => NdefWriter
  }
}

const BTN = 'min-h-[48px] min-w-[48px] rounded-full border border-current px-4 font-semibold disabled:opacity-50'
const PRIMARY = 'min-h-[48px] min-w-[48px] rounded-full bg-[#34c759] px-5 font-semibold text-black disabled:opacity-50'

const WRITE_ERRORS: Record<string, string> = {
  NotAllowedError: 'NFC permission was refused. Allow NFC for this site, or copy the link instead.',
  NotSupportedError: "This phone or sticker can't be written here. Copy the link instead.",
  NotReadableError: "NFC is switched off. Turn on NFC in your phone's settings, then try again, or copy the link instead.",
  InvalidStateError: 'Keep RunTag open on screen while writing, then try again.',
  AbortError: 'Writing was cancelled.',
}
const WRITE_FALLBACK = "Couldn't write the tag. Hold the phone still on the sticker and try again, or copy the link instead."
const TIMED_OUT = 'Writing timed out. Hold the phone on the sticker and try again.'

const kindOf = (e: unknown): Failure['kind'] => (e instanceof StoreError ? e.kind : 'unavailable')

/** Retry only what can succeed again (quota / aborted transaction); otherwise the store error. */
function SaveFailure({ failure }: { failure: Failure }) {
  if (failure.kind === 'quota' || failure.kind === 'tx-aborted') {
    return (
      <p data-testid="tag-failed" role="alert">
        That wasn&apos;t saved{' '}
        <button type="button" data-testid="tag-retry" className={BTN} onClick={failure.retry}>
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

type RowProps = {
  tag: Tag
  nfc: boolean
  writingId: string | null
  setWritingId: (id: string | null) => void
  /** Shared across rows and taken synchronously on press: at most one write operation at a time. */
  writeLock: React.MutableRefObject<string | null>
  reload: () => void
}

function TagRow({ tag, nfc, writingId, setWritingId, writeLock, reload }: RowProps) {
  const url = tagUrl(tag.id)
  const [copied, setCopied] = useState<'copied' | 'fallback' | null>(null)
  const [writeState, setWriteState] = useState<'idle' | 'writing' | 'ready'>('idle')
  const [writeError, setWriteError] = useState<string | null>(null)
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState(tag.name)
  const save = useAction()
  const controller = useRef<{ abort: AbortController; reason: 'cancel' | 'timeout' | 'hidden' | null } | null>(null)

  const abortWrite = (reason: 'cancel' | 'timeout' | 'hidden') => {
    const c = controller.current
    if (c && !c.abort.signal.aborted) {
      c.reason = reason
      c.abort.abort()
    }
  }
  useEffect(() => () => abortWrite('cancel'), []) // leaving the view aborts a pending write

  const rearm = () =>
    save.run(async (now) => {
      if ((await markTagWritten(tag.id, now)) === null) reload()
    })

  const copy = () => {
    // The clipboard call stays inside the click (user activation), before anything is awaited.
    const clip = typeof navigator !== 'undefined' ? navigator.clipboard : undefined
    const settle = (ok: boolean) => {
      setCopied(ok ? 'copied' : 'fallback')
      rearm() // the test tap after a writer-app write lands in setup grace
    }
    if (!clip?.writeText) return settle(false)
    clip.writeText(url).then(
      () => settle(true),
      () => settle(false),
    )
  }

  const write = async () => {
    // Reserve synchronously, before anything is awaited, so repeated or competing presses start nothing.
    if (writeLock.current !== null || !window.NDEFReader) return
    writeLock.current = tag.id
    const c = { abort: new AbortController(), reason: null as 'cancel' | 'timeout' | 'hidden' | null }
    controller.current = c
    setWritingId(tag.id)
    setWriteError(null)
    setWriteState('writing')
    const armAt = Date.now()
    const deadline = armAt + WRITE_DEADLINE_MS
    // Cancel, hide, leaving the view and the deadline apply from the press on, including during the arm.
    const timer = setInterval(() => Date.now() >= deadline && abortWrite('timeout'), 1000)
    const onHide = () => document.visibilityState === 'hidden' && abortWrite('hidden')
    document.addEventListener('visibilitychange', onHide)
    const release = () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onHide)
      if (controller.current === c) controller.current = null
      if (writeLock.current === tag.id) writeLock.current = null
      setWritingId(null)
    }
    const stopped = () => c.abort.signal.aborted || document.visibilityState === 'hidden' || Date.now() >= deadline
    const showStop = () => {
      setWriteState('idle')
      setWriteError(c.reason === 'timeout' || (c.reason === null && Date.now() >= deadline) ? TIMED_OUT : WRITE_ERRORS.AbortError)
    }

    try {
      if ((await markTagWritten(tag.id, armAt)) === null) {
        release()
        setWriteState('idle')
        return reload()
      }
    } catch (e) {
      release()
      setWriteState('idle')
      return save.fail({ kind: kindOf(e), retry: () => void write() }) // a failed arm never writes
    }
    if (stopped()) {
      release()
      return showStop() // cancelled, hidden, left or timed out during the arm: no write starts
    }
    let written = false
    let failure: unknown = null
    try {
      await new window.NDEFReader().write({ records: [{ recordType: 'url', data: url }] }, { signal: c.abort.signal })
      written = true
    } catch (e) {
      failure = e
    }
    release()
    if (written && stopped()) written = false
    if (!written) {
      setWriteState('idle')
      if (c.abort.signal.aborted || Date.now() >= deadline) return showStop()
      const name = (failure as { name?: string } | null)?.name ?? ''
      setWriteError(WRITE_ERRORS[name] ?? WRITE_FALLBACK)
      return
    }
    // Written: re-arm the grace from now; "Tag ready" only after that commits (S-8).
    try {
      await markTagWritten(tag.id, Date.now())
      setWriteState('ready')
    } catch (e) {
      setWriteState('idle')
      setWriteError("Tag written. That wasn't saved")
      save.fail({ kind: kindOf(e), retry: () => rearmAfterWrite() })
    }
  }
  const rearmAfterWrite = () =>
    save.run(async (now) => {
      await markTagWritten(tag.id, now)
      setWriteError(null)
      setWriteState('ready')
    })

  const submitRename = () => {
    if (cleanTagName(newName) === null) return
    save.run(async () => {
      await renameTag(tag.id, newName) // null when the row is gone: the re-list drops it
      setRenaming(false)
      reload()
    })
  }

  return (
    <li data-testid="tag-row" data-tag-id={tag.id} className="mt-4 rounded-2xl border border-current p-4">
      {renaming ? (
        <div>
          <input
            aria-label="New name"
            data-testid="tag-rename-input"
            className="block w-full rounded-lg border border-current bg-transparent px-3 py-2"
            value={newName}
            maxLength={40}
            autoFocus
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitRename()
              if (e.key === 'Escape') setRenaming(false)
            }}
          />
          <button type="button" data-testid="tag-rename-save" className={BTN} disabled={save.pending || cleanTagName(newName) === null} onClick={submitRename}>
            Save
          </button>{' '}
          <button type="button" data-testid="tag-rename-cancel" className={BTN} onClick={() => setRenaming(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <p data-testid="tag-row-name" className="text-lg font-semibold">
          {tag.name}
        </p>
      )}
      <p data-testid="tag-url" className="break-all">
        {url}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" data-testid="tag-copy" className={BTN} onClick={copy}>
          Copy link
        </button>
        {nfc && writeState !== 'writing' && (
          <button type="button" data-testid="tag-write" className={BTN} disabled={writingId !== null} onClick={() => void write()}>
            Write to tag
          </button>
        )}
        {!renaming && (
          <button
            type="button"
            data-testid="tag-rename"
            className={BTN}
            onClick={() => {
              setNewName(tag.name)
              setRenaming(true)
            }}
          >
            Rename
          </button>
        )}
      </div>
      {copied === 'copied' && (
        <p data-testid="tag-copied" role="status">
          Link copied
        </p>
      )}
      {copied === 'fallback' && (
        <label className="mt-2 block">
          Copy this link:
          <input
            aria-label="Tag link"
            data-testid="tag-copy-fallback"
            className="mt-1 block w-full rounded-lg border border-current bg-transparent px-3 py-2"
            readOnly
            value={url}
            autoFocus
            onFocus={(e) => e.currentTarget.select()}
          />
        </label>
      )}
      {writeState === 'writing' && (
        <p data-testid="tag-writing" role="status">
          Hold your phone on the sticker.{' '}
          <button type="button" data-testid="tag-write-cancel" className={BTN} onClick={() => abortWrite('cancel')}>
            Cancel
          </button>
        </p>
      )}
      {writeState === 'ready' && (
        <p data-testid="tag-ready" role="status">
          Tag ready
        </p>
      )}
      {writeError && (
        <p data-testid="tag-error" role="alert">
          {writeError}
        </p>
      )}
      {save.failure && <SaveFailure failure={save.failure} />}
    </li>
  )
}

const STEPS = [
  'Install a free NFC writer app (for example NFC Tools).',
  'Choose Write, then Add a record, then URL.',
  'Paste your tag link.',
  'Tap Write and hold the phone on the sticker.',
  "Tap the sticker once with your phone to test it. You'll see 'Tag works ✓'.",
]

export function TagsView() {
  const [tags, setTags] = useState<Tag[] | null>(null)
  const [loadError, setLoadError] = useState<Failure['kind'] | null>(null)
  const [name, setName] = useState('My tag')
  const [status, setStatus] = useState<string | null>(null)
  const [nfc, setNfc] = useState(false)
  const [writingId, setWritingId] = useState<string | null>(null)
  const writeLock = useRef<string | null>(null)
  const create = useAction()
  const busy = useRef(false)
  const nameInput = useRef<HTMLInputElement>(null)
  const silo = useSilo()
  const [confirmAsk, setConfirmAsk] = useState(false)
  const blockedRef = useRef<HTMLParagraphElement>(null)

  const reload = useCallback(() => {
    listTags().then(
      (rows) => setTags(sortTags(rows)),
      (e: unknown) => setLoadError(kindOf(e)),
    )
  }, [])
  useEffect(() => {
    setNfc('NDEFReader' in window)
    reload()
  }, [reload])

  /** The single create entry point, gated by the storage-silo guard (APP-DURABLE). */
  const onCreate = (confirmedNow = false) => {
    if (busy.current || cleanTagName(name) === null) return
    if (silo === 'standalone') return blockedRef.current?.focus() // planting here is blocked; nothing is written
    if (silo === 'in-app' && !confirmedNow) return setConfirmAsk(true) // one press, one confirmation
    busy.current = true
    setStatus(null)
    setConfirmAsk(false)
    create.run(async (now) => {
      try {
        await createTag(name, now)
        setName('')
        setStatus('Tag created')
        reload()
        nameInput.current?.focus()
        void requestPersistence() // after the commit; never part of this action's failure or Retry
      } finally {
        busy.current = false
      }
    })
  }

  if (loadError) {
    return (
      <section className="mx-auto max-w-md px-4 py-6">
        <h1 className="app-title">Your tags</h1>
        <p data-testid="store-error" role="alert">
          RunTag can&apos;t open its storage on this device ({loadError}).
        </p>
        <AppNav />
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-md px-4 py-6">
      <h1 className="app-title">Your tags</h1>
      <SiloNotice silo={silo} link={`${TAG_ORIGIN}/app/tags`} blockedRef={blockedRef} />
      <p data-testid="private-note">Private tabs forget your chain.</p>
      <form
        className="mt-4"
        onSubmit={(e) => {
          e.preventDefault()
          onCreate()
        }}
      >
        <input
          aria-label="Tag name"
          data-testid="tag-create-name"
          ref={nameInput}
          className="block w-full rounded-lg border border-current bg-transparent px-3 py-3"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" data-testid="tag-create" className={`${PRIMARY} mt-3`} disabled={create.pending || cleanTagName(name) === null}>
          Create tag
        </button>
        {confirmAsk && (
          <button type="button" data-testid="silo-confirm" className={`${BTN} mt-3`} disabled={create.pending} onClick={() => onCreate(true)}>
            Plant here anyway
          </button>
        )}
      </form>
      {status && <p role="status">{status}</p>}
      {create.failure && <SaveFailure failure={create.failure} />}
      {!nfc && (
        <ol data-testid="nfc-instructions" className="mt-6 list-decimal pl-6">
          {STEPS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      )}
      <ul className="mt-2">
        {(tags ?? []).map((t) => (
          <TagRow key={t.id} tag={t} nfc={nfc} writingId={writingId} setWritingId={setWritingId} writeLock={writeLock} reload={reload} />
        ))}
      </ul>
      <AppNav />
    </section>
  )
}
