# APP-SHELL: app shell, on-device store, offline service worker

**Epic:** RunTag App v1 (PRDs/runtag-app-prd.md @ f6c230c7…) · **Wave:** W1 · **Priority:** P0 (blocks every other app ticket)
**Persona:** owner-runner on iPhone or Android · **Promise:** "Open `/app` once, and RunTag works at the trailhead even with no signal."
**Gate A:** SHIP_WITH_STIPULATIONS — verdict §7 APP-SHELL items 1–9 folded below.
**B.5 pre-flight:** docs/specs/app/APP-SHELL-preflight.md — C1–C3, P1-1…P1-8, P2-1…P2-14 folded below (v2).
**v3:** duo preparation review run 1791621592510-28c16ad0 round 1 — F-1 path-preserving redirects, F-2 transaction semantics, F-3 full S-10 coverage (no waiver), F-6 Gate B reconciliation. Sub-criterion IDs AC-1b/5b/6b/8b are the original v2 identifiers (an interim upper-casing was reverted).
**Covers:** APP-001, APP-008, APP-010, APP-011, APP-020, APP-102 (+ verdict S-3, S-5, S-7, S-8, S-9, S-10, S-14, T12, M-7, M-9)

## Scope
### In scope
- **One static client shell** at `app/(shell)/shell/page.tsx` (no props, statically prerendered — P2-4). `next.config.mjs` `rewrites`: `/app`, `/app/:path*`, `/t/:path*` → `/shell` (P2-5). The shell resolves its view with `useSyncExternalStore(subscribe, () => resolveRoute(location), () => null)` — server snapshot `null` renders a neutral frame, so hydration never mismatches (P1-1).
- **In-shell navigation:** `shellNavigate(path)` = `history.pushState` + a `runtag:navigate` event; `popstate` handled. `next/link`, `usePathname`, `useParams`, `useSearchParams` are forbidden inside `app/(shell)/**` and `components/app/**` (contract pattern) (P1-1, S-3).
- **Placeholder views** (one file each; later tickets replace them): `views/home.tsx` (chain number via `computeChain`, `<ReadyOffline/>`), `views/tags.tsx`, `views/settings.tsx`, `views/tap.tsx` (shows the parsed tag id), `views/tapped.tsx` (for `/app?tapped=`), `views/invalid-tag.tsx`, `views/not-found.tsx` (P1-2, P2-12).
- **Store** `lib/app/store.ts`, **pure logic** `lib/app/chain.ts`, **routing** `lib/app/route.ts`, **navigation** `lib/app/nav.ts`, **origin** `lib/app/origin.ts`.
- **Service worker:** `scripts/sw/sw.template.js` rendered by `scripts/sw/build-sw.mjs` as an npm `postbuild` step into `public/sw.js` (git-ignored) with `BUILD_ID` from `.next/BUILD_ID` and the precache list inlined (C2, C3). Registration from the shell.
- **Manifest + icons:** `public/manifest.webmanifest`, `public/icons/icon-192.png`, `icon-512.png`; linked only from `app/(shell)/layout.tsx` metadata so the demo `/` head is unchanged (P2-10).
- **Host redirects** for non-canonical production aliases (S-7, C1).
- **Contracts/tests:** `docs/contracts/feature_app.yml`, `docs/contracts/feature_app_defaults.yml`, `docs/contracts/journey_app_offline.yml`, scope-coverage test, rendered-text no-metrics check, `tests/e2e/journey_app_offline.spec.ts`, `tests/e2e/app_shell.spec.ts`, `tests/e2e/app_logic.spec.ts`.
### Not in scope
Tap state machine (APP-TAP), chain UI/history (APP-CHAIN), tag creation UI (APP-TAGS), export/import/silo guard (APP-DURABLE), demo link (APP-LINK).

## Data and module contract (S-9, S-8, P1-2)
```ts
// lib/app/store.ts
export interface Tag  { id: string; name: string; createdAt: number; graceUntil: number }      // graceUntil = createdAt + 600_000
export interface Run  { id: string; status: 'open' | 'done' | 'abandoned'; tagInId: string; tagOutId?: string;
                        startedAt: number; endedAt?: number; abandonedAt?: number;
                        localDay: string /* YYYY-MM-DD */; tzOffsetMin: number; lastTapAt: number }
export interface Meta { schemaVersion: 1; persistResult?: boolean; lastExportAt?: number; backupNudgeDismissedUntil?: number }
export interface ExportFile { schemaVersion: 1; exportedAt: number; tags: Tag[]; runs: Run[]; meta: Meta }
export interface Stores { tags: IDBObjectStore; runs: IDBObjectStore; meta: IDBObjectStore }
export class StoreError extends Error { kind: 'quota' | 'blocked' | 'newer-schema' | 'unavailable' | 'tx-aborted' }
export function openStore(): Promise<IDBDatabase>            // v1 upgrade creates tags(id), runs(id; idx status, localDay), meta(singleton 'meta' = {schemaVersion:1});
                                                              // newer version → StoreError('newer-schema'), no writes; onblocked/versionchange → close + StoreError('blocked')
export function withTxn<T>(mode: IDBTransactionMode, fn: (s: Stores) => Promise<T>): Promise<T>
//   caller captures `now` BEFORE; inside fn only IDB requests are awaited (no timers/fetch/UI awaits).
//   Resolves with fn's value only after the transaction fires `complete` (committed).
//   If fn throws/rejects or any request errors: tx.abort() is called, all writes roll back, and withTxn rejects with StoreError ('quota' for QuotaExceededError, else 'tx-aborted').
//   If the transaction aborts/errors on its own: rejects with StoreError; never resolves early.
export function getTag(id): Promise<Tag|undefined>; listTags(); listRuns(); getOpenRun(); getMeta()
export function startRunIfNoneOpenIn(s: Stores, tagId: string, now: number): Promise<{ run: Run; created: boolean }> // composable: runs inside a caller's transaction, opens none of its own
export function startRunIfNoneOpen(tagId: string, now: number): Promise<{ run: Run; created: boolean }>             // = withTxn('readwrite', s => startRunIfNoneOpenIn(s, tagId, now))
// APP-TAP composes its whole decision (APP-023) in ONE withTxn('readwrite', …) and calls the *In variants and Stores reads inside it; it never nests a second transaction.
// lib/app/chain.ts (pure, no DOM)
export function localDayOf(epochMs: number, tzOffsetMin?: number): string   // the ONLY source of localDay and "today"
export function computeChain(runs: Run[], todayLocalDay: string): number      // APP-007
export function newTagId(): string   // ^[a-z0-9]{10}$ via crypto.getRandomValues
export function newRunId(): string
// lib/app/route.ts
export type Route = { view: 'home'|'tags'|'settings'|'tap'|'tapped'|'invalid-tag'|'not-found'; tagId?: string; runId?: string }
export function resolveRoute(loc: { pathname: string; search: string }): Route  // '/t/<id>' → tap only if ^[a-z0-9]{10}$ else invalid-tag; '/app?tapped=<id>' → tapped; '/shell' or unknown '/app/*' → not-found; no case folding
// lib/app/origin.ts
export const TAG_ORIGIN = 'https://runtag.vercel.app'; export function tagUrl(id: string): string
```
**Test access (P1-3):** the shell assigns `window.__runtagStore = { startRunIfNoneOpen, listRuns, listTags, getMeta }` **only when `navigator.webdriver === true`**. These are the real store functions (no alternate implementation). Contract forbids any other `window.__` assignment in app code.

## Service worker contract (S-3, M-9, C2, C3, P1-5, P1-6, P2-6)
- Cache name `runtag-shell-${BUILD_ID}`. Install: `cache.addAll` of `/shell` (stored under key `/shell`) + every file under `.next/static/**` except `*.map`, + manifest + icons, each fetched with `new Request(u, {cache:'reload'})`. `build-sw.mjs` fails the build if `.next/server/app/shell.html` is missing or references a `/_next/static/` URL not in the list.
- Fetch: only `request.mode === 'navigate'` with pathname `/app`, `/app/*` or `/t/*` → respond **cache-first** with the cached `/shell` document (path and query ignored; never cache `/t/*` keys); static assets → cache-first from the build cache; everything else → network.
- Update: new SW precaches fully, then waits. `skipWaiting` only on a `SKIP_WAITING` message, posted by the home view when idle (no tap view open), followed by one reload; `activate` deletes caches whose name ≠ current. Never mid-tap.

## Redirects (S-7, C1)
`next.config.mjs` `redirects` (production only; skipped when `VERCEL_ENV === 'preview'`), each with `missing: [{type:'host', value:'runtag\\.vercel\\.app'}, {type:'host', value:'localhost|127\\.0\\.0\\.1'}]`, permanent (308), query string preserved:
- `/app` → `https://runtag.vercel.app/app`
- `/app/:path*` → `https://runtag.vercel.app/app/:path*`
- `/t/:path*` → `https://runtag.vercel.app/t/:path*`

## Invariants referenced
INV-D4/APP-008 (no metrics), APP-001 (origin permanence), APP-020 (atomic decisions), INV-D7 (a11y).

## Acceptance Criteria
| AC | Criterion | Oracle (re-read value) |
|---|---|---|
| AC-1 | Hard loads of `/app`, `/app/tags`, `/app/settings`, `/t/abc123def4`, `/t/ABC123def4`, `/t/a/b`, `/app/nope`, `/shell` render the view from `resolveRoute` | `[data-testid=view]` `data-view` = home, tags, settings, tap, invalid-tag, invalid-tag, not-found, not-found; no hydration warning in console |
| AC-1b | Online in-shell navigation `/app` → `/app/tags` → back via `shellNavigate`/`popstate` | `data-view` = tags then home; `location.pathname` matches |
| AC-2 | `/t/{id}` takes the id from `location.pathname` only, for two ids loaded in sequence | `[data-testid=tap-tag-id]` `data-tag-id` = each URL id |
| AC-3 | Store round trip: `startRunIfNoneOpen` creates a typed run; reload; rows re-read equal | `__runtagStore.listRuns()` after reload deep-equals the returned run |
| AC-4 | `computeChain` (APP-007), cases: [] → 0; today → 1; yesterday+today → 2; −3,−2,today → 1; −2,−1 → 2; −3,−2 → 0; open/abandoned ignored; two runs same day → 1; month boundary 2026-09-30, 10-01 → 2 | node-side Playwright spec (no page), UTC date math |
| AC-5 | Atomicity: two pages in one context `Promise.all` call `__runtagStore.startRunIfNoneOpen('abc123def4', now)` | exactly one `status:'open'` row; one result `created:true`, one `false` — **chromium and mobile** |
| AC-5b | `window.__runtagStore` is undefined when `navigator.webdriver` is false | addInitScript override → `typeof window.__runtagStore === 'undefined'` |
| AC-6 | Offline: after one online `/app` visit and SW activated, `setOffline(true)`, never-loaded `/t/qqqqqqqqq1` and `/t/zzzzzzzzz9` | each `data-tag-id` equals its URL id; `response.fromServiceWorker()` true; cache keys contain no `/t/`; elapsed (Node `performance.now()`, one warm-up allowed) < 1000 ms; offline `/app`→`/app/tags` renders tags — chromium only |
| AC-6b | Online cache-first: navigation `/app` with network delayed 30 s via `route` | view visible < 1000 ms; served by SW — chromium only |
| AC-7 | "Ready offline ✓" iff the shell and every precache entry are in `runtag-shell-${BUILD_ID}` | text visible ⇔ all entries present; AND every `/_next/static/` URL parsed from the cached `/shell` HTML is in the cache — chromium only |
| AC-8 | SW update policy: cache name includes BUILD_ID; no unconditional `skipWaiting`; `SKIP_WAITING` handler present | static checks on generated `public/sw.js` |
| AC-8b | Two builds with different BUILD_IDs produce byte-different `public/sw.js`; `GET /sw.js` contains the current `.next/BUILD_ID` | node test + HTTP check |
| AC-9 | Tag URLs only via `TAG_ORIGIN`: `tagUrl('abc123def4') === 'https://runtag.vercel.app/t/abc123def4'` | node test + contract forbidding `/location\.(origin\|host\|hostname\|href)/` and `/new URL\([^)]*\/t\//` in `lib/app/**`, `app/(shell)/**`, `components/app/**` |
| AC-10 | Redirects: `http.request` to the local prod server with `Host: runtag-floutlabs.vercel.app` → 308 with exact `Location` for `/app` → `https://runtag.vercel.app/app`, `/app/tags?x=1` → `https://runtag.vercel.app/app/tags?x=1`, `/t/abc123def4` → `https://runtag.vercel.app/t/abc123def4`; same three paths with `Host: localhost:3000` → 200 | node HTTP check in CI |
| AC-11 | No metrics: rendered `innerText` of `/app`, `/app/tags`, `/app/settings`, `/t/{id}` matches none of `\b\d{1,2}:\d{2}\b`, `\b\d+\s?(min\|mins\|minutes\|h\|hr\|hrs\|hours\|s\|sec\|secs\|seconds)\b`, whole-word FORBIDDEN_TERMS; tag ids rendered only in attributes or `[data-metric-exempt]` (P2-14); static contract keeps only unit-suffixed patterns and forbids `COPY.scene1`/`COPY.scene4` in app scope | Playwright rendered-text check + contract |
| AC-12 | Contract scope coverage (S-10, full): `feature_app_defaults.yml` mirrors every default rule scoped to `src/**` (SEC-001…005, A11Y-001…004, PROD-001…003, TEST-003…005, COMP-001…004) onto `app/**`, `components/**`, `lib/**`, `hooks/**` — the existing directories, no waivers, no `!` globs; each mirrored rule names its source rule in `mirrors`. The two existing A11Y-003 violations (unlabelled email inputs in `components/scenes/Scene1Hook.tsx` and `Scene8CTA.tsx`) are fixed with `aria-label="Email address"`. Every `non_negotiable` rule's scope matches ≥1 file, except default rules that are mirrored | jest test; enforcement test green over all four directories |
| AC-13 | Manifest: `id:'/app'`, `start_url:'/app'`, `scope:'/'`, `display:'standalone'`, 192/512 icons; linked from the shell layout only | manifest JSON + icons 200; demo `/` head has no manifest link |
| AC-14 | Demo at `/` behaviour unchanged (only the two `aria-label` additions from AC-12) and all pre-existing tests green | full suite |
| AC-17 | Transaction rollback: inside `withTxn('readwrite')` put a run then throw → `withTxn` rejects with `StoreError('tx-aborted')` | runs count unchanged (0) after reload |
| AC-18 | Composition: `withTxn('readwrite', s => startRunIfNoneOpenIn(s, …))` creates at most one open run and resolves only after commit | `listRuns()` re-read immediately after resolve contains the run |
| AC-15 | Storage failure: `addInitScript` makes `IDBObjectStore.prototype.put`/`.add` throw `QuotaExceededError` → `startRunIfNoneOpen` rejects with `StoreError('quota')` | runs count unchanged (0) |
| AC-16 | Newer schema: DB pre-created at version 2 → `[data-testid=store-error]` visible | runs/tags counts unchanged |

## Gherkin
```gherkin
Feature: App shell
  Scenario: Tap URL parsed from the address bar
    When I open "/t/abc123def4" and then "/t/zzzzzzzzz9"
    Then the tap view shows tag id "abc123def4" and then "zzzzzzzzz9"

  Scenario: Offline never-loaded tag URL
    Given I opened "/app" online and the service worker is active
    And the device is offline
    When I open "/t/qqqqqqqqq1"
    Then the tap view shows tag id "qqqqqqqqq1" within 1 second

  Scenario: One open run under concurrency
    Given no run is open
    When two pages simultaneously start a run if none is open
    Then exactly one run row has status "open"

  Scenario: Canonical origin
    Given a request for "/app" with host "runtag-floutlabs.vercel.app"
    Then the response is a 308 to "https://runtag.vercel.app/app"
```

## Journey (Definition of Done)
J-APP-OFFLINE (`tests/e2e/journey_app_offline.spec.ts`, contract `docs/contracts/journey_app_offline.yml`) + `tests/e2e/app_shell.spec.ts` + `tests/e2e/app_logic.spec.ts`. Local run: stop any dev server, `npm run build && PW_PROD=1 npx playwright test`; specs assert `GET /sw.js` contains `.next/BUILD_ID` (P2-11). Clock: `page.clock.install()` before first navigation; app time via `Date.now()` only; SW timing measured Node-side (P2-2). Chromium-only ACs use `test.skip(browserName !== 'chromium', 'SW interception is Chromium-only in Playwright')` (P2-3).

## Declarations (Gate B seams — P2-13)
writes: [`components/scenes/Scene1Hook.tsx`, `components/scenes/Scene8CTA.tsx`, `/app`, `/t/`, `/app/tags`, `/app/settings`, `/app?tapped=`, `app/(shell)/`, `lib/app/store.ts`, `lib/app/chain.ts`, `lib/app/route.ts`, `lib/app/nav.ts`, `lib/app/origin.ts`, `scripts/sw/`, `public/manifest.webmanifest`, `public/icons/`, `next.config.mjs`, `package.json`, `.gitignore`, `docs/contracts/feature_app.yml`, `docs/contracts/feature_app_defaults.yml`, `docs/contracts/journey_app_offline.yml`, `tests/e2e/journey_app_offline.spec.ts`]
reads: [`lib/constants.ts`]
reuses: [`components/ChainVisual.tsx` (APP-CHAIN)]
adrNone: "repo has no ADR folder"

**Gate B reconciliation (F-6):** the declared `writes` are surfaces this slice creates, so pre-build seam computation ran with `--no-resolve` (PRDs/runtag-app-hops.md, evidence/seams-runtag-app.out.json). Implementation-time obligation (DoD): after this slice is built, `node scripts/verify-seams.cjs evidence/seams-runtag-app.json --repo-root .` must resolve every APP-SHELL `writes` surface (exit 0); future slices' surfaces stay unresolved until they are built (progressive specification). requirement→journey→test→issue for this slice: APP-001/008/010/011/020/102 → J-APP-OFFLINE → tests/e2e/journey_app_offline.spec.ts, app_shell.spec.ts, app_logic.spec.ts → #16.

## Definition of Done
- [ ] AC-1…AC-16 asserted; `npm run test:contracts` + full Playwright (chromium + mobile) green on CI (Gate C)
- [ ] provenance: asserted values re-read from IndexedDB / caches / HTTP; no literals copied into implementation; code says "placeholder", not "stub"/"fake" (P2-9)
- [ ] slice < 1000 hand-written lines (generated `public/sw.js` excluded)
- [ ] Gate B resolve re-run for APP-SHELL surfaces exits 0 after build
