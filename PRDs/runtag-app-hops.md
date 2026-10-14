# RunTag App v1 — Pre-committed integration oracle (hops)

**Pinned:** 2026-10-10, before any app code exists · **Pinned by:** GATE A critic · **Owner:** @hulupeep
PRD SHA-256: f6c230c7e39494aa25e7e49293425df7d22764448d4dd3de834d6ffa5e7f77fc
**Bound to:** PRDs/runtag-app-prd.md v2 (hash above) and PRDs/runtag-app-verdict.md (stipulations S-1…S-14, M-1…M-11).
**Consumed by:** GATE D (feature-build epic_gate). **Amendment rule:** the build agent may not edit this file. Any change needs a dated amendment entry at the bottom, naming who changed what and why. If the PRD hash changes, the oracle must be re-pinned.

## Assertion bar
Every EXPECTED VALUE is a **re-read**. That means either (a) an IndexedDB row field read back with `page.evaluate` from DB `runtag`, stores `tags` / `runs` / `meta`, or (b) a value rendered **after `page.reload()`** or in a new page or context, such as `[data-testid=chain-visual]` `data-count`, or exact text. Element presence alone never satisfies a hop.

## Conventions
- `R(page)` = all `runs` rows sorted by `startedAt`. `T(page)` = all `tags` rows. `M(page)` = the `meta` row.
- `open(R)` = rows with `status:'open'`.
- Local URLs are relative to `baseURL` (`http://localhost:3000`, production build: `npm run build && PW_PROD=1`). Real-device hops use `https://runtag.vercel.app`.
- Time: `page.clock.install({ time: <T0> })` before the first navigation. App time comes only from `Date.now()`. Default `T0 = 2026-10-12T07:00:00+01:00`, `timezoneId: 'Europe/London'`.
- Tag ids are fixed fixtures: `A = 'aaaaaaaaaa'`, `B = 'bbbbbbbbbb'`, `C = 'cccccccccc'`, `D = 'dddddddddd'`, `X = 'abc123def4'`.
- Fault and context injection uses `addInitScript` prototype or property overrides only (test_integrity_defaults TEST-001/002: no `jest.mock` or similar, and no `mock|stub|fake|spy` together with `import|from` on one line).
- A chromium-only skip is `test.skip(browserName !== 'chromium', 'SW interception is Chromium-only in Playwright')`, never `test.skip(true)` (TEST-003).

---

## Persona 1 — iPhone runner (Playwright project `mobile`, iPhone 13 WebKit; plus real device)
| # | From | URL | Required control | EXPECTED VALUE (re-read) | Oracle / source |
|---|---|---|---|---|---|
| I1 | fresh context | `/app` | none | after reload: `chain-visual` `data-count` = `"0"`; `M.schemaVersion` = 1; `T` length 0; empty-state text contains "plant" | APP-009, APP-010; J-APP-CHAIN |
| I2 | I1 | `/app/tags` | "Create tag", name `Oak at gate`, save | `T` length 1; `T[0].name` = `"Oak at gate"`; `T[0].id` ~ `^[a-z0-9]{10}$`; `T[0].graceUntil − T[0].createdAt` = 600000; after reload the rendered URL text = `"https://runtag.vercel.app/t/" + T[0].id` (WebKit has no `NDEFReader` → copy-link branch; "Write to tag" count = 0) | APP-001, APP-014; S-7, S-8, S-9; J-APP-PLANT |
| I3 | fresh context, `X` unknown | `/t/abc123def4` | type `Oak at gate`, press "Save and start run" | `T` contains `{id:X, name:'Oak at gate'}`; `open(R)` length 1 with `tagInId` = X | APP-002; S-1 (T1 Gherkin) |
| I4 | I3, clock +2 min | `/t/abc123def4` | none | `open(R)` still length 1, same `id` as I3, `lastTapAt` unchanged; rendered "Tag works ✓" and "Finish run" | APP-017; S-1 |
| I5 | fresh context, plant `X` via "Just save" at T0; clock +11 min | `/t/abc123def4` | none (auto tap) | URL = `/app?tapped=<R[0].id>`; `R` length 1; `R[0]` = `{status:'open', tagInId:X, localDay:'2026-10-12'}` | APP-003, APP-016; §5 "Tap in then tap out"; S-4 |
| I6 | I5 | `/app?tapped=<id>` | `page.reload()` | `R` length 1, `R[0].status` = `'open'` (no re-tap); "Undo" visible because `now − R[0].lastTapAt < 60000` | APP-016, APP-018; §5 "Reload does not re-tap"; S-4 |
| I7 | I5, clock +5 s | `/t/abc123def4` | none | `R` length 1; `R[0].lastTapAt` unchanged; rendered "Finish run" | APP-005 (after tap-in) |
| I8 | I5, clock +40 min | `/t/abc123def4` | none | `R[0]` = `{status:'done', tagOutId:X}`, `endedAt` set; after reload of `/app`, `data-count` = `"1"` | APP-004, APP-007; §5 tap-out |
| I9 | I8, clock +5 s | `/t/abc123def4` | none | `R` length 1; `open(R)` length 0; rendered "Start another run" | APP-005 (after tap-out); §5 "Double read after tap-out" |
| I10 | I8 | `/app`, `/app/tags`, `/app/settings`, last `/t/*` result screen | none | `document.body.innerText` matches neither `\b\d{1,2}:\d{2}\b` nor `\b\d+\s?(min\|mins\|minutes\|h\|hr\|hrs\|hours\|s\|sec\|secs\|seconds)\b`, and contains no whole-word `FORBIDDEN_TERMS` | APP-008; S-5; M-6 |
| I11 | fresh tag `X` (planted at T0 − 1 h), clock T0 | `/t/abc123def4` | press "Undo" within 60 s | `R` length 0; after reload of `/app`, `data-count` unchanged from before the tap | APP-018; §5 "Undo" |
| I12 | `addInitScript` making `IDBObjectStore.prototype.put` and `.add` throw `QuotaExceededError`; `X` known | `/t/abc123def4` | none | rendered "This tap wasn't saved" and "Retry"; "TAGGED" count = 0; new context without the override: `R` length 0 | APP-019; §5 "Storage failure"; S-14 |
| I13 | open run seeded with `startedAt` = T0 − 6 h | `/app` | none | after reload: that row `status` = `'abandoned'`, `abandonedAt` set; `data-count` unchanged | APP-006; §5 "Forgotten tap-out" |
| I14 | `addInitScript` sets `navigator.standalone = true` | `/app/tags` | attempt "Create tag" | rendered "Plant tags in Safari"; `T` length 0 | APP-013; S-12 |
| I15 | 3 tags + 10 runs seeded | `/app/settings` | Export → clear site data → Import file → Export | 2nd export's `tags` and `runs` sorted by id deep-equal the 1st export's (`meta` excluded); importing the same file again leaves `T` = 3 and `R` = 10 | APP-012; §5 "Round trip"; S-6 |
| I16 | **real iPhone**, tag written with the URL from I2 | NFC → banner → `https://runtag.vercel.app/t/<id>` | hold phone to tag, tap the "Open in Safari" banner | Export after tap-in has the run with `status:'open'`; after tap-out, `status:'done'`; screen recording < 2 s from banner tap to first TAGGED frame (4G) | §2, §7 Latency; M-7; APP-LINK checklist |
| I17 | **real iPhone**, ≥ 8 days of NFC-launched visits only | `https://runtag.vercel.app/app` | Export daily | each day's export run-id set ⊇ the previous day's; chain = tally recorded in a dated note before opening `/app` | §7 Durability; APP-021 hypothesis; T12 |

## Persona 2 — Android runner (Playwright project `chromium`; plus real Android device)
| # | From | URL | Required control | EXPECTED VALUE (re-read) | Oracle / source |
|---|---|---|---|---|---|
| A1 | fresh context, online | `/app` | wait for SW `ready` | after reload: `navigator.serviceWorker.controller` ≠ null; `caches.keys()` contains a name including the build ID; rendered "Ready offline ✓" | APP-009, APP-011; M-9 |
| A2 | A1 | `/app/tags` | create `A` and `B` online (neither `/t/` URL ever loaded); clock +11 min | `T` length 2; both `graceUntil` < now | APP-001; S-8 |
| A3 | A2, `context.setOffline(true)` | `/t/<A.id>` | none | `R` length 1; `R[0].tagInId` = A.id (not B.id); `status` `'open'`; rendered tap screen visible < 1000 ms after `goto` resolves | APP-011; §5 Offline; S-3; M-7 |
| A4 | A3 offline, clock +61 s | `/t/<B.id>` | none | `R[0].tagOutId` = B.id, `status` `'done'` (second never-loaded id resolves correctly) | APP-011; S-3 (two-id oracle) |
| A5 | A4 offline | `/app` → `/app/tags` | in-app link | rendered tag list contains both names; `T` length 2 | S-3 (offline intra-shell navigation) |
| A6 | online; `context.route('**/*', 30 s delay)` | `/t/<A.id>` (clock +1 h) | none | `open(R)` length 1 committed and TAGGED visible < 1000 ms (cache-first, no network wait) | APP-011 cache-first; PL-10 |
| A7 | `A` known, no run open | two pages in one context, `Promise.all(goto('/t/<A.id>'))` | none | `open(R)` length exactly 1; `R` length 1 | APP-020; S-14 (T9) |
| A8 | `addInitScript` sets `document.prerendering = true` | `/t/<A.id>` | dispatch `prerenderingchange` after asserting | before dispatch `R` length 0; after dispatch `R` length 1 | APP-016; S-4 |
| A9 | new context, `userAgent` contains `Instagram` | `/t/<C.id>` (unknown) | name, save, then second confirmation | after the first save `T` length 0; after the second confirmation `T` length 1 | APP-013; S-12 |
| A10 | NDEFReader absent (desktop Chromium) | `/app/tags` | none | "Write to tag" count = 0; copy-link instructions text present; `T` unchanged | APP-014 feature-detect (the automated hop never treats a fake `NDEFReader` as proof of writing) |
| A11 | **real Android**, Chrome | `https://runtag.vercel.app/app/tags` | "Write to tag", hold sticker until "Tag ready" | NFC Tools read-back URL = `https://runtag.vercel.app/t/<id>` exactly; export shows that tag's `graceUntil` ≥ write time + 600000; the OS auto-read straight after the write creates no run (export `runs` unchanged) | APP-014, APP-017; S-8; PL-8 |
| A12 | real Android | `https://runtag-floutlabs.vercel.app/app` | open | lands on `https://runtag.vercel.app/app` (308) | S-7 |
| A13 | seeded done runs (chain fixtures, both projects) | `/app` | reload | 5 consecutive days incl. today → `data-count` `"5"`; days −3, −2, today (not −1) → `"1"`; run in at 23:55 and out at 00:20 → counted on the start `localDay`; TZ: seed 3 days in London at `2026-10-12T15:00+01:00`, reopen in a new context with `timezoneId:'America/New_York'` + `storageState({indexedDB:true})` → `"3"`; DST: `localDay` 2026-10-24/25/26, clock 2026-10-26T12:00 Europe/London → `"3"` | APP-007; §5 Chain; S-11 |
| A14 | seeded chain 40 | `/app` | reload | rendered links = 30; rendered count text = `40` | APP-009 cap; T12 |

## Persona 3 — Two-tag looper (projects `chromium` and `mobile`)
Setup: `A` and `B` planted via `/app/tags` at T0 − 1 day (grace expired). Clock at T0.

| # | From | URL | Required control | EXPECTED VALUE (re-read) | Oracle / source |
|---|---|---|---|---|---|
| L1 | setup | `/t/<A>` | none | `open(R)` length 1, `tagInId` = A | APP-003 |
| L2 | L1, clock +30 min | `/t/<B>` | none | that run `{status:'done', tagInId:A, tagOutId:B}`; after reload of `/app`, `data-count` `"1"` | APP-004 (point-to-point) |
| L3 | L2, clock +30 s | `/t/<A>` (walks back past A) | none | `R` length 1; `open(R)` length 0 (guard is tag-agnostic) | APP-005 |
| L4 | L2, clock +2 min | `/t/<A>` | press "Undo" | `R` length 1 (phantom deleted); `open(R)` 0; after reload `data-count` `"1"` | APP-018; PL-12 |
| L5 | day +1, 07:00 | `/t/<B>` then +30 min `/t/<A>` | none | new run `{tagInId:B, tagOutId:A, status:'done', localDay:'2026-10-13'}`; after reload `data-count` `"2"` | APP-004 reversed; APP-007 |
| L6 | day +2, `/t/<A>` tap-in; +30 min | `/t/<C>` (unknown on this device) | name `Bridge`, "Save and tap out here" | `T` contains C; that run `{status:'done', tagOutId:C}`; `open(R)` 0; after reload `data-count` `"3"` | APP-002 (S14/PL-7); §5 "Unknown tag while a run is open" |
| L7 | L6, clock +2 min | `/t/<C>` | none | grace for C applies after tap-out: `R` length unchanged, `open(R)` 0; rendered "Tag works ✓" and "Start run" | APP-017; S-1; S-2 order |
| L8 | open run seeded with `startedAt` = now − 7 h | `/t/<D>` (unknown) | none | old row `status` `'abandoned'`; "Save and tap out here" count = 0; after plant, `open(R)` 0 | APP-006 before APP-002; S-2 (amended T2) |
| L9 | L5 | `/app?tapped=<id>` after tap-out | press "Undo" within 60 s | that row `status` `'open'`, `endedAt`/`tagOutId` cleared; after reload `data-count` back to the pre-tap value | APP-018; S-13 (T8) |
| L10 | tap-in on A in page 1; page 2 presses guard "Finish run" | page 1 `/app?tapped=<id>` | press "Undo" | rendered "Can't undo — something changed"; row `status` stays `'done'` | APP-018 CAS; S-13 |

## Seam-derived hops (appended at GATE B)
_Empty at pin time. `node scripts/verify-seams.cjs` appends writer×writer and writer×reader hops here. Expected seams: APP-TAP×APP-CHAIN on `/app?tapped=`, APP-SHELL×APP-TAP on the shell document and `tagId` source, APP-TAGS×APP-TAP on `tag.graceUntil`, APP-DURABLE×APP-TAP on the `runs` store._

## Amendment log
| Date | Who | Change | Reason |
|---|---|---|---|
| 2026-10-10 | GATE A critic | initial pin | — |

## Gate B — seam-derived hops (appended 2026-10-10; computed with --no-resolve because APP-SHELL creates the surfaces; re-run with resolve after W1 merges)

```json
[
 {
  "surface": "/app",
  "why": "seam (mixed) between APP-CHAIN, APP-DURABLE, APP-SHELL, APP-LINK",
  "assert": "re-read value on the merged tree — not element presence"
 },
 {
  "surface": "/app/settings",
  "why": "seam (writer-writer) between APP-DURABLE, APP-SHELL",
  "assert": "re-read value on the merged tree — not element presence"
 },
 {
  "surface": "/app/tags",
  "why": "seam (writer-writer) between APP-SHELL, APP-TAGS",
  "assert": "re-read value on the merged tree — not element presence"
 },
 {
  "surface": "/t/",
  "why": "seam (writer-writer) between APP-SHELL, APP-TAP",
  "assert": "re-read value on the merged tree — not element presence"
 },
 {
  "surface": "lib/app/origin.ts",
  "why": "seam (writer-reader) between APP-SHELL, APP-TAGS, APP-TAP",
  "assert": "re-read value on the merged tree — not element presence"
 },
 {
  "surface": "lib/app/store.ts",
  "why": "seam (writer-reader) between APP-SHELL, APP-CHAIN, APP-DURABLE, APP-TAGS, APP-TAP",
  "assert": "re-read value on the merged tree — not element presence"
 },
 {
  "surface": "public/sw.js",
  "why": "seam (writer-reader) between APP-SHELL, APP-TAP",
  "assert": "re-read value on the merged tree — not element presence"
 },
 {
  "surface": "runs",
  "why": "seam (mixed) between APP-DURABLE, APP-TAP, APP-CHAIN",
  "assert": "re-read value on the merged tree — not element presence"
 },
 {
  "surface": "tags",
  "why": "seam (writer-writer) between APP-DURABLE, APP-TAGS, APP-TAP",
  "assert": "re-read value on the merged tree — not element presence"
 }
]
```

## Amendment 2026-10-10 (Gate B, duo review F-7, run 1791621982721-52edfc39)
Reason: APP-SHELL v3 declarations grew (P2-13); the seam input `evidence/seams-runtag-app.json` is now synced to the ticket's exact `writes`/`reads`, regenerated with `--no-resolve` → `evidence/seams-runtag-app.out.json` (10 seams, 10 derived hops). Pin of the original hops above is unchanged; this section only adds checks. Signoff policy: not required.

| Hop | Seam (kind) | From → URL | Required control | EXPECTED VALUE (re-read) | Oracle |
|---|---|---|---|---|---|
| G1 | `/app?tapped=` (APP-SHELL ↔ APP-TAP, writer-writer) | tap `/t/abc123def4` → replaced URL `/app?tapped={runId}` → reload | none (reload) | after reload `[data-testid=view]` `data-view` = `tapped` AND the rendered result reads the run whose IndexedDB row `id` = `{runId}` from the URL, with `status` = `open` | APP-016, verdict S-4, APP-SHELL `resolveRoute` |
| G2 | `components/scenes/Scene8CTA.tsx` (APP-SHELL ↔ APP-LINK, writer-writer) | `/` → complete demo → scene 8 | email input; "Start for real" link (APP-LINK) | email input accessible name re-read = `Email address` (APP-SHELL aria-label) AND, after APP-LINK, the £19 CTA text and waitlist form still present with "Start for real" `href` = `/app` | APP-SHELL AC-12, APP-LINK AC-1 / M-8 |

Post-build resolution for the selected slice (Gate B DoD): `node scripts/verify-seams.cjs evidence/seams-app-shell.json --repo-root .` must exit 0 — that file is the APP-SHELL entry only, identical to the ticket's complete declarations (23 writes, 1 read). Future slices resolve when they are built.

## Amendment 2026-10-12 (Gate B, F-SEAM-GRAPH; supersedes the 2026-10-10 seam inputs, not the pinned hops)
Reason: `verify-seams` resolves surfaces as text in code, so seams are now declared as route literals, `data-testid` values and **exported API identifiers** (the shared store/origin/route contract). Pinned hops I1–I17, A1–A14, L1–L10, G1 and G2 above are unchanged; G2's Scene8CTA seam is now carried by the `Email address` surface (APP-SHELL writes, APP-LINK reads).

**Two distinct computations**
1. *Epic graph* — `node scripts/verify-seams.cjs evidence/seams-runtag-app.json --no-resolve` over all six tickets (future slices' surfaces do not exist yet, so no resolution): 23 seams → `evidence/seams-runtag-app.out.json`.
2. *Selected-slice resolution* — `bash evidence/seams-check.sh`: APP-SHELL's own declarations (`evidence/seams-app-shell.json`) resolve in a clean tree and every declared file exists. Each later slice adds its own resolution when it is built.

**Shared-contract hops added (re-read values, asserted when the reading slice is built)**
| Hop | Seam | Reader | EXPECTED VALUE (re-read) |
|---|---|---|---|
| S1 | `withTxn` (APP-SHELL → TAP, CHAIN, TAGS, DURABLE) | each reader's journey | rows written by the reader's flow are present after reload; a forced failure leaves row counts unchanged |
| S2 | `startRunIfNoneOpenIn`, `getOpenRunIn` (→ TAP) | J-APP-RUN | after tap-in, exactly one `status:'open'` run row whose `tagInId` equals the URL id |
| S3 | `computeChain`, `localDayOf` (→ CHAIN, DURABLE, TAP) | J-APP-CHAIN | rendered chain after reload equals `computeChain(listRuns(), localDayOf(now))` re-read in the page |
| S4 | `tagUrl`, `TAG_ORIGIN`, `newTagId` (→ TAGS) | J-APP-PLANT | displayed/copied URL after reload equals `https://runtag.vercel.app/t/` + the stored tag id |
| S5 | `StoreError` (→ TAP, DURABLE) | J-APP-RUN, J-APP-BACKUP | storage failure shows the failure screen and store counts are unchanged |
| S6 | `resolveRoute`, `TAPPED_PREFIX`, `tapped-run` (→ TAP) | J-APP-RUN | after reload of `/app?tapped={runId}`, `data-run-id` equals the stored run id |
| S7 | `ready-offline` (→ CHAIN) | J-APP-CHAIN | the replaced home view still shows "Ready offline ✓" iff all precache entries are cached |

## Amendment 2026-10-14 (Gate B, APP-TAP scoped review F-HOPS-RECONCILIATION; pinned hop IDs unchanged)
Reason: APP-TAP's B.5 pre-flight and scoped review corrected how several pinned hops must be exercised. The expected values above are unchanged; only the harness that reaches them is reconciled, so the ticket and this oracle prescribe compatible checks.

| Hop | Reconciled harness |
|---|---|
| I12 | Failure injection is armed through a `sessionStorage` flag read by an init script **after** the database exists (arming in the previous page is lost on the new document); "rows unchanged" is re-read in the **same** context, never a fresh one (a fresh context is trivially empty). |
| A8 | `document.prerendering` is a **configurable getter** flipped before dispatching `prerenderingchange`; the bfcache half is replaced by the once-per-document rule (Playwright Chromium runs with the back/forward cache disabled): a reload or in-shell Back to `/t/` records nothing (APP-TAP AC-TAP-19). |
| I4–I11, L1–L10, A3–A7 | Time via `page.clock.setFixedTime()` per step (never `clock.install` with `pauseAt`/`runFor`: `withTxn` settles on a real `setTimeout`); journeys pinned to `timezoneId: 'Europe/London'`; latency (A3, A6) measured Node-side between `goto` resolving and the result becoming visible. |
| I7, I9 | Guard URLs carry the scanned tag (`&tag=`); cross-tag variants: tap in at A, scan B, reload, "Finish run" → `tagOutId` = B; tap out at A, scan B, reload, "Start another run" → `tagInId` = B. |

**New seam hop S8 — `abandonStaleIn` (writer APP-TAP, reader APP-CHAIN)**
| Step | From → URL | Control | EXPECTED VALUE (re-read) | Owner |
|---|---|---|---|---|
| S8.1 | seed via the real store: open run R0 with `startedAt` = now − 7 h; tag A planted > 10 min ago | — | `R0.status` = `'open'` | fixture |
| S8.2 | `/t/<A>` | none (auto tap) | after reload: `R0` = `{status:'abandoned', abandonedAt: now}` with all other fields unchanged; exactly one new open run with `tagInId` = A; stale notice visible | APP-TAP (AC-TAP-11) |
| S8.3 | seed a second stale open run R9 (`startedAt` = now − 7 h, no tap); open `/app` | none | after reload: `R9.status` = `'abandoned'`, `abandonedAt` set; `chain-value` unchanged; no open-run banner for R9 | APP-CHAIN (AC-CHAIN-5) |

## Amendment 2026-10-14b (Gate B, APP-CHAIN B.5 pre-flight; pinned hop IDs and expected values unchanged)
Reason: the APP-CHAIN v2 declarations (docs/specs/app/APP-CHAIN.md, evidence/seams-app-chain.json) add surfaces, so the epic seam graph was recomputed with `--no-resolve` (evidence/seams-runtag-app.out.json). Two new derived seams get checks; the harness for the pinned CHAIN hops is reconciled with the ticket.

| Hop | Reconciled harness |
|---|---|
| I1 | "after reload" on a fresh context; `chain-visual` stays rendered in the empty state (`data-count` `"0"`) next to `empty-state`, whose text contains lowercase `plant`. |
| A13 (TZ) | `storageState({indexedDB:true})` is the export of the seeding context (`context.storageState({ indexedDB: true })`), restored with `browser.newContext({ ...testInfo.project.use, timezoneId: 'America/New_York', storageState })`; precondition: `listRuns()` in the new context deep-equals the seeded rows. DST clock `2026-10-26T12:00:00Z`. The 23:55 → 00:20 run is produced through `tapAtTag`, never seeded. |
| A14 | "rendered links" = count of `[data-testid=chain-visual] [data-testid^=chain-day-]`; no horizontal scroll at the mobile width. `data-count` means links rendered (`min(chain, 30)`); the chain itself is `chain-value`. |

**New seam hop S9 — `stale-notice` (writers APP-TAP and APP-CHAIN)**
| Step | From → URL | Control | EXPECTED VALUE (re-read) | Owner |
|---|---|---|---|---|
| S9.1 | seed open run R9 with `startedAt` = now − 7 h; open `/app` | none | after reload at the same clock: `stale-notice` text = "Your last run wasn't tapped out, so it didn't count."; R9 `abandonedAt` = now | APP-CHAIN (AC-CHAIN-5) |
| S9.2 | same clock + 61 s, reload `/app` | none | `stale-notice` absent; R9 unchanged | APP-CHAIN (AC-CHAIN-5) |

**New seam hop S10 — `store-error` (writer APP-SHELL, reader APP-CHAIN)**
| Step | From → URL | Control | EXPECTED VALUE (re-read) | Owner |
|---|---|---|---|---|
| S10.1 | database pre-created at version 2; open `/app` | none | `store-error` visible on the replaced home view; tags/runs counts unchanged (AC-SHELL-16 unmodified) | APP-CHAIN (AC-CHAIN-12) |

## Amendment 2026-10-14c (Gate B, APP-TAGS B.5 pre-flight; pinned hop IDs and expected values unchanged)
Reason: the APP-TAGS v2 declarations (docs/specs/app/APP-TAGS.md, evidence/seams-app-tags.json) add surfaces, so the epic seam graph was recomputed with `--no-resolve` (evidence/seams-runtag-app.out.json). New derived seams get checks; owners and harness of the TAGS hops are reconciled with the ticket.

| Hop | Reconciled harness / owner |
|---|---|
| I2 | Button label "Create tag" (`tag-create`); runs in `chromium` and `mobile`; `createdAt` = the fixed clock; the WebKit "Write to tag = 0" half is AC-TAGS-4. Owner APP-TAGS (AC-TAGS-1). |
| A2 | Owner APP-TAGS (AC-TAGS-10): tags created through the UI, both `graceUntil` < now at +11/12 min, a tap at that clock is a tap-in (no grace). |
| A5 | Owner APP-TAGS (AC-TAGS-10): offline `/app` → `nav-tags` lists both names; chromium only (SW interception). |
| A10 | Seeded rows plus a positive control (harness `NDEFReader` → `tag-write` present); without it `tag-write` = 0 and the writer-app steps are shown (AC-TAGS-4). |
| A11 | Real Android, listed verbatim in the APP-LINK #19 device checklist (APP-TAGS DoD), incl. "NFC switched off → NotReadableError message". |

**New seam hop S11 — `graceUntil` (writer APP-TAGS, reader APP-TAP)**
| Step | From → URL | Control | EXPECTED VALUE (re-read) | Owner |
|---|---|---|---|---|
| S11.1 | tag created 1 h before writeTime; `/app/tags` with the Web NFC harness | "Write to tag" | row `graceUntil` = writeTime + 600000; `/t/{id}` at writeTime and writeTime + 2 min → `/app?grace={id}`, "Tag works ✓", `listRuns()` = `[]` | APP-TAGS (AC-TAGS-5) |
| S11.2 | tag created 1 h before T0; no Web NFC | "Copy link" at T0 | row `graceUntil` = T0 + 600000; `/t/{id}` at T0 + 5 min → `/app?grace={id}`, `listRuns()` = `[]` | APP-TAGS (AC-TAGS-3) |

**New seam hop S12 — `tags` (writer APP-TAGS, reader APP-CHAIN `empty-state`)**
| Step | From → URL | Control | EXPECTED VALUE (re-read) | Owner |
|---|---|---|---|---|
| S12.1 | fresh device; create one tag on `/app/tags` | `goto('/app')`, reload | `empty-state` count 0; `chain-value` `"0"`; `listTags()` length 1 | APP-TAGS (AC-TAGS-1) |
