# RunTag App v1 — GATE A verdict

**Critic:** single hostile adversary (adversary-mandate@v3, adversarial-prd-review 7-pass) · **Date:** 2026-10-10
**Target:** PRDs/runtag-app-prd.md v2 (not edited by this review)
PRD SHA-256: f6c230c7e39494aa25e7e49293425df7d22764448d4dd3de834d6ffa5e7f77fc
**Informing lenses (not deciders):** PRDs/runtag-app-falsification.md (PASS WITH STIPULATIONS T1–T12, hash-bound; `node scripts/verify-falsification.cjs … --require-pass --binds-prd` exit 0, re-run by this critic), PRDs/runtag-app-persona-lens.md (PL-1…PL-24).
**Owner context applied:** storage on-device only; owner granted autonomy; revenue is not a v1 goal (personal use + validation). Pass 7 is judged against that. No revenue requirement is invented here.
**ADR folder:** none (`docs/adr|adrs|architecture` absent). Mandate clause 12 is a no-op.

Verdict: SHIP_WITH_STIPULATIONS

**Why not SHIP:** the canonical Gherkin contradicts APP-002. The falsification's own decision order (T2) lets a stale run be tapped out. The offline shell rule (T3) cannot be built as literally worded on a multi-route App Router. Two production aliases open silent storage silos. Several oracles would fail or get weakened at Gate D.

**Why not DO_NOT_SHIP:** every FATAL candidate I raised is closed by a concrete edit folded into a named §9 ticket (below). None of them needs a PRD rewrite, a new dependency or a decision the owner has not delegated. Because the PRD stays hash-bound, corrections go into ticket acceptance, not into the PRD text. If the PRD is edited, falsification must be re-run.

Issue count: **0 FATAL · 14 SERIOUS · 11 MINOR = 25.** All 25 are owned by @hulupeep and assigned to a ticket. 0 are UNRESOLVED.

---

## 1. Seven-pass findings

### Pass 1 — JTBD coherence
- JTBD (§1) names a real user (the owner), a functional job (record "I went" with zero typing), an emotional job (no metric guilt) and an honour-system boundary. **No FATAL.**
- **MINOR M-1 (Ramen test).** The PRD never names the alternative the owner uses today. That could be a paper or wall calendar, a streak app such as Streaks or "Don't Break the Chain", or an iOS Shortcuts NFC personal automation that appends a row to Numbers. The delta is real (no install, no typing, a physical ritual at the spot, a chain with no metrics), but the PRD should say so.

### Pass 2 — Traceability matrix
| Req | Testable? | Ambiguous? | AC exists? | Note |
|---|---|---|---|---|
| APP-001 | Yes | **Yes** — constrains the tag string, not the origin the app runs on | Partly | S-7 |
| APP-002 | Yes | **Yes** — contradicts §5 Plant; stale-vs-unknown order | Yes (wrong) | S-1, S-2 |
| APP-003/004 | Yes | No | Yes | — |
| APP-005 | Yes | Precedence vs grace/unknown | Yes | S-2 |
| APP-006 | Yes | Future `startedAt` | Yes | M-5 |
| APP-007 | Yes | "today" zone; TZ Gherkin depends on wall-clock time | Yes (flaky) | S-11 (T10) |
| APP-008 | Yes | Static vs rendered | Yes (gameable) | S-5 |
| APP-009 | Yes | Cap size | Partly | T12 |
| APP-010 | Yes | **Entity shapes untyped** | No | S-9 |
| APP-011 | Yes | **Shell mechanism infeasible as worded** | Yes (one id only) | S-3 |
| APP-012 | Yes | Import "validated" undefined | Partly | M-4 |
| APP-013 | **No** ("where detectable") | Yes | No | S-12 (T7) |
| APP-014 | Partly (Web NFC not automatable) | No | No | S-8 |
| APP-015 | Partly | — | No | S-10 |
| APP-016 | Yes | replaceState × Next router | Partly | S-4 |
| APP-017 | Yes | **Keyed on creation only** | Yes (wrong) | S-1, S-8 |
| APP-018 | Yes | CAS, reload survival | Yes | S-4, S-13 |
| APP-019 | Yes | Injection method | Yes | S-14 (T11) |
| APP-020 | Yes | — | **No** | S-14 (T9) |
| APP-021 | No (hypothesis) | — | §7 owns it | T12 |
| APP-022 | Yes | "never exported" | No | T12 |
| APP-101 | Yes | Add vs replace the £19 CTA | No | M-8 |
| APP-102 | Yes | — | No | — |

### Pass 3 — Two-engineer test (blockers)
See S-1, S-2, S-3, S-4, S-7, S-8, S-9. Each would make two engineers build different things on day 1.

### Pass 4 — Scope boundary
In and out of scope are explicit (§3). Unmentioned load-bearing items: non-canonical production aliases (S-7), service-worker update/versioning policy (M-9), import validation (M-4), default contracts that scan nothing (S-10), and the demo INV-D3 contract colliding with app code (M-3).

### Pass 5 — Dependencies
| Edge | Reason | Verified? | Verdict |
|---|---|---|---|
| APP-SHELL → APP-TAP | IDB module, atomic txn, SW shell | Code does not exist yet; sequencing in §9 is correct | Valid |
| APP-SHELL shell scheme → APP-TAP tagId source | Shell serving dictates `location.pathname` | — | Valid; must be a written contract (S-3) |
| APP-TAP ↔ APP-CHAIN on `/app?tapped=` | Reload of the replaced URL lands on `/app` | — | Owner = APP-TAP (S-4) |
| APP-TAGS Web NFC write → APP-TAP grace | Android auto-read after write | — | **Missing in PRD** (S-8) |
| Vercel `runtag` project → origin | Tag origin | **TRUE** via Vercel API (ledger) | Valid; alias silo risk (S-7) |
| NTAG213/215 stickers | Physical test | Owner buys, no date | MINOR M-10 |
| iOS writer app, iOS default-browser behaviour | W4 | **UNVERIFIED**, owned by W4 check | Acceptable, owned |
| No SW/PWA library; Next 16.1.4 | Build mechanism | **TRUE**; mechanism must be named (S-3) | Valid |

### Pass 6 — Success metrics
- Primary: ≥5 runs in 7 days and chain = tally. Machine-checkable from the export run set. The tally must be recorded before the owner opens `/app` (T12).
- Durability: daily export run-id ⊇ previous. Machine-checkable.
- **MINOR M-7.** The latency metric (< 2 s on 4G, < 1 s offline) has no measurement method. Real device: screen recording, counting frames from the banner tap or tag contact to the first TAGGED frame. Automated (offline): `performance.now()` from navigation start to the TAGGED element being visible, < 1000 ms in J-APP-OFFLINE.
- Guardrail: INV-D4. Currently gameable (S-5).

### Pass 7 — Revenue / willingness to pay
The PRD is honestly a **personal-use feature spec**. Payments and waitlist are explicitly out (§3), and the owner context says revenue is not a v1 goal. This is not a defect. **MINOR M-11:** the PRD never states this in words. The APP-LINK ticket must carry the line "Revenue: none in v1; validation only; the demo's £19 starter-kit CTA and waitlist are unchanged", so no engineer wires a payment path.

### Banned-language scan
- "robust", "seamless", "etc.": none.
- "where detectable" (APP-013) is an escape hatch → S-12.
- "(WebKit storage-retention signal)" (APP-021) states a hypothesis as fact → T12.
- "best-effort" (APP-012) is acceptable because the fallback (export plus nudge) is specified.
- "versioned migrations" (APP-010) has no v1→v2 content, which is acceptable at v1. But the APP-SHELL ticket must define `onupgradeneeded` for v1 only and reject a newer `schemaVersion` on import.

---

## 2. FATAL candidates attacked and not sustained (refutation log)
1. **"An NFC URL tap cannot drive a stateful app without a server."** Refuted: IndexedDB per origin, plus tagId in the path, plus the stored state machine. No server is needed. The honour-system boundary is stated (§1).
2. **"A cached shell can't serve a never-loaded `/t/{id}`."** Feasible only under the single-shell-route constraint (S-3). It is closable in APP-SHELL, so not FATAL.
3. **"iOS evicts data → the core job fails."** Mitigated by export/import, a restore link on the plant screen, and the backup nudge. The outcome is measured by the §7 8-day check. For personal-use validation this is an owned risk, not a blocker.
4. **"The origin is not under owner control."** Refuted: the Vercel API shows `runtag.vercel.app` verified on project `prj_dKKjiH8GRLPDpZHGvoMnqmSEnivf`.
5. **"Gate D tests can't run against a production build."** Refuted for CI: `.github/workflows/e2e.yml:22-26` builds and then runs with `CI=true` → `npm run start`.
6. **"The falsification PASS is stale."** Refuted: the verifier exits 0 and the hash matches.

---

## 3. SERIOUS findings
| ID | Finding (evidence) | Ticket |
|---|---|---|
| S-1 | §5 Plant (prd:75-78) has "Save and start run" record no tap-in. APP-002 (prd:32) promises a run, and APP-017 grace is defined for "a tap", not a button. (= T1) | APP-TAP |
| S-2 | **T2's own order is wrong.** It puts "unknown tag (APP-002)" before "stale abandon (APP-006)", so a ≥6 h open run is offered "Save and tap out here" and **counts**, which violates APP-006 "never counts". | APP-TAP |
| S-3 | **T3 as worded is infeasible.** "SW serves one shell entry for every `/t/*` and `/app*`" on a multi-route App Router hydrates the cached route's flight tree: `/t/x` would render the `/app` page (falsification ledger: create-initial-router-state.js:24-26 keeps the URL, but the tree comes from the cached HTML). No SW library exists (package.json:15-34), `public/` is empty, and `next.config.mjs:2` is empty. | APP-SHELL |
| S-4 | replaceState → Next `ACTION_RESTORE` changes `usePathname()` under a mounted `/t` component. On reload of `/app?tapped=`, Undo is lost unless `/app` renders the result. (= T4) | APP-TAP |
| S-5 | APP-008 "contract patterns" would mean a static scan. The duration regex hits Tailwind `w-32 h-1` (components/IPhoneMockup.tsx:30, MapView.tsx:101, TreeIllustration.tsx:32; re-run by this critic: also app/globals.css:43,61,71,80,102,107,119). The existing runtime check is substring-based (tests/invariants/invariants.spec.ts:66-68) and `COPY.scene4.narrative` = "No pace to check." (lib/constants.ts:41): the reuse of COPY that §9 mandates would trip a whole-word "pace" check. (= T5 + new) | APP-SHELL |
| S-6 | The backup "byte-equal" check is broken by `meta.lastExportAt`. (= T6) | APP-DURABLE |
| S-7 | **NEW. Production aliases are separate origins.** The Vercel API lists `runtag.vercel.app`, `runtag-floutlabs.vercel.app` and `runtag-git-main-floutlabs.vercel.app`. Planting on any alias other than `runtag.vercel.app` writes IndexedDB to another origin, so every tag tap (on `runtag.vercel.app`) sees "Plant this tag". If the tag URL is built from `location.origin`, the sticker is printed with a non-canonical origin (and the git alias is behind SSO: `ssoProtection.deploymentType = all_except_custom_domains`). APP-001 constrains only the string. | APP-SHELL + APP-TAGS |
| S-8 | **NEW. Grace is keyed on creation only.** APP-017 (prd:42) covers "10 min after a tag is created". Creating on `/app/tags` and doing the Web NFC write later than 10 min re-creates PL-8 route 2a (Android auto-read after write = tap-in at home). The tag record has no `createdAt` field anywhere in APP-010. | APP-SHELL + APP-TAGS |
| S-9 | **NEW. No entity types.** APP-010 names stores but no shapes for Tag, abandoned Run fields, Meta or the export file. This fails the Specflow compliance check (every entity needs a schema). | APP-SHELL |
| S-10 | **NEW, loophole (always-green).** The default contracts scope only `src/**`: security_defaults.yml:23,48,67,82,99; accessibility_defaults.yml:22,35,48,61; production_readiness_defaults.yml:21,56,84. The repo has **no `src/`**, so SEC-003 (innerHTML), SEC-004 (eval), A11Y-001…004 and PROD-002 scan zero files and pass forever. App code that parses user-supplied import JSON is unguarded. | APP-SHELL |
| S-11 | The TZ Gherkin is wall-clock dependent; no DST case; "today" is undefined. (= T10) | APP-CHAIN |
| S-12 | APP-013 "where detectable" is untestable; there is no silo Gherkin. (= T7) | APP-DURABLE + APP-LINK |
| S-13 | Undo is a blind overwrite. (= T8) | APP-TAP |
| S-14 | APP-020 has no oracle; storage-failure injection is gameable; local Playwright defaults to `next dev` (playwright.config.ts:27). (= T9, T11) | APP-SHELL |

## 4. MINOR findings
| ID | Finding | Ticket |
|---|---|---|
| M-1 | Alternative not named (Ramen test) | APP-LINK |
| M-2 | T12 bundle: tally before opening `/app`; "never exported" = >7 days; chain cap = last 30 links + count; `computeChain` in the APP-SHELL store; §3 Vercel-log sentence false (IP/UA/time are logged); APP-021 hypothesis wording | per item below |
| M-3 | Demo contract INV-D3 (feature_demo.yml:39-47, scope `hooks/**/*.ts`, `components/**/*.tsx`; `hooks/useDemoState.ts` exists) forbids `chainCount: <digit>` and declares that chain values "live only in lib/constants.ts". App code in those dirs collides with it. | APP-CHAIN |
| M-4 | Import "validated" is undefined (persona 5d) | APP-DURABLE |
| M-5 | `startedAt > now` (clock moved back) never goes stale (PL-24) | APP-TAP |
| M-6 | Countdown copy ("Undo 42s", "10 min grace") would itself violate APP-008's rendered regex | APP-TAP |
| M-7 | Latency metric has no measurement method | APP-SHELL (offline) + APP-LINK (device) |
| M-8 | APP-101: add vs replace the scene-8 CTA (components/scenes/Scene8CTA.tsx:80-83 uses `COPY.scene8.cta` "Get Starter Kit – £19") | APP-LINK |
| M-9 | No SW update policy; a cache-first shell can pin a stale deploy indefinitely | APP-SHELL |
| M-10 | Sticker purchase has no date; W4 can't start without stickers | APP-LINK |
| M-11 | No revenue statement (Pass 7) | APP-LINK |

---

## 5. Reality-grounding ledger
| # | Claim (PRD / grounding / falsification) | Verified against | Result |
|---|---|---|---|
| 1 | Stack Next.js 16, React 18, Tailwind, Framer Motion | package.json:19 `"next": "^16.1.4"`, :20 react ^18.2.0, :18 framer-motion, :33 tailwindcss; node_modules/next/package.json version 16.1.4 | TRUE |
| 2 | Playwright chromium + iPhone 13 WebKit | playwright.config.ts:16-25 | TRUE |
| 3 | Playwright ≥1.51 (`storageState({indexedDB})`) | node_modules/@playwright/test version 1.57.0; package.json:26 | TRUE |
| 4 | Journeys run against `next build && next start` (§6) | .github/workflows/e2e.yml:22 `npm run build`, :24-26 `CI: 'true'` → playwright.config.ts:27 `npm run start`; locally defaults to `npm run dev` | TRUE in CI / FALSE locally (S-14) |
| 5 | No SW/PWA library installed | package.json:15-34 (no serwist/next-pwa/workbox) | TRUE |
| 6 | Manifest/icons/SW exist | `public/` is empty; next.config.mjs:2 `const nextConfig = {}` | FALSE (to be built in APP-SHELL; PRD does not claim they exist) |
| 7 | `next build` mechanism | node_modules/next/dist/bin/next:89 offers `--turbopack` and `--webpack` flags | TRUE; mechanism must be named (S-3) |
| 8 | Reuse `components/ChainVisual.tsx` | ChainVisual.tsx:5-11 `count: number`, :15 `data-count={count}`; renders `count` divs with no cap | TRUE (reusable); cap needed (T12) |
| 9 | Reuse `components/NFCTag.tsx` ripple | NFCTag.tsx:7-14 `onTap` button component with ripple | TRUE (visual only; it is a button, not NFC) |
| 10 | COPY has TAGGED / Run started / "You're in. Now go." | lib/constants.ts:36-38 | TRUE |
| 11 | COPY has "Day N. Chain unbroken." | lib/constants.ts:50 literal "Day 5. Chain unbroken." | TRUE as text; N must be templated, not reused literally |
| 12 | COPY safe to reuse under APP-008 | lib/constants.ts:41 "No pace to check." | FALSE for scene4/scene1 copy (S-5) |
| 13 | INV-D4 contract exists, static scope | docs/contracts/feature_demo.yml:22-37 scope app/components/lib | TRUE |
| 14 | Proposed duration regex false-positives on source | grep over app/components/lib: IPhoneMockup.tsx:30, MapView.tsx:101, TreeIllustration.tsx:32, app/globals.css (7 lines) | TRUE (worse than falsification reported) |
| 15 | Runtime INV-D4 check exists | tests/invariants/invariants.spec.ts:58-68, substring `toContain` | TRUE; substring, not whole-word |
| 16 | Default contracts protect app code | security_defaults.yml:23 etc. scope `src/**`; `ls src` → absent | FALSE (S-10) |
| 17 | Vercel project `runtag` exists | .vercel/project.json `projectName: runtag`; Vercel API get_project id prj_dKKj…, framework nextjs | TRUE |
| 18 | `https://runtag.vercel.app` is the production domain | Vercel API list_project_domains: `runtag.vercel.app` verified:true, redirect:null | TRUE |
| 19 | It is the only origin serving the app | Vercel API get_project domains: also `runtag-floutlabs.vercel.app`, `runtag-git-main-floutlabs.vercel.app` | FALSE (S-7) |
| 20 | Git `main` → production | Vercel API: latestDeployment target production READY; branch mapping not exposed in this response | UNVERIFIED (grounding cites Vercel API) |
| 21 | runtag.vercel.app publicly reachable (no SSO) | get_project ssoProtection `all_except_custom_domains`; curl blocked (no network in sandbox) | UNVERIFIED. W4 checklist: unauthenticated GET `/t/{id}` → 200 |
| 22 | §3 "Vercel logs contain only random tag IDs, no personal data" | Platform request logs carry IP/UA/time (falsification ledger) | FALSE (T12) |
| 23 | Falsification is hash-bound to this PRD | `node scripts/verify-falsification.cjs PRDs/runtag-app-falsification.md --require-pass --binds-prd PRDs/runtag-app-prd.md` → "✓ … PRD hash matches", exit 0; sha256sum = f6c230c7… | TRUE |
| 24 | Next intercepts replaceState / canonicalUrl from location | falsification ledger (app-router.js:225-270; create-initial-router-state.js:24-26), not re-read by this critic | UNVERIFIED by critic (accepted as cited file:line) |
| 25 | Journey test files must not use mocks / `test.skip(true)` | test_integrity_defaults.yml:32-49 (TEST-001), :67-73 (TEST-002), :93-95 (TEST-003) | TRUE: constrains T11/T4 injection wording (use `addInitScript` prototype overrides, no `mock/stub/fake` + `from` on one line; chromium-only skip via `test.skip(browserName !== 'chromium', '<reason>')`) |
| 26 | iOS NFC opens default browser / never Private; iOS writer app works; ITP interaction signal | no source | UNVERIFIED, owned by the W4 real-device checklist (APP-LINK) |
| 27 | No ADR folder | `ls docs/adr docs/adrs docs/architecture` → absent | TRUE (clause 12 no-op) |

## 6. Loophole hunt (results)
| Loophole | Status | Closed by |
|---|---|---|
| Always-green default contracts scanning zero files | **Survives today** | S-10 |
| INV-D4 regex deleted after day-1 red | Latent | S-5 |
| Offline test with one tagId passes a wrong-tag shell | Latent | S-3 |
| App-internal "fail storage" flag | Latent | S-14 |
| Backup equality silently weakened | Latent | S-6 |
| Concurrency invariant untested | Latent | S-14 |
| Element-presence assertions | Barred by §6 line 166 + hops oracle | PRDs/runtag-app-hops.md |
| Web NFC write "success" proven by a stubbed `NDEFReader` | Latent (Playwright has no NFC) | hops H-A3: automated hop asserts the feature-detect branch only; the real write is a W4 device hop with a read-back value |
| Chromium-only offline marked green on mobile by an unconditional skip | Latent | TEST-003 forbids `test.skip(true)`; skip must carry a reason |

---

## 7. Stipulations — owned edits per ticket (owner of all: @hulupeep)
The PRD stays at the hash above. Each item below is acceptance text that **must be copied into the named ticket**. Gate B (board-auditor) fails a ticket that lacks its items. Falsification T1–T12 are adopted verbatim **except where amended here** (T2 → S-2, T3 → S-3).

### APP-SHELL (W1)
1. **S-3 (amends T3).** All app routes are one client shell. `next.config.mjs` `rewrites` map `/t/:tagId` and `/app/:path*` (and `/app`) to a single page, e.g. `app/(shell)/shell/page.tsx`. Its client component switches on `window.location.pathname` and reads `tagId` from `location.pathname` only, never from route params or `usePathname()`. The SW precaches that one shell document plus its build assets and serves it **cache-first** for every navigation matching `/t/*` or `/app*`, ignoring path and query. Ticket names the SW mechanism: a hand-written `public/sw.js` with a precache list generated post-build from `.next` build manifests (no webpack-plugin PWA). Shell links use `prefetch={false}`. Oracle: offline, two never-loaded ids → each run row's `tagInId` equals its URL id. Also, offline navigation `/app` → `/app/tags` renders the tags view.
2. **S-7.** `TAG_ORIGIN = 'https://runtag.vercel.app'` is a constant in `lib/`. Tag URLs are built only from it, never from `location.origin`. `next.config.mjs` `redirects` with `has: [{type:'host', value:'(?!runtag\\.vercel\\.app).*'}]` send 308 for `/app/:path*`, `/app` and `/t/:path*` to `https://runtag.vercel.app/...` (production builds only; localhost exempt). The W4 checklist verifies that `runtag-floutlabs.vercel.app/app` redirects.
3. **S-9 + S-8 schema.** TypeScript interfaces in the store module:
   - `Tag {id; name; createdAt:number; graceUntil:number}`
   - `Run {id; status:'open'|'done'|'abandoned'; tagInId; tagOutId?; startedAt; endedAt?; abandonedAt?; localDay:'YYYY-MM-DD'; tzOffsetMin; lastTapAt}`
   - `Meta {schemaVersion:1; persistResult?:boolean; lastExportAt?:number; backupNudgeDismissedUntil?:number}`
   - `ExportFile {schemaVersion:1; exportedAt; tags:Tag[]; runs:Run[]; meta:Meta}`

   `graceUntil = createdAt + 600 000` at creation.
4. **S-14 (T9 + T11).** APP-020: `now` is captured before the transaction, and only IDB requests are awaited inside it. Oracle: two pages in one context `Promise.all` goto `/t/x` → exactly one `open` row. §6 rule: `page.clock.install()` before the first navigation, and app time via `Date.now()` only. IDB failure is injected with `addInitScript` overriding `IDBObjectStore.prototype.put` and `.add` to throw `QuotaExceededError`. Local journey runs use `npm run build && PW_PROD=1 npx playwright test` (CI already builds: e2e.yml:22).
5. **S-5 (T5 + new).** APP-008 enforcement is the rendered `innerText` of `/app`, every `/t/*` result screen, `/app/tags` and `/app/settings` against `\b\d{1,2}:\d{2}\b` and `\b\d+\s?(min|mins|minutes|h|hr|hrs|hours|s|sec|secs|seconds)\b`, plus whole-word `FORBIDDEN_TERMS`. The static contract keeps only the existing unit-suffixed patterns (feature_demo.yml:30-33). App routes must not render `COPY.scene1` or `COPY.scene4` (lib/constants.ts:41 "pace").
6. **S-10.** Add `app/**`, `components/**`, `lib/**` and `hooks/**` to the scopes of SEC-003, SEC-004, A11Y-001…004 and PROD-002, or record a per-rule waiver in the contract file. Add a contract test: every `non_negotiable` rule's scope matches ≥1 file. Contract edits are made by @hulupeep, since LLMs may not modify non-negotiables.
7. **T12 part.** `computeChain(runs, todayLocalDay)` is a pure function in the store module (consumed by APP-TAP and APP-CHAIN).
8. **M-9.** The SW cache name includes the Next build ID. A new SW precaches fully before `activate` deletes old caches. No `skipWaiting` mid-tap. "Ready offline ✓" requires the shell plus all precache entries present.
9. **M-7 (offline).** J-APP-OFFLINE asserts that TAGGED is visible < 1000 ms after `goto` resolves offline.

### APP-TAP (W2)
1. **S-1 (= T1).** APP-017 append: "Grace applies only to page loads of `/t/{tagId}`, never to plant-screen buttons. The grace screen shows 'Tag works ✓' plus 'Finish run' when a run is open, otherwise 'Start run'." Replace §5 Plant lines 75-78 with the T1 Gherkin, which asserts exactly one open run with `tagInId "abc123def4"` after "Save and start run", plus the "Just save" scenario.
2. **S-2 (amends T2).** New APP-023 decision order, first match wins, all inside the APP-020 transaction:
   1. invalid id
   2. stale abandon (APP-006; a run with `startedAt > now` also counts as stale (M-5)), then continue
   3. unknown tag (APP-002; "Save and tap out here" only if a **non-stale** run is open)
   4. setup grace (`now < tag.graceUntil`)
   5. double-read guard (APP-005)
   6. tap-out (APP-004)
   7. tap-in (APP-003)

   Gherkin: open run started 7 h ago + unknown tag → old run `abandoned`, plant screen without "Save and tap out here".
3. **S-4 (= T4).** `/app?tapped={runId}` renders that run's result screen from IndexedDB, with Undo while `now − run.lastTapAt < 60 000` (derived from the stored value, not a component timer). APP-TAP owns this render inside the shell. `tagId` is captured once from `location.pathname`. Tap logic waits for the first `visible` and non-prerendering state, and ignores `pageshow.persisted`. Tests assert `toHaveURL(/\/app\?tapped=/)` before reload, and that stubbed `document.prerendering=true` produces no run row until `prerenderingchange`.
4. **S-13 (= T8).** Undo is a compare-and-set in one readwrite txn. Otherwise it shows "Can't undo — something changed". Abandoned runs stay abandoned. Gherkin: undo tap-out → run `open`, chain back to the prior value after reload.
5. **M-6.** No countdowns or durations in copy. Undo and grace show no seconds or minutes.

### APP-CHAIN (W2)
1. **S-11 (= T10).** "today = device's current local date at render". TZ scenario at fixed `2026-10-12T15:00:00+01:00`. Re-open in a new context with `timezoneId:'America/New_York'` and `storageState({indexedDB:true})` → chain 3. DST: `timezoneId:'Europe/London'`, done runs with `localDay` 2026-10-24/25/26, clock 2026-10-26T12:00 → chain 3.
2. **T12 part.** ChainVisual is capped at the last 30 links plus a numeric count. Days before the first ever done run render neutral (PL-16).
3. **M-3.** Either rename app-side variables away from `chainCount` or narrow INV-D3 scope to the demo files (feature_demo.yml:41-43) via an @hulupeep contract edit. The app chain value comes from `computeChain`, not `CHAIN.*`.

### APP-TAGS (W3)
1. **S-7.** Displayed and copied tag URL = `TAG_ORIGIN + '/t/' + id`. Oracle: rendered URL text after reload equals that string.
2. **S-8.** On successful `NDEFReader.write`, set `tag.graceUntil = Date.now() + 600 000` in the same flow, before showing "Tag ready". Write errors show plain language and fall back to copy-link (PL-17). Feature-detect only (`'NDEFReader' in window`).

### APP-DURABLE (W3)
1. **S-6 (= T6).** Round trip: the fresh export's `tags` and `runs`, sorted by id, deep-equal the first export's. `meta` is excluded. Import never overwrites local `meta`.
2. **S-12 (= T7).** APP-013 detection is closed to `navigator.standalone === true` and the UA tokens `Instagram`, `FBAN`, `FBAV`, `Line/`, `musical_ly`, `BytedanceWebview`. Private mode is not detected; the plant screen states "Private tabs forget your chain." Gherkin: in-app UA → warning, and the tag row exists only after the second confirmation. Standalone → "Plant tags in Safari" and no tag row.
3. **M-4.** Import validation: JSON parses; `schemaVersion === 1`; each tag matches `^[a-z0-9]{10}$` with name 1–40 chars; each run has the required fields with valid `status` and `localDay` `^\d{4}-\d{2}-\d{2}$`. Any failure rejects the whole file with "This isn't a RunTag backup" and **zero writes** (oracle: store counts unchanged).
4. **T12 part.** APP-022: "never exported" counts as >7 days.

### APP-LINK (W4)
1. **M-8.** "Start for real" → `/app` is **added** as a secondary link in scene 8. The £19 CTA and waitlist stay untouched.
2. **M-11 / M-1.** Ticket body states: "Revenue: none in v1; validation only. Alternative today: calendar/streak app or iOS Shortcuts NFC automation; delta: no install, no typing, metric-free chain."
3. **Real-device checklist (S-12, ledger #20, #21, #26, M-7, M-10).**
   - Sticker purchase date set before W4.
   - Unauthenticated GET `https://runtag.vercel.app/t/{id}` → 200 (no Vercel login).
   - `runtag-floutlabs.vercel.app/app` → 308 to the canonical origin.
   - iOS: which browser opens the NFC URL when the default ≠ Safari, and can it land in a Private tab.
   - iOS writer app writes a URL that reads back exactly.
   - Latency measured by screen recording (< 2 s from banner tap to TAGGED on 4G).
   - 8-day iOS retention check.
   - T12: §3 privacy sentence replaced with the overclaim text in the release notes; §7 tally recorded in a dated note before opening `/app`; APP-021 worded as a hypothesis.

---

## 8. Final tally
- Total issues: 25 (0 FATAL, 14 SERIOUS, 11 MINOR)
- Issues closed by an owned stipulation folded into a ticket: 25/25
- UNRESOLVED: 0
- Integration oracle pinned: PRDs/runtag-app-hops.md (same PRD hash, pin date 2026-10-10)
- GitHub issue creation still requires the owner's approval of this verdict (spec-build GATE_A rule). This critic does not create issues.

## Human approval for issue creation
Approved by owner @hulupeep via standing authorization given 2026-10-10 in the Claude Code session
("Full: Create issues after a SHIP verdict, push branches, open + merge PRs to main when tests pass, deploy").
Recorded by the builder; this is a pre-authorization, not a signature. Signoff policy: not required (spec-build GATE_A).
