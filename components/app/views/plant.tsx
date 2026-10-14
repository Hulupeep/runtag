'use client'

import { useEffect, useState } from 'react'
import { shellNavigate, shellReplace } from '@/lib/app/nav'
import { TAPPED_PREFIX } from '@/lib/app/route'
import { listRuns } from '@/lib/app/store'
import type { Run } from '@/lib/app/store'
import { plantTag } from '@/lib/app/tap'
import type { PlantAction } from '@/lib/app/tap'
import { FailedView, Primary, Secondary, StaleNotice, useAction } from './tapped'

/** First scan of an unknown tag (APP-002). Buttons bypass setup grace and the guard (S-1). */
export function PlantView({ tagId, openRunId }: { tagId: string; openRunId?: string }) {
  const [name, setName] = useState('My tag')
  const [runs, setRuns] = useState<Run[]>([])
  const { pending, failure, run } = useAction()

  useEffect(() => {
    listRuns().then(setRuns, () => undefined)
  }, [])

  const save = (action: PlantAction) =>
    run(async (now) => {
      const r = await plantTag(tagId, name, action, now, openRunId)
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
          <Primary label="Save and tap out here" disabled={pending || invalid} onPress={() => save('tap-out')} />
        </div>
      ) : (
        <div data-testid="plant-save-start">
          <Primary label="Save and start run" disabled={pending || invalid} onPress={() => save('start')} />
        </div>
      )}
      <Secondary testId="plant-just-save" label="Just save" disabled={pending || invalid} onPress={() => save('save')} />
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
