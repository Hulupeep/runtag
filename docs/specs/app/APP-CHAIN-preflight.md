# APP-CHAIN — GATE B.5 pre-flight simulation

**Target:** docs/specs/app/APP-CHAIN.md (working-tree version, 77 lines) · **Date:** 2026-10-14 · **Mode:** ticket walk against merged APP-SHELL + APP-TAP code
**Context read:** PRDs/runtag-app-prd.md (APP-006…009, §5 Chain), PRDs/runtag-app-verdict.md §7 APP-CHAIN 1–3 and §4 M-2/M-3, PRDs/runtag-app-persona-lens.md PL-16, PRDs/runtag-app-hops.md (I1, I13, A13, A14, S3, S7, S8, amendment 2026-10-14), docs/specs/app/APP-TAP.md, APP-DURABLE.md, APP-TAGS.md, lib/app/{store,chain,route,nav,tap}.ts, components/app/Shell.tsx, components/app/views/{home,tapped}.tsx, components/app/{ReadyOffline,AppNav}.tsx, components/ChainVisual.tsx, app/globals.css, lib/constants.ts, hooks/useDemoState.ts, docs/contracts/feature_app.yml, feature_app_defaults.yml, feature_demo.yml, tests/contracts/contract-enforcement.test.js, tests/e2e/{journey_app_run,app_shell,journey_app_offline,app_logic}.spec.ts, tests/e2e/tap-helpers.ts, playwright.config.ts, evidence/seams-app-chain.json, node_modules/playwright-core@1.57.0 (server/browserContext.js, generated/storageScriptSource.js, generated/clockSource.js, types/types.d.ts).
**Verdict:** NOT build-ready. 0 CRITICAL, 9 P1, 9 P2. Each finding gives the exact ticket edit. The ticket was not edited.

## Personas walked
| Persona | Walk | Result |
|---|---|---|
| P-D daily owner-runner (`mobile`, iPhone 13 WebKit, 390 px) | chain 12, ran yesterday, not yet today; opens `/app` at 21:00 | At-risk shows, but its copy is unspecified (P2-5). The chain visual is one non-wrapping flex row of 40 px links. It overflows the viewport from 9 links up, so 12 links are clipped on both sides (P1-3). |
| P-T traveller (London → New York; DST end 2026-10-25) | (a) runs on 10-10…10-12 in London, reopens in New York at 15:00 London; (b) opens `/app` at 2026-10-25 23:30 GMT; (c) a done run dated 10-13 (London, 01:00) viewed from New York where it is still 10-12 | (a) Chain 3, but the S-11 test can't tell device-today from stored-offset-today (P2-4). The history labels drift a day if they're built with `new Date('YYYY-MM-DD')` (P2-3). (b) Stepping back 86 400 000 ms per day repeats 2026-10-25 and shows 13 distinct days. Spring-forward skips 2026-03-29 (P1-2). (c) The 10-13 run is after today: is it "the first ever done run"? Undefined (P1-1). |
| P-F first-time user, empty device | fresh context → `/app` | The ticket doesn't say whether the chain visual renders in the empty state. Hop I1 reads `chain-visual` `data-count="0"` and lowercase "plant", and the drafted text is "Plant your first tag" (P1-4). All 14 history days would be neutral, but is today `today-pending` or `neutral`? (P1-1). |
| P-L long-chain user (40 days) | `/app` | `data-count` 30 and text 40 are consistent with A14. 30 "✓" text nodes are read aloud one by one, and the hops' `data-count` now means "links", not "chain" (P2-2, P2-9). |
| P-S forgot-to-tap-out user | open run started 7 h ago, or dated in the future → `/app` | The run is abandoned, but the APP-006 message "Your last run wasn't tapped out, so it didn't count." never appears on `/app` (P1-7). Abandon and the chain/history read are not required to share one transaction and one `now` (P2-1). |
| P-B build engineer | implement `buildHistory`, at-risk, banner, empty state, replace `home.tsx` | Precedence of done / missed / today-pending / neutral is undefined for 4 cases (P1-1). Day enumeration is unspecified (P1-2). The placeholder's SW `SKIP_WAITING` effect and `store-error` view are not in "keep" and nothing tests the SW one (P1-8). The home view never refreshes "today" while it stays mounted past midnight (P2-6). |
| P-G Gate C test author (Playwright 1.57) | write AC-CHAIN-1…11 oracles | The prescribed `browser.newContext({ timezoneId, storageState: { indexedDB: true } })` does not type-check and drops `baseURL` and the device (P1-5). With no sanctioned fixture writer, AC-CHAIN-9 can be passed by a hand-written `localDay` (P1-6). "30 links" is read from a prop, not counted (P2-2). History labels can trip the rendered-text regex on some calendar dates (P2-3). |
| P-R regression (merged APP-SHELL + APP-TAP suites) | app_shell AC-SHELL-1B/11/16, journey_app_offline AC-SHELL-7, journey_app_run `expectChainAfterReload` | `chain-value`, `ready-offline` and `nav-tags` are declared or kept. `store-error` (AC-SHELL-16) and the `SKIP_WAITING` effect (M-9) are not (P1-8). AC-SHELL-11 runs at the real date, so a date-dependent label could fail it on some weekdays (P2-3). APP-TAP seeds stale runs only after `openApp` has mounted home, so render-time abandon doesn't disturb them, provided the abandon is a single transaction at mount (P2-1). |

## Stipulation fold-in check (verdict §7 APP-CHAIN 1–3)
| # | Stipulation | Folded? | Gap → finding |
|---|---|---|---|
| 1 | S-11 (= T10): today = device's current local date at render; TZ scenario at fixed `2026-10-12T15:00:00+01:00`, new context `America/New_York` + `storageState({indexedDB:true})` → 3; DST Europe/London `localDay` 2026-10-24/25/26 at 2026-10-26T12:00 → 3 | Yes (Rules line 15, AC-CHAIN-7/8) | The harness as written is infeasible (P1-5). The DST clock has no offset, and the TZ fixture can't fail an implementation that uses the stored offset for "today" (P2-4). |
| 2 | T12 part: ChainVisual capped at the last 30 links plus a numeric count; days before the first ever done run render neutral (PL-16) | Partial | The cap is folded (line 17). PL-16 neutral vs `today-pending` precedence is undefined (P1-1). The cap overflows on a phone (P1-3). |
| 3 | M-3: rename away from `chainCount` or narrow INV-D3; app chain from `computeChain`, not `CHAIN.*` | Yes (rename route; line 16, AC-CHAIN-11) | The new `APP-CHAIN-SOURCE` rule has no pattern or scope. A naive `\bCHAIN\.` already matches merged lib/app/tap.ts:27 ("Shared with APP-CHAIN.") (P2-7). |
| — | M-2 (T12 bundle) items assigned to APP-CHAIN | Cap only, covered by row 2 | — |

## Hop coverage check (pinned I1, I13, A13, A14; shared-contract S3, S7; plus S8.3, which the 2026-10-14 amendment assigns to APP-CHAIN)
| Hop | Criterion | Re-read oracle in ticket? | Gap |
|---|---|---|---|
| I1 | AC-CHAIN-6 | partial | Missing: "after reload", `chain-visual` `data-count="0"`, `T` length 0, and lowercase "plant" (case-sensitive `toContainText`) (P1-4) |
| I13 | AC-CHAIN-5 | partial | Boundary (exactly T0 − 6 h) not named. "chain unchanged" has no non-zero baseline (P1-9) |
| A13 | AC-CHAIN-1, 7, 8, 9 | partial | 23:55 can be satisfied by a hand-written `localDay` (P1-6). The TZ harness is infeasible (P1-5). The DST clock is offset-less (P2-4) |
| A14 | AC-CHAIN-2 | partial | "rendered links = 30" is read from the `data-count` prop, not by counting links. There is no phone-width check (P1-3, P2-2) |
| S3 | AC-CHAIN-1 | yes | `__runtagStore.computeChain` and `localDayOf` are already exposed (Shell.tsx:19-20,36). `tap-helpers.ts` `chainInPage` is reusable |
| S7 | AC-CHAIN-10 | yes | Reuse the journey_app_offline.spec.ts:28-53 audit, including the converse ("iff") half |
| S8.3 | AC-CHAIN-5 | partial, not pinned in header | Needs `startedAt = now − 7 h`, `abandonedAt === now`, all other fields unchanged, no banner (P1-9) |
| 2026-10-14 harness rules | Journey section | partial | `setFixedTime` is stated, but `test.use({ timezoneId: 'Europe/London' })` is not. The rules stop at fixtures and clock, and "in-page recomputation" isn't tied to `chainInPage` (P1-5, P1-6) |

---

## Pre-flight Findings

### CRITICAL
None. Every gap below is either a definition hole or a test-feasibility gap. None loses or miscounts a stored run, because `computeChain` and `abandonStaleIn` are merged and correct.

### P1

#### P1-1 — History precedence is undefined for four reachable cases
- **What breaks:** Rules line 18 lists four states with no precedence. Two engineers will disagree on:
  1. **No done run ever** (P-F, or tags but only "Just save"). Every day is "before the first ever done run", so is today `neutral` or `today-pending`?
  2. **Today is the first done day.** Days −13…−1 are neutral either way. Is today `done`? (Yes, but say so.)
  3. **Done runs dated after today** (P-T(c): London run stored `2026-10-13`, viewed in New York on 10-12; or a manual clock change). If the "first ever done run" is computed as the min over all done runs, the result is fine. If it's computed over the window, or as "the first done run seen", every in-window day before 10-13 is neutral, so a real missed day shows as neutral.
  4. **A day with only an abandoned or open run.** Missed or pending? (`computeChain` counts only `done`: chain.ts:30-31.)
- **AC/step:** Rules line 18; AC-CHAIN-3; verdict §7 APP-CHAIN 2 (PL-16).
- **Evidence:** APP-CHAIN.md:18,29. lib/app/chain.ts:30-39. PRDs/runtag-app-persona-lens.md:124.
- **Ticket edit:** replace the History rule (line 18) with:
  > **History** (`buildHistory(runs, today)` in lib/app/history.ts, pure): the 14 days `today−13 … today`, oldest → newest. Let `first` = the minimum `localDay` over runs with `status:'done'` and `localDay ≤ today` (undefined if none). For each day `d`: `done` iff some `done` run has `localDay === d`; otherwise, if `d === today`, `today-pending`; otherwise, if `first` is undefined or `d < first`, `neutral`; otherwise `missed`. Open and abandoned runs never make a day `done`. Done runs with `localDay > today` are ignored. Today is never `neutral` or `missed`.

  Add to AC-CHAIN-3 fixtures and expected arrays: (a) no runs → 13 × `neutral` + `today-pending`. (b) First done run on day −2, nothing on −1 → `…neutral, done, missed, today-pending`. (c) A done run at today+1 only → 13 × `neutral` + `today-pending`. (d) Day −1 has only an abandoned run, and day −3 is done → day −1 `missed`.

#### P1-2 — Day enumeration across DST repeats or skips a calendar day
- **What breaks:** The natural implementation is `localDayOf(now − i * 86_400_000)` for i = 0…13. In `Europe/London` at `2026-10-25T23:30:00Z` it yields `…2026-10-24, 2026-10-25, 2026-10-25`: 13 distinct days, with 10-25 duplicated. At `2026-03-29T23:30:00Z` it skips `2026-03-29`. (Verified with `TZ=Europe/London node`.) AC-CHAIN-8's 12:00 clock and AC-CHAIN-3's unpinned fixtures cannot catch this. `previousDay` (UTC calendar arithmetic, chain.ts:23-27) is DST-safe and is already in `reads`, but nothing requires it.
- **AC/step:** Rules line 18; AC-CHAIN-3, AC-CHAIN-8; persona P-T(b).
- **Evidence:** lib/app/chain.ts:8-12 (`localDayOf` uses device zone), :23-27 (`previousDay` in UTC). APP-CHAIN.md:18,34.
- **Ticket edit:** append to the History rule:
  > Days are enumerated only by repeated `previousDay(today)`, never by subtracting milliseconds from `now`.

  Add AC-CHAIN-3 fixture (e): "`timezoneId:'Europe/London'`, `setFixedTime('2026-10-25T23:30:00Z')` → 14 `history-day` elements whose `data-day` values are 14 distinct consecutive dates ending `2026-10-25`."

#### P1-3 — The capped chain visual overflows a phone screen from 9 links up
- **What breaks:** `.chain-visual` is `flex gap-2 items-center justify-center`, with no wrap, and each `.chain-day` is `w-10 h-10` (40 px). The width is `n·40 + (n−1)·8`, so 9 links are 424 px wide against the `mobile` project's iPhone 13 390 px viewport. At the 30-link cap the row is 1432 px. With `justify-center`, the overflow is split, so the left links are clipped and can't be reached by scrolling, and the page gains horizontal scroll. Nothing in the app shell constrains it, because `.app-shell` and `.app-home` have no CSS. A14's "rendered links = 30" passes while the visual is broken on the primary device. `ChainVisual` takes a `className` that is appended to `chain-visual`, so wrapping needs no change to the demo component (which `tests/invariants/invariants.spec.ts:55` also asserts).
- **AC/step:** Rules line 17; AC-CHAIN-2 (A14); APP-015 (WCAG reflow, 1.4.10).
- **Evidence:** app/globals.css:75-81. components/ChainVisual.tsx:11-15. playwright.config.ts:20-22 (`devices['iPhone 13']`). `grep app-shell\|app-home app/globals.css` → none.
- **Ticket edit:** replace the Chain visual rule (line 17) with:
  > **Chain visual**: `<ChainVisual count={Math.min(chain, 30)} className="flex-wrap" />` (default `highlightLast={false}`; no change to components/ChainVisual.tsx, which the demo shares). `chain-value` text is the full chain. Long chains never render more than 30 links, and the view never scrolls horizontally.

  Replace the AC-CHAIN-2 oracle with:
  > after reload: `[data-testid=chain-visual] [data-testid^=chain-day-]` count = 30, `chain-visual` `data-count` = `"30"`, `chain-value` = `"40"`. In both projects, `document.documentElement.scrollWidth ≤ window.innerWidth`.

#### P1-4 — The empty state doesn't satisfy hop I1 as drafted
- **What breaks:** I1 expects, after reload on a fresh context: `chain-visual` `data-count` = `"0"`, `M.schemaVersion` = 1, `T` length 0, and empty-state text containing **"plant"**. The ticket (line 21, AC-CHAIN-6):
  - doesn't say the chain visual still renders in the empty state. An engineer who swaps the chain block for the empty card removes `chain-visual`, and I1 fails.
  - gives only "Plant your first tag". Capital-P "Plant" does not satisfy a case-sensitive `toContainText('plant')`.
  - omits "after reload" and `T` length 0.
  - doesn't say how the `/app/tags` link navigates. APP-SHELL-NAV forbids `next/link`, so the link needs `shellNavigate`.
- **AC/step:** Rules line 21; AC-CHAIN-6 (I1).
- **Evidence:** PRDs/runtag-app-hops.md:9,25. APP-CHAIN.md:21,32. docs/contracts/feature_app.yml:19-30. components/app/AppNav.tsx:14-22 (the in-shell link pattern). ChainVisual.tsx:12-15 (count 0 renders an empty `chain-visual` with `data-count="0"`).
- **Ticket edit:** replace the Empty state rule with:
  > **Empty state** (`data-testid="empty-state"`): no tags and no runs. It renders in addition to the chain block (`chain-value` 0, `ChainVisual count={0}`) and the history. The copy is: heading "Plant your first tag", then "Stick a tag where you start running, then plant it here." A link "Plant a tag" (`data-testid="empty-plant-link"`, `href="/app/tags"`) navigates with `shellNavigate` like AppNav.

  Replace the AC-CHAIN-6 oracle with:
  > fresh context, `/app`, reload: `chain-value` = `"0"`; `chain-visual` `data-count` = `"0"`; `empty-state` contains `plant`; `listTags()` length 0; `getMeta().schemaVersion` = 1. Click `empty-plant-link` → `data-view` = `tags`, and the URL path is `/app/tags`.

#### P1-5 — The prescribed TZ-travel harness doesn't compile, and as an ad-hoc context it loses `baseURL` and the device
- **What breaks:** The Journey section prescribes `browser.newContext({ timezoneId, storageState: { indexedDB: true } })`. In Playwright 1.57, `indexedDB: true` is an option of **`browserContext.storageState()`**, the export. `newContext`'s `storageState` is a path or a `{ cookies, origins }` object with `cookies` required, so the literal is a type error. Restore works: `setStorageState` re-creates DB `runtag` at its recorded version with keyPath and the `status` and `localDay` indexes. But it needs the exported object. A manual `browser.newContext` also doesn't inherit the project `use` (`baseURL`, `devices['iPhone 13']`), so `goto('/app')` throws "invalid URL" and the `mobile` project silently runs as desktop. The new context's clock is also unset.
- **AC/step:** Journey line 63; AC-CHAIN-7 (A13 TZ, S-11).
- **Evidence:** node_modules/playwright-core/types/types.d.ts:9291-9298 (`storageState(options?: { indexedDB?: boolean; path? })`), :10055-10060 (`newContext` `storageState?: string | { cookies: …; origins: … }`). lib/server/browserContext.js:454-498 (collect), :499-545 (restore through `script.restore`). generated/storageScriptSource.js (`restore` re-creates stores and indexes at `dbInfo.version`). playwright.config.ts:11-12,16-24.
- **Ticket edit:** replace the zone clause of the Journey paragraph with:
  > Journeys use `test.use({ timezoneId: 'Europe/London' })`. AC-CHAIN-7: seed in the test's own context, then `const state = await context.storageState({ indexedDB: true })` and `const ny = await browser.newContext({ ...testInfo.project.use, baseURL: testInfo.project.use.baseURL, timezoneId: 'America/New_York', storageState: state })`. In the new page, call `page.clock.setFixedTime(…)` **before** `goto('/app')`, then reload and re-read. Precondition: `listRuns()` in the new context deep-equals the seeded rows (this proves the transfer and stops the check passing on an empty DB).

#### P1-6 — No sanctioned fixture writer, so AC-CHAIN-9 can pass by construction
- **What breaks:** "Fixtures are written through the real store functions … never by raw IndexedDB writes." No exposed function writes a `done` run with a chosen `localDay`. The merged harness `seedRun` does `withTxn` + `req(s.runs.put(row))` with a hand-built row (tap-helpers.ts:44-47), which is arguably a raw write. If AC-CHAIN-9 is seeded that way with `localDay: '<start day>'`, the test only reads back its own fixture. "Counts for the day it started" would hold even if tap-out overwrote `localDay`. The 40-day and 14-day fixtures legitimately need hand-built rows.
- **AC/step:** Journey line 63; AC-CHAIN-9 (A13 23:55); PRD §5 "Late-night run".
- **Evidence:** tests/e2e/tap-helpers.ts:44-47,74-79. components/app/Shell.tsx:19-23,36 (exposed: `withTxn`, `req`, `listRuns`, `listTags`, `getMeta`, `startRunIfNoneOpen(In)`, `computeChain`, `localDayOf`, `tapAtTag`, `undoTap`). lib/app/tap.ts:55-68.
- **Ticket edit:** replace the fixture sentence with:
  > Fixtures: static history and chain rows are written with `seedRun`/`seedTag` from tests/e2e/tap-helpers.ts (the exposed `withTxn` + `req` inside one transaction), and every seeded row sets `localDay` explicitly. **AC-CHAIN-9 and one AC-CHAIN-1 fixture are produced by the app**: `seedTag(A, createdAt = T−1 h)`, then `setFixedTime('2026-10-11T23:55:00+01:00')` + `__runtagStore.tapAtTag(A, Date.now())`, then `setFixedTime('2026-10-12T00:20:00+01:00')` + `tapAtTag(A, Date.now())`. The oracle is the row `{status:'done', localDay:'2026-10-11'}`. At clock 2026-10-12T09:00+01:00: `history-day[data-day="2026-10-11"]` is `done`, `[data-day="2026-10-12"]` is `today-pending`, `at-risk` is present, and `chain-value` = `"1"`.

#### P1-7 — The APP-006 message is dropped on `/app` render
- **What breaks:** APP-006 is a MUST: "becomes abandoned … on the next tap *or* whenever `/app` renders. Message: 'Your last run wasn't tapped out, so it didn't count.'" The ticket abandons on render but says only "Stale runs never show and never count". P-S opens `/app` and their run silently disappears. APP-TAP already shows this text (`stale-notice`) derived from the database (`0 ≤ now − abandonedAt < 60 000`), so it survives reload.
- **AC/step:** Rules line 20; AC-CHAIN-5; PRD APP-006, §5 "Forgotten tap-out".
- **Evidence:** PRDs/runtag-app-prd.md:40. components/app/views/tapped.tsx:35-38. docs/specs/app/APP-TAP.md:93,169 (`stale-notice` is an APP-TAP write).
- **Ticket edit:** add to the Open run banner rule:
  > When some run has `0 ≤ now − abandonedAt < 60_000` (the same derivation as APP-TAP), home shows `<p data-testid="stale-notice">Your last run wasn't tapped out, so it didn't count.</p>`. That covers runs abandoned by this render or by a tap within the last minute.

  Add to the AC-CHAIN-5 oracle: "`stale-notice` visible after the render that abandoned the run and after one reload at the same clock; absent after `setFixedTime(+61 s)` + reload." Add `stale-notice` to `writes` (writer × writer seam with APP-TAP).

#### P1-8 — Replacing `home.tsx` can drop two merged APP-SHELL behaviours, and one of them is untested
- **What breaks:** The placeholder home does more than render a chain:
  1. It posts `SKIP_WAITING` to a waiting service worker and reloads once on `controllerchange`. This is the only activation path for a new deploy (M-9; the APP-SW-UPDATE contract says "skipWaiting only on a SKIP_WAITING message from the idle home view").
  2. It renders `store-error` when the store can't open.

  The ticket's "keep" list names only `<ReadyOffline/>` and the nav. AC-SHELL-16 would catch the loss of `store-error` (app_shell.spec.ts:115-133). **No test reads `home.tsx` for `SKIP_WAITING`.** app_logic.spec.ts:86-91 and AC-SHELL-8 check only the SW side. If the home effect is dropped, every user stays on the old cached build forever, and the suite stays green.
- **AC/step:** Scope "In scope" line 10; regression of AC-SHELL-8 / M-9 and AC-SHELL-16.
- **Evidence:** components/app/views/home.tsx:14-23 (effect, `SKIP_WAITING` at :23), :31-33 (`store-error`), :38-39. docs/contracts/feature_app.yml:82-89. tests/e2e/app_logic.spec.ts:86-91. docs/specs/app/APP-SHELL.md:64.
- **Ticket edit:** replace the end of the In-scope line with:
  > …keep, unchanged: `<ReadyOffline/>`, `<AppNav/>`, the `store-error` view (`StoreError.kind` text), and the mount effect that posts `{type:'SKIP_WAITING'}` to `reg.waiting` and reloads once on `controllerchange`.

  Add a new criterion, named AC-CHAIN-12 in the table: "static: components/app/views/home.tsx matches `/postMessage\(\{\s*type:\s*'SKIP_WAITING'\s*\}\)/` and `/controllerchange/`; runtime: AC-SHELL-16 green unmodified". Add `tests/e2e/app_logic.spec.ts` to `files`.

#### P1-9 — The hop header omits S8, and AC-CHAIN-5 is weaker than I13 and S8.3
- **What breaks:** The 2026-10-14 amendment assigns **S8.3** to APP-CHAIN (AC-CHAIN-5): stale run R9 with `startedAt = now − 7 h`; after reload `R9.status = 'abandoned'`, `abandonedAt` set, `chain-value` unchanged, and no banner for R9. I13 pins the **boundary**, `startedAt = T0 − 6 h`. The ticket header doesn't list S8. AC-CHAIN-5's "chain unchanged" has no stated baseline, so with an empty history it is 0 → 0 and can't detect a stale run that was miscounted on a past day. "Future `startedAt`" has no fixture.
- **AC/step:** header line 5; AC-CHAIN-5.
- **Evidence:** PRDs/runtag-app-hops.md:37,175-180. lib/app/tap.ts:23,29-38 (`abandonedAt: now`, other fields spread unchanged).
- **Ticket edit:** change the header to "Pinned hops: I1, I13, A13, A14; shared-contract hops S3, S7, S8.3 (PRDs/runtag-app-hops.md, amendment 2026-10-14)". Replace AC-CHAIN-5 with:
  > Seed done runs on days −2 and −1 (chain 2), then one of three open runs: R6 `startedAt = now − 6 h` exactly; R9 `now − 7 h` with `localDay` = yesterday; RF `now + 3 h`. Open `/app` and reload. Each stale row deep-equals `{...seeded, status:'abandoned', abandonedAt: now}`, `chain-value` = `"2"`, `open-run-banner` count 0. A fresh run with `startedAt = now − 5 h` stays `open` and shows `open-run-banner` with "Run in progress — tap your tag to finish" (I13, S8.3).

### P2

#### P2-1 — Abandon and read must share one transaction and one `now`
- **What breaks:** "abandonStaleIn … runs in one readwrite transaction first" doesn't say the chain, history, banner and empty-state reads happen in that **same** transaction with the **same** `now`. A separate `listRuns()` before the abandon commits renders a stale run as the banner. Two `Date.now()` calls straddling midnight give a "today" that disagrees with the abandon `now`. The single-transaction-at-mount shape is also what keeps the APP-TAP suite safe: `openApp` mounts home and then seeds stale and future runs, and readwrite transactions serialize in creation order (journey_app_run.spec.ts:127-151).
- **Evidence:** lib/app/store.ts:85-117. lib/app/tap.ts:29. tests/e2e/tap-helpers.ts:31-35.
- **Ticket edit:** "On mount, home captures `now = Date.now()` once and calls `withTxn('readwrite', async s => { await abandonStaleIn(s, now); return { runs: getAll(runs), tags: getAll(tags) } })`. Everything rendered derives from that result and `today = localDayOf(now)`. Home starts no other store transaction. A rejected transaction renders the existing `store-error` view."

#### P2-2 — `data-count` changes meaning from "chain" to "links"; assert both
- **What breaks:** The hops read the chain as `chain-visual` `data-count` (I1, I8, I11, I13, L2, L4–L6, L9). The APP-TAP harness reads `chain-value` text (tap-helpers.ts:86). With the cap, they diverge above 30. A14's "rendered links" counts elements, not the prop.
- **Ticket edit:** in Rules: "`chain-visual` `data-count` = `min(chain, 30)` (links rendered); `chain-value` text = `String(chain)`." AC-CHAIN-1 oracle: "after reload, `chain-value` = in-page `computeChain(listRuns(), localDayOf(Date.now()))` (`chainInPage`) **and** `data-count` = `min` of that and 30."

#### P2-3 — History labels: date-dependent regex false positives, and an off-by-one in western zones
- **What breaks:** (a) The rendered-text duration regex is applied to the lowercased `innerText` and includes the bare unit `s`. A label that puts a day number next to a single-letter weekday initial (`17` then `S` on its own line) yields `17\ns`, which matches `\b\d+\s?(…|s|…)\b`. AC-SHELL-11 renders `/app` at the **real** date, so it would fail on some weekdays only. (b) Formatting `new Date('2026-10-12')` parses UTC midnight, which renders "Sun, Oct 11" in `America/New_York` (verified). `data-day` stays right, so no oracle sees the wrong label.
- **Evidence:** tests/e2e/app_shell.spec.ts:191-199. tests/e2e/tap-helpers.ts:96-97.
- **Ticket edit:** "Each `history-day` shows a weekday abbreviation from `Intl.DateTimeFormat(undefined, { weekday: 'short', timeZone: 'UTC' })` applied to `Date.UTC(y, m−1, d)` parsed from `data-day`. It never shows single-letter initials or a bare day number. Its accessible name is `aria-label="{weekday long} {day} {month long}: {state text}"` with state text Ran / Missed / Not yet / (empty for neutral). AC-CHAIN-7 also asserts that the newest `history-day` `aria-label` starts with `Monday 12 October` in New York."

#### P2-4 — The TZ fixture can't fail a stored-offset "today", and the DST clock is offset-less
- **What breaks:** At 15:00 London (10:00 New York) both zones share the date. An implementation computing today as `localDayOf(now, lastRun.tzOffsetMin)` passes AC-CHAIN-7, so S-11's "device's current local date" is unproven. The chain alone can't discriminate either: at a time when the dates differ, the yesterday rule gives 3 in both cases. Separately, AC-CHAIN-8's `2026-10-26T12:00` has no offset, so `new Date()` in the Node runner resolves it in the runner's zone.
- **Ticket edit:** AC-CHAIN-8 clock = `2026-10-26T12:00:00Z`. Add to AC-CHAIN-7: "second clock in the New York context, `2026-10-12T21:30:00-04:00` (already 10-13 in London): newest `history-day` `data-day` = `2026-10-12` and state `done`, `chain-value` = `"3"`, `at-risk` absent."

#### P2-5 — At-risk copy and oracle
- **What breaks:** No copy is given. The obvious "Run in the next 3 hours" violates APP-008. "present/absent for both fixtures" names no fixtures and is presence-only, which the hops' assertion bar rejects.
- **Ticket edit:** "At risk (`data-testid="at-risk"`): 'Run today to keep your chain.' AC-CHAIN-4 fixtures, re-read after reload: done −1 only → present; done −1 and today → absent; done −2 only → absent (chain 0); no runs → absent. An open run today doesn't hide it."

#### P2-6 — "Today" goes stale on a mounted home view
- **What breaks:** "today at render" is evaluated once. P-D leaves `/app` open at 23:50, and iOS resumes the same document the next morning. The view shows yesterday's at-risk state and history until a navigation.
- **Ticket edit:** "Home re-runs its load (P2-1) on `visibilitychange` to `visible` when `localDayOf(Date.now())` differs from the rendered `today`." (Untested in automation; manual check in the APP-LINK device list.)

#### P2-7 — `APP-CHAIN-SOURCE` needs an exact pattern and an app-only scope
- **What breaks:** The rule is named but not defined. The contract test scans raw file content, comments included. A naive `/\bCHAIN\./` matches merged lib/app/tap.ts:27 "…Shared with APP-CHAIN.", because `-` is a word boundary. A scope that includes `hooks/**` or `app/page.tsx` hits the demo's legitimate `chainCount` and `CHAIN.initial`. `llm_may_modify_non_negotiables: false`, so @hulupeep adds the rule.
- **Evidence:** lib/app/tap.ts:27. hooks/useDemoState.ts:8,17. app/page.tsx:27. tests/contracts/contract-enforcement.test.js:40-51. docs/contracts/feature_app.yml:12-15. feature_demo.yml:39-47.
- **Ticket edit:** "APP-CHAIN-SOURCE (non_negotiable, added by @hulupeep): scope `components/app/**/*.{ts,tsx}`, `lib/app/**/*.ts`; forbidden `/(?<![\w-])CHAIN\.(initial|afterRun)\b/` ('demo chain constants') and `/\bchainCount\b/` ('INV-D3 collision, M-3'); example_violation `const chainCount = CHAIN.initial`. INV-D3 is left unchanged."

#### P2-8 — Seam declarations
- **What breaks:** `chain-visual` (ChainVisual.tsx:15), `chain-value` (home.tsx:35) and `/app` already resolve before any APP-CHAIN code exists, so `seams-check` can't fail on them. Reads omit what the view actually consumes: `listTags` and `tags` for the empty state, `runs`, `StoreError` / `store-error`, `AppNav` / `nav-tags`, `shellNavigate`, `ReadyOffline`. Writes omit `stale-notice` (P1-7) and `empty-plant-link` (P1-4). evidence/seams-app-chain.json mirrors the ticket.
- **Ticket edit:** writes add `stale-notice`, `empty-plant-link`. reads add `runs`, `tags`, `StoreError`, `store-error`, `shellNavigate`, `AppNav`, `nav-tags`, `ReadyOffline`, `isStale`. Note: "`/app`, `chain-value`, `chain-visual` resolve pre-build (vacuous); covered by `history-day` and `open-run-banner`." Files add `tests/e2e/app_logic.spec.ts`. Regenerate evidence/seams-app-chain.json from the edited lists.

#### P2-9 — Accessibility of the chain visual and history
- **What breaks:** Each link renders a literal "✓" with no role or label, so a 30-link chain is announced as 30 "check mark"s, and the number is only in `chain-value`. History states that differ only by colour fail WCAG 1.4.1. `highlightLast` would add a spring animation that is pointless on a static home view.
- **Ticket edit:** "The ChainVisual wrapper is `aria-hidden="true"`. `chain-value` sits in `<p>` 'Chain <strong>{n}</strong> days' as the accessible statement. Each `history-day` carries its state in text or `aria-label` (P2-3), not colour alone. `highlightLast` stays false."

---

## Regression notes (no ticket edit needed beyond P1-8, P2-1)
- `chain-value` (APP-TAP `expectChainAfterReload`, tap-helpers.ts:82-88), `ready-offline` (journey_app_offline.spec.ts:14,47,52; journey_app_run.spec.ts:539), `nav-tags` (app_shell.spec.ts:40; journey_app_offline.spec.ts:77) and `data-view="home"` all survive if the In-scope edit in P1-8 is applied.
- `/app?tapped=` and `/app?grace=` stay with APP-TAP's TappedView (lib/app/route.ts:35-46), so APP-CHAIN must not render them. Seam G1 is unaffected.
- APP-DURABLE expects the `backup-status` slot (APP-DURABLE.md:3). APP-TAGS needs no home hook beyond the `/app/tags` link (P1-4).
