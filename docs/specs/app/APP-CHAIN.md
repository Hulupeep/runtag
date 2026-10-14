# APP-CHAIN: chain home and 14-day history at `/app`

**Epic:** RunTag App v1 (PRDs/runtag-app-prd.md @ f6c230c7…) · **Wave:** W2 · **Priority:** P0 · **Depends on:** APP-SHELL #26 (merged), APP-TAP #14 (`abandonStaleIn`)
**Persona:** owner-runner · **Promise:** "Open the app and see one number that matters, and the days behind it."
**Gate A:** SHIP_WITH_STIPULATIONS — verdict §7 APP-CHAIN items 1–3 (S-11, T12, M-3) folded below. Pinned hops: I1, I13, A13, A14 and shared-contract hops S3, S7 (PRDs/runtag-app-hops.md).
**Covers:** APP-006 (on `/app` render), APP-007, APP-009

## Scope
### In scope
Replace the APP-SHELL placeholder home view with the real chain home: chain number, capped chain visual, 14-day history, at-risk state, open-run banner (with stale abandon on render), empty state; keep `<ReadyOffline/>` and the in-shell nav.
### Not in scope
Tap logic (APP-TAP #14), backup status/nudge content (APP-DURABLE #18 — this ticket renders an empty `backup-status` slot), tag management (APP-TAGS #17).

## Rules
- **today** = `localDayOf(Date.now())` at render (device's current local date) (S-11).
- **chain** = `computeChain(runs, today)` from APP-SHELL; never `CHAIN.*` demo constants; no app identifier named `chainCount` (M-3, INV-D3).
- **Chain visual**: the existing demo `ChainVisual` with `count = min(chain, 30)`; the full value is shown separately as text (T12). Long chains never render more than 30 links.
- **History**: the last 14 local days, oldest → newest, each `done` (≥1 done run with that `localDay`), `missed`, `today-pending` (today with no done run yet) or `neutral` (any day before the first ever done run) (PL-16).
- **At risk**: yesterday is `done` and today has no done run.
- **Open run banner**: on render, `abandonStaleIn` (APP-TAP) runs in one readwrite transaction first; a remaining open run shows "Run in progress — tap your tag to finish". Stale runs never show and never count (APP-006).
- **Empty state**: no tags and no runs → "Plant your first tag" explanation with a link to `/app/tags`.
- No metrics, clock times or durations in rendered text (APP-008).

## Acceptance Criteria
| AC | Criterion | Oracle (re-read value) |
|---|---|---|
| AC-CHAIN-1 | Rendered chain value equals `computeChain(listRuns(), localDayOf(Date.now()))`: 5 consecutive days incl. today → 5; days −3, −2, today (not −1) → 1; days −2, −1 (not today) → 2 | `chain-value` text after reload vs in-page recomputation from stored rows (A13, S3) |
| AC-CHAIN-2 | Chain of 40 renders exactly 30 links and the text 40 | `chain-visual` `data-count` = 30; `chain-value` = 40 (A14) |
| AC-CHAIN-3 | History shows 14 days with states done / missed / today-pending / neutral; days before the first done run are neutral | each `history-day` `data-day` and `data-state` re-read vs stored `localDay` values |
| AC-CHAIN-4 | At-risk shown iff yesterday is done and today is not | `at-risk` present/absent for both fixtures |
| AC-CHAIN-5 | Stale open run (≥ 6 h or future `startedAt`) is abandoned on `/app` render and not counted; a fresh open run shows the banner | after reload: row `status:'abandoned'`, `abandonedAt` set, chain unchanged; `open-run-banner` visible for a fresh run (I13) |
| AC-CHAIN-6 | Empty state on a fresh device: chain 0, text contains "Plant your first tag", link to `/app/tags`; meta `schemaVersion` 1 | rendered values + `getMeta()` re-read (I1) |
| AC-CHAIN-7 | Time-zone travel: done runs stored in London on 3 consecutive days; reopened at fixed `2026-10-12T15:00:00+01:00` in a new context with `timezoneId:'America/New_York'` and the same IndexedDB → chain 3 | `chain-value` re-read (S-11) |
| AC-CHAIN-8 | DST: `timezoneId:'Europe/London'`, done runs with `localDay` 2026-10-24/25/26, clock 2026-10-26T12:00 → chain 3 | `chain-value` re-read (S-11) |
| AC-CHAIN-9 | A run tapped in at 23:55 and out at 00:20 counts for the day it started | stored `localDay` and history state re-read (PRD §5) |
| AC-CHAIN-10 | The home view still shows "Ready offline ✓" iff all precache entries are cached | `ready-offline` with the APP-SHELL cache audit (S7) — chromium only |
| AC-CHAIN-11 | No metrics, clock times or durations in rendered text of `/app` for every fixture; app code uses no `CHAIN.*` demo constants and no `chainCount` identifier | rendered-text regexes + contract `APP-CHAIN-SOURCE` |

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
```

## Journey (Definition of Done)
J-APP-CHAIN (`tests/e2e/journey_app_chain.spec.ts`, contract `docs/contracts/journey_app_chain.yml`). Fixtures are written through the real store functions exposed to automated browsers (`window.__runtagStore`), never by raw IndexedDB writes; time via `page.clock.setFixedTime()`; zones via `browser.newContext({ timezoneId, storageState: { indexedDB: true } })`.

## Declarations (Gate B)
writes: [`/app`, `chain-value`, `chain-visual`, `history-day`, `at-risk`, `open-run-banner`, `empty-state`, `backup-status`, `ChainHome`, `buildHistory`]
reads: [`computeChain`, `localDayOf`, `previousDay`, `withTxn`, `abandonStaleIn`, `ready-offline`, `ChainVisual`]
files: [`components/app/views/home.tsx`, `lib/app/history.ts`, `tests/e2e/journey_app_chain.spec.ts`, `docs/contracts/journey_app_chain.yml`, `docs/contracts/feature_app.yml`]
adrNone: "repo has no ADR folder"

Post-build (DoD): `bash evidence/seams-check.sh evidence/seams-app-chain.json` exits 0 on a clean tree; the epic graph is recomputed with `--no-resolve`.

## Definition of Done
- [ ] Every criterion in the Acceptance Criteria table asserted; `npm run test:contracts` + full Playwright (chromium + mobile) green on CI (Gate C)
- [ ] provenance record `evidence/provenance-<issue>.json` passes `scripts/provenance-gate.cjs` on the branch diff
- [ ] production code < 1000 hand-written lines (owner amendment 2026-10-13: tests and contracts excluded)
- [ ] `bash evidence/seams-check.sh evidence/seams-app-chain.json` exits 0 after build
