# APP-LINK: demo link to the app + real-device release check

**Epic:** RunTag App v1 (PRDs/runtag-app-prd.md @ f6c230c7…) · **Wave:** W4 · **Priority:** P2 · **Depends on:** APP-SHELL #26, APP-TAP #27, APP-CHAIN #29, APP-TAGS #31, APP-DURABLE #33 — all merged and live
**Persona:** a demo visitor who wants the real thing; the owner releasing v1 on real phones · **Promise:** "The demo leads to the real thing, and the real thing works on a real phone."
**Gate A:** SHIP_WITH_STIPULATIONS — verdict §7 APP-LINK items 1–3 (M-8, M-11/M-1, real-device checklist incl. T12 part) folded. **B.5:** docs/specs/app/APP-LINK-preflight.md — C1 (owner decision 2026-10-20, option A), P1-1…P1-5, P2-1…P2-4 folded (v2).
**Pinned hops:** G2 (automated); I16, I17, A11, A12 (real devices, owner — A12 re-stated by the owner-approved hops amendment 2026-10-20); verdict ledger #20, #21 (release smoke).
**Covers:** APP-101, the v1 release checklist, the T12 release-notes text.

Revenue statement (M-11 / M-1): see release-note string R3 below.

## Scope
### In scope
- Demo scene 8 (`components/scenes/Scene8CTA.tsx`): an **added** link "Start for real" to `/app`. The "Get Starter Kit – £19" button, the waitlist email form (`aria-label="Email address"`), social proof and "Restart Demo" stay unchanged (M-8).
- Release notes `docs/release/runtag-app-v1.md` with the corrected texts R1–R4 (T12, M-11).
- The real-device checklist `docs/release/runtag-app-v1-device-checklist.md`, items 1–10, each with hop id and named Gate D evidence files.
- A release smoke script `scripts/release-smoke.sh` (owner/agent-run after deploy; never in CI or `npm test`).
### Not in scope
Executing the device checklist and signing it (owner only — Gate D); any change to the demo's waitlist, pricing or copy beyond the added link (demo copy slice #12 stays parked); PRD §7 14-day durability metric (owner, from the daily I17 exports, recorded in Gate D findings); persona-lens §5 asks 2 and 5 (recorded as observations if seen, not release blockers).

## Rules
- **Link (P2-1):** a plain `<a href="/app" data-testid="start-for-real" className="cta-button secondary inline-flex min-h-[48px] min-w-[48px] items-center justify-center">Start for real</a>` — not a `motion` element and not `next/link` (a full document load into the app shell), with exactly the text "Start for real" and no other added copy. It is placed after the `{!submitted ? form : success}` block and before the social-proof `<p>`, so it renders whether or not the waitlist was submitted; "Restart Demo" stays last.
- **Release notes (P1-3):** `docs/release/runtag-app-v1.md` contains each of these four strings exactly, as raw markdown (backticks included), each on its own line:
  - R1 = `Vercel request logs record tag ID, IP, user agent and time for online taps (plan retention); no analytics scripts on `/t/*` or `/app*`.`
  - R2 = `Every tap screen shows one primary button (hypothesised WebKit user-interaction signal; confirmed or refuted by the §7 8-day iOS check).`
  - R3 = `Revenue: none in v1; validation only. Alternative today: calendar/streak app or iOS Shortcuts NFC automation; delta: no install, no typing, metric-free chain.`
  - R4 = `Private browsing is not detected (no reliable signal); the plant screen states 'Private tabs forget your chain.'`
  The release notes never quote the replaced PRD §3 sentence; parenthetical notes in this ticket are commentary, not release-note text.
- **Release smoke (P1-1, P2-3, C1):** `scripts/release-smoke.sh` (`set -euo pipefail`, `curl -sS --max-redirs 0`, no cookies, read-only GETs) prints one line per check, `<check> <status> <location-or-marker> PASS|FAIL`, and exits 0 only if all pass:
  1. **Shell:** `GET https://runtag.vercel.app/t/{id}` with a fresh `[a-z0-9]{10}` id from `/dev/urandom` → 200, the body contains `<title>RunTag</title>` and `data-testid="view"`, and every `<script src=…>` starts with `/_next/static/` (PL-22: no third-party scripts).
  2. **Aliases (owner decision 2026-10-20, option A):** `GET https://runtag-floutlabs.vercel.app/app` and `GET https://runtag-git-main-floutlabs.vercel.app/app`, anonymous → each is either 302/307 with `Location` starting `https://vercel.com/sso-api`, or 308 with `Location: https://runtag.vercel.app/app`; a 200 or any other status fails.
  3. **Service worker:** `GET https://runtag.vercel.app/sw.js` → 200, `Cache-Control: no-cache`, and the body matches `const BUILD_ID = '([^'_][^']*)'` (a rendered id, never `__BUILD_ID__`).
  4. **This release is live (ledger #20):** `GET https://runtag.vercel.app/` → 200 and at least one `/_next/static/chunks/*.js` referenced by that HTML contains `start-for-real`; polled every 30 s for up to 10 min, so it can start as soon as the merge lands.
  The build agent runs it once the merge commit's production deployment is READY and commits the raw output to `evidence/release-smoke-<issue>.txt` in a docs-only follow-up (the Ignored Build Step skips that deploy); the same file is copied to `gate-d/runtag-app/evidence/release-smoke.txt`.
- **Device checklist (P1-2, P1-4, P2-4):** each item is a `### <n>. <title>` section with these lines in this order: `Hop:` (hop id or `—`), `Expected:`, `Evidence:` (file names under `gate-d/runtag-app/evidence/`, `.png`/`.txt`/`.json` only), `Result:`, `Date:`, `Phone / OS / browser:`. Items:
  1. Stickers — Hop `—`; purchase date of NTAG213/215 recorded before the walk (M-10); evidence `stickers-purchase.png`.
  2. iPhone tap — Hop `I16` (review F-I16-PRECONDITIONS); setup on the iPhone, all in the same Safari (not a Private tab): create the tag at `https://runtag.vercel.app/app/tags` and note the time, copy its link, write that link with the iOS writer app; the read-back is exactly `https://runtag.vercel.app/t/<id>`; open `/app` and confirm no "Run in progress" banner (no open run). Wait until at least 11 minutes after the last Create or Copy link (the setup grace ends 10 minutes after either; never copy again). Tap-in: NFC banner → "Open in Safari" → TAGGED (screen recording; < 2 s from the banner tap to the first TAGGED frame on 4G, M-7); export (run `open`). Wait at least 61 seconds (the double-read guard) and less than 6 hours (the stale threshold), then tap-out at the same or another known tag → "Day N. Chain unbroken." or "Run saved."; export (run `done`). If a tap shows "Tag works ✓" (grace) or "You're in. Now go." with "Finish run" (guard), record it as a timing deviation, not a product failure, and repeat the step after waiting. Evidence `I16-timeline.txt` (tag created, last copy, tap-in, tap-out times and the screen shown at each tap), `I16-export-after-in.json`, `I16-export-after-out.json`, `I16-latency.txt` (fps, banner-tap frame, first TAGGED frame, ms), `I16-first-tagged-frame.png` (the recording itself is kept but is not Gate D evidence).
  3. iPhone default browser — Hop `—`; which browser opens the NFC URL when the default is not Safari, and whether it can land in a Private tab (S-12); evidence `iOS-default-browser.txt` (browser name and version, Private yes/no).
  4. iPhone retention — Hop `I17`; `Expected:` contains the APP-DURABLE DoD text exactly (extraction rule in AC-LINK-5); plus a line `APP-021 hypothesis:` confirmed (no data lost over ≥ 8 days of NFC-launched visits) / refuted (loss observed: date and what was lost); evidence `I17-export-<YYYY-MM-DD>.json` per day, `I17-tally.txt`, `I17-silo.png`.
  5. Android writing — Hop `A11`; `Expected:` contains the APP-TAGS DoD text exactly; plus `Expected copy: "NFC is switched off. Turn on NFC in your phone's settings, then try again, or copy the link instead."`; evidence `A11-export.json`, `A11-nfctools-readback.png`, `A11-nfc-off.png`.
  6. Alias domain — Hop `A12` (owner amendment 2026-10-20): (a) on an Android browser **not** signed in to Vercel, `https://runtag-floutlabs.vercel.app/app` shows the Vercel login, never RunTag; (b) in a browser signed in to Vercel, the same URL lands on `https://runtag.vercel.app/app` (address bar re-read); evidence `A12-anonymous.txt` (URL opened, final address bar URL, page title), `A12-signed-in.txt` (URL opened, final address bar URL), `A12-anonymous.png`, `A12-signed-in.png`.
  7. Unauthenticated tag URL — Hop `—` (ledger #21); `https://runtag.vercel.app/t/{id}` on mobile data opens the app, no Vercel login; evidence `unauth-t.txt` (URL opened, final address bar URL, first heading shown), `unauth-t.png`.
  8. Primary metric — Hop `—`; ≥ 5 real runs in 7 days with physical tags; the chain equals a manual tally written in a dated note **before** opening `/app` each day (T12); evidence `primary-metric.txt` (dated tally rows and chain value per day).
  9. Demo link — Hop `G2`; on a phone, the demo's "Start for real" lands on `/app`; evidence `demo-link.txt` (start URL, final address bar URL, whether "Get Starter Kit – £19" and the email field were visible on scene 8), `demo-link.png`.
  10. Day change — Hop `—` (APP-CHAIN #29 rule "Day change"); `/app` open in iPhone Safari before local midnight, switch to another app, return after midnight without reloading → today's history day and state show the new day; evidence `day-change.txt` (time left, time returned, the last history day shown before and after), `day-change.png`.

## Acceptance Criteria
| AC | Criterion | Oracle (re-read value) |
|---|---|---|
| AC-LINK-1 | Scene 8 gains "Start for real" (M-8, G2) | both projects, scene 8 reached by testids: `start-for-real` visible with `href` = `/app` and text exactly "Start for real"; the button "Get Starter Kit – £19" and the email input with accessible name "Email address" are still present; activating the link → `data-view` = `home`, path `/app`, and `performance.getEntriesByType('navigation')[0].name` ends with `/app` (a document load); the link stays available after a waitlist signup (review F-MOCKED-SIGNUP-ORACLE): no signup is faked in the journey (test-integrity contract) — instead a node-side source check of components/scenes/Scene8CTA.tsx finds `data-testid="start-for-real"` after the closing of the `{!submitted ? … : …}` block (after the `You&apos;re on the list!` success markup) and before the social-proof element, i.e. outside both branches, so it renders in either state |
| AC-LINK-2 | Accessible and unobtrusive | focus the email input; Tab → the £19 button is focused; Tab → `start-for-real` is focused; Enter → a document load of `/app`; its `boundingBox()` (read before any hover) is ≥ 48 × 48; DOM order inside `scene-8`: form → `start-for-real` → social-proof text → `restart-button` (`compareDocumentPosition`) |
| AC-LINK-3 | Demo unchanged otherwise | every pre-existing Playwright spec (all of tests/e2e and tests/invariants except journey_app_link.spec.ts) passes, and `git diff --stat main -- tests/` lists only the new spec |
| AC-LINK-4 | Release notes carry the corrected texts (T12, M-11) | the spec reads R1–R4 from its own constants and finds each as an exact line in docs/release/runtag-app-v1.md; the file does not contain "contain only random tag IDs" |
| AC-LINK-5 | Device checklist complete and Gate D ready | the spec reads docs/release/runtag-app-v1-device-checklist.md: sections 1–10 present; every section has non-empty `Hop:`, `Expected:`, `Evidence:`, `Result:`, `Date:`, `Phone / OS / browser:` lines in that order; items 2, 4, 5, 6 carry `Hop: I16`, `I17`, `A11`, `A12`; every evidence name ends in .png, .txt or .json, and every value-bearing item — 2, 3, 4, 5, 6, 7, 8, 9 and 10 — lists at least one .txt or .json (screenshots alone never satisfy a value check; review F-GATE-D-VALUE-EVIDENCE); item 2 lists `I16-timeline.txt`; item 6 lists `A12-anonymous.txt` and `A12-signed-in.txt`; item 9 lists `demo-link.txt`; item 4 has an `APP-021 hypothesis:` line; for each of docs/specs/app/APP-TAGS.md and docs/specs/app/APP-DURABLE.md the spec reads the single line containing `APP-LINK #19 device checklist`, extracts the text between the first `"` after `verbatim:` and the last `"` on that line, and finds it as an exact substring of item 5 (APP-TAGS) and item 4 (APP-DURABLE) |
| AC-LINK-6 | Release smoke against production | after the merge: `bash scripts/release-smoke.sh` exit 0; the captured `evidence/release-smoke-<issue>.txt` shows four PASS lines and the BUILD_ID value |

## Gherkin
```gherkin
Feature: From the demo to the app
  Scenario: Start for real
    Given I finished the demo and see scene 8
    Then I still see "Get Starter Kit – £19" and the waitlist form
    When I choose "Start for real"
    Then I am on "/app"
```

## Journey (Definition of Done)
J-APP-LINK (`tests/e2e/journey_app_link.spec.ts`, contract `docs/contracts/journey_app_link.yml`), projects chromium + mobile. Scene 8 is reached with testids (P2-2): `start-demo-button` → `nfc-tag` → `scene-5` (timeout 10 000) → `nfc-tag` → `page.getByTestId('scene-6').getByRole('button')` → `page.getByTestId('scene-7').getByRole('button')` → `scene-8` visible; `tap()` on `mobile`, `click()` on `chromium`. The static release-document checks run in both projects (read-only, idempotent). The release smoke runs after deploy and its raw output is retained as evidence; the device checklist is executed and signed by the owner in Gate D.

## Declarations (Gate B)
Surfaces are route literals, `data-testid` values and exported identifiers as they appear in code. `scene-8`, `Email address`, `restart-button`, `/app` resolve pre-build (APP-SHELL / demo); `start-for-real` and `Start for real` resolve only after this build. The APP-LINK entry of evidence/seams-runtag-app.json is updated to the same writes/reads and the epic graph is recomputed with `--no-resolve`.
writes: [`start-for-real`, `Start for real`]
reads: [`/app`, `scene-8`, `Email address`, `restart-button`, `data-view`]
files: [`components/scenes/Scene8CTA.tsx`, `docs/release/runtag-app-v1.md`, `docs/release/runtag-app-v1-device-checklist.md`, `scripts/release-smoke.sh`, `tests/e2e/journey_app_link.spec.ts`, `docs/contracts/journey_app_link.yml`, `evidence/seams-app-link.json`, `evidence/seams-runtag-app.json`]
adrNone: "repo has no ADR folder"

Post-build (DoD): `bash evidence/seams-check.sh evidence/seams-app-link.json` exits 0 on a clean tree; the epic graph is recomputed with `--no-resolve`.

## Definition of Done
- [ ] Every criterion in the Acceptance Criteria table asserted; `npm run test:contracts` + full Playwright (chromium + mobile) green on CI (Gate C); AC-LINK-6 captured after deploy
- [ ] provenance record `evidence/provenance-<issue>.json` passes `scripts/provenance-gate.cjs` on the branch diff
- [ ] production code < 1000 hand-written lines (owner amendment 2026-10-13: tests and contracts excluded)
- [ ] `bash evidence/seams-check.sh evidence/seams-app-link.json` exits 0 after build
- [ ] PRDs/runtag-app-hops.md carries the dated, owner-approved amendment 2026-10-20 re-stating A12 as in checklist item 6 (owner decision recorded in evidence/run-contract-runtag-app.yml before the build)
- [ ] Device checklist handed to the owner for Gate D (not signed by an agent)
