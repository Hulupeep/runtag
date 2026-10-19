# APP-DURABLE: backups, persistence, storage-silo guard

**Epic:** RunTag App v1 (PRDs/runtag-app-prd.md @ f6c230c7…) · **Wave:** W3 · **Priority:** P1 · **Depends on:** APP-SHELL #26, APP-TAP #27 (plant view, restore link), APP-CHAIN #29 (`backup-status` slot, home load transaction), APP-TAGS #31 (`onCreate` entry point) — all merged and live
**Persona:** owner-runner whose chain must survive a cleared browser or a new phone (iPhone Safari ITP, Android Chrome) · **Promise:** "My chain survives a new phone or a cleared browser."
**Gate A:** SHIP_WITH_STIPULATIONS — verdict §7 APP-DURABLE items 1–4 (S-6, S-12, M-4, T12 part) folded. **B.5:** docs/specs/app/APP-DURABLE-preflight.md — P1-1…P1-11, P2-1…P2-7 folded (v2).
**Pinned hops:** I14, I15, A9 (automated); I17 (real iPhone, added to the APP-LINK #19 checklist by this ticket's DoD); shared-contract hops S1, S3, S5 (PRDs/runtag-app-hops.md). **Seams:** `runs`/`tags` writer×writer with APP-TAP and APP-TAGS (AC-DUR-4); `meta` writer (APP-SHELL creates it); `backup-status` in APP-CHAIN's load transaction.
**Covers:** APP-012, APP-013, APP-022 (+ PL-1 backup visibility, PL-2, PL-6, PL-14)

## Scope
### In scope
- `lib/app/backup.ts`: export file, validation, plan + merge-by-id import with conflicts, persistence request, the single meta writer, the nudge rule.
- `lib/app/silo.ts`: the closed storage-silo detection list and the plant guard.
- Settings view (`components/app/views/settings.tsx`): Export, Import (summary, conflict choices), persistence status, last backup.
- Guarding the two planting entry points — APP-TAGS `onCreate` (components/app/views/tags.tsx) and the APP-TAP plant buttons (components/app/views/plant.tsx) — and requesting persistence after a plant or an import commits.
- Home (`components/app/views/home.tsx`): `meta` joins the existing load transaction; last backup, persistence warning, the backup nudge and the standalone notice inside the `backup-status` slot.
### Not in scope
Cloud sync or accounts (v1 has no server); detecting private browsing (not detectable — stated in copy instead); real-device retention and iOS file handling (I17, APP-LINK #19 checklist).

## Rules
- **Silo detection (S-12, APP-013), closed list:** `detectSilo(nav)` returns `'standalone'` iff `nav.standalone === true`; else `'in-app'` iff `nav.userAgent` contains any of `Instagram`, `FBAN`, `FBAV`, `Line/`, `musical_ly`, `BytedanceWebview`; else `null`. Private mode is not detected.
- **Guarded planting (P1-5):** `guardPlant(nav): 'blocked' | 'confirm' | 'ok'` and the hook `useSilo()` (lib/app/silo.ts) are the only silo API the views use; tags.tsx and plant.tsx contain no `userAgent` (code or comment).
  - `ok`: unchanged behaviour.
  - `blocked` (standalone, P1-6): `silo-blocked` "Plant tags in Safari. Tags planted in the Home Screen app can't be read when you tap them." is rendered **on load** on `/app` (inside `backup-status`), `/app/tags`, the plant view and Settings. The plant and create buttons stay enabled (one primary on `/t/`); pressing them writes nothing and moves focus to `silo-blocked`.
  - `confirm` (in-app): `silo-warning` is rendered on load with "This browser keeps its own storage, so taps won't find these tags. Open RunTag in Safari or your default browser." and a **Copy link** button (`silo-copy`) that copies `TAG_ORIGIN + '/app/tags'` (tags view) or `tagUrl(tagId)` (plant view) with the APP-TAGS clipboard and fallback rules. The first press of Create tag, Save and start run, Just save or Save and tap out here writes nothing and reveals `silo-confirm` "Plant here anyway" — a **secondary** button, never `tap-primary` (the APP-TAP one-primary rule holds) — which remembers the pressed action and performs exactly that action (the same `createTag` / `plantTag(…, displayedOpenRunId)` call, so the APP-TAP plant race outcomes are unchanged) under the same disabled-while-pending and `busy` rules. The confirmation lasts for one press: after each write the next plant needs a new confirmation; Enter on the create form and a second press of the original button only re-reveal it.
  - `private-note` "Private tabs forget your chain." is always shown on both plant views.
- **Persistence (APP-012, P1-1):** `requestPersistence()` runs **after** any commit that leaves the device with at least one tag: `createTag` resolving in `onCreate`, `plantTag` resolving in the plant view, and Import Apply committing. It does nothing if `meta.persistResult !== undefined` (re-read in its own transaction) and is single-flight per document. It calls `navigator.storage?.persist?.()` (missing API → `false`; a rejection → `false`) and stores the boolean with `updateMeta`. It is never awaited inside the create or plant action, never shown as a failure and never retried by the action's Retry; if its meta write fails, `persistResult` stays `undefined` and the next plant or import asks again. Rejections are handled explicitly (no `.catch(() => …)` swallowing). Writing `persistResult` after an import is local bookkeeping, not "import changing meta" (S-6).
- **Meta (seam, P1-7):** `updateMeta(patch)` is the only meta writer: in one `withTxn('readwrite')` it `get`s the `'meta'` row and `put`s `{ ...row, ...patch, schemaVersion: 1 }`. Home's existing load transaction (`loadHome`) also returns `meta`, and everything in `backup-status` derives from that result and its `now`; home starts no other transaction, and a rejected load still shows `store-error` only.
- **Export (P2-1):** `exportFile(now)` reads tags, runs and meta in one readonly transaction and returns `{ schemaVersion: 1, exportedAt: now, tags, runs, meta }` with tags and runs sorted by `id` in code-unit order (`a.id < b.id ? -1 : 1`). Settings downloads it as `runtag-backup-${localDayOf(now)}.json`, then `updateMeta({ lastExportAt: now })`, and says "Saved to your Downloads or Files. If you cancelled, export again." If that write fails: `backup-failed` with Retry for the **save only** (no second download).
- **Validation (M-4, P1-4):** `validateBackup(text)` accepts iff the JSON parses to a plain object with exactly the keys `schemaVersion`, `exportedAt`, `tags`, `runs`, `meta`; `schemaVersion === 1`; `exportedAt` is a finite number; `meta` is a plain object (not validated further, never imported); `tags` and `runs` are arrays. Every tag is a plain object with exactly the keys `id` (`^[a-z0-9]{10}$`), `name` (string with `cleanTagName(name) === name`), `createdAt`, `graceUntil` (finite numbers). Every run is a plain object with only the keys of `Run`: `id` (non-empty string), `status` ∈ open/done/abandoned, `tagInId` (tag id pattern), `startedAt`, `tzOffsetMin`, `lastTapAt` (finite numbers), `localDay` (`^\d{4}-\d{2}-\d{2}$`); optional `tagOutId` (tag id pattern), `endedAt`, `abandonedAt` (finite numbers), `lastTransition` ∈ in/out. Tag ids are unique within `tags` and run ids within `runs`. Any failure → `backup-invalid` "This isn't a RunTag backup", and no transaction is opened.
- **Import (S-6, P1-2, P1-3):** `planImport(file)` reads the current rows in one readonly transaction and returns `{ added, identical, conflicts }`; nothing is written. **Identical** = deep-equal over own enumerable keys, ignoring key order, an absent key equal to `undefined`. A tag that differs only in `graceUntil` is not a conflict: the local row is kept and counted as already here. `importBackup(file, choices, now)` (choices: `Record<'tag:'|'run:' + id, 'mine'|'backup'>`, default `'mine'`) runs **one** `withTxn('readwrite')` that **re-reads every local row and recomputes the merge inside the transaction**: new ids are `add`ed; identical rows are skipped; a differing row is `put` only if its choice is `'backup'`; a row that differs but has **no** choice (it changed after the plan) rejects with `ImportChanged`, writes nothing, and the view re-plans and shows "Your data changed. Check the list again." Still inside that transaction `abandonStaleIn(s, now)` runs over the merged state; then, if more than one run is `open`, the one with the greatest `startedAt` stays open and every other becomes `{status:'abandoned', abandonedAt: now}` (all other fields unchanged) — so a backup can't displace a valid local open run with a stale or future-dated one. The stale notice may show after an import abandonment (accepted: the abandoned run doesn't count). Import never changes local `meta`. Importing the same file again after any Apply writes nothing; conflicts kept as "mine" are listed again.
- **Import flow (P1-3):** pick a file (`backup-import`, `accept=".json,application/json,text/plain"`) → validate → plan → `backup-summary` "New: {n} tags, {m} runs. Already here: {k}." plus the conflict list, **Apply** and **Cancel** (writes nothing). Apply is required even with no conflicts. After the commit: `backup-done` "Backup restored." and `requestPersistence()`. Conflict rows: a tag shows "Tag: {local name} (yours) / {backup name} (backup)"; a run shows "Run on {weekday} {day} {month} (its `localDay`): yours {state}, backup {state}" with state "finished" / "in progress" / "didn't count" — no clock times. In standalone, `backup-import` is replaced by "Restore your backup in Safari." and nothing is imported; in-app, the first Apply reveals `silo-confirm` "Restore here anyway". Export is allowed everywhere.
- **Backup status and nudge (APP-022, T12, PL-1, P2-2):** home's `backup-status` slot shows `last-backup` "Last backup: never" or "Last backup: {weekday} {day} {month}" for `localDayOf(meta.lastExportAt)`, rendered with the history.ts parts (`weekday:'long'`, the day number, `month:'long'`, `timeZone:'UTC'` on that day); Settings shows the same line. `NUDGE_MS = 604_800_000`; the card `backup-nudge` "Back up your chain" shows iff (`persistResult === false` or (done runs ≥ 3 and (`lastExportAt === undefined` or `now − lastExportAt > NUDGE_MS`))) and not `backupNudgeDismissedUntil > now`. On home `persist-warning` "Your phone may clear this data. Export a backup." is shown only inside the card, and "Not now" hides both; Settings always shows `persist-warning` when `persistResult === false` and `persist-ok` "This phone keeps your data." when `true`. The card's "Back up now" exports in one tap; "Not now" → `updateMeta({ backupNudgeDismissedUntil: now + NUDGE_MS })`. Copy names no number of days. After an import the card follows the same rule (a restored phone has no export yet).
- **Failure (S1, S5, P2-4):** pending/retry via `useAction`. Retry only for `StoreError` kinds `quota` / `tx-aborted`: `backup-failed` "That wasn't saved" + `backup-retry`, nothing written. Other kinds, and a rejected Settings load, render `store-error` "RunTag can't open its storage on this device ({kind})." with `<AppNav/>`.
- **Copy, accessibility and contracts (P2-6):** no metrics, clock times or durations in rendered text (APP-008, M-6). Every `<input>` (file, radio) puts `aria-label` before any attribute containing `=>`. Copy-link URLs come only from `TAG_ORIGIN` / `tagUrl`. No new window globals. Shared button classes, no `className` hex literals. Buttons at least 48 × 48 px (APP-015). Settings keeps its "Settings" h1 and `<AppNav/>`.

## Views and copy (P1-11)
| Element | testid / attributes | Copy |
|---|---|---|
| Settings heading | — | "Settings" (h1, kept) + `<AppNav/>` (kept) |
| export | `backup-export` (Settings) / `backup-nudge-export` (card) | "Export backup" / "Back up now" |
| import | `backup-import` (`<input type="file">`, `aria-label="Backup file"` first) behind a visible ≥ 48 × 48 label button | "Import backup" |
| invalid | `backup-invalid` (`role="alert"`) | "This isn't a RunTag backup" |
| summary | `backup-summary` | "New: {n} tags, {m} runs. Already here: {k}." |
| conflict row | `backup-conflict`, `data-kind="tag"|"run"`, `data-id`; radios `backup-keep` / `backup-use` | Import flow text; "Keep mine" / "Use backup" |
| apply / cancel | `backup-apply` / `backup-cancel` | "Apply" / "Cancel" |
| done | `backup-done` (`role="status"`) | "Backup restored." |
| changed | `backup-changed` (`role="alert"`) | "Your data changed. Check the list again." |
| failure | `backup-failed` + `backup-retry`; non-retryable → `store-error` | "That wasn't saved" / "Retry" |
| persistence | `persist-warning` (when `false`); `persist-ok` (when `true`); nothing when `undefined` | Rules |
| last backup | `last-backup` (home inside `backup-status`; Settings) | "Last backup: never" / "Last backup: {weekday} {day} {month}" |
| nudge | `backup-nudge` (contains `persist-warning` when `false`), `backup-nudge-export`, `backup-nudge-dismiss` | "Back up your chain" / "Back up now" / "Not now" |
| silo | `silo-blocked`, `silo-warning` (+ `silo-copy`), `silo-confirm`, `private-note` | Rules |
No DURABLE button uses `tap-primary`.

## Module contract
```ts
// lib/app/silo.ts
export type Silo = 'standalone' | 'in-app' | null
export function detectSilo(nav: { standalone?: boolean; userAgent: string }): Silo
export function guardPlant(nav: { standalone?: boolean; userAgent: string }): 'blocked' | 'confirm' | 'ok'
export function useSilo(): Silo   // client-only views; computed once per render
// lib/app/backup.ts
export const NUDGE_MS = 604_800_000
export class ImportChanged extends Error {}
export function exportFile(now: number): Promise<ExportFile>
export function validateBackup(text: string): ExportFile | null
export function planImport(file: ExportFile): Promise<{ added: { tags: number; runs: number }; identical: number; conflicts: Conflict[] }>
export function importBackup(file: ExportFile, choices: Record<string, 'mine' | 'backup'>, now: number): Promise<{ added: number; replaced: number; abandoned: number }>
export function updateMeta(patch: Partial<Meta>): Promise<Meta>
export function requestPersistence(): Promise<boolean | undefined>
export function shouldNudge(meta: Meta, runs: Run[], now: number): boolean
```

## Acceptance Criteria
| AC | Criterion | Oracle (re-read value) |
|---|---|---|
| AC-DUR-1 | Round trip and restore from the plant view (I15, S-6, S3, PL-1) | fixture: tags A, B, C; runs = 8 `done` on consecutive `localDay`s ending today (each with `endedAt`, `tagOutId`, `lastTransition:'out'`), 1 `abandoned` (with `abandonedAt`), 1 `open` started 30 min before T0 (`lastTransition:'in'`); before export `chain-value` = `"8"`. Export → file A (`download.suggestedFilename()` = `runtag-backup-2026-10-12.json`, `exportedAt` = T0). New context (project use): `goto('/t/' + A.id)` → plant view → "Restore from backup" → `data-view=settings` → import file A → Apply → `goto('/app')` + reload: `chain-value` = `"8"` = in-page `computeChain(listRuns(), localDayOf(now))`, `listRuns()` deep-equals file A's runs, `/t/{A}` no longer shows the plant view. Export → file B: B's `tags` and `runs` deep-equal A's (`meta`, `exportedAt` excluded). Import A again → `backup-summary` "New: 0 tags, 0 runs. Already here: 13.", Apply → tags 3, runs 10, rows deep-equal. Export at `2026-10-13T00:30:00+01:00` → `runtag-backup-2026-10-13.json` |
| AC-DUR-2 | Invalid files write nothing (M-4, P1-4, P1-9) | seed tag A, done run R1 and `meta.lastExportAt = T0 − 1 day`; for each of: not JSON, top-level `[]`, `schemaVersion: 2`, `exportedAt` missing, `meta: null`, a tag id `ABC`, a 41-character name, a duplicate tag id, a run `status:'paused'`, a run `localDay:'12/10/2026'`, a run missing `startedAt`, a run `lastTransition:'x'`, a run `tagOutId:'BAD'`, an extra key `"x":1` on a run: `backup-invalid` "This isn't a RunTag backup", and `listTags()`, `listRuns()`, `getMeta()` deep-equal the seeded values |
| AC-DUR-3 | Conflicts, summary and cancel (P1-3) | local tag A "Gate", backup tag A "Bridge", a new tag B, and a local tag D re-armed (only `graceUntil` differs): the summary counts B as new and D as already here; the conflict list shows only A with "Keep mine" checked; Cancel → all stores deep-equal their values before; Apply → A "Gate", B added; repeat choosing "Use backup" → A "Bridge"; a run conflict row's text matches neither metric regex; local meta unchanged |
| AC-DUR-4 | At most one open run after import, re-merged at Apply (P1-2) | (a) local open R1 (T0 − 1 h), backup open R2 (T0 − 30 min): after Apply R2 open, R1 `{status:'abandoned', abandonedAt: importTime}`, exactly one open run; (b) backup open R2 with `startedAt` = now + 1 h, local open R1 (now − 1 h): after Apply R1 open and unchanged, R2 abandoned; (c) two pages: page 1 shows the plan for a backup with open R2 (now − 30 min); page 2 taps in at A (R3); page 1 Apply → `listRuns()` re-read in the same context has exactly one open row, R3 open and unchanged, R2 abandoned; variant: page 2 renames a conflicting tag after the plan → `backup-changed` and `listTags()` deep-equals page 2's state |
| AC-DUR-5 | Persistence after a plant or an import (APP-012, P1-1) | init script `Object.defineProperty(Navigator.prototype, 'storage', …)` whose `persist()` counts calls in `sessionStorage['runtag-persist-calls']` and resolves `sessionStorage['runtag-persist'] === 'true'`: (a) false: Create on `/app/tags` → `expect.poll(getMeta().persistResult)` = `false`; Settings and home (after reload, inside the card) show `persist-warning`. (b) true, fresh context: `/t/{unknown}` Just save → `persistResult === true`, `persist-ok` on Settings; then Create → call count still `"1"`. (c) restore-only device: fresh context imports a valid file → `persistResult` set, call count `"1"`. (d) no override on `mobile` (no `navigator.storage`): Create → `persistResult === false`. (e) fail-writes armed after the database exists, then Create → exactly one tag (same context), no `tag-failed`, `persistResult` still `undefined` |
| AC-DUR-6 | Standalone: notice on load, planting and restore blocked (I14, P1-6, P1-9) | seed tag A and open run R1 first; standalone override (`Object.defineProperty(Navigator.prototype, 'standalone', { configurable: true, get: () => true })`): `silo-blocked` visible on load of `/app`, `/app/tags`, `/app/settings` and the plant view; Create on `/app/tags` and every plant button on `/t/{X}` → `listTags()` deep-equals `[A]`, `listRuns()` deep-equals `[R1]` (same context); Settings `backup-import` count 0. Positive control, fresh context without the override: Create → `listTags()` contains `{ name:'Oak at gate', createdAt: T0 }` |
| AC-DUR-7 | In-app browser: warning, one-press confirmation (A9, P1-5) | context `userAgent` = project UA + ` Instagram 300.0.0`: `/t/{C}` shows `silo-warning` and `private-note`; first "Just save" → `listTags()` deep-equals the seeded rows and `silo-confirm` visible; `[data-testid=tap-primary]` count 1 in the warning and confirm states; `silo-confirm` → `listTags()` includes `{ id: C, name: 'Bridge', createdAt: now, graceUntil: now + 600000 }`; `dblclick` on `silo-confirm` → grows by exactly 1; on `/app/tags` Enter in `tag-create-name` after the first press → no new tag; "Save and tap out here" + confirm with an open R1 → R1 `{status:'done', tagOutId: C}`; `silo-copy` → clipboard or fallback value `tagUrl(C)`; project UA without the token → no `silo-warning` |
| AC-DUR-8 | Private-tab copy | both plant views contain `private-note` "Private tabs forget your chain." |
| AC-DUR-9 | Backup status and nudge (APP-022, P1-7, P2-2) | home `last-backup` "Last backup: never"; 3 done runs, never exported → `backup-nudge` visible; "Back up now" → `meta.lastExportAt` = now, card gone, `last-backup` "Last backup: Monday 12 October" (T0) in both projects; at `lastExportAt + NUDGE_MS` exactly → no card, `+ 1 ms` → card; "Not now" → `backupNudgeDismissedUntil` = now + NUDGE_MS, card hidden after reload; 2 done runs and `persistResult` true → no card; `persistResult === false` with 0 runs → card with `persist-warning`; two pages: page 1 "Not now" while page 2 exports → `getMeta()` has both fields; the APP-CHAIN forced-failure test (journey_app_chain.spec.ts) re-run unchanged |
| AC-DUR-10 | Failures write nothing (S1, S5, P2-4) | fail-writes armed through sessionStorage after the database exists: Apply → `backup-failed` + Retry, tags, runs **and meta** re-read in the same context unchanged; disarm, Retry → merged; "Not now" armed → card still visible, `backupNudgeDismissedUntil` unchanged, disarm + Retry → set; export armed → the download happens, `lastExportAt` unchanged, `backup-failed`, Retry → `lastExportAt` set and download count still 1; database pre-created at version 2 → `/app/settings` shows `store-error` and no `backup-import` |
| AC-DUR-11 | No metrics; accessible; contracts | rendered-text regexes on Settings (empty, summary, conflicts, done, invalid, failure), home with the card, both plant views in warning and confirm states; labelled file input and radios; buttons ≥ 48 × 48 px; `npm run test:contracts` green; the APP-TAGS static check (journey_app_tags.spec.ts) re-run green |

## Gherkin (PRD §5 Backup)
```gherkin
Feature: Backup
  Scenario: Round trip
    Given 3 tags and 10 runs
    When I export, clear site data and import the file
    Then the fresh export's tags and runs, sorted by id, deep-equal the first export's (meta and exportedAt excluded)
    And importing the same file again leaves 3 tags and 10 runs unchanged

  Scenario: Not a backup
    When I import a file that isn't a RunTag backup
    Then I see "This isn't a RunTag backup"
    And nothing on this phone changes

  Scenario: Home Screen app
    Given RunTag is open as a Home Screen app on iPhone
    When I open "/app/tags"
    Then I see "Plant tags in Safari" before pressing anything
    And trying to plant saves no tag

  Scenario: In-app browser
    Given RunTag is open in Instagram's in-app browser
    When I open an unknown tag and press "Just save"
    Then I see "This browser keeps its own storage" and "Plant here anyway"
    And no tag is saved
    When I press "Plant here anyway"
    Then the tag is saved

  Scenario: Backup nudge
    Given 3 done runs exist and no export has been made
    When I open "/app"
    Then I see "Back up your chain"
```

## Journey (Definition of Done)
J-APP-BACKUP (`tests/e2e/journey_app_backup.spec.ts`, contract `docs/contracts/journey_app_backup.yml`), projects chromium + mobile. `test.use({ timezoneId: 'Europe/London' })`, time only via `page.clock.setFixedTime()`; rows re-read through `window.__runtagStore`; background writes re-read with `expect.poll`. In-app UA = `` `${testInfo.project.use.userAgent} Instagram 300.0.0` `` via `browser.newContext({ ...testInfo.project.use, userAgent })`; "new context" = `browser.newContext({ ...testInfo.project.use })`; standalone and persistence overrides as in AC-DUR-6 / AC-DUR-5. Meta is seeded with `withTxn('readwrite', s => req(s.meta.put({ ...m, schemaVersion: 1 }, 'meta')))` (new `seedMeta` in tests/e2e/tap-helpers.ts). Export = `Promise.all([page.waitForEvent('download'), click])` → `download.path()` → `setInputFiles`. Failure injection is armed through `sessionStorage` after the database exists, and rows are re-read in the same context. Run against `npm run build && PW_PROD=1 npx playwright test`.

## Declarations (Gate B)
Surfaces are route literals, `data-testid` values and exported API identifiers as they appear in code. `meta`, `/app/settings` and the Meta fields resolve pre-build (vacuous); they are covered by `updateMeta`, `backup-export` and `last-backup`.
writes: [`/app/settings`, `meta`, `tags`, `runs`, `exportFile`, `validateBackup`, `planImport`, `importBackup`, `ImportChanged`, `updateMeta`, `requestPersistence`, `shouldNudge`, `NUDGE_MS`, `detectSilo`, `guardPlant`, `useSilo`, `backup-export`, `backup-import`, `backup-invalid`, `backup-summary`, `backup-conflict`, `backup-keep`, `backup-use`, `backup-apply`, `backup-cancel`, `backup-done`, `backup-changed`, `backup-failed`, `backup-retry`, `persist-warning`, `persist-ok`, `last-backup`, `backup-nudge`, `backup-nudge-export`, `backup-nudge-dismiss`, `silo-blocked`, `silo-warning`, `silo-copy`, `silo-confirm`, `private-note`]
reads: [`withTxn`, `req`, `StoreError`, `store-error`, `listTags`, `listRuns`, `getMeta`, `abandonStaleIn`, `localDayOf`, `computeChain`, `tagUrl`, `TAG_ORIGIN`, `cleanTagName`, `onCreate`, `createTag`, `plantTag`, `backup-status`, `empty-state`, `tap-primary`, `useAction`, `nav-settings`, `AppNav`]
files: [`lib/app/backup.ts`, `lib/app/silo.ts`, `components/app/views/settings.tsx`, `components/app/views/tags.tsx`, `components/app/views/plant.tsx`, `components/app/views/home.tsx`, `tests/e2e/journey_app_backup.spec.ts`, `tests/e2e/tap-helpers.ts`, `docs/contracts/journey_app_backup.yml`, `evidence/seams-app-durable.json`, `evidence/seams-runtag-app.json`]
adrNone: "repo has no ADR folder"

Post-build (DoD): `bash evidence/seams-check.sh evidence/seams-app-durable.json` exits 0 on a clean tree; the epic graph is recomputed with `--no-resolve`.

## Definition of Done
- [ ] Every criterion in the Acceptance Criteria table asserted; `npm run test:contracts` + full Playwright (chromium + mobile) green on CI (Gate C)
- [ ] provenance record `evidence/provenance-<issue>.json` passes `scripts/provenance-gate.cjs` on the branch diff
- [ ] production code < 1000 hand-written lines (owner amendment 2026-10-13: tests and contracts excluded)
- [ ] `bash evidence/seams-check.sh evidence/seams-app-durable.json` exits 0 after build
- [ ] PRDs/runtag-app-hops.md carries a dated amendment reconciling the I14 / A9 / I15 harness (seeded preconditions, appended UA, `defineProperty` overrides) and the derived seams of this ticket
- [ ] APP-LINK #19 device checklist (docs/specs/app/APP-LINK.md, real-device checklist) lists, verbatim: "I17 (iPhone Safari, ≥ 8 days, NFC-launched visits only): Export daily from `https://runtag.vercel.app/app/settings`; the file `runtag-backup-YYYY-MM-DD.json` lands in Files; each day's export run-id set ⊇ the previous day's; chain = the tally in a dated note written before opening `/app`. Import that file on a cleared Safari (Settings → Import) → the chain matches. Record `meta.persistResult` from the export. Home Screen app: `/app/tags` shows 'Plant tags in Safari' on load. Instagram in-app browser: the warning and 'Plant here anyway'."
