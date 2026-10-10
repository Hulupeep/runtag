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
