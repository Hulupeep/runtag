# APP-TAP: tap in / tap out at `/t/{tagId}`

**Epic:** RunTag App v1 (PRDs/runtag-app-prd.md @ f6c230c7…) · **Wave:** W2 · **Priority:** P0 · **Depends on:** APP-SHELL #26 (merged, live)
**Persona:** owner-runner (iPhone via Safari banner, Android via Chrome) · **Promise:** "Tap the tag, see TAGGED, go. Tap again at the end and see the chain grow."
**Gate A:** SHIP_WITH_STIPULATIONS — verdict §7 APP-TAP items 1–5 (S-1, S-2, S-4, S-13, M-6) folded. **B.5:** docs/specs/app/APP-TAP-preflight.md — C1, C2, P1-1…P1-11, P2-1…P2-9 folded (v2).
**v4 (scoped review round 2):** F-EXPLICIT-RACE-OUTCOMES — explicit Finish/Start race outcomes with URL, copy, primary and two-page scenarios (AC-TAP-22, AC-TAP-23).
**v3 (scoped review round 1 of #27):** F-UNDO-OPEN, F-PLANT-TARGET, F-GUARD-TAG, F-HOPS-RECONCILIATION folded (reload-safe scanned tag, plant/undo race contracts, hops amendment 2026-10-14).
**Pinned hops covered:** I3–I12, A3, A4, A6, A7, A8, L1–L10 (I13 belongs to APP-CHAIN, A5 to APP-TAGS).
**Covers:** APP-002, APP-003, APP-004, APP-005, APP-006 (on tap), APP-016, APP-017, APP-018, APP-019, APP-020, APP-021, APP-023 (new)

## Scope
### In scope
- `lib/app/tap.ts`: the tap decision in ONE `withTxn('readwrite')` using the APP-023 order; plant, undo, explicit finish/start; `abandonStaleIn` (shared with APP-CHAIN, shipped in this slice's first commit).
- Tap, plant, grace, guard, result, stale and failure views; `/app?tapped=` result rendering from IndexedDB; Undo.
- Additive changes to APP-SHELL modules: `Run.lastTransition`; `startRunIfNoneOpenIn` sets `lastTransition:'in'`; `resolveRoute` adds the `grace` view and passes `again`; `shellReplace` in nav.ts; `__runtagStore` exposes `computeChain`, `localDayOf`, `tapAtTag` for tests.
### Not in scope
Chain home, history and stale-abandon on `/app` render (APP-CHAIN #15); tag list/creation/Web NFC (APP-TAGS #17); backup import behind "Restore from backup" (APP-DURABLE #18; link → `/app/settings`); demo link (APP-LINK #19).

## Once per document (APP-016, C2)
The tap decision runs at most once per document, and only when (a) the view mounted for the document's initial URL, (b) `performance.getEntriesByType('navigation')[0].type === 'navigate'`, (c) the document is visible and not prerendering (it waits for `visibilitychange` / `prerenderingchange`). A `/t/` view reached by in-shell Back/forward, a reload, or a bfcache restore never decides: it shows the plant view if the tag is still unknown, otherwise replaces the URL with `/app`. Every outcome leaves `/t/` except the plant view (whose buttons leave it):
| Outcome | URL after `shellReplace` |
|---|---|
| tap-in / tap-out | `/app?tapped={runId}` |
| guard (after tap-in or tap-out) | `/app?tapped={runId}&again=1&tag={tagId}` (scanned tag, reload-safe) |
| grace with an open run | `/app?tapped={openRunId}&grace={tagId}` (the grace tag is the scanned tag) |
| grace without an open run | `/app?grace={tagId}` |
| plant buttons | `/app?tapped={runId}` (start / tap-out ok), `/app` (just save), see plant race outcomes below |
**Scanned tag (F-GUARD-TAG):** guard and grace actions take the tag from the URL (`tag` or `grace` param), never from memory, so a reload keeps it. It must match `^[a-z0-9]{10}$` and be a known tag; otherwise the action buttons are hidden and the view shows `Tap your tag again.` with primary **Go** (safe fallback: no state change is possible without a scanned tag).
`shellReplace(path)` = `window.history.replaceState(null, '', path)` + the `runtag:navigate` event; it is called only after an awaited store call, never synchronously in a mount effect (P2-1).

## Decision order (APP-023, S-2, C1) — first match wins, inside one readwrite transaction
`now` is captured before the transaction; only IndexedDB requests are awaited inside it.
1. **invalid id** (`!^[a-z0-9]{10}$`) → no state change (APP-SHELL routes to the invalid-tag view).
2. **stale abandon**: `abandonStaleIn(s, now)` sets every `open` run with `now − startedAt ≥ STALE_MS` (21_600_000) or `startedAt > now` to `{status:'abandoned', abandonedAt: now}`, leaves all other fields unchanged, returns `true` iff it changed a row, opens no transaction; continue.
3. **unknown tag** → plant view. With a (non-stale) open run: primary **Save and tap out here**, secondary **Just save**, no "Save and start run". Without: primary **Save and start run**, secondary **Just save**. Both show the restore link.
4. **setup grace** (`now < tag.graceUntil`) → grace outcome, no state change. Grace applies only to page loads of `/t/{tagId}`, never to plant-view buttons (S-1).
5. **double-read guard**: the most recent `open` or `done` run (max `lastTapAt`) with `0 ≤ now − lastTapAt < GUARD_MS` (60_000) → guard outcome, no state change (abandoned runs and future `lastTapAt` never guard). Tag-agnostic.
6. **tap-out** (a run is open) → `{status:'done', endedAt: now, tagOutId: tagId, lastTapAt: now, lastTransition:'out'}`; any known tag (point-to-point).
7. **tap-in** → `startRunIfNoneOpenIn` creating `{status:'open', tagInId, startedAt: now, localDay, tzOffsetMin, lastTapAt: now, lastTransition:'in'}`.

## Data and module contract
```ts
// lib/app/store.ts (additive): Run.lastTransition?: 'in' | 'out'; startRunIfNoneOpenIn sets lastTransition:'in'.
//   Every write that changes lastTapAt also sets lastTransition. A missing lastTransition is treated as "changed" by Undo.
// lib/app/route.ts (additive): View adds 'grace'; Route adds again?: boolean, graceTagId?: string, scannedTagId?: string (from `tag`), notice?: 'plant-changed' | 'plant-already-open' | 'finish-changed' | 'start-already-open'.
// lib/app/nav.ts (additive): shellReplace(path)
// lib/app/tap.ts
export const STALE_MS = 21_600_000, GUARD_MS = 60_000, UNDO_MS = 60_000
export type TapOutcome =
  | { kind: 'unknown'; openRunId?: string }
  | { kind: 'grace'; openRunId?: string }
  | { kind: 'guard'; run: Run }
  | { kind: 'in' | 'out'; run: Run }
export function tapAtTag(tagId: string, now: number): Promise<TapOutcome>
export function plantTag(tagId: string, name: string, action: 'start' | 'save' | 'tap-out', now: number, displayedOpenRunId?: string):
  Promise<{ tag: Tag; run?: Run; openRunId?: string; result: 'ok' | 'changed' | 'already-open' }>
//   inside one txn: abandonStaleIn first; saves the tag unless it exists (never overwrites); then
//   'start'   -> if ANY run is open: result 'already-open' (no new run, no 'Run started' feedback), else startRunIfNoneOpenIn;
//   'tap-out' -> only if the open run's id === displayedOpenRunId (the run shown when the plant view rendered) and it is not stale:
//                finish it with tagOutId = tagId; otherwise result 'changed' (no run fields touched).
export function finishOpenRun(runId: string, tagId: string, now: number): Promise<{ result: 'ok'; run: Run } | { result: 'changed'; run?: Run; openRunId?: string }>
//   explicit "Finish run"; tagId = scanned tag from the URL; finishes only if runId is still the open, non-stale run; otherwise
//   nothing is written and the same transaction re-reads the displayed run (`run`) and the currently open run (`openRunId`), if any.
export function startRunExplicit(tagId: string, now: number): Promise<{ result: 'ok'; run: Run } | { result: 'already-open'; openRunId: string }>
//   explicit "Start run"/"Start another run"; if any run is open nothing is written and its id is returned from the same transaction
//   both: abandonStaleIn first, bypass grace and guard, one txn each; buttons are disabled while pending.
export function undoTap(runId: string, expectedLastTapAt: number, now: number): Promise<'undone' | 'changed' | 'expired' | 'too-late' | 'other-open'>
export function abandonStaleIn(s: Stores, now: number): Promise<boolean>
```
**Undo** (APP-018, S-13, T8) is offered while `0 ≤ now − lastTapAt < UNDO_MS` (derived from the stored value; the mounted view re-checks every second and hides it when the window passes) on the in/out result views **and** on guard views (for the original transition). It is a compare-and-set in one readwrite transaction: tap-in undo deletes the run only if still `open`, `lastTransition:'in'`, `lastTapAt === expected`; tap-out undo reopens (`status:'open'`, removes `endedAt`/`tagOutId`, `lastTapAt = startedAt`, `lastTransition:'in'`) only if still `done`, `lastTransition:'out'`, `lastTapAt === expected` **and no other run is open** (checked in the same transaction; otherwise `Can't undo — another run is in progress.`, outcome `other-open`, nothing changes, so at most one run is ever open — APP-004), and is refused with `Too late to undo.` when `now − startedAt ≥ STALE_MS`. Otherwise `Can't undo — something changed.`; window passed → `Undo window has passed.` Abandoned runs stay abandoned. After an Undo the guard does not apply (accepted, honour system).

## Views and copy (M-6: no countdowns or durations anywhere)
Every view on `/t/` keeps `[data-testid=tap-tag-id][data-tag-id]` (APP-SHELL tests). Every view has exactly one primary action: `<button data-testid="tap-primary" data-primary>`; navigation uses `shellNavigate`, never `<a>`.
| View | Copy | Primary | Secondary |
|---|---|---|---|
| tap-in result | `TAGGED` · `Run started` · `You're in. Now go.` | **Go** (→ `/app`) | Undo |
| tap-out result | `Day {N}. Chain unbroken.` (N = `computeChain(listRuns(), localDayOf(now))` after commit; if N = 0, `Run saved.`) | **Done** (→ `/app`) | Undo |
| guard after tap-in | `You're in. Now go.` | **Finish run** | Undo |
| guard after tap-out | `Run saved.` | **Start another run** | Undo |
| grace (run open) | `Tag works ✓` | **Finish run** | — |
| grace (no run) | `Tag works ✓` | **Start run** | — |
| plant | `Plant this tag`, name (1–40 chars, default `My tag`) | Save and start run / Save and tap out here | Just save, restore link |
| plant tap-out race: displayed run no longer open (`changed`) | `Tag saved. Your run changed on another screen, so nothing was tapped out.` — URL `/app?tapped={openRunId}&grace={tagId}&notice=plant-changed` if another run is open, else `/app?grace={tagId}&notice=plant-changed` | the grace primary (**Finish run** / **Start run**) | — |
| plant start race: a run is already open (`already-open`) | `Tag saved. A run is already in progress.` (never `TAGGED`/`Run started`) — URL `/app?tapped={openRunId}&again=1&tag={tagId}&notice=plant-already-open` | **Finish run** (with this scanned tag) | — |
| explicit Finish, run changed, another run open (`changed` + `openRunId`) | `Your run changed on another screen. Nothing was tapped out.` — URL `/app?tapped={openRunId}&again=1&tag={tagId}&notice=finish-changed` (guard-after-tap-in view of the open run; never `Day N` / success copy) | **Finish run** (for `openRunId`, scanned tag) | — |
| explicit Finish, run changed, no run open (`changed`, no `openRunId`) | `Your run changed on another screen. Nothing was tapped out.` — URL `/app?tapped={runId}&notice=finish-changed` (the displayed run's stored result, no success copy) | **Go** | — |
| explicit Start, a run is already open (`already-open`) | `A run is already in progress. Nothing new was started.` (never `TAGGED` / `Run started`) — URL `/app?tapped={openRunId}&again=1&tag={tagId}&notice=start-already-open` | **Finish run** (for `openRunId`, scanned tag) | — |
| guard/grace without a valid scanned tag | `Tap your tag again.` | **Go** | — |
| `/app?tapped=` unknown or deleted id | `This tap was undone or isn't on this phone.` | **Go** | — |
| `/app?tapped=` abandoned run | `Your last run wasn't tapped out, so it didn't count.` | **Go** | — |
| failure (quota / tx-aborted) | `This tap wasn't saved` | **Retry** (re-runs the same action with a fresh `Date.now()`, incl. plant with the typed name) | — |
| failure (newer-schema / unavailable / blocked) | `This tap wasn't saved` + the APP-SHELL store-error text | **Go** | — |
**Stale notice** (`stale-notice`): shown on any tap result/plant view while some run has `0 ≤ now − abandonedAt < 60_000` (derived from the database, survives URL change and reload) (P1-1).

## Acceptance Criteria
| AC | Criterion | Oracle (re-read value) |
|---|---|---|
| AC-TAP-1 | Unknown tag, no open run → plant view: name field, primary "Save and start run", "Just save", restore link; no "Save and tap out here"; `tap-tag-id` present | buttons present/absent; tags count 0 before save (I3, L8) |
| AC-TAP-2 | "Save and start run" → tag `{id, name, createdAt, graceUntil: createdAt + 600000}` and exactly one open run with `tagInId` = id, `lastTransition:'in'`; URL `TAPPED_PREFIX + runId` | rows re-read after reload (I3) |
| AC-TAP-3 | "Just save" → tag stored, zero runs, URL `/app` | rows re-read (I5 setup) |
| AC-TAP-4 | Unknown tag while a non-stale run R1 is open → primary "Save and tap out here" stores the tag and completes R1 with `tagOutId` = new id. Race: page 1 shows the plant view for R1; page 2 finishes R1 and starts R2; page 1 presses "Save and tap out here" → tag stored, R1 fields unchanged (still `done` with page 2's `tagOutId`), R2 still the only open run, URL `/app?tapped={R2}&grace={tag}&notice=plant-changed`, no `Run started` | rows re-read for R1, R2 and the tag; URL and copy (L6, F-PLANT-TARGET) |
| AC-TAP-5 | Grace: a load within `graceUntil` changes nothing and lands on the grace URL with "Tag works ✓" + "Finish run" (run open) or "Start run" | run rows incl. `lastTapAt` unchanged (I4, L7) |
| AC-TAP-6 | Tap-in on a known tag outside grace/guard (Europe/London zone): exactly `TAPPED_PREFIX + R[0].id`; `R[0]` = `{status:'open', tagInId, localDay:'2026-10-12', lastTransition:'in'}`; `TAGGED` only after commit (AC-TAP-13 is the negative control) | URL + rows re-read (I5) |
| AC-TAP-7 | Reload of `/app?tapped={runId}` never re-taps; result from IndexedDB; Undo visible iff `0 ≤ now − lastTapAt < 60000` | rows unchanged after reload; `data-run-id` = stored id (I6) |
| AC-TAP-8 | Guard after tap-in: no change, URL `…&again=1&tag={scanned}`, "Finish run". Cross-tag: tap in at A, scan B within 60 s, **reload**, press "Finish run" → `tagOutId` = B; missing/invalid `tag` param → "Tap your tag again." and no action | `lastTapAt` unchanged before press; `{status:'done', tagOutId:B}` after (I7, F-GUARD-TAG) |
| AC-TAP-9 | Tap-out (same or another known tag) → `{status:'done', endedAt, tagOutId, lastTransition:'out'}`; text `Day N. Chain unbroken.` with N equal to in-page `computeChain(listRuns(), localDayOf(Date.now()))`; after `goto('/app')` + reload `chain-value` = N | rows + rendered N + chain re-read (I8, L2) |
| AC-TAP-10 | Guard after tap-out: no new run, URL `…&again=1&tag={scanned}`, "Start another run". Cross-tag: tap out at A, scan B within 60 s, **reload**, press "Start another run" → new run `tagInId` = B | runs count unchanged before press; new open run `tagInId:B` after (I9, L3, F-GUARD-TAG) |
| AC-TAP-11 | Stale: open run aged ≥ 6 h, or with `startedAt > now`, is abandoned on the next tap; a done run with future `lastTapAt` never guards; the tap then proceeds; stale notice shown | rows re-read for both future-dated fixtures and the 7 h fixture (L8) |
| AC-TAP-12 | Undo: tap-in → run deleted; tap-out → reopened, chain back after reload; changed → "Can't undo — something changed."; window passed → Undo hidden and "Undo window has passed." on a late press; tap-out undo with run aged ≥ 6 h → "Too late to undo."; guard views offer Undo for the original transition; two pages: page 1 taps out R1, page 2 starts R2, page 1 presses Undo → "Can't undo — another run is in progress.", R1 stays `done`, R2 the only open run | rows + `chain-value` re-read after reload (I11, L4, L9, L10) |
| AC-TAP-13 | Storage failure (armed via `sessionStorage` flag read by the init script, after the DB exists) → "This tap wasn't saved" + Retry, no `TAGGED`, rows unchanged in the same context; Retry after disarming records the tap | rows re-read (I12) |
| AC-TAP-14 | Two pages loading the same tag URL at once → exactly one open run; one page lands on `TAPPED_PREFIX + id`, the other on `…&again=1` | open rows = 1 + both URLs (A7) — chromium + mobile |
| AC-TAP-15 | Prerendering (configurable `document.prerendering` getter + `prerenderingchange`) → no run until the event; a reload, an in-shell Back to `/t/`, or a non-`navigate` navigation never decides | runs count before/after (A8, C2) |
| AC-TAP-16 | Offline after one online visit: two never-loaded tag URLs tap in then out with their own ids; result visible < 1000 ms after `goto` resolves (Node-side timing) | `tagInId`/`tagOutId` re-read (A3, A4) — chromium only |
| AC-TAP-17 | No metrics, durations or countdowns in rendered text of every view above | rendered-text regexes of the APP-SHELL metric check (I10, M-6) |
| AC-TAP-18 | Every view shows exactly one `[data-testid=tap-primary][data-primary]` button | count = 1 per view |
| AC-TAP-19 | Restoring or reloading a guard, grace or result URL after 40 minutes records nothing; Back from `/app/settings` to a former `/t/` entry records nothing | rows unchanged (C2) |
| AC-TAP-20 | Online with navigations delayed 30 s: a tap still commits and shows `TAGGED` < 1000 ms (cache-first shell, no network wait) | open rows = 1; timing Node-side (A6) — chromium only |
| AC-TAP-21 | Plant start race: page 1 shows the plant view (no run open); page 2 starts R2 at another tag; page 1 presses "Save and start run" → tag stored, no new run, R2 unchanged and the only open run, no `TAGGED`/`Run started`, URL `/app?tapped={R2}&again=1&tag={tag}&notice=plant-already-open` | rows + URL + absent copy (F-PLANT-TARGET) |
| AC-TAP-22 | Explicit Finish race: page 1 shows the guard-after-tap-in view for R1; page 2 finishes R1 (tagOutId A) and starts R2; page 1 presses "Finish run" → nothing written: R1 stays `{status:'done', tagOutId:A}` with page 2's `endedAt`, R2 stays the only open run; URL `/app?tapped={R2}&again=1&tag={tag}&notice=finish-changed`; notice visible; no `Day N`/`Run saved.` success copy. Variant with no R2: URL `/app?tapped={R1}&notice=finish-changed`, primary Go | R1/R2 rows re-read in the same context; URL; copy present/absent (F-EXPLICIT-RACE-OUTCOMES, P1-3) |
| AC-TAP-23 | Explicit Start race: page 1 shows the guard-after-tap-out view ("Start another run"); page 2 starts R2; page 1 presses "Start another run" → no new run, R2 unchanged and the only open run; URL `/app?tapped={R2}&again=1&tag={tag}&notice=start-already-open`; notice visible; no `TAGGED`/`Run started` | runs count and R2 fields re-read in the same context; URL; copy present/absent (F-EXPLICIT-RACE-OUTCOMES, P1-3) |

## Gherkin (PRD §5 Plant/Run, T1-corrected)
```gherkin
Feature: Plant a tag
  Scenario: First scan of a new tag, start a run
    Given no tag "abc123def4" exists on this device and no run is open
    When I open "/t/abc123def4"
    Then I see "Plant this tag" and "Restore from backup"
    When I name it "Oak at gate" and press "Save and start run"
    Then tag "abc123def4" is stored as "Oak at gate"
    And exactly one run is open with tagInId "abc123def4"
    When 2 minutes pass and I open "/t/abc123def4"
    Then I see "Tag works ✓" and "Finish run"
    And the run is unchanged

  Scenario: Just save
    Given no tag "abc123def4" exists
    When I open "/t/abc123def4", name it and press "Just save"
    Then the tag is stored and no run exists

Feature: Run
  Scenario: Tap in then tap out
    Given tag "abc123def4" was planted more than 10 minutes ago and no run is open
    When I open "/t/abc123def4"
    Then I see "TAGGED" and "You're in. Now go." only after the run row is committed
    And the URL becomes "/app?tapped=<runId>"
    When 61 seconds pass and I open "/t/abc123def4"
    Then the run is done
    And I see "Day 1. Chain unbroken."

  Scenario: Forgotten tap-out with an unknown tag
    Given a run opened 7 hours ago is still open
    When I open "/t/bbbbbbbbbb" which is unknown
    Then the old run is abandoned
    And I do not see "Save and tap out here"

  Scenario: Restored guard page
    Given I was shown the guard screen after tapping in
    When I reload that page 40 minutes later
    Then no run changes
```

## Journeys (Definition of Done)
Hop harnesses follow the 2026-10-14 amendment in PRDs/runtag-app-hops.md (failure arming, prerender getter, setFixedTime + Europe/London, Node-side latency) and include hop S8 (`abandonStaleIn`, TAP → CHAIN).
J-APP-RUN (`tests/e2e/journey_app_run.spec.ts`, `docs/contracts/journey_app_run.yml`) and the tap part of J-APP-PLANT (`tests/e2e/journey_app_plant.spec.ts`, `docs/contracts/journey_app_plant.yml`). `test.use({ timezoneId: 'Europe/London' })`; time only via `page.clock.setFixedTime()` (never `install` + `pauseAt`/`runFor`: `withTxn` settles on a real `setTimeout`; the clock is context-wide). After each tap-out and each Undo: `goto('/app')`, reload, re-read `chain-value` against in-page `computeChain(listRuns(), localDayOf(Date.now()))`. Run against `npm run build && PW_PROD=1 npx playwright test`; offline/slow-network ACs Chromium-only with a stated reason.

## Declarations (Gate B)
Surfaces are route literals, `data-testid` values and exported API identifiers as they appear in code (`/t/` resolves vacuously; `tap-tag-id` carries that surface).
writes: [`/t/`, `/app?tapped=`, `tap-tag-id`, `tapped-run`, `plant-name`, `plant-save-start`, `plant-just-save`, `plant-save-tapout`, `tap-result`, `tap-undo`, `tap-primary`, `tap-guard`, `stale-notice`, `tap-failed`, `tapAtTag`, `plantTag`, `undoTap`, `finishOpenRun`, `startRunExplicit`, `abandonStaleIn`, `shellReplace`, `lastTransition`, `STALE_MS`, `GUARD_MS`, `UNDO_MS`, `TapOutcome`, `scannedTagId`, `plant-changed`, `plant-already-open`, `other-open`, `finish-changed`, `start-already-open`]
reads: [`withTxn`, `startRunIfNoneOpenIn`, `getOpenRunIn`, `StoreError`, `localDayOf`, `computeChain`, `TAPPED_PREFIX`, `resolveRoute`, `graceUntil`, `SETUP_GRACE_MS`, `chain-value`, `shellNavigate`, `subscribeLocation`]
files: [`lib/app/tap.ts`, `lib/app/store.ts`, `lib/app/nav.ts`, `lib/app/route.ts`, `components/app/Shell.tsx`, `components/app/views/tap.tsx`, `components/app/views/tapped.tsx`, `components/app/views/plant.tsx`, `tests/e2e/journey_app_run.spec.ts`, `tests/e2e/journey_app_plant.spec.ts`, `docs/contracts/journey_app_run.yml`, `docs/contracts/journey_app_plant.yml`]
adrNone: "repo has no ADR folder"

Post-build (DoD): `bash evidence/seams-check.sh evidence/seams-app-tap.json` exits 0 on a clean tree; the epic graph is recomputed with `--no-resolve`.

## Definition of Done
- [ ] Every criterion in the Acceptance Criteria table asserted; `npm run test:contracts` + full Playwright (chromium + mobile) green on CI (Gate C)
- [ ] provenance record `evidence/provenance-<issue>.json` passes `scripts/provenance-gate.cjs` on the branch diff
- [ ] production code < 1000 hand-written lines (owner amendment 2026-10-13: tests and contracts excluded)
- [ ] `bash evidence/seams-check.sh evidence/seams-app-tap.json` exits 0 after build
