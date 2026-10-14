# APP-TAP — GATE B.5 pre-flight simulation

**Target:** docs/specs/app/APP-TAP.md (working-tree version, 124 lines) · **Date:** 2026-10-13 · **Mode:** ticket walk (not PRD), against the merged APP-SHELL code
**Context read:** PRDs/runtag-app-prd.md (APP-002…006, 016…021), PRDs/runtag-app-verdict.md §7 APP-TAP 1–5 and falsification T4/T8, PRDs/runtag-app-hops.md (I3–I13, A3–A8, L1–L10, S1–S7, G1), docs/specs/app/APP-CHAIN.md (current, consumes `abandonStaleIn`), lib/app/{store,chain,route,nav,origin}.ts, components/app/Shell.tsx, components/app/views/*.tsx, components/app/ReadyOffline.tsx, scripts/sw/sw.template.js, next.config.mjs, playwright.config.ts, tests/e2e/app_shell.spec.ts, tests/e2e/journey_app_offline.spec.ts, docs/contracts/feature_app.yml, feature_demo.yml, scripts/verify-seams.cjs, evidence/seams-check.sh, node_modules/next@16.1.4 (client/components/app-router.js, router-reducer/*), node_modules/playwright-core@1.57.0.
**Verdict:** NOT build-ready. 2 CRITICAL, 11 P1, 12 P2. Each finding gives the exact ticket edit. The ticket was not edited.

## Personas walked
| Persona | Walk | Result |
|---|---|---|
| P-I iPhone owner-runner (`mobile`, WebKit) | plant X → grace +2 min → +11 min tap-in → double read +5 s → leave Safari; tab restored hours later | The guard view stays on `/t/X`. The tab restore re-runs the decision after the window closes and records a tap-out the runner never made (C2). |
| P-T traveller (clock moved back 3 h after a tap-out, or a run with `startedAt > now`) | tap any known tag | Step 2 abandons the future run, then step 5 guards on it forever: negative delta < 60 000. Every tap is blocked until the wall clock passes the stored `lastTapAt` (C1). |
| P-A Android two-tag looper (`chromium`) | L1–L10, plus an NFC re-read right after Undo | The stale notice is lost on the URL switch (P1-1). Undo of a tap-in always says "changed" because no run carries `lastTransition` (P1-2). A re-read after Undo re-taps (P2-2). |
| P-P planter with a run open | `/t/{unknown}` → plant view | It is undefined which buttons show and which is primary. "Save and start run" returns the old open run and shows TAGGED for it (P1-4). |
| P-B build engineer | implement `finishOpenRun`, `startRunExplicit`, Undo result views, `shellReplace` | No target id, no "nothing open" outcome, no expired copy, no render rule for a deleted or abandoned `?tapped=` id (P1-3, P1-5). `shellReplace` itself is safe (P2-1). |
| P-G Gate C test author | AC-TAP-9, 13, 14 and 15 oracles on Playwright 1.57 | In-page `computeChain` is not exposed (P1-6). `document.prerendering` can't be flipped and bfcache is disabled in Chromium (P1-7). Failure arming can't survive the navigation that fires the tap (P1-8). The concurrency oracle passes even if one page never decides (P1-9). |
| P-R regression (APP-SHELL suite after merge) | app_shell.spec.ts AC-SHELL-2 and journey_app_offline AC-SHELL-6 on unknown tags | Both read `tap-tag-id[data-tag-id]` on `/t/`. The plant view isn't required to keep it (P1-10). |

## Stipulation fold-in check (verdict §7 APP-TAP 1–5)
| # | Stipulation | Folded? | Gap → finding |
|---|---|---|---|
| 1 | S-1: grace only on page loads, never plant buttons; grace shows "Tag works ✓" + Finish/Start; T1 Gherkin + Just save | Yes (decision step 4, Gherkin) | — |
| 2 | S-2: APP-023 order; non-stale gating of "Save and tap out here"; 7 h + unknown Gherkin | Yes, but step 5 is unsafe after step 2 for future-dated runs | C1 |
| 3 | S-4: `?tapped=` rendered from IDB with Undo from stored `lastTapAt`; `tagId` captured once; visible / non-prerendering; ignore `pageshow.persisted`; `toHaveURL` before reload; prerender stub oracle | Partial | Only state-changing outcomes leave `/t/` (C2). The prerender stub can't be flipped as written, and the bfcache oracle can't fail (P1-7). |
| 4 | S-13 (= T8): CAS in one txn; "Can't undo — something changed"; abandoned stays abandoned; undo tap-out Gherkin with chain back after reload. T8 also says "Guard screens offer Undo for the original transition until 60 s after it." | Partial | Guard-screen Undo is missing. There is no Gherkin for undoing a tap-out. The CAS depends on `lastTransition`, which `startRunIfNoneOpenIn` never writes (P1-2, P1-5). |
| 5 | M-6: no countdowns or durations | Yes (Copy, AC-TAP-17) | The expired-Undo copy is missing, so implementers will improvise (P1-5). |

## Hop coverage check (pinned I3–I13, A3–A8, L1–L10)
| Hop | Criterion | Re-read oracle in ticket? | Gap |
|---|---|---|---|
| I3 | AC-TAP-1, AC-TAP-2 | yes | — |
| I4 | AC-TAP-5 | yes | — |
| I5 | AC-TAP-6 | partial | URL must equal `TAPPED_PREFIX + R[0].id`; `localDay` not asserted (P2-4) |
| I6 | AC-TAP-7 | yes | — |
| I7 | AC-TAP-8 | yes | — |
| I8 | AC-TAP-9 | partial | the oracle needs an unexposed function (P1-6); `/app` chain after reload missing (P2-5) |
| I9 | AC-TAP-10 | yes | — |
| I10 | AC-TAP-17 | yes | — |
| I11 | AC-TAP-12 | partial | "chain unchanged after reload" missing (P2-5) |
| I12 | AC-TAP-13 | **vacuous in hops** | "new context: R length 0" is always true, because a new context has empty IndexedDB (P1-8) |
| I13 | none | — | `/app`-render abandon is owned by APP-CHAIN (AC-CHAIN-5), yet the header pins it here (P1-11) |
| A3, A4 | AC-TAP-16 | partial | A3's < 1000 ms TAGGED latency is dropped (P1-11) |
| A5 | none | — | the `/app/tags` list is APP-TAGS; the header pin overclaims (P1-11) |
| A6 | **none** | — | the slow-network cache-first tap (< 1000 ms, committed) has no criterion (P1-11) |
| A7 | AC-TAP-14 | passes vacuously | P1-9 |
| A8 | AC-TAP-15 | infeasible as written | P1-7 |
| L1, L2 | AC-TAP-6, AC-TAP-9 | yes / partial | L2 `/app` chain after reload (P2-5) |
| L3 | AC-TAP-10 | partial | other-tag (tag-agnostic) case not named (P2-5) |
| L4, L9, L10 | AC-TAP-12 | partial | L9 "chain back to pre-tap value after reload" missing (P2-5) |
| L5 | AC-TAP-9 | partial | reversed direction + `localDay:'2026-10-13'` + chain 2 not named (P2-5) |
| L6 | AC-TAP-4 | partial | chain 3 after reload (P2-5) |
| L7 | AC-TAP-5 | yes | — |
| L8 | AC-TAP-11, AC-TAP-1 | yes | "after plant, `open(R)` 0" implies "Just save"; the ticket should say which button |

---

## Pre-flight Findings

### CRITICAL

#### C1 — The double-read guard selects abandoned and future-dated runs. After a clock change every tap is blocked, which contradicts "tap then proceeds"
- **What breaks:** Step 5 picks "the most recent run (max `lastTapAt`)" with `now − lastTapAt < 60_000`. Two failure modes follow:
  1. **The M-5 case itself.** A run with `startedAt > now` (clock moved back) is abandoned in step 2. Its `lastTapAt ≥ startedAt > now` is unchanged, so it is still the max. `now − lastTapAt` is negative, which is `< 60_000`, so step 5 fires on an **abandoned** run. `TapOutcome` has no guard kind for an abandoned run (`guard-in | guard-out` only), and the tap never proceeds.
  2. **A done run with a future `lastTapAt`** (tap-out, then the clock moves back by hours, through travel or a manual change). No stale rule applies to done runs, so step 5 guards every tap on every tag until the wall clock passes the stored value. The app is effectively bricked for that period. Undo has the same defect: "not offered once `now − lastTapAt ≥ 60_000`" stays offered forever for a future `lastTapAt`.
- **AC/step:** decision steps 2 and 5. Criteria AC-TAP-11 ("tap then proceeds"), AC-TAP-8, AC-TAP-10 and AC-TAP-12. Persona P-T.
- **Evidence:** APP-TAP.md:19 (abandon writes only `status` and `abandonedAt`), :22 (guard over max `lastTapAt` and any status), :33-36 (no abandoned guard kind), :45 (Undo window). lib/app/store.ts:6-17 (`lastTapAt` is mandatory and never cleared). Verdict M-5 (PRDs/runtag-app-verdict.md:124).
- **Ticket edit:** replace decision step 5 and the Undo window sentence with:
  > 5. **double-read guard**: candidates are runs with `status` `open` or `done` (abandoned runs never guard). Take the candidate with max `lastTapAt`. It guards iff `0 ≤ now − lastTapAt < GUARD_MS`. A `lastTapAt` in the future is outside the window. `open` → `guard-in`, `done` → `guard-out`.
  >
  > Undo is offered iff `0 ≤ now − run.lastTapAt < UNDO_MS`.

  Add to AC-TAP-11: "…including a seeded open run with `startedAt = now + 3 h` and a done run with `lastTapAt = now + 3 h`: the tap on a known tag outside grace creates a new open run (row re-read), and the future open run is `abandoned`."

#### C2 — Only state-changing outcomes leave `/t/{id}`. A reload, tab restore or in-shell Back of a guard, grace or plant view re-runs the tap after its window has closed
- **What breaks:** APP-016 is a MUST: "reload/Back/tab-restore never re-tap". The ticket replaces the URL only "when state changed" (Scope line 11). Guard-in, guard-out, grace, the pre-save plant view and the "Just save" result therefore all stay on `/t/{id}`. Walk P-I: tap-in at T, NFC double read at T+5 s gives the guard-in view on `/t/X`. iOS discards the tab, and when Safari is reopened at T+40 min the tab reloads `/t/X`. The decision runs again, reaches step 6, and records a **tap-out the runner never made**. The real end-of-run tap then opens a phantom run that is later abandoned and triggers the stale notice. The same happens in-shell: from the plant view, "Restore from backup" calls `shellNavigate('/app/settings')` (pushState) over `/t/X`. Back fires `popstate`, Shell resolves `/t/X` again and **mounts a new TapView**, and the decision runs a second time. After APP-DURABLE lands, the restored tag is known, so this records a tap. React dev StrictMode double effects hit the same path.
- **AC/step:** Scope "runs the decision once, then replaces the URL … when state changed". Criteria AC-TAP-7, AC-TAP-8, AC-TAP-10 and AC-TAP-15. PRD §5 "Reload does not re-tap".
- **Evidence:** APP-TAP.md:11. components/app/Shell.tsx:23,40-48 (the view is a pure function of the address bar; TapView mounts whenever the URL resolves to `tap`). lib/app/nav.ts:5-8,10-12 (pushState and popstate both re-render). lib/app/route.ts:13-16 (`resolveRoute` reads only `tapped` from the search string, so extra params are free). node_modules/next/dist/server/config-shared.js:77 (`reactStrictMode: null`, and the App Router turns it on in dev).
- **Ticket edit:** replace the Scope tap-view bullet with:
  > Tap view (`/t/{tagId}`): the decision runs **at most once per document**, for the tag id in the URL at document load, latched in a module-level variable. It runs only when that document's navigation entry has `type === 'navigate'`. It never runs on `reload` or `back_forward`, never on an in-shell popstate or remount, and never twice under StrictMode. On a non-`navigate` load the view shows the tag's current state with an explicit primary **Record tap** button that calls `tapAtTag`. Every outcome that concerns a run leaves `/t/` through `shellReplace()`: `in`/`out` → `` `${TAPPED_PREFIX}${run.id}` ``; `guard-in`/`guard-out` → `` `${TAPPED_PREFIX}${run.id}&again=1` `` (TappedView reads `again` from `window.location.search` to choose the guard copy and primary); every plant, grace or guard button → `TAPPED_PREFIX + resulting run id`; "Just save" → `shellReplace('/app')`. The grace view and the pre-save plant view are the only views that remain on `/t/{id}`.

  Add a new criterion, named AC-TAP-19 in the table: "Guard view, then `page.clock.setFixedTime(+40 min)`, then `page.reload()`: runs unchanged and URL still `/app?tapped=…&again=1`. Grace view, then `setFixedTime(+11 min)`, then reload of `/t/X`: runs count unchanged (the navigation type is `reload`). Plant view, then click the restore link, then `page.goBack()`: runs and tags unchanged." Oracle: rows re-read.

### P1

#### P1-1 — The stale notice can't survive the URL switch or a reload, and "stale + unknown" changes state without a defined URL
- **What breaks:** `staleNotice` lives on the `TapOutcome` in the TapView. On tap-in the URL becomes `/app?tapped=`, TapView unmounts and the flag is gone. On reload it is gone too, so the AC-TAP-11 "notice shows" assertion can only pass before navigation, or through ad-hoc URL or module state. Also, "stale abandon → unknown" (step 2 then step 3) is a state change with no run id, which conflicts with the Scope rule "replace when state changed".
- **AC/step:** AC-TAP-11; Gherkin "Forgotten tap-out with an unknown tag".
- **Evidence:** APP-TAP.md:11,19,32-36. components/app/Shell.tsx:48-49 (separate views, no shared state). components/app/views/tapped.tsx:2 (TappedView gets only `runId`).
- **Ticket edit:** add under the Data contract:
  > The stale notice (`data-testid="stale-notice"`) on `/app?tapped={id}` is derived from IndexedDB. It shows iff some run has `status:'abandoned'` and `abandonedAt === run.startedAt` of the displayed run (the same captured `now`), so it survives reload. On `/t/` views (plant, grace) it comes from `outcome.staleNotice`. Stale abandon followed by unknown or grace stays on `/t/{id}`; the abandon is the only change.

  Extend the AC-TAP-11 oracle: "notice text re-read after `page.reload()` of `/app?tapped={newRunId}`".

#### P1-2 — `lastTransition:'in'` is claimed for `startRunIfNoneOpenIn`, which never writes it, so Undo of a tap-in always returns "changed"
- **What breaks:** Step 7 says tap-in uses `startRunIfNoneOpenIn` "creating {… lastTransition:'in'}". The merged function builds the row without it. The Undo CAS requires `lastTransition:'in'`, so it always returns `'changed'` unless each engineer separately adds the field, either by editing store.ts or with a second `put`. Runs already on devices from APP-SHELL, and imported backups (APP-DURABLE M-4 validates "required fields"), also lack it.
- **AC/step:** decision step 7; AC-TAP-12 (I11, L4).
- **Evidence:** lib/app/store.ts:123-137 (row literal has no `lastTransition`). APP-TAP.md:24,28-29,45.
- **Ticket edit:** replace the store.ts comment in the Data contract with:
  > lib/app/store.ts (additive): `Run.lastTransition?: 'in' | 'out'`. `startRunIfNoneOpenIn` sets `lastTransition: 'in'` on the row it creates (AC-SHELL-3 uses `toMatchObject` and stays green). Every APP-TAP write that sets `lastTapAt` also sets `lastTransition`: tap-in, `startRunExplicit` and plant `start` set `'in'`; tap-out, `finishOpenRun` and plant `tap-out` set `'out'`. The Undo CAS treats a missing `lastTransition` as `'changed'`.

#### P1-3 — The explicit actions have no target identity and no "nothing to do" outcome
- **What breaks:** `finishOpenRun(tagId, now)` finishes "the open run", not the run the page showed. Walk L10 in reverse: page 1 shows grace "Finish run" for run R. Meanwhile R is tapped out elsewhere and a new run R2 starts. Pressing the stale button finishes R2 at once. If nothing is open (finished on page 2, abandoned by APP-CHAIN, or a double press), `Promise<Run>` has no defined result. `startRunExplicit` calls `startRunIfNoneOpenIn`, which returns an existing open run with `created:false` (store.ts:124-125), so the view would announce "Run started" for an old run. Neither action says whether it runs `abandonStaleIn` first. A "Finish run" pressed on a view left open for 7 h would complete a stale run, which violates APP-006 "never counts". Double presses are not covered.
- **AC/step:** AC-TAP-5, AC-TAP-8, AC-TAP-10, AC-TAP-18; module contract lines 39-40.
- **Evidence:** APP-TAP.md:39-40. lib/app/store.ts:117-125.
- **Ticket edit:** replace the two signatures with:
  > `finishOpenRun(runId: string, tagId: string, now: number): Promise<{ kind: 'out'; run: Run } | { kind: 'changed' }>` — one readwrite txn: `abandonStaleIn` first. Applies only if run `runId` is still `open`. Sets `{status:'done', endedAt: now, tagOutId: tagId, lastTapAt: now, lastTransition:'out'}`, otherwise `changed`.
  >
  > `startRunExplicit(tagId: string, now: number): Promise<{ kind: 'in'; run: Run } | { kind: 'already-open'; run: Run }>` — `abandonStaleIn` first, then `startRunIfNoneOpenIn`. `created:false` maps to `already-open`.
  >
  > Both bypass grace and guard. Buttons are `disabled` from press until the promise settles. `changed` shows "Can't finish — something changed" with primary **Done** → `/app`. `already-open` replaces to that run's `?tapped=` URL with `again=1`.

  Add to AC-TAP-8: "pressing Finish run on page 1 after page 2 finished the run leaves the row unchanged (`endedAt` re-read equals page 2's)."

#### P1-4 — The plant view with a non-stale open run, and planting an existing tag, are undefined
- **What breaks:** APP-002 says the screen "*instead* offers 'Save and tap out here'". The ticket marks it "(conditional)" but doesn't say whether "Save and start run" and "Just save" still appear, or which button is primary (AC-TAP-18 asks for exactly one). If "Save and start run" is shown and pressed while a run is open, `startRunIfNoneOpenIn` returns the old run, and the result view shows TAGGED / "Run started" for a run started earlier. `plantTag` on a tag id that already exists (double press, two tabs, or the tag planted on another tab in the meantime) is either a `tags.add` ConstraintError, which aborts and shows "This tap wasn't saved", or a `put` that resets `createdAt` and `graceUntil`. `plantTag(…,'tap-out')` doesn't say it re-checks inside its own transaction that a non-stale run is still open.
- **AC/step:** AC-TAP-1, AC-TAP-2, AC-TAP-4, AC-TAP-18; L6, L8.
- **Evidence:** PRD APP-002 (runtag-app-prd.md:32). APP-TAP.md:38,48,53-56. lib/app/store.ts:96-97 (an aborted request maps to `tx-aborted`), 124-125.
- **Ticket edit:** add to the Copy/Plant text:
  > With a non-stale open run, the plant view shows **Save and tap out here** (primary) and **Just save**, and no "Save and start run". With no open run, it shows **Save and start run** (primary) and **Just save**.
  >
  > `plantTag` runs in one readwrite txn: `abandonStaleIn`; if the tag id already exists, it keeps the stored tag unchanged and continues as `tapAtTag` would for a known tag. `tap-out` with no open run degrades to `save`, and the result says "Tag saved"; it never starts a run. `start` with an open run is impossible from the UI. If called anyway, it returns the open run without creating one.

  Add to AC-TAP-4: "with an open run, 'Save and start run' count = 0".

#### P1-5 — The Undo lifecycle has holes: guard-screen Undo (T8), expired press, the 60 s boundary on a mounted view, and rendering a deleted or abandoned `?tapped=` id
- **What breaks:** (a) T8, adopted verbatim through S-13, says "Guard screens offer Undo for the original transition until 60 s after it". The ticket is silent. (b) `undoTap` returns `'expired'`, but no copy exists for it, and M-6 forbids improvising "Undo (12s)". (c) Undo visibility is "derived from the stored value", but the ticket doesn't say whether a mounted view hides Undo when the window passes, or only checks on press. (d) After undo of a tap-in the row is deleted, and the URL `/app?tapped={deletedId}` reloads into a missing row. `resolveRoute` maps *any* `tapped` value to the tapped view, which also covers bookmarks, abandoned runs and garbage ids. Two engineers will build four different screens. (e) An old done run revisited from history renders "Day 0. Chain unbroken." once the chain has broken (`computeChain` can return 0).
- **AC/step:** AC-TAP-7, AC-TAP-12, AC-TAP-17, AC-TAP-18; L9, L10, I11.
- **Evidence:** falsification T8 (PRDs/runtag-app-falsification.md:124) and verdict S-13 (runtag-app-verdict.md:213). lib/app/route.ts:13-15. lib/app/chain.ts:30-39. APP-TAP.md:41,45,48.
- **Ticket edit:** add a "Result view states" paragraph:
  > `/app?tapped={id}` reads run `id`. Open run: tap-in copy, primary **Go**. Done run: `Day {N}. Chain unbroken.` with N ≥ 1, otherwise `Run saved.`, primary **Done**. With `again=1`: guard copy, primary **Finish run** (open) or **Start another run** (done). Abandoned run: `This run didn't count.`, primary **Done**. Missing row: `Nothing to show here.`, primary **Done** → `/app`.
  >
  > **Undo** (`data-testid="tap-undo"`, non-primary) appears on the tap-in, tap-out and guard variants iff `0 ≤ Date.now() − run.lastTapAt < UNDO_MS`, evaluated at render and re-evaluated by a single timeout. No countdown is rendered.
  >
  > `undoTap` results: `undone` → `shellReplace('/app')`. `changed` → `Can't undo — something changed`. `expired` → `Too late to undo.`, with the Undo button removed.

  Add to AC-TAP-12: "reload of `/app?tapped={undoneTapInId}` shows 'Nothing to show here.' and runs count 0; undo on a guard view reverts the original transition."

#### P1-6 — The AC-TAP-9 oracle needs in-page `computeChain` and `localDayOf`, which the automation hook doesn't expose
- **What breaks:** The AC-TAP-9 oracle is "rendered N equals in-page `computeChain(listRuns(), localDayOf(Date.now()))`". `window.__runtagStore` is typed `Pick<typeof store, …>` and exposes only store functions. The chain functions live in `lib/app/chain.ts`. A Node-side recomputation would use the runner's timezone, not the page's, which makes the oracle unsound. `components/app/Shell.tsx` isn't in the ticket's `files`, so the needed edit is unowned.
- **AC/step:** AC-TAP-9 (I8, L2, hop S3).
- **Evidence:** components/app/Shell.tsx:15-19,27-30. lib/app/chain.ts:8,30. feature_app.yml:53-66 (APP-GLOBALS allows only `__runtagStore`).
- **Ticket edit:** add to the Data contract:
  > `components/app/Shell.tsx` (additive): the webdriver-gated `window.__runtagStore` also exposes `computeChain`, `localDayOf`, `tapAtTag`, `plantTag` and `undoTap`. Its type becomes `Pick<typeof store, …> & Pick<typeof chain, 'computeChain' | 'localDayOf'> & Pick<typeof tap, …>`.

  Add `components/app/Shell.tsx` to `files`.

#### P1-7 — The prerender oracle can't be flipped, and the bfcache oracle can't fail
- **What breaks:** (a) `addInitScript(() => Object.defineProperty(document,'prerendering',{value:true}))` defines a non-configurable `true`. After the test dispatches `prerenderingchange`, a correct implementation that re-checks `document.prerendering` still sees `true` and never taps, so a correct build fails the test. Only an implementation that trusts the event blindly passes. (b) Playwright's Chromium launches with `--disable-back-forward-cache`, so a real `pageshow.persisted` restore can't happen in the `chromium` project. A synthetic `pageshow` event can't fail a mount-once effect, because a bfcache restore never remounts React and the effect never re-runs. The criterion is green whether or not the guard exists. (c) The component mounts after hydration, so the initial `pageshow`, and possibly `prerenderingchange` if activation happened before hydration finished, have already fired. An implementation that only waits for events hangs.
- **AC/step:** AC-TAP-15 (A8), verdict S-4.
- **Evidence:** node_modules/playwright-core/lib/server/chromium/chromiumSwitches.js:59 (`--disable-back-forward-cache`). components/app/Shell.tsx:23,48 (mount after hydration). node_modules/next/dist/client/components/app-router.js:143-163 (Next's own `pageshow` handler only dispatches `ACTION_RESTORE`; the tree is the same, so there is no remount).
- **Ticket edit:** replace AC-TAP-15 with:
  > At mount the tap view checks `document.prerendering === true` and `document.visibilityState !== 'visible'`. If either holds, it subscribes to `prerenderingchange` and `visibilitychange` and re-checks on each event. It never waits for `pageshow`. Oracle: the init script defines `document.prerendering` as a **configurable getter** backed by a test-local closure variable. Assert runs = 0 for 1 s. Flip the variable to `false` and dispatch `prerenderingchange`. Assert runs = 1 and `tagInId` = id. The bfcache half is asserted as "the decision runs at most once per document" (C2): dispatch `new PageTransitionEvent('pageshow', {persisted: true})`, then `history.back()` then `history.forward()` inside the shell, and runs stay 1.

#### P1-8 — Storage-failure injection can't be "armed after the store opens" when the tap fires on load, and hop I12's re-read is vacuous
- **What breaks:** APP-SHELL learned that the quota override must be armed after `openStore()`, because the `onupgradeneeded` `meta.put` would otherwise fail the open (store.ts:42-49, app_shell.spec.ts:89-104). The tap fires automatically when `/t/X` loads, which is a new document. A `globalThis` flag set by `page.evaluate` in the previous document is lost, and arming from document start in a fresh context breaks the upgrade, giving `unavailable` rather than `quota`. I12's oracle, "new context without the override: `R` length 0", is always true, because a new Playwright context has empty IndexedDB. "Retry after recovery" needs a disarm path in the same document.
- **AC/step:** AC-TAP-13 (I12, hop S5).
- **Evidence:** lib/app/store.ts:42-49,75-76. tests/e2e/app_shell.spec.ts:89-104. PRDs/runtag-app-hops.md:36.
- **Ticket edit:** replace the AC-TAP-13 oracle with:
  > Visit `/app` first, so the DB is created and upgraded, and seed tag X with grace expired. The init script wraps `IDBObjectStore.prototype.put` and `.add` to throw `QuotaExceededError` while `sessionStorage.getItem('failIdb') === '1'`. Set it, then `goto('/t/X')`. Assert "This tap wasn't saved", `TAGGED` count 0, and runs = 0, re-read **in the same context** through `__runtagStore.listRuns()` after `sessionStorage.removeItem('failIdb')`. Press **Retry**: one open run with `tagInId` = X.

  Record a hops amendment request: I12's "new context" re-read becomes "same context, override disarmed".

#### P1-9 — The two-page concurrency oracle passes even if one page never decides
- **What breaks:** "open rows = 1" is also the result when one page never runs the decision: it stayed hidden in WebKit's second window, waited on `visibilitychange`, or crashed. The single-transaction design is never actually exercised. Both pages share one clock (`page.clock` is the context clock), so the second decision must be a guard.
- **AC/step:** AC-TAP-14 (A7).
- **Evidence:** node_modules/playwright-core/lib/client/page.js:71 (`this.clock = this._browserContext.clock`). lib/app/store.ts:83-115 (readwrite txns over the same scope serialize).
- **Ticket edit:** extend the AC-TAP-14 oracle:
  > …and both pages finished a decision: one page has URL `/app?tapped={id}` (no `again`), the other `/app?tapped={id}&again=1`, both with the same `data-run-id` as the single open row. Runs length = 1.

#### P1-10 — The new tap views can drop `tap-tag-id`, which breaks two merged APP-SHELL tests
- **What breaks:** After APP-TAP, `/t/abc123def4` with no stored tag renders the plant view. AC-SHELL-2 and the offline AC-SHELL-6 wait for `[data-testid=tap-tag-id][data-tag-id=<id>]` on exactly these unknown-tag loads. The ticket lists `tap-tag-id` in `writes` but never requires it on the plant, grace, failure or pending views.
- **AC/step:** regression of AC-SHELL-2 and AC-SHELL-6. APP-TAP Scope line 12.
- **Evidence:** tests/e2e/app_shell.spec.ts:48-53. tests/e2e/journey_app_offline.spec.ts:63-70. components/app/views/tap.tsx:6.
- **Ticket edit:** add to Scope:
  > Every view rendered at `/t/{id}` (pending, plant, grace, failure, Record-tap) keeps `<… data-testid="tap-tag-id" data-tag-id={tagId}>`. The tag id stays out of rendered text (P2-14). The APP-SHELL suite stays green unmodified.

#### P1-11 — The pinned-hop header overclaims, and A6 and A3's latency have no criterion
- **What breaks:** The header pins "I3–I13, A3–A8". I13 (abandon on `/app` render) is out of scope here, because it is owned by AC-CHAIN-5 in APP-CHAIN. A5 (offline `/app/tags` list) belongs to APP-TAGS. **A6** (online, 30 s navigation delay, tap committed and TAGGED visible < 1000 ms) has no criterion at all. A3's "TAGGED visible < 1000 ms after `goto` resolves" (verdict M-7) was dropped from AC-TAP-16. Gate D would walk hops that no test asserts.
- **AC/step:** header line 5; AC-TAP-16.
- **Evidence:** PRDs/runtag-app-hops.md:37,48,50,51. tests/e2e/journey_app_offline.spec.ts:81-92 (the AC-SHELL-6B delay harness exists to reuse).
- **Ticket edit:** change the header to "Pinned hops: I3–I12, A3, A4, A6, A7, A8, L1–L10, S2, S3, S5, S6, G1 (I13 → APP-CHAIN AC-CHAIN-5; A5 → APP-TAGS)". Append to AC-TAP-16: "…and `TAGGED` visible < 1000 ms after `goto` resolves". Add a new criterion, named AC-TAP-20 in the table: "Online with every navigation delayed 30 s (`context.route`), `/t/A` (grace expired) commits one open run and shows `TAGGED` < 1000 ms (A6) — chromium only, SW interception". Oracle: row re-read.

### P2

#### P2-1 — `shellReplace` through `history.replaceState` is safe; state the one ordering constraint
- **Finding (safe):** Next 16.1.4 patches `history.replaceState`. A call with non-Next data copies `__NA` and `__PRIVATE_NEXTJS_INTERNALS_TREE` into the entry. It then dispatches `ACTION_RESTORE` inside `startTransition` with the **same tree** and the new URL, so there is no fetch and no remount, and Shell keeps its identity. Only after that does it call the original `replaceState`, so `location` is already updated when `shellReplace` dispatches `runtag:navigate`, and `useSyncExternalStore` reads the new key. Next's `HistoryUpdater` then rewrites the entry with `canonicalUrl` equal to the new URL. `shellNavigate` (pushState) already runs through the same path and is proven by AC-SHELL-1B.
- **Constraint:** the patch is installed in an AppRouter `useEffect`, and parent effects run after child effects in the mounting commit. A synchronous `replaceState` inside TapView's first effect would bypass the patch and leave Next's `canonicalUrl` at `/t/X`, and a later router update would write `/t/X` back. That can't happen when `shellReplace` runs after an awaited `withTxn`, which settles on a later task.
- **Evidence:** node_modules/next/dist/client/components/app-router.js:80-93,221-268; router-reducer/reducers/restore-reducer.js:22-35; create-initial-router-state.js:24-26 (initial `canonicalUrl` = `location.href`, so the rewrite keeps `/t/X`). lib/app/nav.ts:3-8,10-12.
- **Ticket edit:** "`shellReplace(path)` lives in lib/app/nav.ts, reuses the module's `NAVIGATE` constant, calls `window.history.replaceState(null, '', path)` and dispatches `runtag:navigate`. It is called only after an awaited store call, never synchronously in a mount effect."

#### P2-2 — The guard is lost after Undo, and an Undo can create an immediately-stale run
- **What breaks:** Undo of a tap-out sets `lastTapAt = startedAt`, and Undo of a tap-in deletes the row. In both cases the guard window is gone, so an Android auto re-read while the phone is still on the tag re-taps at once and redoes what was just undone. This doesn't break the chain: the reopened run keeps its `localDay` and doesn't count while open. Undo of a tap-out at 5 h 59 m reopens a run that `/app` (APP-CHAIN) abandons moments later, so the user loses a done run by pressing Undo. A reopened run whose `startedAt` is within 60 s can be undone again as a tap-in. That is harmless, but undocumented.
- **Ticket edit:** "After Undo the double-read guard does not apply (accepted, honour system). Undo of a tap-out is refused with `Too late to undo.` when `now − startedAt ≥ STALE_MS`. A reopened run's tap-in can be undone while `now − startedAt < UNDO_MS`."

#### P2-3 — The primary-button oracle is under-specified
- **What breaks:** If "Go" or "Done" → `/app` is built as an anchor, `role=button` with `data-primary` counts 0. The guard-out view shows "the success view" (which has **Done**) plus "Start another run", so it would have two primaries. Plant and failure views aren't covered.
- **Ticket edit:** "Primary actions are `<button data-testid="tap-primary" data-primary>`. Navigation uses `shellNavigate`, never `<a>`. Exactly one per view, including plant (see P1-4), failure (**Retry**) and grace. On guard-out, **Done** is absent."

#### P2-4 — The AC-TAP-6 oracle is weaker than I5, and "success only after commit" has no falsifiable check
- **Ticket edit:** AC-TAP-6 oracle: "`toHaveURL(TAPPED_PREFIX + R[0].id)` exactly; `R[0]` = `{status:'open', tagInId:X, localDay:'2026-10-12'}`; `TAGGED` count 0 on the failure path (AC-TAP-13 is the negative control)."

#### P2-5 — The chain re-read after reload is missing from several hops
- **What breaks:** I8, I11, L2, L4, L5, L6 and L9 assert the `/app` chain after reload. The ticket asserts only rows or result text. APP-CHAIN replaces `home.tsx` in the same wave, but keeps `chain-value` (both tickets declare it).
- **Ticket edit:** add to the Journeys section: "After each tap-out and each Undo, `goto('/app')` + reload and re-read `[data-testid=chain-value]` text against `computeChain(listRuns(), localDayOf(Date.now()))` in-page. Add `chain-value` to `reads`. L3 and L5 are named explicitly: the guard on the other tag, and the reversed direction with `localDay:'2026-10-13'` and chain 2."

#### P2-6 — Time and zone setup for the tests
- **What breaks:** The hops convention says `clock.install` and `timezoneId:'Europe/London'`. The ticket says `setFixedTime` and pins no zone, so I5's `localDay:'2026-10-12'` depends on the runner's TZ. `clock.install` + `pauseAt` freezes `withTxn`'s `setTimeout(…, 0)` settle, and every store call hangs. The clock is context-wide.
- **Evidence:** lib/app/store.ts:95. node_modules/playwright-core/lib/client/clock.js:28-45; page.js:71.
- **Ticket edit:** "Journeys `test.use({ timezoneId: 'Europe/London' })`. Time only via `page.clock.setFixedTime()`. Never `install` + `pauseAt`/`runFor`, because `withTxn` settles on a real `setTimeout`. In multi-page tests the clock is shared."

#### P2-7 — Seam declarations: `/t/` resolves vacuously, and read surfaces are missing
- **What breaks:** `surfaceResolves` strips the leading `/`, so `/t/` becomes the substring `t/` and matches almost any file. It can never fail. The hop-pinned APP-TAGS × APP-TAP seam on `graceUntil` isn't declared. The shared constants aren't declared.
- **Evidence:** scripts/verify-seams.cjs:76-87. PRDs/runtag-app-hops.md:78.
- **Ticket edit:** writes add `STALE_MS`, `GUARD_MS`, `UNDO_MS`, `TapOutcome`, `tap-record`, `tap-guard`. Reads add `graceUntil`, `SETUP_GRACE_MS`, `chain-value`, `shellNavigate`, `subscribeLocation`. Keep `/t/` but note "vacuous resolution; covered by the `tap-tag-id` surface". Files add `components/app/Shell.tsx`.

#### P2-8 — The failure view across `StoreError` kinds
- **What breaks:** `newer-schema`, `blocked` and `unavailable` make Retry pointless, and two engineers will differ on which kinds count as "This tap wasn't saved".
- **Ticket edit:** "`quota`/`tx-aborted` → `tap-failed` with **Retry** (re-runs the same action with a fresh `Date.now()`, including plant actions with the typed name). `newer-schema`/`unavailable`/`blocked` → `tap-failed` plus the APP-SHELL `store-error` text, with no Retry."

#### P2-9 — The `abandonStaleIn` contract and W2 sequencing with APP-CHAIN
- **What breaks:** APP-CHAIN (W2, "parallel") now depends on `abandonStaleIn` from this ticket (APP-CHAIN.md:3,20). The function's semantics (all qualifying runs? does it touch `lastTapAt`? what does the boolean mean?) aren't written down.
- **Ticket edit:** "`abandonStaleIn(s, now)` sets every `open` run with `now − startedAt ≥ STALE_MS` or `startedAt > now` to `{status:'abandoned', abandonedAt: now}` and leaves all other fields unchanged. It returns `true` iff it changed any row, and opens no transaction of its own. It ships in the first commit of this slice so APP-CHAIN can rebase on it."

#### P2-10 — `tapAtTag` with an invalid id
- **Ticket edit:** "`tapAtTag` rejects with `TypeError` when `!TAG_ID.test(tagId)` before opening a transaction (step 1 is defensive; Shell never calls it)." Add `TAG_ID` to `reads`.

#### P2-11 — User-entered tag names can trip the rendered-text metric regex
- **What breaks:** If any view renders the tag name (grace "Oak at gate"), a name such as `Loop 5 s` matches `\b\d+\s?(…|s|…)\b`, and AC-TAP-17 fails on user data.
- **Ticket edit:** "Tap and result views do not render the tag name, or the AC-TAP-17 fixtures use names without digits. Plant name validation is 1–40 chars only."

#### P2-12 — `journey_app_plant` is shared with APP-TAGS
- **Ticket edit:** "This slice creates `docs/contracts/journey_app_plant.yml` and `tests/e2e/journey_app_plant.spec.ts` with the `/t/` steps only. APP-TAGS appends the `/app/tags` steps (writer × writer seam on both files)."
