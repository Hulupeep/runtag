// Tag setup (APP-TAGS): create, rename and re-arm the setup grace. One readwrite transaction per call.

import { newTagId } from './chain'
import { req, SETUP_GRACE_MS, withTxn } from './store'
import type { Tag } from './store'

/** A pending NFC write is aborted this long after its arm, so it always completes inside the armed grace. */
export const WRITE_DEADLINE_MS = 120_000
const ID_ATTEMPTS = 3

/** Trimmed name of 1–40 characters, else null. */
export function cleanTagName(input: string): string | null {
  const name = input.trim()
  return name.length >= 1 && name.length <= 40 ? name : null
}

/** Adds a new tag (never overwrites: `add` only, retrying only on an id collision). */
export function createTag(name: string, now: number): Promise<Tag> {
  const clean = cleanTagName(name)
  if (clean === null) return Promise.reject(new TypeError('A tag name has 1 to 40 characters'))
  return withTxn('readwrite', async (s) => {
    for (let attempt = 1; ; attempt++) {
      const tag: Tag = { id: newTagId(), name: clean, createdAt: now, graceUntil: now + SETUP_GRACE_MS }
      try {
        await req(s.tags.add(tag))
        return tag
      } catch (e) {
        // withTxn prevents the default on request errors, so a caught collision does not abort the transaction.
        if ((e as { name?: string })?.name !== 'ConstraintError' || attempt >= ID_ATTEMPTS) throw e
      }
    }
  })
}

/** Re-reads the row in the same transaction, so a stale page never reverts another page's write. */
function updateTag(id: string, change: (t: Tag) => Tag): Promise<Tag | null> {
  return withTxn('readwrite', async (s) => {
    const row = (await req(s.tags.get(id))) as Tag | undefined
    if (!row) return null
    const next = change(row)
    await req(s.tags.put(next))
    return next
  })
}

export function renameTag(id: string, name: string): Promise<Tag | null> {
  const clean = cleanTagName(name)
  if (clean === null) return Promise.reject(new TypeError('A tag name has 1 to 40 characters'))
  return updateTag(id, (t) => ({ ...t, name: clean }))
}

/** Re-arms the setup grace (S-8): the next read of this tag within it shows "Tag works ✓", not a tap. */
export function markTagWritten(id: string, now: number): Promise<Tag | null> {
  return updateTag(id, (t) => ({ ...t, graceUntil: now + SETUP_GRACE_MS }))
}

export const sortTags = (tags: Tag[]) =>
  [...tags].sort((a, b) => b.createdAt - a.createdAt || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
