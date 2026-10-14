# APP-CHAIN: chain home and 14-day history at `/app`

**Epic:** RunTag App v1 (PRDs/runtag-app-prd.md @ f6c230c7…) · **Wave:** W2 · **Priority:** P0 · **Depends on:** APP-SHELL #26 (merged, live), APP-TAP #27 (merged, live: `abandonStaleIn`, `isStale`, `stale-notice`)
**Persona:** owner-runner (iPhone 13 class, 390 px wide) · **Promise:** "Open the app and see one number that matters, and the days behind it."
**Gate A:** SHIP_WITH_STIPULATIONS — verdict §7 APP-CHAIN items 1–3 (S-11, T12, M-3) folded. **B.5:** docs/specs/app/APP-CHAIN-preflight.md — P1-1…P1-9, P2-1…P2-9 folded (v2).
**Pinned hops:** I1, I13, A13, A14; shared-contract hops S3, S7, S8.3 (PRDs/runtag-app-hops.md, amendment 2026-10-14).
**Covers:** APP-006 (on `/app` render), APP-007, APP-008, APP-009

## Scope
### In scope
Replace the APP-SHELL placeholder home view (`components/app/views/home.tsx`) with the real chain home: chain number, capped chain visual, 14-day history, at-risk state, open-run banner and stale notice (with stale abandon on render), empty state, an empty `backup-status` slot. Keep, unchanged: `<ReadyOffline/>`, `<AppNav/>`, the `store-error` view (`StoreError.kind` text), and the mount effect that posts `{type:'SKIP_WAITING'}` to `reg.waiting` and reloads once on `controllerchange` (P1-8).
### Not in scope
Tap logic and `/app?tapped=` / `/app?grace=` views (APP-TAP #27, unchanged), backup status/nudge content (APP-DURABLE #18 — this ticket renders the empty `backup-status` slot only), tag management (APP-TAGS #17).

## Rules
- **Load (P2-1):** on mount, home captures `now = Date.now()` once and calls `withTxn('readwrite', async s => { await abandonStaleIn(s, now); return { runs: getAll(runs), tags: getAll(tags) } })`. Everything rendered derives from that one result and `today = localDayOf(now)` (the device's current local date — S-11). Home starts no other store transaction. A rejected transaction renders the existing `store-error` view.
- **Day change (P2-6):** home re-runs the load on `visibilitychange` to `visible` when `localDayOf(Date.now())` differs from the rendered `today` (manual check in the APP-LINK device list).
- **Chain:** `chain = computeChain(runs, today)` from APP-SHELL; never `CHAIN.*` demo constants; no app identifier named `chainCount` (M-3, INV-D3). `chain-value` text = `String(chain)`, inside `<p>Chain <strong data-testid="chain-value">{chain}</strong> days</p>` as the accessible statement (P2-9).
- **Chain visual (T12, P1-3, P2-2):** `<ChainVisual count={Math.min(chain, 30)} className="flex-wrap" />` inside a wrapper with `aria-hidden="true"` (default `highlightLast={false}`; no change to components/ChainVisual.tsx, which the demo shares). `chain-visual` `data-count` = `min(chain, 30)` (links rendered). Long chains never render more than 30 links, and the view never scrolls horizontally.
- **History (P1-1, P1-2):** `buildHistory(runs, today)` in `lib/app/history.ts` (pure) returns the 14 days `today−13 … today`, oldest → newest. Days are enumerated only by repeated `previousDay(today)`, never by subtracting milliseconds from `now`. Let `first` = the minimum `localDay` over runs with `status:'done'` and `localDay ≤ today` (undefined if none). For each day `d`: `done` iff some `done` run has `localDay === d`; otherwise, if `d === today`, `today-pending`; otherwise, if `first` is undefined or `d < first`, `neutral`; otherwise `missed`. Open and abandoned runs never make a day `done`. Done runs with `localDay > today` are ignored. Today is never `neutral` or `missed`.
- **History labels (P2-3, P2-9):** each `history-day` (`data-day`, `data-state`) shows a weekday abbreviation from `Intl.DateTimeFormat(undefined, { weekday: 'short', timeZone: 'UTC' })` applied to `Date.UTC(y, m−1, d)` parsed from `data-day`; it never shows single-letter initials or a bare day number. Its accessible name is `aria-label="{weekday long} {day} {month long}: {state text}"` (same formatter, `timeZone: 'UTC'`), state text Ran / Missed / Not yet / empty for neutral; states are distinguished by text/label and shape, not colour alone.
- **At risk (P2-5):** `data-testid="at-risk"` with "Run today to keep your chain." iff yesterday's history state is `done` and today has no done run. An open run today does not hide it.
- **Open run banner:** after the load, a remaining open run shows `data-testid="open-run-banner"` "Run in progress — tap your tag to finish". Stale runs never show and never count (APP-006).
- **Stale notice (P1-7):** when some run has `0 ≤ now − abandonedAt < 60_000` (the APP-TAP derivation), home shows `<p data-testid="stale-notice">Your last run wasn't tapped out, so it didn't count.</p>` — covers runs abandoned by this render or by a tap within the last minute.
- **Empty state (P1-4):** `data-testid="empty-state"` when there are no tags and no runs. It renders in addition to the chain block (`chain-value` 0, `ChainVisual count={0}`) and the history. Copy: heading "Plant your first tag", then "Stick a tag where you start running, then plant it here." A link "Plant a tag" (`data-testid="empty-plant-link"`, `href="/app/tags"`) navigates with `shellNavigate` like AppNav.
- **Backup slot:** an empty `<div data-testid="backup-status" />` for APP-DURABLE.
- No metrics, clock times or durations in rendered text (APP-008).

## Contract (P2-7)
`docs/contracts/feature_app.yml` gains rule **APP-CHAIN-SOURCE** (non_negotiable; additive, no existing rule changed): scope `components/app/**/*.{ts,tsx}`, `lib/app/**/*.ts`; forbidden `/(?<![\w-])CHAIN\.(initial|afterRun)\b/` ("demo chain constants") and `/\bchainCount\b/` ("INV-D3 collision, M-3"); example_violation `const chainCount = CHAIN.initial`. INV-D3 is left unchanged.

## Acceptance Criteria
| AC | Criterion | Oracle (re-read value) |
|---|---|---|
| AC-CHAIN-1 | Rendered chain equals `computeChain(listRuns(), localDayOf(Date.now()))`: 5 consecutive days incl. today → 5; days −3, −2, today (not −1) → 1; days −2, −1 (not today) → 2 | after reload, `chain-value` = in-page `chainInPage` **and** `chain-visual` `data-count` = min(that, 30) (A13, S3, P2-2) |
| AC-CHAIN-2 | Chain of 40 renders exactly 30 links and the text 40, without horizontal scroll | after reload: `[data-testid=chain-visual] [data-testid^=chain-day-]` count = 30, `data-count` = `"30"`, `chain-value` = `"40"`; both projects `document.documentElement.scrollWidth ≤ window.innerWidth` (A14, P1-3) |
| AC-CHAIN-3 | History shows 14 days with the precedence rule | each `history-day` `data-day`/`data-state` re-read after reload vs expected arrays: (a) no runs → 13 × `neutral` + `today-pending`; (b) first done run on day −2, nothing on −1 → `…neutral, done, missed, today-pending`; (c) a done run at today+1 only → 13 × `neutral` + `today-pending`; (d) day −1 only an abandoned run, day −3 done → day −1 `missed`; (e) `Europe/London`, clock `2026-10-25T23:30:00Z` → 14 distinct consecutive `data-day` values ending `2026-10-25` (P1-1, P1-2) |
| AC-CHAIN-4 | At-risk iff yesterday done and today not | after reload: done −1 only → present with "Run today to keep your chain."; done −1 and today → absent; done −2 only → absent (chain 0); no runs → absent; done −1 plus an open run today → present (P2-5) |
| AC-CHAIN-5 | Stale abandon on render | seed done runs on −2 and −1 (chain 2), then separately each of R6 `startedAt = now − 6 h` exactly, R9 `now − 7 h` with `localDay` = yesterday, RF `now + 3 h`; open `/app`, reload: the stale row deep-equals `{...seeded, status:'abandoned', abandonedAt: now}`, `chain-value` = `"2"`, `open-run-banner` count 0; `stale-notice` visible after that render and after a reload at the same clock, absent after `setFixedTime(+61 s)` + reload. A fresh run `startedAt = now − 5 h` stays `open` and shows `open-run-banner` "Run in progress — tap your tag to finish" (I13, S8.3, P1-7, P1-9) |
| AC-CHAIN-6 | Empty state on a fresh device | fresh context, `/app`, reload: `chain-value` = `"0"`; `chain-visual` `data-count` = `"0"`; `empty-state` contains `plant`; `listTags()` length 0; `getMeta().schemaVersion` = 1; click `empty-plant-link` → `data-view` = `tags`, path `/app/tags` (I1, P1-4) |
| AC-CHAIN-7 | Time-zone travel keeps the chain | done runs on 2026-10-10/11/12 seeded in London at `2026-10-12T15:00:00+01:00`; export `context.storageState({ indexedDB: true })`; new context `{ ...testInfo.project.use, timezoneId: 'America/New_York', storageState }`; precondition `listRuns()` deep-equals the seeded rows; `setFixedTime` before `goto('/app')`, reload → `chain-value` = `"3"`, newest `history-day` `aria-label` starts with `Monday 12 October`; second clock `2026-10-12T21:30:00-04:00` (already 10-13 in London) → newest `data-day` `2026-10-12` state `done`, `chain-value` = `"3"`, `at-risk` absent (S-11, P1-5, P2-4) |
| AC-CHAIN-8 | DST | `timezoneId:'Europe/London'`, done runs with `localDay` 2026-10-24/25/26, clock `2026-10-26T12:00:00Z` → after reload `chain-value` = `"3"` (S-11, P2-4) |
| AC-CHAIN-9 | A run tapped in at 23:55 and out at 00:20 counts for the day it started — produced by the app | `seedTag(A, T−1 h)`; `setFixedTime('2026-10-11T23:55:00+01:00')` + `__runtagStore.tapAtTag(A, Date.now())`; `setFixedTime('2026-10-12T00:20:00+01:00')` + `tapAtTag(A, Date.now())`; row re-read `{status:'done', localDay:'2026-10-11'}`; at `2026-10-12T09:00:00+01:00` after reload: `history-day[data-day="2026-10-11"]` `done`, `[data-day="2026-10-12"]` `today-pending`, `at-risk` present, `chain-value` = `"1"` (A13, PRD §5, P1-6) |
| AC-CHAIN-10 | The home view still shows "Ready offline ✓" iff all precache entries are cached | the APP-SHELL cache audit both ways (journey_app_offline.spec.ts pattern) — chromium only (S7) |
| AC-CHAIN-11 | No metrics, clock times or durations in rendered text of `/app` for every fixture; app code uses no demo chain constants and no `chainCount` | rendered-text regexes (APP-SHELL metric check) on every fixture view of this ticket + contract `APP-CHAIN-SOURCE` |
| AC-CHAIN-12 | Home keeps the service-worker update path and the store error | static: components/app/views/home.tsx matches `/postMessage\(\{\s*type:\s*'SKIP_WAITING'\s*\}\)/` and `/controllerchange/` (tests/e2e/app_logic.spec.ts); runtime: the APP-SHELL newer-schema store-error test in tests/e2e/app_shell.spec.ts green unmodified (P1-8) |

## Gherkin (PRD §5 Chain)
```gherkin
Feature: Chain
  Scenario: Consecutive days
    Given done runs on the last 5 local days including today
    When I open "/app"
    Then the chain shows 5
    And no duration, pace, distance or clock time appears anywhere on the page

  Scenario: Missed day breaks chain
    Given done runs on days -3, -2 and today but not day -1
    Then the chain shows 1

  Scenario: Late-night run keeps its day
    Given a run tapped in at 23:55 and out at 00:20 the next day
    Then it counts for the day it started

  Scenario: Time-zone travel
    Given done runs stored with localDay for the last 3 days in London
    When the device zone changes to New York
    Then the chain still shows 3

  Scenario: Forgotten tap-out seen at home
    Given a run opened 7 hours ago is still open
    When I open "/app"
    Then the run is abandoned and the chain is unchanged
    And I see "Your last run wasn't tapped out, so it didn't count."
```

## Journey (Definition of Done)
J-APP-CHAIN (`tests/e2e/journey_app_chain.spec.ts`, contract `docs/contracts/journey_app_chain.yml`). Journeys use `test.use({ timezoneId: 'Europe/London' })` and time only via `page.clock.setFixedTime()` (2026-10-14 amendment). Fixtures: static history and chain rows are written with `seedRun`/`seedTag` from tests/e2e/tap-helpers.ts (the exposed `withTxn` + `req` inside one transaction), every seeded row sets `localDay` explicitly; AC-CHAIN-9 and one AC-CHAIN-1 fixture are produced by the app through `__runtagStore.tapAtTag` (P1-6). "In-page recomputation" is `chainInPage` from tap-helpers. AC-CHAIN-7 follows the storage-state transfer in its oracle (P1-5). Run against `npm run build && PW_PROD=1 npx playwright test`; AC-CHAIN-10 Chromium-only with a stated reason.

## Declarations (Gate B)
Surfaces are route literals, `data-testid` values and exported API identifiers as they appear in code. `/app`, `chain-value`, `chain-visual` resolve pre-build (vacuous); they are covered by `history-day` and `open-run-banner` (P2-8).
writes: [`/app`, `chain-value`, `chain-visual`, `history-day`, `at-risk`, `open-run-banner`, `stale-notice`, `empty-state`, `empty-plant-link`, `backup-status`, `ChainHome`, `buildHistory`]
reads: [`computeChain`, `localDayOf`, `previousDay`, `withTxn`, `abandonStaleIn`, `isStale`, `runs`, `tags`, `StoreError`, `store-error`, `shellNavigate`, `AppNav`, `nav-tags`, `ReadyOffline`, `ready-offline`, `ChainVisual`]
files: [`components/app/views/home.tsx`, `lib/app/history.ts`, `tests/e2e/journey_app_chain.spec.ts`, `tests/e2e/app_logic.spec.ts`, `docs/contracts/journey_app_chain.yml`, `docs/contracts/feature_app.yml`]
adrNone: "repo has no ADR folder"

Post-build (DoD): `bash evidence/seams-check.sh evidence/seams-app-chain.json` exits 0 on a clean tree; the epic graph is recomputed with `--no-resolve`.

## Definition of Done
- [ ] Every criterion in the Acceptance Criteria table asserted; `npm run test:contracts` + full Playwright (chromium + mobile) green on CI (Gate C)
- [ ] provenance record `evidence/provenance-<issue>.json` passes `scripts/provenance-gate.cjs` on the branch diff
- [ ] production code < 1000 hand-written lines (owner amendment 2026-10-13: tests and contracts excluded)
- [ ] `bash evidence/seams-check.sh evidence/seams-app-chain.json` exits 0 after build
