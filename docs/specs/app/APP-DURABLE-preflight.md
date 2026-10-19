# APP-DURABLE — GATE B.5 pre-flight simulation

**Target:** docs/specs/app/APP-DURABLE.md (working-tree version, 83 lines) · **Date:** 2026-10-19 · **Mode:** ticket walk against merged APP-SHELL + APP-TAP + APP-CHAIN + APP-TAGS code
**Context read:** PRDs/runtag-app-prd.md (APP-002, 006, 009, 010, 012, 013, 020, 022, §5 Backup, §6, §7 durability, §10 owner decisions), PRDs/runtag-app-verdict.md (§3 S-6/S-12, §4 M-4/M-6, §6 loophole log, §7 APP-SHELL 3, §7 APP-DURABLE 1–4, §7 APP-LINK 3), PRDs/runtag-app-falsification.md (T6, T7, T12, overclaim table), PRDs/runtag-app-persona-lens.md (P1 1a/1b/1c, P5 5d, PL-1, PL-2, PL-6, PL-14, OQ-6, OQ-7, device question 3), PRDs/runtag-app-hops.md (I14, I15, I17, A9, S1, S3, S5, seam list `/app`, `/app/settings`, `runs`, `tags`, expected seam APP-DURABLE×APP-TAP, amendments 2026-10-12, 2026-10-14, 2026-10-14b, 2026-10-14c), docs/specs/app/APP-TAGS.md (+ preflight P1-7), APP-TAP.md, APP-CHAIN.md, APP-LINK.md, lib/app/{store,chain,route,nav,tap,origin,history,tags}.ts, components/app/Shell.tsx, components/app/views/{home,tags,plant,tapped,tap,settings}.tsx, docs/contracts/feature_app.yml (APP-ORIGIN, APP-GLOBALS, APP-CHAIN-SOURCE), feature_app_defaults.yml (APPD-A11Y-003, APPD-TEST-003/004, PROD rules), test_integrity_defaults.yml (TEST-003/004), journey_app_tags.yml, tests/e2e/{tap-helpers.ts, journey_app_tags, journey_app_plant, journey_app_chain, journey_app_run, journey_app_offline, app_shell}.spec.ts, playwright.config.ts, evidence/seams-runtag-app.json, node_modules/playwright-core@1.57.0 (server/webkit/wkBrowser.js downloads, wkPage.js `overrideUserAgent`, deviceDescriptorsSource.json iPhone 13), plus a scratchpad probe of the installed Playwright browsers on a `http://localhost` page: headless Chromium 143 `navigator.storage.persist()` → `false`; Playwright WebKit (iPhone 13 profile) has **no** `navigator.storage` and no `StorageManager`; `navigator.standalone` is `undefined` with no `Navigator.prototype` descriptor in both.
**Verdict:** NOT build-ready. 0 CRITICAL, 11 P1, 7 P2. Each finding gives the exact ticket edit. The ticket was not edited.

## Personas walked
| Persona | Walk | Result |
|---|---|---|
| P-I iPhone owner in the Home Screen app (standalone) | Home Screen icon → `/app/tags` → Create; `/t/{new}` reached inside the app → plant buttons | Planting is blocked only **when pressed** (Rules line 22, AC-DUR-6). Nothing tells the owner on arrival, and `/app` in standalone shows a chain with no notice. The owner decision is "warn persistently; block planting there" (PRD:192, PL-6) (P1-6). **Restore from backup** stays open in standalone, so a new-phone restore made inside the Home Screen app puts the whole history in the silo, and every sticker tap (Safari) then shows "Plant this tag" (P1-6). |
| Same person tapping a sticker → Safari | NFC banner → Safari `/t/{id}` | Not a silo, and the guard correctly returns `null`. The plant view now has the private note (AC-DUR-8). There's no regression to the tap decision. |
| P-G Instagram in-app browser | link in bio → `/app/tags` → Create; `/t/{unknown}` → "Save and start run" | The guard contract is undefined. Nothing says what `guardPlant()` returns, which action "Plant here anyway" performs (start / just save / tap out), whether every press needs a fresh confirmation, whether Enter on the create form counts, or how it interacts with TAGS `busy`/disabled and TAP's one-primary rule (AC-TAP-18) (P1-5). The warning names the fix but gives no way to act on it inside Instagram. PL-2 asks for a copy-link action, and that link must come from `TAG_ORIGIN`, because APP-ORIGIN forbids `location.href` (P1-5). |
| P-S owner switching phones | old phone Export → new phone Safari → sticker shows "Plant this tag" → Restore from backup → Import → `/app` | Dates survive: `localDay`/`tzOffsetMin` are stored and copied verbatim. Meta isn't overwritten (S-6). But persistence is only requested when "a plant commits and the device had no tags before it" (line 25). A restored phone has tags from import and never plants, so `persist()` is **never called** there and the "may clear this data" warning never appears (P1-1). Right after the restore, home shows "Last backup: never" and (≥ 3 done runs) the nudge card, which is undefined-by-intent (P2-2). No criterion covers the restore path from the plant view, or the chain value after restore (P2-5). |
| P-O owner importing an older backup (taken before some runs) | local has newer runs; backup has an open run that was later finished locally, and tags re-armed by Copy link since | Same-id runs that differ are conflicts, default Keep mine, and that's fine. But every tag whose `graceUntil` was re-armed by Copy/Write (APP-TAGS lines 19–20) becomes a "conflict" with an **identical visible name**, and the ticket doesn't say what a conflict row shows (P1-3). The newest-open rule runs over the plan snapshot, not inside Apply. A backup open run dated in the future (other phone's clock ahead, or hand edit) wins over a valid local open run. The local run is abandoned, and the future run is then abandoned at the next `/app` render (`isStale` treats `startedAt > now` as stale, tap.ts:23), so the runner's real run never counts (P1-2). An import abandonment also triggers the "Your last run wasn't tapped out" notice for 60 s (home.tsx:85) (P1-2). |
| P-H owner editing a backup by hand (honour system, P5 5d) | edit JSON: add runs, change `lastTransition`, duplicate an id, add a key | Validation (line 27) checks only the required fields. `lastTransition` (store.ts:18), `endedAt`, `tagOutId`, `abandonedAt`, `meta`, `exportedAt`, duplicate ids inside the file, unknown keys and a top-level non-object are unspecified ("optional fields of the right type"). A duplicate id makes `add` fail mid-Apply, or `put` silently picks one (P1-4). AC-DUR-2 re-reads "values before" on an empty device, so it passes vacuously (P1-9). Forged runs are accepted by design (PRD §1 honour system), and no edit is needed for that. |
| P-N runner with chain ≥ 3, never exported | `/app` daily; press "Not now"; return 8 days later | The rule is coherent: never = > 7 days (T12), dismiss = now + 7 days. Gaps: home must read `meta` in APP-CHAIN's **single** load transaction ("Home starts no other store transaction", APP-CHAIN.md:16) (P1-7). The "Last backup" date formatter is unnamed, so `toLocaleDateString()` would render "10/12/2026" and fail the AC text (P2-2). Whether "Your phone may clear this data" sits inside the card or beside it (and whether "Not now" hides it) is undefined (P2-2). M-6: "Not now" copy must not say "in 7 days" (P2-2). |
| P-B build engineer | `planImport` → conflict list → `importBackup` in one txn; identical rows; export order and file name; persist once; guard in `onCreate` and `PlantView.save` | (1) The plan is read in one transaction and Apply writes in another. A tap or plant in another page between them (APP-020 seam on `runs`/`tags`) is not re-merged, so two open runs or a stale overwrite are possible (P1-2). (2) "Identical" is undefined (key order, absent vs `undefined`) (P1-3). (3) If persistence bookkeeping runs inside the create/plant action (`useAction`, tapped.tsx:44-58), a meta-write failure shows "That wasn't saved" + Retry for a tag that **was** saved, and Retry calls `createTag` again: a second tag, which breaks AC-TAGS-2 "one press, one tag" (P1-1). (4) Meta writes from separate pages (persist after a plant, Export, dismiss) are blind puts unless the ticket says read-modify-write (P1-7). (5) Sort by `id` and the local-day file name are fine, but the comparison and day function are not named (P2-1). |
| P-C Gate C test author (Playwright 1.57) | AC-DUR-1…11 on `chromium` + `mobile` | Playwright WebKit has **no `navigator.storage`** (probe), so AC-DUR-5's "init script makes `navigator.storage.persist` resolve `false`" can't patch `StorageManager.prototype` on `mobile`. Without an override the app takes the "missing API → false" branch (P1-1). `test.use({ userAgent })` replaces the iPhone 13 UA (deviceDescriptorsSource.json:829; wkPage.js:635 `overrideUserAgent`), so A9 on `mobile` runs with a UA that is no longer iPhone-like unless the token is appended (P2-3). `navigator.standalone` has no prototype descriptor, so `Object.defineProperty(Navigator.prototype,'standalone',{get})` is the portable override (P2-3). Downloads work in WebKit (wkBrowser.js:56-58, 194-196). Meta can be seeded only with `withTxn` + `req` and the unexported key `'meta'` (store.ts:36) (P2-3). I14/A9 `length 0` and `toEqual([])` are vacuous and hit TEST-004 (P1-9). The date text "Monday 12 October" doesn't trip either metric regex (checked against tap-helpers.ts:96-97). |
| P-X regression | AC-TAGS-9 static `userAgent` check; APP-TAP plant tests, AC-TAP-4/18/21; APP-CHAIN home tests incl. AC-CHAIN-6/13 and AC-SHELL-11 on `/app` and `/app/settings` at the real date; empty state; journey_app_run "Restore from backup" → `data-view=settings` | AC-TAGS-9 (journey_app_tags.spec.ts:385-390) stays green only if tags.tsx keeps the token out of code **and comments** (P2-6). AC-TAP-18 needs exactly one `tap-primary` on the plant view, including in-app confirm and standalone states (P1-5). Persist resolves `false` in headless Chromium and is missing in WebKit, so after this ticket every journey that plants leaves `persistResult === false` and home shows the warning and card. Nothing existing asserts against that, but the card must not reuse `tap-primary` (Regression notes). AC-SHELL-11 at the real date with an empty DB renders "Last backup: never" only, which is safe. |

## Stipulation fold-in check (verdict §7 APP-DURABLE 1–4, plus items assigned here elsewhere)
| # | Stipulation | Folded? | Gap → finding |
|---|---|---|---|
| 1 | S-6 / T6: fresh export's `tags`+`runs` sorted by id deep-equal the first; `meta` excluded; import never overwrites local `meta` | Partly (Rules line 28, AC-DUR-1) | The Gherkin (lines 51–55) still says "a fresh export equals the first export exactly". That is the wording T6 replaces, and it's the "backup equality silently weakened" loophole (verdict §6) (P1-8). "Never overwrites meta" vs the persistence request after an import must be reconciled (P1-1) |
| 2 | S-12 / T7: closed detection list; private mode not detected, plant screen says "Private tabs forget your chain."; **Gherkin**: in-app UA → warning, tag row only after second confirmation; standalone → "Plant tags in Safari", no row | Rules yes (lines 20–24); Gherkin only standalone (lines 62–65) | The in-app Gherkin is missing (P1-8). The guard contract and integration are undefined (P1-5). The standalone warning isn't persistent (P1-6) |
| 3 | M-4: validation rules; any failure rejects the whole file, zero writes, oracle = store counts unchanged | Partly (line 27, AC-DUR-2) | Incomplete vs the merged `Run`/`ExportFile` types (P1-4). The oracle is vacuous on an empty device (P1-9) |
| 4 | T12 part: APP-022 "never exported" counts as > 7 days | Yes (line 29) | The boundary (`>` vs `≥`) and the date formatter are unspecified (P2-2) |
| — | PL-1 (backup visibility; restore link on the plant screen) | Partly (line 29, AC-DUR-9) | No PL-1 Gherkin (P1-8). The restore path from the plant view isn't exercised (P2-5) |
| — | PL-2 (copy-link action naming the fix; one device + one browser = one chain) | No | P1-5 |
| — | PL-6 / §10 owner decision "warn persistently; block planting there" | Block yes, persistent warning no | P1-6 |
| — | PL-14 (conflict list, newest open wins, **import summary counts**) | Partly | No summary, no flow, no conflict-row content (P1-3) |
| — | APP-012 "call `persist()` when the first tag is planted" | Partly | Misses the restore-only device; unobservable trigger; failure path (P1-1) |
| — | M-6 (no countdowns) / APP-008 rendered check on `/app/settings` and `/app` | Yes (line 31, AC-DUR-11) | Copy traps: "Not now" / "remind in 7 days"; conflict rows must show no clock times (P1-3, P2-2) |
| — | §7 Durability metric (daily owner exports on a real iPhone, I17) | Delegated to APP-LINK #19 | No DoD line puts it in the APP-LINK checklist, and nothing checks export/import on iOS Safari (P1-10) |

## Hop coverage check (pinned I14, I15, A9, I17; shared S1, S5; seams naming APP-DURABLE)
| Hop | Criterion | Re-read oracle in ticket? | Gap |
|---|---|---|---|
| I14 | AC-DUR-6 | **vacuous** | `listTags()` length 0 on a fresh device holds even if Create is simply broken. There's no positive control in the same build without the override. A persistent notice isn't asserted (P1-6, P1-9) |
| I15 | AC-DUR-1 | yes | The fixture shape isn't pinned (optional fields, no stale open run). Projects aren't stated. The chain after restore (S3 reader) isn't asserted (P2-5) |
| A9 | AC-DUR-7 | partial | "length 1" instead of a deep-equal row `{id:C, name}`. The `mobile` UA override drops the iPhone UA. "Plant here anyway" action semantics are unspecified (P1-5, P1-9, P2-3) |
| I17 | none (APP-LINK #19) | **orphaned** | APP-LINK.md:11 lists "8-day iOS retention" but not the I17 oracle (daily export run-id ⊇, tally note), and not iOS export/import working. There's no DoD line (P1-10) |
| S1 (`withTxn`) | AC-DUR-10 | partial | Import Apply only. Dismiss, export bookkeeping and Settings load failures aren't asserted. "Re-read unchanged" doesn't say "same context" (amendment 2026-10-14 I12 harness) (P2-4) |
| S5 (`StoreError`) | AC-DUR-10 | partial | Non-retryable kinds (`newer-schema`, `blocked`, `unavailable`) → `store-error` isn't specified for Settings. `meta` isn't in the "unchanged" re-read (P2-4) |
| S3 (`computeChain`, `localDayOf` → DURABLE) | none | — | Hops:159 lists DURABLE as a reader. The chain after import and the local-day file name are unasserted (P2-1, P2-5) |
| seam `runs` (DURABLE, TAP, CHAIN, mixed) | AC-DUR-4 | partial | Single page only. There's no two-page Apply vs tap race for APP-020 "at most one open run" (P1-2) |
| seam `tags` (DURABLE, TAGS, TAP, writer-writer) | AC-DUR-3, -6, -7 | partial | The `graceUntil`-only difference creates false conflicts. A rename between plan and Apply isn't re-merged (P1-2, P1-3) |
| `meta` writers (APP-SHELL creates `{schemaVersion:1}` at upgrade, store.ts:50; DURABLE writes three fields) | AC-DUR-5, -9 | no | Read-modify-write isn't required. Home reads meta outside CHAIN's single load txn (P1-7) |
| `backup-status` (APP-CHAIN slot, home.tsx:128) | AC-DUR-9 | yes | The load-transaction rule and the empty-state coexistence aren't stated (P1-7) |
| `onCreate` / `plantTag` (TAGS / TAP entry points) | AC-DUR-5…7 | partial | Guard and persist integration contract (P1-1, P1-5) |
| `/app/settings` (DURABLE, SHELL) | AC-DUR-1…3 | yes | The view must keep `data-view=settings`, the h1 and `<AppNav/>` (journey_app_offline.spec.ts:88-89, journey_app_run.spec.ts:414-415) (Regression notes) |

---

## Pre-flight Findings

### CRITICAL
None. Every path below that can lose or duplicate data comes from an unspecified ordering, trigger or comparison. The specified rules can be made safe by the exact edits given, and nothing requires a PRD change.

### P1

#### P1-1 — The persistence trigger misses restored phones, and its bookkeeping can create a second tag
- **What breaks:**
  1. **Trigger.** "After a plant commits and the device had no tags before it" (line 25) can't be observed from either entry point. `createTag` (lib/app/tags.ts:18-33) and `plantTag` (lib/app/tap.ts:71-90) don't report whether the store was empty, and the views' React lists are stale across pages. Worse, the switching-phones walk never plants: tags arrive through Import. So `persist()` is never called on the new phone, `persistResult` stays `undefined`, and neither the warning nor the `persistResult === false` branch of the nudge ever fires. That is PL-1 1c on the very device that was just restored.
  2. **Failure path.** Line 30 gives "persistence bookkeeping" the "That wasn't saved" + Retry treatment. If the request runs inside the create or plant action (both use `useAction`, tapped.tsx:44-58, whose Retry re-runs the **whole** action), a meta-write failure after `createTag` committed shows "That wasn't saved" for a saved tag, and Retry calls `createTag` again: two tags, which breaks AC-TAGS-2. In the plant view, `shellReplace` already left the view (plant.tsx:25), so there's nowhere to show it.
  3. **Harness.** Playwright WebKit has no `navigator.storage` (probe), so AC-DUR-5's override can't be a `StorageManager.prototype` patch on `mobile`. Headless Chromium resolves `persist()` to `false`, so every existing planting journey will now set `persistResult:false`. That is harmless only if the request is fire-and-forget after the commit.
- **AC/step:** Rules lines 25, 30; AC-DUR-5; APP-012; PL-1; seam `onCreate`/`plantTag`.
- **Evidence:** docs/specs/app/APP-DURABLE.md:25,30,40. lib/app/tags.ts:18-33. lib/app/tap.ts:71-90. components/app/views/tags.tsx:318-333. components/app/views/plant.tsx:22-28. components/app/views/tapped.tsx:44-58. PRDs/runtag-app-prd.md:60. PRDs/runtag-app-persona-lens.md:36,109. The probe (Chromium `persist()` → `false`; WebKit `navigator.storage` undefined).
- **Ticket edit:** replace the Persistence rule (line 25) with:
  > **Persistence (APP-012):** `requestPersistence(now)` in lib/app/backup.ts. It runs **after** any commit that leaves the device with at least one tag: `createTag` resolving in `onCreate`, `plantTag` resolving in the plant view, and Import Apply committing. It does nothing if `meta.persistResult !== undefined` (re-read in its own transaction), and it is single-flight per document. It calls `navigator.storage?.persist?.()` (missing API → `false`; a rejection → `false`) and then stores the boolean with a read-modify-write of `meta` (P1-7). It is never awaited inside the create or plant action, never shown as a failure, and never retried by the action's Retry. If its meta write fails, `persistResult` stays `undefined`, and the next plant or import asks again. The rejection is handled explicitly (APPD-TEST-003 forbids `.catch(() => undefined)` in lib/**/*.ts). Writing `persistResult` after an import is local bookkeeping, not "import changing meta" (S-6). When `persistResult === false`, Settings and home show "Your phone may clear this data. Export a backup."

  In line 30, delete "persistence bookkeeping".

  Replace AC-DUR-5 with:
  > The override is an init script `Object.defineProperty(Navigator.prototype, 'storage', { configurable: true, get: () => ({ persist: () => { sessionStorage['runtag-persist-calls'] = String(+(sessionStorage['runtag-persist-calls'] ?? 0) + 1); return Promise.resolve(sessionStorage['runtag-persist'] === 'true') }, estimate: () => Promise.resolve({}) }) })` (works in WebKit, which has no `navigator.storage`). (a) false: Create on `/app/tags` → `expect.poll(getMeta().persistResult)` = `false`; Settings and home (after reload) show `persist-warning` with the exact text. (b) true, in a fresh context: `/t/{unknown}` Just save → `persistResult === true`, no `persist-warning`; then Create on `/app/tags` → the call count is still `"1"`. (c) Restore-only device: a fresh context imports a valid file (no plant) → `persistResult` set and the call count is `"1"`. (d) No override on `mobile`: Create → `persistResult === false` (missing-API branch). (e) Fail-writes armed after the database exists, then Create → exactly one tag (re-read in the same context), no `tag-failed`, `persistResult` still `undefined`.

#### P1-2 — Apply isn't required to re-merge inside its own transaction, and "newest open wins" can abandon the runner's real run
- **What breaks:**
  1. **Snapshot vs commit.** Conflicts are "listed before anything is written" and "Apply writes the whole merge at once" (line 28), so the plan comes from one transaction and the write happens in a later one. Between the two, a tap in another page can open R3 (APP-TAP, `runs` seam) or a rename can change a tag (APP-TAGS, `tags` seam). An Apply that writes the planned set adds the backup's open run next to R3: **two open runs**, against APP-004/APP-020. It can also `put` over a row that changed after the plan.
  2. **Stale and future-dated open runs.** "The newest `startedAt` stays open" (line 28) ranks a backup run with `startedAt > now` (a phone clock that was ahead, or a hand edit) above a valid local open run. The local run is abandoned, the future run is abandoned at the next `/app` render (`isStale`, tap.ts:23; `abandonStaleIn` in `loadHome`, home.tsx:20-26), and the runner's real run never counts. Undo can't restore it (`undoTap` handles only `open`/`done`, tap.ts:114-135).
  3. **Notice.** An import abandonment sets `abandonedAt: now`. For 60 s, home (home.tsx:85) and every result view (`StaleNotice`, tapped.tsx:36-39) show "Your last run wasn't tapped out, so it didn't count." The ticket doesn't say whether that is intended.
- **AC/step:** Rules line 28; AC-DUR-4; APP-004, APP-006, APP-020; seams `runs`, `tags`; hops:78 (expected seam APP-DURABLE×APP-TAP on `runs`).
- **Evidence:** docs/specs/app/APP-DURABLE.md:28,39. lib/app/tap.ts:23,29-38,114-135. lib/app/store.ts:119-122. components/app/views/home.tsx:20-26,85. PRDs/runtag-app-prd.md:34,40,45. PRDs/runtag-app-hops.md:78,124-133.
- **Ticket edit:** replace the Import rule's second, third and fourth sentences with:
  > `planImport(file)` reads the current rows in one readonly transaction and returns `{ added, identical, conflicts }`. Nothing is written. `importBackup(file, choices, now)` (choices: `Record<'tag:'|'run:' + id, 'mine'|'backup'>`, default `'mine'`) runs **one** `withTxn('readwrite')` that **re-reads every local row and recomputes the merge inside the transaction**:
  > - new ids are `add`ed;
  > - identical rows are skipped;
  > - a differing row is `put` only if its choice is `'backup'`;
  > - a row that differs but has **no** choice (it changed after the plan) rejects with `ImportChanged`, writes nothing, and the view re-plans and shows "Your data changed. Check the list again."
  >
  > Still inside that transaction, `abandonStaleIn(s, now)` runs over the merged state. Then, if more than one run is `open`, the one with the greatest `startedAt` stays open and every other becomes `{status:'abandoned', abandonedAt: now}` (all other fields unchanged). Because stale and future-dated runs were already abandoned, a backup can't displace a valid local open run with a future-dated one. The stale notice may show after an import abandonment. This is accepted: the abandoned run doesn't count.

  Add to AC-DUR-4:
  > (b) backup open run R2 with `startedAt` = now + 1 h, local open R1 (now − 1 h): after Apply, R1 `open` and unchanged, R2 `{status:'abandoned', abandonedAt: importTime}`. (c) Two pages: page 1 shows the plan for a backup with open run R2 (now − 30 min); page 2 taps in at A (R3); page 1 presses Apply → `listRuns()` re-read in the same context has exactly one `open` row, R3 `open` and unchanged, R2 abandoned.
  >
  > Variant: page 2 renames a conflicting tag after the plan → Apply shows "Your data changed. Check the list again." and `listTags()` deep-equals page 2's state.

#### P1-3 — The import flow, "identical" and the conflict rows are undefined
- **What breaks:**
  - The ticket has an Import control and an Apply button, but no flow: what shows after the file is picked when there are no conflicts, whether Apply is needed then, whether there's a Cancel, and what confirms success. PL-14 asks for a summary of counts added, skipped and conflicted.
  - "Identical" is undefined. Key order, an absent key vs `undefined`, and an extra key all change the result of a naive `JSON.stringify` comparison, and with it the idempotency claim ("importing the same file twice changes nothing").
  - The conflict row content is undefined. A run row naively rendered with `startedAt` shows a clock time (APP-008).
  - Tags re-armed by Copy link or Write (APP-TAGS lines 19–20) differ only in `graceUntil`. Every such tag becomes a conflict that shows two identical names.
  - A second import of the same file with "Keep mine" choices shows the same conflicts again. That is consistent, but it isn't stated.
- **AC/step:** Rules line 28; AC-DUR-1, AC-DUR-3; PL-14; APP-008.
- **Evidence:** docs/specs/app/APP-DURABLE.md:28,36,38. docs/specs/app/APP-TAGS.md:19-20. lib/app/tags.ts:53-55. PRDs/runtag-app-persona-lens.md:122. lib/app/history.ts:51-54 (date-only label pattern).
- **Ticket edit:** add after the Import rule:
  > **Import flow:** pick a file (`backup-import`) → validate (P1-4) → `planImport` → the view shows `backup-summary`: "New: {n} tags, {m} runs. Already here: {k}." plus the conflict list, **Apply** (`backup-apply`) and **Cancel** (`backup-cancel`, writes nothing). Apply is required even when there are no conflicts. After the commit it shows `backup-done` (`role="status"`) "Backup restored." and the summary counts.
  >
  > **Identical** means deep-equal over own enumerable keys, ignoring key order; an absent key equals `undefined`.
  >
  > A tag that differs only in `graceUntil` is not a conflict. The local row is kept and counted as already here.
  >
  > **Conflict rows** (`backup-conflict`, `data-kind="tag"|"run"`, `data-id={id}`): a tag shows "Tag: {local name} (yours) / {backup name} (backup)". A run shows "Run on {weekday} {day} {month} (its `localDay`): yours {state}, backup {state}", where state is "finished" / "in progress" / "didn't count". No clock times. Each row has two radio options, "Keep mine" (checked by default) and "Use backup".
  >
  > Importing the same file again after any Apply writes nothing; conflicts kept as "mine" are listed again.

  AC-DUR-3 adds: "Seed tag A with `graceUntil` re-armed (≠ backup's): it isn't listed, and it is counted in 'Already here'. A run conflict row's text matches neither metric regex. Cancel → all stores re-read deep-equal their values before."

#### P1-4 — Validation doesn't cover the merged `Run`/`ExportFile` shapes
- **What breaks:** Line 27 lists only the required fields and then says "optional fields of the right type". The merged `Run` has `lastTransition?: 'in'|'out'` (store.ts:18), which Undo reads, and an invalid value makes `canUndo` false forever. `endedAt`, `abandonedAt` and `tagOutId` (which must match the tag id pattern) are also unchecked, and so are `ExportFile.exportedAt` and `meta` (store.ts:20-21).
  - Duplicate ids inside one file make `add` throw `ConstraintError` mid-Apply. Under `withTxn`, a caught request error doesn't abort (store.ts:99), so a half-merged write or a silent `put` choice is possible.
  - Unknown keys would be stored and would break "identical".
  - A top-level array or `null` isn't excluded.
  - Two engineers will reject different files.
- **AC/step:** Rules line 27; AC-DUR-2; M-4; S-9 types; P5 5d.
- **Evidence:** lib/app/store.ts:5-21,99. PRDs/runtag-app-verdict.md:189-190,228. PRDs/runtag-app-persona-lens.md:99.
- **Ticket edit:** replace the Validation rule's field list with:
  > `validateBackup(text)`: the JSON parses to a plain object with exactly the keys `schemaVersion`, `exportedAt`, `tags`, `runs`, `meta`; `schemaVersion === 1`; `exportedAt` is a finite number; `meta` is a plain object (not validated further, never imported); `tags`, `runs` are arrays.
  >
  > Every tag is a plain object with exactly the keys `id` (`^[a-z0-9]{10}$`), `name` (string, `cleanTagName(name) === name`), `createdAt`, `graceUntil` (finite numbers).
  >
  > Every run is a plain object with only the keys of `Run`: `id` (non-empty string), `status` ∈ open/done/abandoned, `tagInId` (tag id pattern), `startedAt`, `tzOffsetMin`, `lastTapAt` (finite numbers), `localDay` (`^\d{4}-\d{2}-\d{2}$`); optional `tagOutId` (tag id pattern), `endedAt`, `abandonedAt` (finite numbers), `lastTransition` ∈ in/out.
  >
  > Tag ids are unique within `tags`, and run ids are unique within `runs`.
  >
  > Any failure → `backup-invalid` "This isn't a RunTag backup", and no transaction is opened.

  Add to AC-DUR-2's list: "top-level `[]`; a duplicate tag id; a run `lastTransition:'x'`; a run `tagOutId:'BAD'`; an extra key `"x":1` on a run; `meta: null`; `exportedAt` missing".

#### P1-5 — `guardPlant()` has no contract, so the in-app confirm can't be built consistently on two views
- **What breaks:**
  - **Return value and entry points.** "Both entry points call `guardPlant()` before any store write" (line 21) doesn't say what it returns. The plant view has three actions (start / just save / tap out, plant.tsx:50-59), and the ticket doesn't say which one "Plant here anyway" performs.
  - **Confirmation lifetime.** It isn't stated whether the confirmation lasts for one press or for the whole view. Enter on the create `<form>` (tags.tsx:350-356) could count as the confirmation.
  - **Pending and press rules.** The ticket doesn't say how the confirm respects TAGS's `busy` ref and disabled-while-pending (one press, one tag, APP-TAGS:17), or TAP's exactly one `tap-primary` per `/t/` view (APP-TAP:73, AC-TAP-18).
  - **Race outcomes.** The ticket doesn't say whether the race outcomes (AC-TAP-4, AC-TAP-21) still apply after a confirm.
  - **Copy-link fix.** PL-2's fix includes a copy-link action, because inside Instagram the user can only move to the browser by pasting. The page URL must come from `TAG_ORIGIN`, since APP-ORIGIN forbids `location.href` (feature_app.yml:36-46).
- **AC/step:** Rules lines 20–24; AC-DUR-6, AC-DUR-7; AC-TAP-4/18/21; AC-TAGS-2; PL-2; hop A9.
- **Evidence:** components/app/views/tags.tsx:303,318-333,350-366. components/app/views/plant.tsx:22-28,50-59. components/app/views/tapped.tsx:17-31. docs/specs/app/APP-TAP.md:73,101,115,118. docs/contracts/feature_app.yml:36-46. PRDs/runtag-app-persona-lens.md:110.
- **Ticket edit:** replace "Guarded planting" (lines 21–24) with:
  > **Guarded planting:** `useSilo()` / `guardPlant(): 'blocked' | 'confirm' | 'ok'` (lib/app/silo.ts; `detectSilo(navigator)` is computed once per view render; the views are client-only, Shell.tsx:28-30).
  > - **`ok`:** unchanged behaviour.
  > - **`blocked` (standalone):** see P1-6.
  > - **`confirm` (in-app):**
  >   - `silo-warning` is rendered on view load. It contains the warning text and a **Copy link** button that copies `TAG_ORIGIN + '/app/tags'` (tags view) or `tagUrl(tagId)` (plant view) with the APP-TAGS clipboard and fallback rules.
  >   - The first press of Create tag, Save and start run, Just save or Save and tap out here writes nothing and reveals `silo-confirm` "Plant here anyway". That button is a **secondary** button, never `tap-primary`, so AC-TAP-18 holds. It remembers the pressed action and performs exactly that action (the same `plantTag(…, displayedOpenRunId)` call, so the AC-TAP-4/21 race outcomes are unchanged), subject to the same disabled-while-pending and `busy` rules.
  >   - The confirmation lasts for one press: after each write the next plant needs a new confirmation. Enter on the create form and a second press of the original button only re-reveal it.
  >   - The private note `private-note` is always shown on both plant views.

  AC-DUR-7 adds:
  > Plant view: `[data-testid=tap-primary]` count 1 in the warning and confirm states. `dblclick` on `silo-confirm` → `listTags()` grows by exactly 1. On `/app/tags`, Enter in `tag-create-name` after the first press → no new tag. "Save and tap out here" + confirm with an open R1 → R1 `{status:'done', tagOutId: C}`. Copy link in `silo-warning` → clipboard or fallback value `tagUrl(C)`.

#### P1-6 — Standalone isn't warned persistently, and Restore can import a whole history into the silo
- **What breaks:** The owner decision (PRD §10: "warn persistently; block planting there") and PL-6 (the notice persists on `/app` and `/app/tags`) are only half-folded. The ticket blocks a press and shows the message only after it (line 22, AC-DUR-6). In standalone, `/app` shows the silo's chain with no notice. Import is unguarded. A new-phone owner who added RunTag to the Home Screen first and restores there gets every tag and run in standalone storage, and every sticker tap (Safari, a different partition) shows "Plant this tag". That's persona-lens route 1a with the full history. In-app browsers have the same restore problem.
- **AC/step:** Rules line 22; AC-DUR-6; Settings scope line 13; PRD APP-013, §10; PL-6; hop I14.
- **Evidence:** PRDs/runtag-app-prd.md:61,192. PRDs/runtag-app-persona-lens.md:32,114. docs/specs/app/APP-DURABLE.md:13,22,41. components/app/views/plant.tsx:60-70 (restore link → `/app/settings`).
- **Ticket edit:** replace line 22 with:
  > `blocked` (standalone): `silo-blocked` "Plant tags in Safari. Tags planted in the Home Screen app can't be read when you tap them." is rendered **on load** on `/app` (inside `backup-status`), `/app/tags`, the plant view and Settings. The plant and create buttons stay enabled (one primary on `/t/`). Pressing them writes nothing and moves focus to `silo-blocked`.
  >
  > Import follows the same guard. In standalone, `backup-import` is replaced by "Restore your backup in Safari." and nothing is imported. In-app, the first Apply reveals `silo-confirm` "Restore here anyway". Export is allowed everywhere.

  AC-DUR-6 adds: "`silo-blocked` visible on load of `/app`, `/app/tags` and `/app/settings` before any press; on Settings, `backup-import` count 0 and importing via `setInputFiles` is impossible."

#### P1-7 — Meta: home's single load transaction and read-modify-write for every writer
- **What breaks:**
  - APP-CHAIN's merged rule is "Home starts no other store transaction" (APP-CHAIN.md:16; `loadHome`, home.tsx:20-26 reads runs and tags only). The nudge and "Last backup" need `meta`. A second `getMeta()` would break that rule, and with it AC-CHAIN-13's "store-error and nothing else from the load".
  - Three DURABLE writers touch `meta` from different pages and times: `persistResult` after a plant, `lastExportAt` after Export, `backupNudgeDismissedUntil` on "Not now". APP-SHELL created the row at upgrade (store.ts:50) under an unexported key (store.ts:36). A builder holding meta in React state and `put`ting it whole would make the last writer silently revert the others' fields.
- **AC/step:** Rules lines 25, 26, 29; AC-DUR-5, AC-DUR-9; seams `/app` (mixed), `backup-status`, `meta`.
- **Evidence:** docs/specs/app/APP-CHAIN.md:16,26. components/app/views/home.tsx:20-26,128. lib/app/store.ts:20,36,50,146-150. PRDs/runtag-app-hops.md:89-93.
- **Ticket edit:** add a rule:
  > **Meta (seam):** `updateMeta(patch)` in lib/app/backup.ts is the only meta writer. In one `withTxn('readwrite')` it `get`s the `'meta'` row and `put`s `{ ...row, ...patch, schemaVersion: 1 }`. Home's existing load transaction (`loadHome`, home.tsx) also returns `meta: await req(s.meta.get('meta'))`, and `last-backup` / `backup-nudge` derive from that result and its `now`. Home still starts no other transaction (APP-CHAIN P2-1). A rejected load still shows `store-error` only.

  AC-DUR-9 adds: "Two pages: page 1 presses 'Not now' while page 2 Exports → after reload `getMeta()` has both `backupNudgeDismissedUntil` and `lastExportAt`. AC-CHAIN-13 re-run unchanged."

#### P1-8 — The Gherkin keeps the "equals exactly" wording that T6 replaces, and lacks two required scenarios
- **What breaks:** Lines 53–54, "Then a fresh export equals the first export exactly", are the §5 text that T6 / S-6 replace. `exportedAt` and `meta.lastExportAt` differ between exports, so a test generated from this Gherkin (playwright-from-specflow) either fails or gets weakened ad hoc. That's verdict §6's "backup equality silently weakened" loophole. S-12 explicitly requires an in-app Gherkin ("warning, and the tag row exists only after the second confirmation"), and PL-1 supplies the nudge Gherkin. Both are missing.
- **AC/step:** Gherkin lines 49–66; verdict §7 APP-DURABLE 1–2; PL-1.
- **Evidence:** docs/specs/app/APP-DURABLE.md:51-55. PRDs/runtag-app-falsification.md:99,122-123. PRDs/runtag-app-verdict.md:171,226-227. PRDs/runtag-app-persona-lens.md:109.
- **Ticket edit:** replace lines 54–55 with:
  > `Then the fresh export's tags and runs, sorted by id, deep-equal the first export's (meta and exportedAt excluded)`
  > `And importing the same file again leaves 3 tags and 10 runs unchanged`

  Add:
  ```gherkin
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

#### P1-9 — The I14, A9 and invalid-file oracles are vacuous on a fresh device
- **What breaks:**
  - AC-DUR-6 (I14) asserts `listTags()` length 0 after a blocked Create on a fresh device. That also holds if Create never works at all.
  - AC-DUR-2 re-reads "tags/runs/meta deep-equal their values before" with no seeded rows, so `[] = []`.
  - AC-DUR-7 (A9) asserts "length 1" instead of the row.
  - The hops' assertion bar rejects trivially true checks (hops:9), and TEST-004 flags `expect(x).toHaveLength(n)` and `expect(x).toEqual([])` (test_integrity_defaults.yml:116-131).
  - This is the same defect class as APP-TAGS P1-5.
- **AC/step:** AC-DUR-2, -6, -7; hops I14, A9.
- **Evidence:** PRDs/runtag-app-hops.md:9,38,54. docs/contracts/test_integrity_defaults.yml:116-131. docs/specs/app/APP-TAGS-preflight.md (P1-5). tests/e2e/tap-helpers.ts:38-47.
- **Ticket edit:**
  - **AC-DUR-6:** "seed tag A (`seedTag`) and open run R1 first; with the override, Create on `/app/tags` and every plant button on `/t/{X}` → `listTags()` deep-equals `[A]`, `listRuns()` deep-equals `[R1]` (same context). Positive control in a fresh context without the override: Create → `listTags()` contains `{name:'Oak at gate', createdAt: T0}`."
  - **AC-DUR-2:** "seed tag A, done run R1 and `meta.lastExportAt = T0 − 1 day` first; after each invalid file, `listTags()`, `listRuns()` and `getMeta()` deep-equal the seeded values."
  - **AC-DUR-7:** "after the confirmation `listTags()` deep-equals `[{ id: C, name: 'Bridge', createdAt: now, graceUntil: now + 600000 }]`."

#### P1-10 — I17 has no owner in the device checklist, and iOS export/import is never checked
- **What breaks:** The header delegates I17 to "APP-LINK #19 checklist", but APP-LINK.md AC-3 lists only "8-day iOS retention". It has neither I17's oracle (each day's export run-id set ⊇ the previous; chain = a dated tally recorded before opening `/app`) nor the facts I17 depends on:
  - Export downloads a file on iPhone Safari. iOS shows a download confirmation the app can't observe.
  - Import's file picker can select it. `accept="application/json"` greys out files in some iOS Files providers.
  - `persist()`'s real iOS result is unknown (persona-lens device question 3).

  The §7 durability metric runs on exactly these exports. APP-TAGS fixed the same gap for A11 with a verbatim DoD line.
- **AC/step:** header line 6; Not in scope line 17; DoD; hop I17; §7 Durability.
- **Evidence:** PRDs/runtag-app-hops.md:41. docs/specs/app/APP-LINK.md:11. PRDs/runtag-app-prd.md:170. PRDs/runtag-app-persona-lens.md:156. docs/specs/app/APP-TAGS.md:109.
- **Ticket edit:** add a DoD line:
  > - [ ] APP-LINK #19 device checklist (docs/specs/app/APP-LINK.md AC-3) lists, verbatim: "I17 (iPhone Safari, ≥ 8 days, NFC-launched visits only): Export daily from `https://runtag.vercel.app/app/settings`; the file `runtag-backup-YYYY-MM-DD.json` lands in Files; each day's export run-id set ⊇ the previous day's; chain = the tally in a dated note written before opening `/app`. Import that file on a cleared Safari (Settings → Import) → the chain matches. Record `meta.persistResult` from the export. Home Screen app: `/app/tags` shows 'Plant tags in Safari' on load. Instagram in-app browser: the warning and 'Plant here anyway'."

  In Rules line 26, add: "the file input uses `accept=".json,application/json,text/plain"`."

#### P1-11 — No selector and copy map for Settings, import, conflicts and the nudge
- **What breaks:** The declarations list 17 testids, but the ticket never maps them to elements, copy or attributes. Missing pieces:
  - per-row conflict choices
  - the summary, Cancel and the success status
  - the failure and Retry elements (TAGS's `tag-failed` is view-specific)
  - Settings' persistence status when `persistResult` is `true` or `undefined`
  - whether the nudge's export button reuses `backup-export`, which is also on Settings

  The tag view has no `<h1>`/AppNav rule here. Settings must keep `data-view=settings` and `<AppNav/>` (journey_app_offline:88-89; journey_app_run:414-415). Two Gate C authors would write incompatible locators. APP-TAGS P1-8 was the same issue.
- **AC/step:** Rules lines 13, 21–30; AC-DUR-1…11; Declarations line 72.
- **Evidence:** docs/specs/app/APP-DURABLE.md:72. components/app/views/settings.tsx:1-12. tests/e2e/journey_app_offline.spec.ts:88-89. tests/e2e/journey_app_run.spec.ts:414-415.
- **Ticket edit:** add a "Views and copy" table after Rules:
  > | Element | testid / attributes | Copy |
  > |---|---|---|
  > | Settings heading | — | "Settings" (h1, kept) + `<AppNav/>` (kept) |
  > | export | `backup-export` (Settings) / `backup-nudge-export` (card) | "Export backup" / "Back up now" |
  > | import | `backup-import` (`<input type="file">`, `aria-label="Backup file"` first, visible label button ≥ 48 × 48) | "Import backup" |
  > | invalid | `backup-invalid` (`role="alert"`) | "This isn't a RunTag backup" |
  > | summary | `backup-summary` | "New: {n} tags, {m} runs. Already here: {k}." |
  > | conflict row | `backup-conflict`, `data-kind`, `data-id`; radios `backup-keep` / `backup-use` | P1-3 text; "Keep mine" / "Use backup" |
  > | apply / cancel | `backup-apply` / `backup-cancel` | "Apply" / "Cancel" |
  > | done | `backup-done` (`role="status"`) | "Backup restored." |
  > | changed | `backup-changed` (`role="alert"`) | "Your data changed. Check the list again." |
  > | failure | `backup-failed` + `backup-retry`; non-retryable → `store-error` | "That wasn't saved" / "Retry" |
  > | persistence | `persist-warning` (when `false`); `persist-ok` "This phone keeps your data." (when `true`); nothing when `undefined` | — |
  > | last backup | `last-backup` (home, inside `backup-status`; and Settings) | "Last backup: never" / "Last backup: {weekday} {day} {month}" |
  > | nudge | `backup-nudge` (contains `persist-warning` when `false`), `backup-nudge-export`, `backup-nudge-dismiss` | "Back up your chain" / "Back up now" / "Not now" |
  > | silo | `silo-blocked`, `silo-warning` (+ `silo-copy`), `silo-confirm`, `private-note` | Rules |

  No DURABLE button uses `tap-primary`.

### P2

#### P2-1 — Export: ordering, local-day file name, bookkeeping honesty and Retry
- **What breaks:**
  - "Sorted by id" doesn't name the comparison. `localeCompare` differs across locales; code-unit `<` doesn't.
  - "Local day" doesn't name `localDayOf` (the S3 reader) or test a UTC/local split.
  - `lastExportAt` is written after a download the app can't observe. On iPhone the user can cancel the download prompt, and "Last backup" would then claim a backup that doesn't exist and suppress the nudge for 7 days.
  - "Export bookkeeping" failure + Retry (line 30) doesn't say whether Retry downloads again.
- **Evidence:** docs/specs/app/APP-DURABLE.md:26,30. lib/app/chain.ts:8-15. PRDs/runtag-app-hops.md:159.
- **Ticket edit:** line 26: "…sorted by `id` with code-unit order (`a.id < b.id ? -1 : 1`); file name `runtag-backup-${localDayOf(now)}.json`; after the download is started, `updateMeta({ lastExportAt: now })`. Settings explains: 'Saved to your Downloads or Files. If you cancelled, export again.' If that write fails: `backup-failed` with Retry for the **save only** (no second download)." AC-DUR-1 adds: "`download.suggestedFilename()` = `runtag-backup-2026-10-12.json` at T0; at `2026-10-13T00:30:00+01:00` → `runtag-backup-2026-10-13.json` (UTC date is 10-12); `exportedAt` = the fixed clock."

#### P2-2 — Backup status and nudge: formatter, boundary, card layout, copy, post-restore state
- **What breaks:**
  - "{weekday} {day} {month}" doesn't name a formatter. `toLocaleDateString()` gives "10/12/2026" in the en-US test locale and fails AC-DUR-9.
  - It doesn't say which zone turns `lastExportAt` into a day.
  - The "more than 7 days" boundary is not pinned to a constant.
  - Home may show the warning twice (as text and in the card), and the ticket doesn't say whether "Not now" hides the warning.
  - M-6: "Not now" must not say "Remind me in 7 days".
  - After a restore on a new phone, `lastExportAt` is `undefined`, so home shows "Last backup: never" and (≥ 3 done runs) the card at once. That is consistent with S-6 but unstated (OQ-7).
- **Evidence:** lib/app/history.ts:47-54. PRDs/runtag-app-verdict.md:125. PRDs/runtag-app-persona-lens.md:146. docs/specs/app/APP-DURABLE.md:29,44.
- **Ticket edit:** line 29:
  > Date = `localDayOf(meta.lastExportAt)` rendered with the history.ts parts (`weekday:'long'`, day number, `month:'long'`, `timeZone:'UTC'` on that day). `NUDGE_MS = 604_800_000`; card iff `persistResult === false` or (done runs ≥ 3 and (`lastExportAt === undefined` or `now − lastExportAt > NUDGE_MS`)), and not (`backupNudgeDismissedUntil > now`). On home, `persist-warning` is shown only inside the card, and "Not now" hides both. Settings always shows `persist-warning` when `persistResult === false`. Copy names no number of days. After an import the card follows the same rule (a restored phone has no export yet).

  AC-DUR-9 adds: "at `lastExportAt + NUDGE_MS` exactly → no card; `+ 1 ms` → card; `last-backup` text = 'Last backup: Monday 12 October' for `lastExportAt` = T0 in both projects; `persistResult === false` with 0 runs → card visible."

#### P2-3 — Gate C harness facts
- **What breaks:**
  - `test.use({ userAgent: '… Instagram …' })` replaces the whole UA. On `mobile` this drops the iPhone 13 UA (deviceDescriptorsSource.json:829; wkPage.js:178, 635).
  - `navigator.standalone` has no prototype descriptor in either Playwright browser (probe), and plain assignment is fragile.
  - A "new context" must keep the project's device emulation.
  - There's no helper to seed `meta`, whose key `'meta'` isn't exported (store.ts:36).
  - Background meta writes need `expect.poll`.
  - Downloads are supported in WebKit (wkBrowser.js:56-58, 194-196) but need `download.path()` → `setInputFiles`.
  - The journey's projects aren't stated (PRD §6: chromium + mobile).
- **Ticket edit:** Journey line 69 adds:
  > Projects chromium + mobile. In-app UA = `` `${testInfo.project.use.userAgent} Instagram 300.0.0` `` via `browser.newContext({ ...testInfo.project.use, userAgent })`. Standalone = `Object.defineProperty(Navigator.prototype, 'standalone', { configurable: true, get: () => true })`. "New context" = `browser.newContext({ ...testInfo.project.use })`. Meta is seeded with `withTxn('readwrite', s => req(s.meta.put({ ...m, schemaVersion: 1 }, 'meta')))` (new `seedMeta` in tap-helpers). Background writes are re-read with `expect.poll`. Export = `Promise.all([page.waitForEvent('download'), click])` → `download.path()` → `setInputFiles`. The persist override is in AC-DUR-5 (P1-1). Failure injection is armed through `sessionStorage` after the database exists, and rows are re-read in the same context (hops amendment 2026-10-14, I12).

#### P2-4 — S1 / S5 coverage beyond Apply
- **What breaks:**
  - AC-DUR-10 covers only Apply. "Not now" failure (the card must stay, `backupNudgeDismissedUntil` unchanged) and export bookkeeping failure aren't asserted.
  - A rejected Settings load (`newer-schema`, `blocked`, `unavailable`) has no specified view.
  - The "unchanged" re-read omits `meta` and doesn't say "same context".
- **Evidence:** docs/specs/app/APP-DURABLE.md:30,45. components/app/views/tags.tsx:36-53 (`SaveFailure` pattern). PRDs/runtag-app-hops.md:157,161,170.
- **Ticket edit:** line 30 adds: "Retry only for `quota`/`tx-aborted`. Other kinds, and a rejected Settings load, render `store-error` 'RunTag can't open its storage on this device ({kind}).' with `<AppNav/>`." AC-DUR-10 adds: "tags, runs **and meta** re-read in the same context; 'Not now' armed → card still visible, `backupNudgeDismissedUntil` unchanged, disarm + Retry → set; export armed → the download happens, `lastExportAt` unchanged, `backup-failed`, Retry → `lastExportAt` set and download count still 1; database pre-created at version 2 → `/app/settings` shows `store-error`, no `backup-import`."

#### P2-5 — Round-trip fixture, chain after restore (S3), and the restore path (PL-1)
- **What breaks:**
  - AC-DUR-1's "3 tags + 10 runs" doesn't say the runs cover the optional fields (`endedAt`, `tagOutId`, `abandonedAt`, `lastTransition`). It also doesn't exclude a stale open run: with the P1-2 in-transaction `abandonStaleIn`, that run would change on import and break deep-equality.
  - Nothing asserts the promise itself: the **chain** after restore (hops:159 lists DURABLE as an S3 reader).
  - The PL-1 path (plant view → "Restore from backup" → Settings → Import) isn't exercised end to end.
- **Evidence:** PRDs/runtag-app-hops.md:39,159. components/app/views/plant.tsx:60-70. lib/app/tap.ts:23. PRDs/runtag-app-persona-lens.md:109.
- **Ticket edit:** AC-DUR-1:
  > Fixture: tags A, B, C; runs = 8 `done` on consecutive `localDay`s ending today (each with `endedAt`, `tagOutId`, `lastTransition:'out'`), 1 `abandoned` (with `abandonedAt`), 1 `open` started 30 min before T0 (`lastTransition:'in'`). Before export: `chain-value` = `"8"`. In the new context: `goto('/t/' + A)` → plant view → click "Restore from backup" → `data-view=settings` → import file A → Apply → `goto('/app')` + reload: `chain-value` = `"8"` = `computeChain(listRuns(), localDayOf(now))` (S3), `listRuns()` deep-equals file A's runs, and `/t/{A}` is no longer unknown (no `tap-plant`).

#### P2-6 — Contract traps for the new code
- **What breaks:**
  - APPD-A11Y-003's lookahead stops at the first `>` (feature_app_defaults.yml:148-159), so `<input type="file" onChange={(e) => …} aria-label=…>` and the conflict radios get flagged unless `aria-label` comes before any `=>` (the same trap as APP-TAGS P2-7).
  - APPD-TEST-003 bans `.catch(() => undefined)` in lib/**/*.ts (feature_app_defaults.yml:264-275), which is the shape a fire-and-forget persist would take.
  - APP-ORIGIN bans `location.href` for the copy-link (P1-5).
  - APP-GLOBALS (feature_app.yml:53-62) forbids exposing `exportFile`/`importBackup` on `window` except through `__runtagStore` (Shell.tsx:19, 36; Shell.tsx isn't in `files`).
  - AC-TAGS-9 (journey_app_tags.spec.ts:385-390) fails on the substring `userAgent` anywhere in tags.tsx, including a comment.
  - APPD-COMP-003 flags `className="…bg-[#…]"` literals.
- **Ticket edit:** line 31 adds: "Every `<input>` (file, radio) puts `aria-label` before any attribute containing `=>`. lib code handles rejections explicitly (no `.catch(() => …)` swallowing). Copy-link URLs come only from `TAG_ORIGIN`/`tagUrl`. tags.tsx and plant.tsx import `useSilo`/`guardPlant` and contain no `userAgent` (code or comment; AC-TAGS-9 stays green). No new window globals. Colours via shared button classes, not `className` hex literals." AC-DUR-11 adds "`npm run test:contracts` green; AC-TAGS-9 re-run green".

#### P2-7 — Declarations and seam evidence
- **What breaks:**
  - `writes` lacks the `tags` and `runs` stores, although the epic seam list names APP-DURABLE as a writer of both (hops:124-133) and Import writes both.
  - `meta`, `/app/settings`, `lastExportAt`, `persistResult` and `backupNudgeDismissedUntil` already resolve pre-build (store.ts:20; route.ts:41), so they are vacuous.
  - The P1-11 testids, `updateMeta`, `useSilo`, `NUDGE_MS` and `ImportChanged` are missing.
  - `reads` lacks `abandonStaleIn`, `localDayOf`, `tagUrl`, `TAG_ORIGIN`, `cleanTagName`, `store-error`, `empty-state`, `tap-primary`.
  - `files` lacks `evidence/seams-app-durable.json`, which the DoD runs, and `evidence/seams-runtag-app.json`, whose APP-DURABLE entry still declares only `/app/settings` + `computeChain` (seams-runtag-app.json:224-233). It also lacks `tests/e2e/tap-helpers.ts` (`seedMeta`).
  - The header pins no seams, and the hops need a dated amendment reconciling the I14/A9 harness (seeded precondition, appended UA, `defineProperty`).
- **Ticket edit:**
  - writes: add `tags`, `runs`, `updateMeta`, `useSilo`, `NUDGE_MS`, `ImportChanged`, `backup-summary`, `backup-keep`, `backup-use`, `backup-cancel`, `backup-done`, `backup-changed`, `backup-failed`, `backup-retry`, `backup-nudge-export`, `persist-ok`, `silo-copy`.
  - reads: add `abandonStaleIn`, `localDayOf`, `computeChain`, `tagUrl`, `TAG_ORIGIN`, `cleanTagName`, `store-error`, `empty-state`, `tap-primary`.
  - Add the note "`meta`, `/app/settings` and the Meta fields resolve pre-build (vacuous); covered by `updateMeta`, `backup-export`, `last-backup`".
  - files: add `evidence/seams-app-durable.json`, `evidence/seams-runtag-app.json`, `tests/e2e/tap-helpers.ts`.
  - Header: "Seams: `runs`/`tags` writer×writer with APP-TAP and APP-TAGS (AC-DUR-4c); `meta` writer (APP-SHELL creates it); `backup-status` in APP-CHAIN's load transaction (P1-7)."
  - DoD: "PRDs/runtag-app-hops.md amendment (dated) reconciles the I14/A9/I15 harness per P1-9 and P2-3."

---

## Regression notes (no ticket edit needed beyond P1-1, P1-5, P1-7, P1-11, P2-6)
- **Persist in existing journeys.** Persist resolves `false` in headless Chromium and is absent in Playwright WebKit (probe). Once P1-1 lands, any merged journey that plants (journey_app_plant, journey_app_run, journey_app_tags) leaves `persistResult === false` in the background, and home then shows `backup-nudge`. No merged test asserts home content that conflicts with this. AC-TAGS-1 (`empty-state` 0, `chain-value` "0") and AC-CHAIN-6 (`getMeta().schemaVersion` = 1, fresh device) stay green. The card must not use `tap-primary` (P1-11).
- **AC-TAP-18 / `checkView` on the plant view** (journey_app_plant.spec.ts:22) stays green only if `silo-confirm` is a secondary button and `private-note` contains no metric text (P1-5).
- **The race outcomes are unchanged** because the confirm replays the same `plantTag` call with the displayed open run id (P1-5). This covers AC-TAP-4 (tap-out race) and AC-TAP-21 (start race).
- **Settings must keep `data-view=settings`, `<AppNav/>` and offline cache-first rendering.** These are checked by AC-SHELL-6B (journey_app_offline.spec.ts:88-89) and by the in-shell Back test through "Restore from backup" (journey_app_run.spec.ts:414-415).
- **AC-SHELL-11** (app_shell.spec.ts:191-201) renders `/app` and `/app/settings` at the real date with an empty database. The new text is "Last backup: never" and the Export/Import labels, and neither metric regex matches. Filled dates render as "Monday 12 October" (no unit after the number).
- **AC-CHAIN-13 / S10** stay green only if the meta read joins the existing load transaction (P1-7). A second transaction would render content after a failed load.
- **AC-TAGS-9** static check: see P2-6.
