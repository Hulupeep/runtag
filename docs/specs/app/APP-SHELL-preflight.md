# APP-SHELL — GATE B.5 pre-flight simulation

**Target:** docs/specs/app/APP-SHELL.md · **Date:** 2026-10-10 · **Mode:** ticket walk (not PRD), before any code exists
**Context read:** PRDs/runtag-app-prd.md, PRDs/runtag-app-verdict.md §7, PRDs/runtag-app-hops.md, docs/specs/app/APP-TAP.md, APP-CHAIN.md, next.config.mjs, package.json, playwright.config.ts, jest.config.js, app/layout.tsx, app/page.tsx, .github/workflows/*.yml, docs/contracts/*.yml, tests/**, the existing `.next/` Turbopack build, and node_modules/next@16.1.4 + playwright-core@1.57 sources.
**Verdict:** NOT build-ready. 3 CRITICAL, 8 P1. Each finding below gives the exact ticket edit.

## Personas walked
| Persona | Walk | Result |
|---|---|---|
| P-A Android runner (Playwright `chromium`) | online `/app` → SW ready → offline → `/t/{A}`, `/t/{B}` → `/app` → in-app link to `/app/tags` | Breaks at step 1 in CI (C1). With C1 fixed, it breaks again on offline styling and hydration (C3). The intra-shell link is undefined (P1-1). |
| P-I iPhone runner (Playwright `mobile`, WebKit) | `/app`, `/t/{id}`, reload, AC-3, AC-5, AC-7 | AC-7 passes vacuously on WebKit (P2-3). The AC-3 and AC-5 hook is undefined (P1-3). |
| P-D next-deploy runner (owner after a 2nd deploy) | phone has the old SW → new deploy → open `/app` | Stale forever. The SW bytes never change (C2). |
| P-B build engineer (APP-TAP / APP-CHAIN implementer) | consume store, `computeChain`, shell views, `/app?tapped=` | No API for reads and writes, `localDay`, ids, the view registry or history-driven re-render (P1-2). |
| P-G Gate C / CI | `npm run test:contracts`, `npm run build`, Playwright on `next start` | AC-12 is red on 15 zero-scope rules. Mirroring A11Y-003 fails the demo (P1-4). Unit ACs can't run under jest (P1-8). |

## Stipulation fold-in check (verdict §7 APP-SHELL 1–9)
| # | Stipulation | In ticket? | Gap → finding |
|---|---|---|---|
| 1 | S-3 single shell, `location.pathname` only, SW cache-first for every `/t/*`·`/app*` navigation ignoring path+query, mechanism named (manifests, no webpack PWA), `prefetch={false}`, two-id oracle + offline `/app`→`/app/tags` | Partial | Missing: online cache-first AC, "ignore path and query", `prefetch={false}`, ban on `usePathname`/`useParams`. "From build manifests" is infeasible under Turbopack. → C3, P1-1, P1-6 |
| 2 | S-7 `TAG_ORIGIN`, host redirects, production only, localhost exempt | Partial | The stipulated regex **does not exempt localhost**. "Production builds only" is what CI runs → C1 |
| 3 | S-9/S-8 types, `graceUntil` | Yes | — |
| 4 | S-14 `now` before txn; two-page goto oracle; `page.clock.install`; QuotaExceededError injection via `addInitScript`; `PW_PROD=1` | Partial | The oracle was swapped for an undefined "test hook". The failure semantics of `withTxn` and the injection technique are absent → P1-3, P1-7 |
| 5 | S-5 rendered-text regex + whole-word terms; **static contract keeps only existing unit-suffixed patterns**; no COPY.scene1/4 | Partial | The ticket says "+ contract" without restricting it. A static duration regex is red on Tailwind (`w-32 h-1`) → P1-7 |
| 6 | S-10 scope fix or per-rule waiver, coverage test, @hulupeep edits | Partial | The mirror approach is OK, but the rule list, the A11Y-003 demo collision, TEST-002 and the owner are missing → P1-4 |
| 7 | T12 `computeChain` pure in the store | Yes | Needs a TZ-safe `today` source → P1-2 |
| 8 | M-9 build-ID cache, full precache before activate, **no skipWaiting mid-tap**, Ready ⇔ all entries | Diverged | The ticket says "no `skipWaiting`" at all, so M-9 (stale pin) stays open. Build-ID versioning is infeasible with a static sw.js → C2, P1-5 |
| 9 | M-7 < 1000 ms after `goto` offline | Yes (AC-6) | Measurement clock → P2-2 |

---

## Pre-flight Findings

### CRITICAL

#### C1 — The host redirect fires on `localhost`. Every app test in CI 308s to the live production origin
- **What breaks:** AC-10 as stipulated uses `has: [{type:'host', value:'(?!runtag\\.vercel\\.app).*'}]` for production builds. CI runs a production build (`npm run build` then `next start`), and Next matches `has.host` against the hostname **with the port stripped**. So `localhost` matches `^(?!runtag\.vercel\.app).*$`, and `/app`, `/app/tags`, `/t/{id}` all 308 to `https://runtag.vercel.app/...`. AC-1, AC-2, AC-3, AC-5, AC-6, AC-7 and AC-11 then run against the live site or fail. "Localhost exempt in dev/test" has no mechanism, because CI is not dev. Gating on `NODE_ENV==='production'` does not help, since `next start` is production.
- **AC/step:** AC-10, and through it every app AC. P-A step 1.
- **Evidence:** node_modules/next/dist/shared/lib/router/utils/prepare-destination.js `matchHas` `case 'host'`: `host?.split(':', 1)[0].toLowerCase()`, then `new RegExp(\`^${hasItem.value}$\`)`. Also .github/workflows/e2e.yml:22-26 (build, then `CI=true` → playwright.config.ts:27 `npm run start`), and verdict §7 APP-SHELL item 2. `missing` is a validated key for redirects (node_modules/next/dist/lib/load-custom-routes.js:95,169).
- **Ticket edit:** replace AC-10 with:
  > AC-10 | `next.config.mjs` `redirects()` returns, unless `process.env.VERCEL_ENV === 'preview'`, three 308 rules (`/app`, `/app/:path*`, `/t/:path*` → `https://runtag.vercel.app/<same path>`) each with `missing: [{type:'host', value:'runtag\\.vercel\\.app'}, {type:'host', value:'localhost|127\\.0\\.0\\.1'}]`. No negative-lookahead `has`. | Playwright node-side spec against the built server: `http.request({host:'localhost', port:3000, path:'/app/tags', headers:{host:'runtag-floutlabs.vercel.app'}})` → status 308 and `location` = `https://runtag.vercel.app/app/tags`. The same path with `host: localhost:3000` → 200. W4 real check unchanged.

#### C2 — A hand-written, static `public/sw.js` cannot be "versioned by build ID". Deploy N+1 never installs
- **What breaks:** browsers install a new SW only when the bytes of the registered script (and, in Chromium, its `importScripts`) change. If `public/sw.js` is committed and hand-written, it is byte-identical on every deploy. Learning the build ID at runtime (for example by fetching a manifest) never triggers `install`. So the build-ID-named cache never rolls, and the cache-first shell pins the first deploy indefinitely. That is exactly M-9. Registering `/sw.js?b=<id>` does not rescue it: the stale cached shell keeps registering the **old** URL. AC-8's oracle ("static check + cache names include build ID") is green in this broken state, so it is an always-green loophole.
- **AC/step:** AC-7, AC-8, M-9. P-D persona.
- **Evidence:** APP-SHELL.md:13 ("Hand-written `public/sw.js` + post-build precache manifest script … cache versioned by Next build ID") and :47 (AC-8 oracle). `public/` does not exist yet (`ls public` → absent). Next reads `public/` once at server start (node_modules/next/dist/server/lib/router-utils/filesystem.js:171-174), so a file generated by `postbuild` before `next start` is served at `/sw.js` with scope `/` (it controls `/t/*` and `/app*`). npm runs `postbuild` automatically after `npm run build`, which e2e.yml:22 uses, as does Vercel's default build command.
- **Ticket edit:** replace the 4th in-scope bullet with:
  > Hand-written SW **template** `scripts/sw/sw.template.js`. A `postbuild` npm script, `scripts/sw/build-sw.mjs`, reads `.next/BUILD_ID` and the precache list (see C3). It writes `public/sw.js` with `const BUILD_ID = '<id>'` and `const PRECACHE = [...]` inlined, plus `public/precache-manifest.json` `{buildId, urls}`. Both generated files are git-ignored. Cache name = `runtag-${BUILD_ID}`.
  
  Add AC-8b:
  > after `npm run build`, `public/sw.js` contains the exact string in `.next/BUILD_ID`. Two consecutive builds with different `BUILD_ID` produce byte-different `public/sw.js` (node-side spec runs `build-sw.mjs` twice with two fixture BUILD_IDs and compares sha256).
  
  Move AC-8's static checks (no `skipWaiting` outside the message handler, `waitUntil(precache)` in `install`, old-cache deletion in `activate`) to target **both** the template (jest, no build needed) and the generated file (Playwright, post-build). Add `package.json` (`postbuild`) and `.gitignore` to the Declarations `writes`.

#### C3 — Under Turbopack (Next 16's default), "precache list from .next build manifests" omits the page chunk, CSS and fonts. AC-7 is self-referential
- **What breaks:** `.next/build-manifest.json` lists only `rootMainFiles` and `polyfillFiles`. The app-route page chunks, the CSS and the `next/font` files are not in it, and Turbopack emits no `app-build-manifest.json`. A generator that reads that manifest precaches an incomplete set. Offline, the shell HTML loads without its page chunk, so it does not hydrate (no `data-view`, no `data-tag-id`), and without CSS. Meanwhile AC-7 ("Ready ⇔ caches contain all **manifest** URLs") stays green, because it checks the list against itself.
- **AC/step:** AC-6, AC-7. P-A offline steps.
- **Evidence (this repo's current build):** `.next/turbopack` marker present. `.next/build-manifest.json` = 4 rootMainFiles + 1 polyfill. `.next/server/app/index.html` references `/_next/static/chunks/df2ebbbe2eeb2989.js` (page), `2402a56a7957a833.js`, `b723b0d97658f59c.css` and two `/_next/static/media/*.woff2`, **none** of which is in build-manifest.json. The page chunk appears only in `.next/server/app/page_client-reference-manifest.js` (`entryJSFiles`). The whole of `.next/static` is 20 files / 972 KB, so precaching it all is cheap.
- **Ticket edit:** replace "from `.next` build manifests" with:
  > Precache list = (every file under `.next/static/**` except `*.map`, as `/_next/static/...`) ∪ `{'/app', '/manifest.webmanifest', icon URLs, '/precache-manifest.json'}`. `build-sw.mjs` **fails the build** if any `/_next/static/` URL referenced in `.next/server/app/shell.html` (the prerendered shell) is missing from the list, or if `shell.html` does not exist (which also proves the shell is statically prerendered).
  
  Amend AC-7's oracle:
  > text visible ⇔ `caches.open('runtag-'+buildId)` contains every URL in `/precache-manifest.json` **and** every `/_next/static/` URL parsed from the cached `/app` response body.

### P1

#### P1-1 — The shell's view resolution, hydration and intra-shell navigation are unspecified. The obvious implementations break
- **What breaks:**
  1. **Hydration.** The shell is prerendered with no `window`. Choosing the view during render (`typeof window` guard) gives a hydration mismatch on every URL whose view differs from the prerendered one. React logs an error and client-re-renders the root, which eats into AC-6's 1000 ms budget. Reading `window` unguarded fails the build.
  2. **Online `<Link>` from `/app` to `/app/tags`.** This fetches RSC for the same rewritten `/shell` tree, so the shell component is **not remounted**. A shell that reads `location` once on mount stays on `home`, and AC-1 (direct `goto`) never catches it.
  3. **Offline `<Link>`.** The RSC fetch throws, Next logs "Failed to fetch RSC payload" and falls back to `location.assign`. It works only by accident.
  4. **Not folded.** `prefetch={false}` (stipulation 1) is missing.
- **AC/step:** AC-1, AC-6 (`/app` → `/app/tags`), APP-TAP's `replaceState` → `/app?tapped=`.
- **Evidence:** create-initial-router-state.js:24-26 (canonicalUrl comes from `location`, so no URL rewrite to `/shell` on hydrate; this part is safe). fetch-server-response.js:159-166 (fetch failure → MPA fallback). app-router.js:240-265 (`pushState`/`replaceState` are patched to dispatch `ACTION_RESTORE` and fire no event the shell can observe). app-router.js:270-285 (`popstate`).
- **Ticket edit:** add to In scope:
  > The shell renders a view-neutral skeleton on the server. It derives `{view, tagId, search}` via `useSyncExternalStore(subscribe, () => resolveRoute(location.pathname, location.search), () => null)`. `subscribe` listens to `popstate` and a `runtag:navigate` event. `lib/app/nav.ts` exports `shellNavigate(path, {replace?})`, which calls `history.pushState`/`replaceState` and dispatches `runtag:navigate`. All intra-shell links use `shellNavigate` (or a plain `<a href>` for a full SW-served load). `next/link`, `useRouter`, `usePathname`, `useParams` and `useSearchParams` are forbidden in `app/(shell)/**` and `lib/app/**` (feature_app.yml pattern).
  
  Add AC-1b:
  > online `/app` → click Tags link → `data-view="tags"` without a document load. Oracle: a `window.__navMark` set before the click survives, read via `page.evaluate`.

#### P1-2 — The seam contract that APP-TAP, APP-CHAIN, APP-TAGS and APP-DURABLE consume is incomplete
- **What breaks:** the ticket defines entity types, `computeChain` and `withTxn`, but leaves out:
  - the `Stores` type;
  - any read or write helpers;
  - a single `localDay` function. APP-TAP writes `Run.localDay` and APP-CHAIN computes `todayLocalDay`. Two implementations means TZ and DST divergence, which is exactly the S-11 risk.
  - id generators (APP-001 `crypto.getRandomValues` tag ids; run ids);
  - who creates the `meta` row (hop I1 expects `M.schemaVersion = 1` after the first `/app`);
  - how `/app?tapped={runId}` routes (APP-TAP S-4 must render it inside the shell, but AC-1 maps `/app` only to `home`);
  - how APP-TAP plugs a view in;
  - what `withTxn` does on failure (APP-TAP AC-6 "only after commit").
  
  W2 tickets would each invent these, which creates writer×writer seams on `lib/app/store.ts` (hops seam list).
- **AC/step:** Data contract, AC-1. Seams `lib/app/store.ts`, `/t/`, `/app`.
- **Evidence:** APP-SHELL.md:20-32. APP-TAP.md:9-13. APP-CHAIN.md:33. hops.md:25 (I1), :115-118 (store seam). verdict §7 APP-CHAIN 1.
- **Ticket edit:** append to the Data contract:
  ```ts
  export type Stores = { tags: IDBObjectStore; runs: IDBObjectStore; meta: IDBObjectStore } // withTxn always opens all three
  export function localDayOf(epochMs: number): string            // device-local YYYY-MM-DD via getFullYear/getMonth/getDate; sole source for Run.localDay and todayLocalDay
  export function newRunId(): string                              // crypto.randomUUID()
  export function getAll(store: 'tags'|'runs'): Promise<Tag[]|Run[]>; export function getTag(id: string): Promise<Tag|undefined>; export function getMeta(): Promise<Meta>
  export class StoreError extends Error { cause: DOMException; kind: 'quota'|'version'|'blocked'|'unknown' } // withTxn aborts the txn and rejects with StoreError; no partial writes
  // origin.ts
  export function newTagId(): string                              // ^[a-z0-9]{10}$ from crypto.getRandomValues (APP-001)
  // lib/app/route.ts
  export type Route = {view:'home'; tapped?: string} | {view:'tags'} | {view:'settings'} | {view:'tap'; tagId: string} | {view:'invalid-tag'} | {view:'not-found'}
  export function resolveRoute(pathname: string, search: string): Route
  ```
  Add:
  > `onupgradeneeded` (v0→1) creates the stores and `meta = {schemaVersion:1}`. The shell renders each view from `app/(shell)/views/<view>.tsx`. Later tickets replace a view file and never edit the resolver.

#### P1-3 — AC-3 and AC-5 depend on an undefined "test hook". Raw `page.evaluate` IDB writes would be always-green
- **What breaks:** this ticket has no UI that creates tags or runs. AC-3 ("creating a tag and a run then reloading") and AC-5 ("the shell's test hook that creates an open run if none is open") have no defined entry point. If the test writes rows with raw `indexedDB` calls in `page.evaluate`, it exercises the browser, not `lib/app/store.ts`, so it passes while `withTxn` is broken. An unconditional `window.__runtag` in production is not a *stub*: it calls real code and passes the provenance-gate diff scan. But it is a shipped write surface: any extension or script could forge runs, which games the chain. It is also a different code path from APP-TAP's tap decision.
- **AC/step:** AC-3, AC-5, stipulation 4 (oracle "two pages `goto /t/x` → one open row").
- **Evidence:** APP-SHELL.md:42,44. scripts/provenance-gate.cjs:42-45 (flags added lines containing `mock|fake|stub` outside docs). hops.md:52 (A7 is the real oracle and lives in APP-TAP).
- **Cleanest compliant mechanism:** expose the **real production primitive**, not a test-only function.
  - The store exports `startRunIfNoneOpen(tagId: string, now: number): Promise<Run|null>`. This is the APP-020 atomic core that APP-TAP's tap-in branch must call; it is a seam, not a test helper.
  - The shell installs `window.__runtagStore = Object.freeze({ startRunIfNoneOpen, putTag, getAll })` **only when `navigator.webdriver === true`**, so real browsers never get it.
  - A feature_app.yml rule forbids any other `window.__` assignment in `app/(shell)/**` and `lib/app/**`.
  - APP-TAP's A7 hop (two pages `goto /t/A`) supersedes AC-5 when W2 merges.
- **Ticket edit:**
  - AC-3 oracle: "rows written via `window.__runtagStore.putTag`/`startRunIfNoneOpen` (webdriver-gated, real store code), then re-read after `page.reload()` via raw `indexedDB` in `page.evaluate`, deep-equal the returned objects."
  - AC-5: "two pages in one context, each after `goto('/app')`, `Promise.all` `__runtagStore.startRunIfNoneOpen('aaaaaaaaaa', Date.now())` → exactly one non-null return, and the `runs` row count with `status:'open'` re-read = 1. Runs on **both** projects (WebKit IDB auto-commit across `await` is the iPhone risk)."
  - Add AC-5b: "`navigator.webdriver` false (`addInitScript` defines it `false`) → `typeof window.__runtagStore === 'undefined'`."

#### P1-4 — AC-12 is red on arrival, and the S-10 mirror collides with AC-14 (demo unchanged)
- **What breaks:** under the repo's own glob walker, **15** non-negotiable rules match zero files:
  - SEC-001…005, A11Y-001…004, PROD-001…003 and COMP-003/004 (all `src/**`);
  - TEST-002 (`tests/e2e/journey_*.spec.ts`; no journey file exists).
  
  The ticket mirrors an unnamed subset. Stipulation 6 named only SEC-003, SEC-004, A11Y-001…004 and PROD-002, which leaves at least 8 rules red. Mirroring A11Y-003 over `components/**` flags existing demo inputs, so either AC-12/S-10 or AC-14 fails. The ticket's journey file `tests/e2e/app_shell.spec.ts` also differs from the PRD's `tests/e2e/journey_app_offline.spec.ts`, so TEST-002 stays uncovered and the J-APP-OFFLINE mapping breaks. Finally, `tests/helpers` `globToRegex` treats `!` negations as literals, so negated scopes copied into the mirror are silently ignored.
- **AC/step:** AC-12, AC-14, journey DoD.
- **Evidence:** zero-coverage run of contract-enforcement's walker over docs/contracts (15 ZERO rules listed above). A11Y-003 pattern hits `components/scenes/Scene1Hook.tsx:47` and `components/scenes/Scene8CTA.tsx` (`<input` without aria-label or id). tests/contracts/contract-enforcement.test.js:13-21 (no `!` support). PRD:163 (journey file name).
- **Ticket edit:**
  - AC-12: "`feature_app_defaults.yml` mirrors **all 14** `src/**`-scoped default rules (list the ids) with scope `app/(shell)/**/*.{ts,tsx}`, `lib/app/**/*.ts`, `components/app/**/*.tsx` (new app code only). Each mirror has a `mirrors: <id>` field. Demo dirs are covered by a per-rule `waiver:` block authored by @hulupeep, naming A11Y-003 × Scene1Hook/Scene8CTA as known debt. Mirror scopes contain no `!` entries."
  - Rename the journey file to `tests/e2e/journey_app_offline.spec.ts` (J-APP-OFFLINE). Unit and shell checks go in `tests/e2e/app_shell.spec.ts`.
  - Add `docs/contracts/journey_app_offline.yml` and both `feature_app*.yml` to `writes`, with owner @hulupeep.

#### P1-5 — "No `skipWaiting`" diverges from stipulation 8 and leaves M-9 open
- **What breaks:** the verdict forbids `skipWaiting` *mid-tap*. The ticket forbids it entirely. With no `skipWaiting`, a new SW waits until **every** controlled tab closes. NFC launches open new Safari or Chrome tabs and old ones linger, so the new build rarely activates. That is the "pins a stale deploy indefinitely" of M-9.
- **AC/step:** AC-8, stipulation 8.
- **Evidence:** verdict:128 (M-9), :197. APP-SHELL.md:47.
- **Ticket edit:** AC-8 becomes:
  > "`install` precaches the full list (`waitUntil`) before `activate`. `activate` deletes only `runtag-*` caches ≠ current. `skipWaiting()` is called **only** from a `message` handler for `{type:'SKIP_WAITING'}`. The shell posts it only when `registration.waiting` exists **and** the current view is `home` with no pending store write, then reloads once on `controllerchange`. Static check: the only `skipWaiting` occurrence sits inside the `message` handler."

#### P1-6 — Stipulation 1's cache-first-online rule and SW request filtering are missing. The AC-6 oracle can't prove the SW served the page
- **What breaks:** the ticket has no AC for "cache-first for every `/t/*`·`/app*` navigation **online**, ignoring path and query". Hop A6 depends on it. Two other failure modes go untested:
  - A SW that matches by path without checking `request.mode === 'navigate'` serves HTML to Next's RSC fetches (`?_rsc=`). Next then treats it as non-flight and hard-navigates (fetch-server-response.js:113-119), which doubles the load.
  - AC-6 can't distinguish "served by the SW from the shell entry" from "served by a runtime cache of `/t/x`".
- **AC/step:** AC-6, stipulation 1, hop A6.
- **Evidence:** APP-SHELL.md:45. hops.md:51. playwright-core types.d.ts:20694 `Response.fromServiceWorker()`. crServiceWorker.js:56-60,88-92 (Chromium applies `setOffline` to the SW session too, unless `serviceWorkers:'block'`).
- **Ticket edit:**
  - Add to In scope: "SW `fetch`: if `request.mode==='navigate'` and pathname matches `^/(app(/.*)?|t/.*)$` → `caches.match('/app', {ignoreSearch:true, ignoreVary:true})` with no network attempt. `GET /_next/static/*` → cache-first. Everything else → network passthrough. No runtime caching."
  - AC-6 oracle adds: "`(await page.goto(url)).fromServiceWorker() === true` for each URL, and `(await caches.open(name)).keys()` contains no URL whose path starts with `/t/`."
  - Add AC-6b (chromium): "online with `context.route('**/app**', r => setTimeout(() => r.continue(), 30000))`, `goto('/app/settings')` → `fromServiceWorker()` true and `data-view="settings"` visible < 1000 ms."

#### P1-7 — Stipulations 4 and 5 are only partly folded in
- **What breaks:**
  - **S-5.** AC-11 says "Playwright rendered-text check **+ contract**" without saying the static contract must not carry the duration or clock regexes. A dev who puts `\b\d+\s?(…|h|…)\b` in `feature_app.yml` over `app/**`/`components/**` goes red on Tailwind (`w-32 h-1`) and globals.css.
  - **S-4.** The `QuotaExceededError` injection technique (`addInitScript` prototype override) and its expected store behaviour are absent, so APP-TAP's I12 has no store contract to stand on.
- **AC/step:** AC-11, stipulation 4/5.
- **Evidence:** verdict:106 (S-5 hit list: IPhoneMockup.tsx:30, MapView.tsx:101, TreeIllustration.tsx:32, app/globals.css ×7), :193-194. feature_demo.yml:22-37 (existing static patterns).
- **Ticket edit:**
  - AC-11 contract clause: "`feature_app.yml` static rules: only the existing INV-D4 unit-suffixed patterns (feature_demo.yml:30-33) plus `/COPY\.scene[14]\b/` scoped to `app/(shell)/**`, `lib/app/**`, `components/app/**`. Duration and clock regexes are runtime-only."
  - Add AC-15: "`addInitScript` overrides `IDBObjectStore.prototype.put` and `.add` to throw `new DOMException('q','QuotaExceededError')`. `__runtagStore.startRunIfNoneOpen` rejects with `StoreError{kind:'quota'}`. In a new context without the override, `runs` count = 0."

#### P1-8 — AC-4 and AC-9 "unit" tests cannot run under the repo's jest
- **What breaks:** jest.config.js runs only `**/tests/**/*.test.js` in `node`, and no TS transform is installed (no ts-jest, no `@babel/preset-typescript`). So `import { computeChain } from 'lib/app/store.ts'` fails. Playwright's runner does transpile TS and honours the tsconfig `@/*` paths.
- **AC/step:** AC-4, AC-9.
- **Evidence:** jest.config.js:1-5. `node_modules` has no ts-jest/tsx/esbuild, only `babel-jest` + `@babel/plugin-syntax-typescript`. tsconfig.json paths `@/*`.
- **Ticket edit:**
  > Put `computeChain` and `localDayOf` in IDB-free `lib/app/chain.ts` (re-exported from `store.ts`) and `tagUrl` in `lib/app/origin.ts`. Unit cases live in `tests/unit/app_pure.spec.ts`, run by Playwright with no `page` fixture, with `test.skip(testInfo.project.name !== 'chromium', 'pure function; run once')`. Date arithmetic on `YYYY-MM-DD` uses `Date.UTC`, so results don't depend on the runner's TZ.
  
  Add AC-4 cases:
  - two done runs today → 1;
  - a done run with `localDay` > today is ignored.

### P2

| ID | What breaks | AC | Evidence | Ticket edit |
|---|---|---|---|---|
| P2-1 | "rendered `data-testid="view"` attribute = home…" doesn't name the attribute. The `data-tag-id` element is unnamed. | AC-1, AC-2 | APP-SHELL.md:40-41 | "`[data-testid=view]` has `data-view` ∈ {home,tags,settings,tap,invalid-tag,not-found}. `[data-testid=tap-tag-id]` has `data-tag-id`. `/shell` and unknown `/app/*` → `not-found`. No case-folding of tag ids." |
| P2-2 | `page.clock.install()` fakes `performance.now`/`Date` in the page, so the M-7 timing must be measured test-side. Cold SW start on CI adds jitter. | AC-6 | hops.md:15; verdict:74 | "Elapsed = Node `performance.now()` between `goto` resolving and `toBeVisible` resolving. One warm-up offline navigation is allowed before the measured one." |
| P2-3 | On WebKit the AC-7 biconditional passes vacuously (no SW → no text). AC-6's skip format is mandated by TEST-003. | AC-6, AC-7 | test_integrity_defaults.yml:95; hops.md:18 | "AC-6, AC-6b and AC-7 use `test.skip(browserName !== 'chromium', 'SW interception is Chromium-only in Playwright')`." |
| P2-4 | The shell must stay statically prerendered. A `searchParams` prop or `useSearchParams` makes it dynamic or forces a CSR bailout. | AC-6/7 | .next/server/app/index.html pattern | "Shell page takes no props. `build-sw.mjs` asserts `.next/server/app/shell.html` exists (C3)." |
| P2-5 | Rewrite `/t/:tagId` (single segment) vs the SW's `/t/*` means `/t/a/b` is a 404 online but the shell offline. | AC-2 | APP-SHELL.md:10 | "Rewrites: `/app`, `/app/:path*`, `/t/:path*` → `/shell`. The resolver renders `invalid-tag` for anything not `^/t/[a-z0-9]{10}$`." |
| P2-6 | The precache install fetch of `/app` may hit the HTTP cache. `cache.addAll` rejects on any non-2xx. `.map` files are needless. | AC-7 | .next/static listing has `a6dad97d9634a72d.js.map` | "Install uses `new Request(u, {cache:'reload'})`. Exclude `*.map`." |
| P2-7 | No AC for a newer schema or a blocked upgrade (`onblocked`/`versionchange`). | Data contract | APP-SHELL.md:32; verdict:85 | "AC-16: DB pre-created at version 2 via `page.evaluate` → `[data-testid=store-error]` visible and `runs`/`tags` counts unchanged. Connections close on `versionchange`." |
| P2-8 | The AC-9 pattern `/location\.origin[^\n]*\/t\//` misses `const o=location.origin; \`${o}/t/…\`` and `new URL('/t/'+id, location.href)`. | AC-9 | APP-SHELL.md:48 | "Forbid `/location\.(origin\|host\|hostname\|href)/` and `/new URL\([^)]*\/t\//` in `lib/app/**`, `app/(shell)/**`, `components/app/**`." |
| P2-9 | The provenance diff gate flags any added code line containing `stub` or `fake`. The ticket calls the views "stubs". | DoD provenance | scripts/provenance-gate.cjs:42-45 | "Call them 'placeholder views' in code and comments." |
| P2-10 | A manifest link added to the root layout changes the demo `/` head (AC-14). A manifest `scope:'/app'` would put `/t/*` out of scope. | AC-13, AC-14 | app/layout.tsx:18-28 | "`app/(shell)/layout.tsx` exports `metadata.manifest='/manifest.webmanifest'`. Manifest: `id:'/app'`, `start_url:'/app'`, `scope:'/'`, `display:'standalone'`." |
| P2-11 | `reuseExistingServer: !CI` locally reuses a running `next dev` even with `PW_PROD=1`. dev has no `postbuild`, so there's no `sw.js` and the offline specs fail confusingly. | Journey | playwright.config.ts:26-30 | Journey line: "stop any dev server first; the spec asserts `GET /sw.js` contains `.next/BUILD_ID`." |
| P2-12 | The `/app` home is a writer×writer seam with APP-CHAIN ("Ready offline ✓", chain number). | AC-1, AC-7 | hops.md:89-93 | "Home view exposes a `<ReadyOffline/>` component. APP-CHAIN replaces `views/home.tsx` and must render it." |
| P2-13 | Declarations `writes` misses `package.json`, `.gitignore`, `scripts/sw/*`, `public/manifest.webmanifest`, `public/icons/*`, `app/(shell)/**`, `lib/app/{chain,route,nav}.ts`, `docs/contracts/feature_app*.yml`, `journey_app_offline.yml` and tests, so seam detection misses them. With C2/C3 the < 1000-line budget is tight. | Declarations, DoD | APP-SHELL.md:79,87 | List them all. Count generated files and icons outside the line budget. |
| P2-14 | A random tag id of the shape `\d+(s\|h\|hr\|min…)` (e.g. `123456789s`) rendered as text trips AC-11. The odds are tiny but non-zero. | AC-11 | AC-11 regex | "Render the tag id only in the `data-tag-id` attribute, or in a `<code>` element excluded from the scan by `[data-metric-exempt]`." |

---

## CRITICAL + P1 summary (for the caller)
- **C1** Host redirect regex matches `localhost` (Next strips the port), so CI's `next start` 308s every app URL to production. Fix: `missing:[canonical, localhost|127.0.0.1]`, off on Vercel preview, plus an HTTP Host-header oracle in CI.
- **C2** Static hand-written `public/sw.js` can't carry a build ID, so browsers never update and the first deploy is pinned forever. Fix: `postbuild` renders `public/sw.js` from a template with BUILD_ID and PRECACHE inlined (git-ignored), with an AC that two builds give different bytes.
- **C3** Turbopack's `build-manifest.json` omits the page chunk, CSS and fonts, so the offline shell won't hydrate, and AC-7 checks the list against itself. Fix: precache all of `.next/static/**` minus maps, fail the build if `shell.html` references anything missing, and make AC-7 also parse the cached HTML.
- **P1-1** View chosen via `useSyncExternalStore` (SSR-neutral); a `shellNavigate` + event; ban `next/link`/`usePathname`/`useParams`/`useSearchParams` in the shell; AC-1b online in-shell nav.
- **P1-2** Seam API: `Stores`, `localDayOf`, id generators, read helpers, `StoreError`, `Route`/`resolveRoute` incl. `/app?tapped=`, a view-file registry, meta created on upgrade.
- **P1-3** Replace the "test hook" with the real `startRunIfNoneOpen` primitive, exposed only when `navigator.webdriver`. AC-5 runs on both projects, plus an absence AC for non-webdriver.
- **P1-4** AC-12: mirror all 14 `src/**` rules onto new-app-only dirs, with a @hulupeep waiver for the demo A11Y-003 hits. Rename the journey file to `journey_app_offline.spec.ts` (covers TEST-002). No `!` globs.
- **P1-5** `skipWaiting` only via a `SKIP_WAITING` message posted from the idle home view (closes M-9).
- **P1-6** Navigate-mode-only, path/query-ignoring cache-first SW; AC-6 adds `fromServiceWorker()` and "no `/t/` keys in the cache"; AC-6b online cache-first under a 30 s network delay.
- **P1-7** Static contract stays unit-suffixed only, plus `COPY.scene[14]` in app scope. AC-15 for QuotaExceededError → `StoreError`, zero rows.
- **P1-8** Pure functions in `lib/app/chain.ts`, tested by Playwright node-side specs (jest can't load TS), with UTC date math and two added cases.
