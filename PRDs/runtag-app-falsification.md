# Falsification Pass — runtag-app

Required output of adversary-mandate@v3 (spec-build). Fresh-context sub-run #2, 2026-10-10. Target: `PRDs/runtag-app-prd.md` **v2**; inputs: grounding, persona lens (PL-1…PL-24), docs/prd.md §4, playwright.config.ts, package.json, installed `node_modules/next` (16.1.4) source. No ADR folder in the repo → mandate clause 12 is a no-op.

**History:** v1 verdict FAIL (PRD SHA-256 0bd72e35…), stipulations S1–S16. This pass re-checks S1–S16 against v2 and attacks the v2 additions (APP-005…APP-022).

PRD SHA-256: f6c230c7e39494aa25e7e49293425df7d22764448d4dd3de834d6ffa5e7f77fc

### v1 stipulation closure (S1–S16)
| S | v1 ask | v2 location | Status | Residual (→ stipulation) |
|---|---|---|---|---|
| S1 | One tap per navigation (visible / prerender / bfcache / replaceState) + reload Gherkin | APP-016; §5 "Reload does not re-tap" | CLOSED (spec) | Next.js interaction of replaceState and hidden-doc behaviour not specified → T4 |
| S2 | Guard after tap-in **and** tap-out, `< 60 000 ms` boundary | APP-005; §5 "Double read after tap-out" | CLOSED | precedence vs APP-017/APP-002 undefined → T2 |
| S3 | On-page interaction anchor for ITP | APP-021 | CLOSED | stated as fact, is a hypothesis → overclaim row |
| S4 | Metric after APP-DURABLE, daily exports ⊇, tally, 8-day iOS check | §7 Durability | PARTIAL | "tally recorded before opening `/app`" dropped → T12 |
| S5 | persist() best-effort, warning, nudge | APP-012, APP-022 | CLOSED | "no export in 7 days" when never exported is undefined → T12 |
| S6 | Stale boundary + banner | APP-006 (`≥ 6 h`, abandon on `/app` render) | CLOSED | — |
| S7 | Origin permanence | APP-001 | CLOSED | — |
| S8 | iPhone banner flow + latency anchor | §2 iPhone row, §7 Latency | CLOSED | — |
| S9 | Feature-detect Web NFC | APP-014 | CLOSED | — |
| S10 | SW navigation fallback for never-loaded `/t/*` | APP-011 (cache-first); §5 Offline | CLOSED (spec) | App Router feasibility hazards → T3 |
| S11 | Stored `localDay`, calendar adjacency, chain 0, TZ + DST + 23:55 cases | APP-007; §5 Chain; §6 J-APP-CHAIN | PARTIAL | no DST case, no `timezoneId`, TZ Gherkin is time-of-day dependent, "today" undefined → T10 |
| S12 | Rendered-text regex oracle + whole-word terms | APP-008 | PARTIAL | wording "contract patterns … over app routes" reads as static source scan → false positives proven → T5 |
| S13 | build+start, chromium-only offline, `page.clock.install` + `Date.now()` only | §6 header, J-APP-OFFLINE | PARTIAL | clock install / Date.now()-only rule dropped; playwright.config still defaults to `next dev` → T11 |
| S14 | Unknown tag while run open → tap out here | APP-002; §5 | CLOSED | — |
| S15 | Reuse ChainVisual/NFCTag/COPY, cap long chains | §9 header; APP-009 | PARTIAL | cap size unspecified → T12 |
| S16 | Deep-equal export round trip, idempotent import | §5 Backup; §6 J-APP-BACKUP | PARTIAL | "equals exactly / byte-equal" contradicts `meta.lastExportAt` in the export → T6 |

## Premise Attack
| Premise | Source | Could be false because | Verdict | Required correction |
|---|---|---|---|---|
| "Save and start run" starts a run | APP-002 (button label); PL-8 intent "run phase is a decision the user makes" | §5 Plant scenario: press "Save and start run" → "a tap-in is NOT recorded during the 10-minute setup grace" + "Tag works ✓". The label promises a run; the canonical Gherkin forbids one. APP-017 grace is defined for "a tap", not a button press. Two engineers build opposite behaviour; P3 route 3c (plant at trailhead, go run) loses the first run either way. | FALSE (internal contradiction) | T1 |
| APP-002 / 005 / 006 / 017 are disjoint | §4 Tap safety | They overlap: grace (10 min) vs guard (60 s) both "change nothing" but render different screens; unknown tag within 60 s of tap-in hits both APP-002 "Save and tap out here" and APP-005 "a tap changes nothing"; stale abandon vs grace. No decision order. | FALSE (ambiguous precedence) | T2 |
| A cached shell can serve any never-loaded `/t/{id}` in App Router | APP-011 | Feasible only with care. `node_modules/next/dist/client/components/router-reducer/create-initial-router-state.js:24-26` sets `canonicalUrl` from `location.href` (URL is not rewritten — good), but the rendered tree/params come from the cached HTML's flight data. If the SW serves a cached `/t/aaaaaaaaaa` page for `/t/bbbbbbbbbb`, `useParams()` yields `aaaaaaaaaa` → tap recorded on the **wrong tag**. | HOLDS only with constraint | T3 |
| replaceState to `/app?tapped=` is inert | APP-016 | Next patches `history.replaceState` (`app-router.js:256-270`) and dispatches `ACTION_RESTORE` → `usePathname()` becomes `/app` while the `/t` component stays mounted. A tap component keyed on `usePathname()` re-renders with no tagId (→ "This isn't a RunTag tag" flash or re-run). On reload, `/app?tapped=` must itself render the result screen, else Undo (APP-018) vanishes on reload. | FRAGILE | T4 |
| Private mode / silos are detectable | APP-013 "storage-quota/private signals where detectable" | Chrome is moving to a predictable reported quota specifically to defeat incognito detection; Safari private has no reliable signal. "Where detectable" makes the requirement untestable (any implementation passes). iOS default-browser ≠ Safari is not detectable at all. | OVERCLAIM | T7 |
| Undo "restores the exact prior state" safely | APP-018 | Undo after a state change by another page/button (e.g. guard-screen "Finish run" at +30 s, then Undo) blindly writes stale prior state. Undo of a tap-in that also abandoned a stale run (APP-006) would reopen a stale run, which `/app` immediately re-abandons. Guard screens (APP-005) are "tap result screens" — whose transition does their Undo revert? | UNDERSPECIFIED | T8 |

## Claim Inventory
| Claim | Type | Source support | Load-bearing? | Status | What breaks downstream if wrong | Correction |
|---|---|---|---|---|---|---|
| Setup grace suppresses run state for 10 min | impl-choice | APP-017, §10 | Yes | Contradicted by APP-002 label; blocks tap-out of a <10-min run at a just-planted tag | Plant Gherkin, J-APP-PLANT | T1 |
| Concurrent loads cannot create two open runs | theorem (IDB spec: overlapping readwrite txns serialize) | APP-020 | Yes | Holds if read-decide-write awaits only IDB requests (txn auto-commits on a non-IDB await); no Gherkin/journey exercises it | "At most one open run" invariant (APP-004) untested | T9 |
| Success renders only after commit | definition | APP-019; §5 Storage failure | Yes | Testable; fault-injection method unspecified (gameable by an app-internal flag) | J-APP-RUN | T11 |
| Cache-first shell works for never-loaded `/t/*` | assumption | APP-011 | Yes | Feasible with location-derived tagId only; no SW library in package.json, Next 16 builds with Turbopack (webpack-plugin PWAs don't apply) — mechanism unnamed | J-APP-OFFLINE, W1 | T3 |
| Tap makes no network request | definition | APP-011 | Medium | App Router `<Link>` viewport prefetch fires RSC requests from tap screens unless `prefetch={false}` | Offline/lie-fi latency | T3 |
| Private/in-app detection | hypothesis | APP-013 | Medium | Private: unreliable (see ledger); in-app UA tokens: testable via Playwright `userAgent` | APP-DURABLE acceptance | T7 |
| On-page button press counts as ITP user interaction | hypothesis | APP-021 | Yes (iOS durability) | Plausible (ITP keys on first-party interaction) but unverified; §7 8-day check is the oracle | iOS data retention | overclaim row; §7 already owns the check |
| Chain counts consecutive `localDay`s ending today/yesterday | definition | APP-007 | Yes | "today" zone not stated; TZ Gherkin flips at certain clock times (runs dated after "today" are excluded) | J-APP-CHAIN | T10 |
| Round-trip export equals exactly | definition | §5 Backup, §6 "byte-equal" | Yes | Export includes `meta.lastExportAt` (APP-010/012) which differs between exports → oracle always fails or gets silently weakened | J-APP-BACKUP | T6 |
| INV-D4 regexes enforce no metrics | definition | APP-008 | Yes (guardrail metric) | As a static source scan `\b\d+\s?(…|h|…)\b` matches Tailwind `w-32 h-1` (components/IPhoneMockup.tsx:30, MapView.tsx:101, TreeIllustration.tsx:32) | Contract gate red on day 1 or regex quietly dropped | T5 |

## Dependency Audit
| Edge (A → B) | Reason edge exists | False-edge risk | Verdict | Correction |
|---|---|---|---|---|
| APP-SHELL (W1) → APP-TAP (W2) | APP-TAP uses IDB module + atomic txn helper (APP-010/020) and SW route rules (APP-011) | Low | Valid | none |
| APP-SHELL SW → `/t/*` page design | Shell-serving dictates tagId must come from `location.pathname` | Medium: W1 can pick a shell scheme APP-TAP can't use | Valid, needs contract | T3 states the rule in APP-SHELL acceptance |
| APP-TAP → chain function | Tap-out screen shows "Day N" (APP-004) | v1 hidden edge | Edge unstated in v2 §9 | MINOR — T12 places `computeChain` in APP-SHELL |
| APP-018 undo → APP-020 txn | Undo is a state write needing the same atomic CAS | Medium | Edge missing in PRD | T8 |
| APP-016 → `/app` page (APP-CHAIN) | After replaceState, reload renders `/app?tapped=` — the result screen moves into APP-CHAIN's route | Medium: W2 parallel tickets each assume the other owns it | Edge missing | T4 names APP-TAP as owner of `?tapped=` rendering |
| APP-DURABLE (W3) → §7 durability metric | Metric starts after APP-DURABLE ships | Low | Valid (S4 applied) | none |
| APP-013 → W4 real-device check | Default-browser/private behaviour of NFC launch unknown | Medium | Edge missing | T7 |

## Acceptance Gate Attack
| Gate | How it could be gamed | Missing oracle | Correction |
|---|---|---|---|
| §5 Plant "First scan" | Implement "Save and start run" as a no-op to satisfy "tap-in NOT recorded" | Assert run row after button press | T1 |
| §5 Offline "never loaded" | Use one tagId; a shell carrying that id in params passes while a second id is mis-recorded | Two distinct never-loaded ids offline; each run row's `tagInId` equals its URL id | T3 |
| §5 Reload | Test reloads `/app` without asserting the URL was replaced | `expect(page).toHaveURL(/\/app\?tapped=/)` before reload; run row still `open` after | T4 |
| APP-016 prerender/bfcache | No scenario; branch can be absent and every journey stays green | `addInitScript` stubbing `document.prerendering=true` → no run row until `prerenderingchange` dispatched | T4 |
| §5 Storage failure | App reads a test flag to fake failure | Inject via `addInitScript` making `IDBObjectStore.prototype.put/add` throw `QuotaExceededError` | T11 |
| §5 Time-zone travel | Pass/fail depends on wall-clock hour | Fixed `page.clock` time where London and New York share the date; new context with `timezoneId` and `storageState({indexedDB:true})` (Playwright ≥1.51; repo 1.57) | T10 |
| §5 Backup "equals exactly" | Engineer strips meta ad hoc to go green | Specified comparison: `tags`, `runs` sorted by id, deep-equal; meta excluded | T6 |
| APP-008 "anywhere on the page" | Static regex fails on Tailwind → regex deleted | Rendered `innerText` of `/app`, `/t/*` result screens, `/app/tags`, `/app/settings` | T5 |
| APP-020 single open run | No test | Two pages, same context, `Promise.all` goto `/t/x` → exactly one `open` row | T9 |
| APP-013 silo guard | No Gherkin at all | `userAgent` containing `Instagram` → warning + second confirm; `navigator.standalone=true` → plant blocked | T7 |

## Source / Reality Ledger
| Concrete claim | Verified against (file:line / query) | Holds? | Evidence |
|---|---|---|---|
| Next canonical URL not rewritten on hydration of a shell | node_modules/next/dist/client/components/router-reducer/create-initial-router-state.js:24-26 | Yes | "location.href is read as the initial value for canonicalUrl in the browser" |
| Next intercepts external replaceState | node_modules/next/dist/client/components/app-router.js:225-270 | Yes | `window.history.replaceState = function replaceState(…) { … applyUrlFromHistoryPushReplace(url) }` → `ACTION_RESTORE`, "Ensures usePathname and useSearchParams hold the newly provided url" |
| Proposed duration regex hits existing source | `grep -P '\b\d+\s?(…|h|…)\b'` over app/components/lib | Yes (3 hits) | components/IPhoneMockup.tsx:30 `w-32 h-1`; MapView.tsx:101 `w-3 h-3`; TreeIllustration.tsx:32 `w-32 h-4` |
| Existing INV-D4 contract scope is source globs | docs/contracts/feature_demo.yml (INV-D4 scope `app/**/*.tsx`, `components/**/*.tsx`, `lib/**/*.ts`) | Yes | "contract patterns" in this repo = static scans |
| Playwright webServer defaults to dev | playwright.config.ts:27 `process.env.CI \|\| process.env.PW_PROD ? 'npm run start' : 'npm run dev'` | Yes | `npm run start` has no build step in config |
| No SW/PWA library installed | package.json dependencies | Yes | none of serwist/next-pwa/workbox |
| Playwright projects | playwright.config.ts:16-25 | Yes | chromium + iPhone 13 (WebKit) |
| SW tests chromium only | https://playwright.dev/docs/service-workers (v1 source, still valid) | Yes | reused |
| ITP 7-day cap; persist() heuristics | https://webkit.org/tracking-prevention/ ; https://webkit.org/blog/14403/updates-to-storage-policy/ (v1) | Yes | reused |
| Incognito quota signal being removed in Chrome | https://windowsreport.com/chrome-is-outsmarting-websites-that-try-to-detect-incognito-mode/ ; https://fingerprint.com/blog/incognito-mode-detection/ (accessed 2026-10-10) | Yes | "predictable reported storage quota" replaces the quota gap |
| iOS NFC opens default browser when ≠ Safari; never Private tab | not verified (no source) | UNCERTAIN | owned W4 device check (T7) |

## Overclaim / Scope Leakage
| Text | Why it overclaims | Replacement text |
|---|---|---|
| APP-013 "and storage-quota/private signals where detectable" | No reliable signal; open-ended clause is untestable | "Private browsing is not detected (no reliable signal); the plant screen states 'Private tabs forget your chain.'" |
| APP-021 "(WebKit storage-retention signal)" | Asserted as fact; whether it resets the ITP clock is unverified | "(hypothesised WebKit user-interaction signal; confirmed or refuted by the §7 8-day iOS check)" |
| §3 "Vercel access logs contain only random tag IDs, no personal data" | Request logs also carry IP, user agent and time per online tap (PL-22) | "Vercel request logs record tag ID, IP, user agent and time for online taps (plan retention); no analytics scripts on `/t/*` or `/app*`." |
| §6 J-APP-BACKUP "byte-equal re-export" | Export contains `meta.lastExportAt` | "re-export's `tags` and `runs` (sorted by id) deep-equal the original" |
| APP-008 "Enforced by contract patterns … over app routes" | Static scan of the duration regex false-positives on Tailwind | "Duration/clock regexes run on rendered text in Playwright; static contract keeps only unit-suffixed metric literals" |

## Banned-Mode Self-Check
Each disqualifies a PASS. Mark present? + evidence for each.
| Banned mode | Present? | Evidence / note |
|---|---|---|
| blanket dependency | No | v1's persist→durability edge removed (APP-012 "best-effort"); every edge above carries a reason |
| definition-as-assumption | No | v1 page-load≡tap assumption replaced by APP-016 rules; the remaining tap-vs-button confusion is a contradiction (T1), not an assumed property |
| source laundering | No | Every platform/framework claim cites a fetched URL or file:line; the iOS default-browser claim is marked UNCERTAIN |
| nearby-proof | No | Offline for never-loaded ids is now an explicit Gherkin oracle, not inferred from `/app` being cached; T3 strengthens it to two ids |
| green-by-assertion | No (latent gaps owned) | PRD claims no green; untested branches (prerender, concurrency, silo) get oracles via T4/T7/T9 |
| inventory-as-reliance | No | All v1 sources reused were read in v1 and re-checked for validity; Next source read in this pass |
| unapplied correction | No | Every SERIOUS/MAJOR finding is an owned stipulation T1–T12 with exact replacement text; none lives only in prose |

## Final Verdict
`PASS WITH STIPULATIONS` — v2 closes 10 of 16 v1 stipulations fully and 6 partially; no remaining defect makes the product infeasible, but the canonical Plant Gherkin contradicts APP-002 and four oracles (backup, INV-D4, TZ, offline) would fail or be weakened at Gate D unless the edits below are folded into ticket acceptance. Owner of every stipulation: @hulupeep (PRD owner); ticket noted per item.

- **T1 (SERIOUS, APP-TAP / J-APP-PLANT):** APP-017 append: "Grace applies only to page loads of `/t/{tagId}`, never to buttons on the plant screen. The grace screen shows 'Tag works ✓' plus 'Finish run' when a run is open, otherwise 'Start run'." Replace §5 lines 75-78 with: `When I name it "Oak at gate" and press "Save and start run"` / `Then tag "abc123def4" is stored as "Oak at gate"` / `And exactly one run is open with tagInId "abc123def4"` / `When 2 minutes pass and I open "/t/abc123def4"` / `Then I see "Tag works ✓" and "Finish run"` / `And the run is still open`. Add scenario: `press "Just save"` → open `/t/abc123def4` within 10 min → "Tag works ✓", no run row.
- **T2 (SERIOUS, APP-TAP):** new APP-023 "Tap decision order (first match wins, all inside the APP-020 transaction): invalid id → unknown tag (APP-002) → stale abandon (APP-006, then continue) → setup grace (APP-017) → double-read guard (APP-005) → tap-out (APP-004) → tap-in (APP-003)."
- **T3 (SERIOUS, APP-SHELL + APP-TAP):** APP-011 append: "The shell reads `tagId` from `window.location.pathname` at load, never from route params; the SW serves one shell entry for every `/t/*` and `/app*` navigation (path and query ignored); tap screens disable `<Link>` prefetch. APP-SHELL names its SW build mechanism (hand-written SW + build-manifest precache list, or a Turbopack-compatible library) in its ticket." J-APP-OFFLINE: open two never-loaded ids offline; each run row's `tagInId` equals its URL id.
- **T4 (SERIOUS, APP-TAP):** APP-016 append: "`/app?tapped={runId}` renders that run's result screen (with Undo for the remaining window) from IndexedDB; the tap component captures `tagId` once and never re-derives it from `usePathname()` (Next maps replaceState to a router update). Tap logic waits for the first `visible` state rather than skipping." Tests: assert URL replaced before reload; stubbed `document.prerendering=true` → no run row until `prerenderingchange`.
- **T5 (SERIOUS, APP-SHELL):** APP-008 replace the enforcement sentence with the overclaim-table text; Playwright checks `innerText` of `/app`, `/t/*` result screens, `/app/tags`, `/app/settings` against `\b\d{1,2}:\d{2}\b` and the duration regex.
- **T6 (SERIOUS, APP-DURABLE):** §5 Backup / §6: "fresh export's `tags` and `runs`, sorted by id, deep-equal the first export's; `meta` is excluded and import never overwrites local `meta`."
- **T7 (MAJOR, APP-DURABLE + APP-LINK):** APP-013 detection list closed to `navigator.standalone === true` and UA tokens `Instagram`, `FBAN`, `FBAV`, `Line/`, `musical_ly`/`BytedanceWebview`; private mode not detected (overclaim text). Gherkin: in-app UA → warning + second confirmation; standalone → "Plant tags in Safari". W4 checklist: record which browser opens an NFC URL when iOS default ≠ Safari, and whether it can land in a Private tab.
- **T8 (MAJOR, APP-TAP):** APP-018 append: "Undo is a compare-and-set in one readwrite transaction: it applies only if the run still holds the values the transition wrote, else 'Can't undo — something changed'. A run abandoned by APP-006 stays abandoned. Guard screens offer Undo for the original transition until 60 s after it." Add Gherkin: undo tap-out → run open again, chain back to prior value.
- **T9 (MAJOR, APP-SHELL):** APP-020 append: "`now` is captured before the transaction; nothing but IDB requests is awaited inside it." Add Gherkin: two pages in one context open `/t/abc123def4` concurrently → exactly one open run.
- **T10 (MAJOR, APP-CHAIN):** APP-007 append "today = device's current local date at render". TZ scenario pinned to a clock time where London and New York share the date (e.g. 15:00 London); test re-opens via new context with `timezoneId` and `storageState({indexedDB:true})`. Add DST case: `timezoneId: 'Europe/London'`, runs on 2026-10-24/25/26 → chain 3.
- **T11 (MAJOR, APP-SHELL):** §6 append: "`page.clock.install()` before first navigation; app time via `Date.now()` only; IDB failure injected by overriding `IDBObjectStore.prototype.put/add`." playwright.config.ts app journeys run with `PW_PROD=1` after `npm run build` (CI must build before `npm run start`).
- **T12 (MINOR, various):** §7 "manual tally recorded in a dated note before opening `/app`"; APP-022 "never exported counts as >7 days"; APP-009 cap "last 30 links + count"; `computeChain` pure fn lands in APP-SHELL's store module; replace §3 Vercel-log sentence with overclaim-table text; APP-021 hypothesis wording per overclaim table.
