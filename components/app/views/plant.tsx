'use client'

import { useEffect, useRef, useState } from 'react'
import { shellNavigate, shellReplace } from '@/lib/app/nav'
import { TAPPED_PREFIX } from '@/lib/app/route'
import { listRuns } from '@/lib/app/store'
import type { Run } from '@/lib/app/store'
import { plantTag } from '@/lib/app/tap'
import type { PlantAction } from '@/lib/app/tap'
import { requestPersistence } from '@/lib/app/backup'
import { tagUrl } from '@/lib/app/origin'
import { useSilo } from '@/lib/app/silo'
import { SiloNotice } from './settings'
import { FailedView, Primary, Secondary, StaleNotice, useAction } from './tapped'

/** First scan of an unknown tag (APP-002). Buttons bypass setup grace and the guard (S-1). */
export function PlantView({ tagId, openRunId }: { tagId: string; openRunId?: string }) {
  const [name, setName] = useState('My tag')
  const [runs, setRuns] = useState<Run[]>([])
  const { pending, failure, run } = useAction()

  useEffect(() => {
    listRuns().then(setRuns, () => undefined)
  }, [])

  const silo = useSilo()
  const [confirmFor, setConfirmFor] = useState<PlantAction | null>(null)
  const blockedRef = useRef<HTMLParagraphElement>(null)

  // Storage-silo guard (APP-DURABLE): blocked writes nothing; in-app needs one confirmation per press,
  // which replays exactly the pressed action (same plantTag call, so race outcomes are unchanged).
  const press = (action: PlantAction) => {
    if (silo === 'standalone') return blockedRef.current?.focus()
    if (silo === 'in-app') return setConfirmFor(action)
    save(action)
  }

  const save = (action: PlantAction) =>
    run(async (now) => {
      setConfirmFor(null)
      const r = await plantTag(tagId, name, action, now, openRunId)
      void requestPersistence() // the tag is committed; fire-and-forget, never part of this action's Retry
      if (r.result === 'ok') return shellReplace(r.run ? TAPPED_PREFIX + r.run.id : '/app')
      if (r.result === 'already-open') return shellReplace(`${TAPPED_PREFIX}${r.openRunId}&again=1&tag=${tagId}&notice=plant-already-open`)
      shellReplace(r.openRunId ? `${TAPPED_PREFIX}${r.openRunId}&grace=${tagId}&notice=plant-changed` : `/app?grace=${tagId}&notice=plant-changed`)
    })

  const tagIdMark = <p data-testid="tap-tag-id" data-tag-id={tagId} className="sr-only">New tag</p>
  if (failure) return <FailedView failure={failure}>{tagIdMark}</FailedView>

  const invalid = name.trim().length === 0 || name.length > 40
  return (
    <section data-testid="tap-plant">
      <h1 className="app-title">Plant this tag</h1>
      {tagIdMark}
      <StaleNotice runs={runs} now={Date.now()} />
      <SiloNotice silo={silo} link={tagUrl(tagId)} blockedRef={blockedRef} />
      <p data-testid="private-note">Private tabs forget your chain.</p>
      <label className="mt-4 block">
        Name
        <input
          aria-label="Tag name"
          data-testid="plant-name"
          className="mt-2 block w-full rounded-lg border border-current bg-transparent px-4 py-3"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      {openRunId ? (
        <div data-testid="plant-save-tapout">
          <Primary label="Save and tap out here" disabled={pending || invalid} onPress={() => press('tap-out')} />
        </div>
      ) : (
        <div data-testid="plant-save-start">
          <Primary label="Save and start run" disabled={pending || invalid} onPress={() => press('start')} />
        </div>
      )}
      <Secondary testId="plant-just-save" label="Just save" disabled={pending || invalid} onPress={() => press('save')} />
      {confirmFor && (
        <Secondary testId="silo-confirm" label="Plant here anyway" disabled={pending || invalid} onPress={() => save(confirmFor)} />
      )}
      <p className="mt-6">
        <a
          href="/app/settings"
          onClick={(e) => {
            e.preventDefault()
            shellNavigate('/app/settings')
          }}
        >
          Restore from backup
        </a>
      </p>
    </section>
  )
}
