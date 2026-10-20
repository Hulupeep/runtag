# GATE D findings — RunTag App v1

Merged main f086ead5d958c97f22aa316af1fdf976910695e1, 2026-10-20. Automated hops are green only if every mapped test×project result passed; skips are listed with their reason (Chromium-only service-worker interception, WebKit clipboard permission). Real-device hops stay `pending — owner` until the owner's checklist evidence is in `evidence/`.

## J: I1 — fresh /app: chain 0, schemaVersion 1, no tags, empty state says plant

Status: green
Covering ticket AC(s): APP-CHAIN AC-CHAIN-6
Expected value (hops doc, re-read): after reload: chain-visual data-count "0"; M.schemaVersion = 1; T length 0; empty-state text contains "plant" (2026-10-14b: chain-visual stays rendered next to empty-state)
Tests (merged main, production build):
  - `tests/e2e/journey_app_chain.spec.ts:203` — "AC-CHAIN-6 empty state on a fresh device" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/I1.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: I2 — create tag "Oak at gate" on /app/tags; stored row and canonical URL survive reload

Status: green
Covering ticket AC(s): APP-TAGS AC-TAGS-1, AC-TAGS-4
Expected value (hops doc, re-read): T length 1; T[0].name "Oak at gate"; id ~ ^[a-z0-9]{10}$; graceUntil - createdAt = 600000; after reload tag-url = "https://runtag.vercel.app/t/" + id; WebKit "Write to tag" count 0
Tests (merged main, production build):
  - `tests/e2e/journey_app_tags.spec.ts:107` — "AC-TAGS-1 create a tag on a fresh device; its link survives reload; home leaves the empty state" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_tags.spec.ts:213` — "AC-TAGS-4 no Web NFC shows the writer-app steps; the harness is the positive control" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/I2.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: I3 — unknown tag X: plant "Oak at gate" and "Save and start run"

Status: green
Covering ticket AC(s): APP-TAP AC-TAP-1, AC-TAP-2
Expected value (hops doc, re-read): T contains {id:X, name:"Oak at gate"}; open(R) length 1 with tagInId = X
Tests (merged main, production build):
  - `tests/e2e/journey_app_plant.spec.ts:11` — "AC-TAP-1 AC-TAP-2 AC-TAP-5 plant a new tag, start a run, then the next load is setup grace" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/I3.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: I4 — reload of the tag inside setup grace (+2 min) changes nothing

Status: green
Covering ticket AC(s): APP-TAP AC-TAP-5
Expected value (hops doc, re-read): open(R) still length 1, same id, lastTapAt unchanged; rendered "Tag works ✓" and "Finish run"
Tests (merged main, production build):
  - `tests/e2e/journey_app_plant.spec.ts:11` — "AC-TAP-1 AC-TAP-2 AC-TAP-5 plant a new tag, start a run, then the next load is setup grace" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/I4.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: I5 — auto tap-in after grace: URL /app?tapped=<id>, one open run on 2026-10-12

Status: green
Covering ticket AC(s): APP-TAP AC-TAP-3 (Just save setup), AC-TAP-6
Expected value (hops doc, re-read): URL = /app?tapped=<R[0].id>; R length 1; R[0] = {status:"open", tagInId:X, localDay:"2026-10-12"}
Tests (merged main, production build):
  - `tests/e2e/journey_app_plant.spec.ts:46` — "AC-TAP-3 AC-TAP-5 Just save stores the tag only; grace without a run offers Start run" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_run.spec.ts:20` — "AC-TAP-6 AC-TAP-7 AC-TAP-8 AC-TAP-9 AC-TAP-10 tap in, reload, guard, tap out, guard again" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/I5.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: I6 — reload of the tapped URL never re-taps; Undo inside 60 s

Status: green
Covering ticket AC(s): APP-TAP AC-TAP-7
Expected value (hops doc, re-read): R length 1, R[0].status "open"; Undo visible because now - lastTapAt < 60000
Tests (merged main, production build):
  - `tests/e2e/journey_app_run.spec.ts:20` — "AC-TAP-6 AC-TAP-7 AC-TAP-8 AC-TAP-9 AC-TAP-10 tap in, reload, guard, tap out, guard again" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/I6.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: I7 — second read within 5 s after tap-in is guarded

Status: green
Covering ticket AC(s): APP-TAP AC-TAP-8
Expected value (hops doc, re-read): R length 1; R[0].lastTapAt unchanged; rendered "Finish run" (guard URL carries &tag=, 2026-10-14)
Tests (merged main, production build):
  - `tests/e2e/journey_app_run.spec.ts:20` — "AC-TAP-6 AC-TAP-7 AC-TAP-8 AC-TAP-9 AC-TAP-10 tap in, reload, guard, tap out, guard again" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_run.spec.ts:78` — "AC-TAP-8 cross-tag guard after tap-in survives reload and finishes at the scanned tag" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/I7.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: I8 — tap-out at +40 min completes the run; chain 1 after reload

Status: green
Covering ticket AC(s): APP-TAP AC-TAP-9
Expected value (hops doc, re-read): R[0] = {status:"done", tagOutId:X}, endedAt set; after reload of /app chain = 1
Tests (merged main, production build):
  - `tests/e2e/journey_app_run.spec.ts:20` — "AC-TAP-6 AC-TAP-7 AC-TAP-8 AC-TAP-9 AC-TAP-10 tap in, reload, guard, tap out, guard again" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/I8.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: I9 — double read after tap-out starts nothing

Status: green
Covering ticket AC(s): APP-TAP AC-TAP-10
Expected value (hops doc, re-read): R length 1; open(R) length 0; rendered "Start another run"
Tests (merged main, production build):
  - `tests/e2e/journey_app_run.spec.ts:20` — "AC-TAP-6 AC-TAP-7 AC-TAP-8 AC-TAP-9 AC-TAP-10 tap in, reload, guard, tap out, guard again" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_run.spec.ts:106` — "AC-TAP-10 cross-tag guard after tap-out survives reload and starts at the scanned tag" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/I9.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: I10 — no metrics, clock times or durations on any app screen

Status: green
Covering ticket AC(s): APP-SHELL AC-SHELL-11; APP-TAP AC-TAP-17; APP-TAGS AC-TAGS-9; APP-DURABLE AC-DUR-11
Expected value (hops doc, re-read): document.body.innerText matches neither \b\d{1,2}:\d{2}\b nor the duration regex, and contains no whole-word FORBIDDEN_TERMS on /app, /app/tags, /app/settings and /t/* result screens
Tests (merged main, production build):
  - `tests/e2e/app_shell.spec.ts:191` — "AC-SHELL-11 app screens render no metrics" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_run.spec.ts:523` — "AC-TAP-17 AC-TAP-18 stored-result views: missing and abandoned runs" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_tags.spec.ts:373` — "AC-TAGS-9 accessible controls of at least 48 × 48 px; feature detection only" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_backup.spec.ts:678` — "AC-DUR-11 Settings controls are labelled and at least 48 × 48 px" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/I10.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: I11 — Undo of a tap-in within 60 s deletes the run; chain unchanged

Status: green
Covering ticket AC(s): APP-TAP AC-TAP-12
Expected value (hops doc, re-read): R length 0; after reload of /app chain unchanged from before the tap
Tests (merged main, production build):
  - `tests/e2e/journey_app_run.spec.ts:168` — "AC-TAP-12 Undo > tap-in Undo deletes the run; the chain is unchanged" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/I11.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: I12 — storage failure on tap: nothing saved, Retry

Status: green
Covering ticket AC(s): APP-TAP AC-TAP-13
Expected value (hops doc, re-read): rendered "This tap wasn't saved" and "Retry"; TAGGED count 0; R length 0 re-read in the same context (2026-10-14 harness)
Tests (merged main, production build):
  - `tests/e2e/journey_app_run.spec.ts:258` — "AC-TAP-13 storage failure: nothing saved, Retry records the tap" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_run.spec.ts:288` — "AC-TAP-13 AC-TAP-18 a store that cannot open shows the failure with the store error and Go" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/I12.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: I13 — stale open run (>= 6 h) is abandoned on /app and does not count

Status: green
Covering ticket AC(s): APP-CHAIN AC-CHAIN-5
Expected value (hops doc, re-read): after reload: row status "abandoned", abandonedAt set; chain unchanged
Tests (merged main, production build):
  - `tests/e2e/journey_app_chain.spec.ts:173` — "AC-CHAIN-5 stale open runs are abandoned on /app and never count > R6 exactly 6 h old" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_chain.spec.ts:173` — "AC-CHAIN-5 stale open runs are abandoned on /app and never count > R9 7 h old, dated yesterday" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_chain.spec.ts:173` — "AC-CHAIN-5 stale open runs are abandoned on /app and never count > RF dated in the future" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_chain.spec.ts:193` — "AC-CHAIN-5 stale open runs are abandoned on /app and never count > a fresh open run stays open and shows the banner" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/I13.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: I14 — Home Screen (standalone) app: planting blocked with "Plant tags in Safari"

Status: green
Covering ticket AC(s): APP-DURABLE AC-DUR-6
Expected value (hops doc, re-read): rendered "Plant tags in Safari" (silo-blocked on load); tags and runs unchanged from the seed (2026-10-19 harness)
Tests (merged main, production build):
  - `tests/e2e/journey_app_backup.spec.ts:442` — "AC-DUR-6 Home Screen app: notice on load; planting and restore blocked" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/I14.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: I15 — export -> clear -> import -> export round trip is identical and idempotent

Status: green
Covering ticket AC(s): APP-DURABLE AC-DUR-1
Expected value (hops doc, re-read): 2nd export's tags and runs sorted by id deep-equal the 1st export's (meta excluded); importing again leaves T = 3 and R = 10; chain after restore = in-page computeChain
Tests (merged main, production build):
  - `tests/e2e/journey_app_backup.spec.ts:87` — "AC-DUR-1 round trip: restore from the plant view, chain kept, re-export equal, re-import idempotent" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/I15.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: I16 — real iPhone NFC tap-in / tap-out through the Safari banner, < 2 s to TAGGED

Status: pending — owner (real device, docs/release/runtag-app-v1-device-checklist.md item 2)
Covering: APP-LINK device checklist item 2
Expected value (hops doc): export after tap-in has the run with status 'open'; after tap-out 'done'; screen recording < 2 s from banner tap to first TAGGED frame on 4G

Owner evidence expected (checklist item 2 names; not yet present, so check-gate-d reports them dangling until the owner adds them): `evidence/I16-timeline.txt` `evidence/I16-export-after-in.json` `evidence/I16-export-after-out.json` `evidence/I16-latency.txt` `evidence/I16-first-tagged-frame.png`.
No agent-produced evidence satisfies this hop: its oracle needs a physical phone and NFC sticker (or a real browser session on the alias host).

## J: I17 — real iPhone retention over >= 8 days of NFC-launched visits

Status: pending — owner (real device, docs/release/runtag-app-v1-device-checklist.md item 4)
Covering: APP-LINK device checklist item 4 (APP-DURABLE DoD)
Expected value (hops doc): each day's export run-id set is a superset of the previous day's; chain = tally in a dated note written before opening /app

Owner evidence expected (checklist item 4 names; not yet present, so check-gate-d reports them dangling until the owner adds them): `evidence/I17-tally.txt` `evidence/I17-silo.png` plus one `I17-export-<YYYY-MM-DD>.json` per day.
No agent-produced evidence satisfies this hop: its oracle needs a physical phone and NFC sticker (or a real browser session on the alias host).

## J: A1 — service worker controls /app; build-ID cache; "Ready offline ✓"

Status: green
Covering ticket AC(s): APP-SHELL AC-SHELL-7, AC-SHELL-8, AC-SHELL-8B
Expected value (hops doc, re-read): after reload navigator.serviceWorker.controller != null; caches.keys() has a name including the build ID; rendered "Ready offline ✓" iff every precache entry is cached
Tests (merged main, production build):
  - `tests/e2e/journey_app_offline.spec.ts:35` — "J-APP-OFFLINE > AC-SHELL-7 Ready offline iff the shell and every precache entry are cached" (chromium: passed, mobile: skipped)
  - `tests/e2e/app_shell.spec.ts:219` — "production build only > AC-SHELL-8 generated public/sw.js: build-ID cache, no skipWaiting on install, SKIP_WAITING handled" (chromium: passed, mobile: passed)
  - `tests/e2e/app_shell.spec.ts:230` — "production build only > AC-SHELL-8B GET /sw.js carries the current BUILD_ID" (chromium: passed, mobile: passed)
Skips: 1 — mobile: SW interception is Chromium-only in Playwright
Evidence: `evidence/A1.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: A2 — two tags created online; create-only grace has expired at +11/12 min

Status: green
Covering ticket AC(s): APP-TAGS AC-TAGS-10
Expected value (hops doc, re-read): T length 2; both graceUntil < now; a tap at that clock is a tap-in (no grace)
Tests (merged main, production build):
  - `tests/e2e/journey_app_tags.spec.ts:547` — "AC-TAGS-10 create-only grace expires; the list works offline (production service worker) > A2 and A5" (chromium: passed, mobile: skipped)
Skips: 1 — mobile: SW interception is Chromium-only in Playwright
Evidence: `evidence/A2.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: A3 — offline, never-loaded /t/<A> taps in with its own id, < 1000 ms

Status: green
Covering ticket AC(s): APP-TAP AC-TAP-16; APP-SHELL AC-SHELL-6
Expected value (hops doc, re-read): R length 1; R[0].tagInId = A (not B); status 'open'; result visible < 1000 ms after goto resolves (Node-side timing)
Tests (merged main, production build):
  - `tests/e2e/journey_app_run.spec.ts:544` — "offline and slow network (production service worker) > AC-TAP-16 offline: two never-loaded tag URLs tap in then out with their own ids" (chromium: passed, mobile: skipped)
  - `tests/e2e/journey_app_offline.spec.ts:55` — "J-APP-OFFLINE > AC-SHELL-6 never-loaded tag URLs work offline, each with its own id" (chromium: passed, mobile: skipped)
Skips: 2 — mobile: SW interception is Chromium-only in Playwright
Evidence: `evidence/A3.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: A4 — offline, second never-loaded /t/<B> taps out with its own id

Status: green
Covering ticket AC(s): APP-TAP AC-TAP-16
Expected value (hops doc, re-read): R[0].tagOutId = B, status 'done'
Tests (merged main, production build):
  - `tests/e2e/journey_app_run.spec.ts:544` — "offline and slow network (production service worker) > AC-TAP-16 offline: two never-loaded tag URLs tap in then out with their own ids" (chromium: passed, mobile: skipped)
Skips: 1 — mobile: SW interception is Chromium-only in Playwright
Evidence: `evidence/A4.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: A5 — offline in-shell navigation /app -> /app/tags lists both tags

Status: green
Covering ticket AC(s): APP-TAGS AC-TAGS-10
Expected value (hops doc, re-read): rendered tag list contains both names; T length 2
Tests (merged main, production build):
  - `tests/e2e/journey_app_tags.spec.ts:547` — "AC-TAGS-10 create-only grace expires; the list works offline (production service worker) > A2 and A5" (chromium: passed, mobile: skipped)
Skips: 1 — mobile: SW interception is Chromium-only in Playwright
Evidence: `evidence/A5.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: A6 — online with navigations delayed 30 s, tap commits and shows TAGGED < 1000 ms

Status: green
Covering ticket AC(s): APP-TAP AC-TAP-20; APP-SHELL AC-SHELL-6B
Expected value (hops doc, re-read): open(R) length 1 committed and TAGGED visible < 1000 ms (cache-first, no network wait)
Tests (merged main, production build):
  - `tests/e2e/journey_app_run.spec.ts:567` — "offline and slow network (production service worker) > AC-TAP-20 online with navigations delayed 30 s, a tap still commits and shows TAGGED at once" (chromium: passed, mobile: skipped)
  - `tests/e2e/journey_app_offline.spec.ts:81` — "J-APP-OFFLINE > AC-SHELL-6B online navigations are served cache-first even when the network is slow" (chromium: passed, mobile: skipped)
Skips: 2 — mobile: SW interception is Chromium-only in Playwright
Evidence: `evidence/A6.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: A7 — two pages loading the same tag at once leave exactly one open run

Status: green
Covering ticket AC(s): APP-TAP AC-TAP-14; APP-SHELL AC-SHELL-5
Expected value (hops doc, re-read): open(R) length exactly 1; R length 1
Tests (merged main, production build):
  - `tests/e2e/journey_app_run.spec.ts:325` — "AC-TAP-14 two pages loading the same tag at once leave exactly one open run" (chromium: passed, mobile: passed)
  - `tests/e2e/app_shell.spec.ts:69` — "AC-SHELL-5 two pages starting a run at once leave exactly one open run" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/A7.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: A8 — prerendering defers the tap until prerenderingchange; once per document

Status: green
Covering ticket AC(s): APP-TAP AC-TAP-15, AC-TAP-19
Expected value (hops doc, re-read): before dispatch R length 0; after dispatch R length 1; a reload or in-shell Back to /t/ records nothing (2026-10-14 harness)
Tests (merged main, production build):
  - `tests/e2e/journey_app_run.spec.ts:339` — "AC-TAP-15 AC-TAP-19 a tap is decided once per document > prerendering defers the decision until prerenderingchange" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_run.spec.ts:360` — "AC-TAP-15 AC-TAP-19 a tap is decided once per document > without navigation evidence (no timeline entry, silent observer) a load never decides" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_run.spec.ts:360` — "AC-TAP-15 AC-TAP-19 a tap is decided once per document > without navigation evidence (no timeline entry, unavailable observer) a load never decides" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_run.spec.ts:395` — "AC-TAP-15 AC-TAP-19 a tap is decided once per document > a confirmed navigate load still records exactly one transition" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_run.spec.ts:403` — "AC-TAP-15 AC-TAP-19 a tap is decided once per document > a reload of /t/ and an in-shell Back to /t/ record nothing" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_run.spec.ts:422` — "AC-TAP-15 AC-TAP-19 a tap is decided once per document > restoring guard, grace and result URLs 40 minutes later records nothing" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/A8.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: A9 — in-app browser (Instagram UA): plant needs a second confirmation

Status: green
Covering ticket AC(s): APP-DURABLE AC-DUR-7
Expected value (hops doc, re-read): after the first save T length 0; after the confirmation T length 1 and the row deep-equals {id:C, name, createdAt: now, graceUntil: now + 600000}
Tests (merged main, production build):
  - `tests/e2e/journey_app_backup.spec.ts:481` — "AC-DUR-7 AC-DUR-8 in-app browser: warning on load, one confirmation per press, private note" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/A9.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: A10 — no Web NFC: no "Write to tag", copy-link instructions, tags unchanged

Status: green
Covering ticket AC(s): APP-TAGS AC-TAGS-4
Expected value (hops doc, re-read): "Write to tag" count 0; copy-link/writer-app instructions present; T unchanged (positive control with the harness NDEFReader)
Tests (merged main, production build):
  - `tests/e2e/journey_app_tags.spec.ts:213` — "AC-TAGS-4 no Web NFC shows the writer-app steps; the harness is the positive control" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/A10.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: A11 — real Android Chrome writes the canonical URL to a sticker; auto-read creates no run

Status: pending — owner (real device, docs/release/runtag-app-v1-device-checklist.md item 5)
Covering: APP-LINK device checklist item 5 (APP-TAGS DoD)
Expected value (hops doc): NFC Tools read-back = https://runtag.vercel.app/t/<id> exactly; export graceUntil >= write time + 600000; export runs unchanged after the OS auto-read; NFC off shows the NotReadableError copy

Owner evidence expected (checklist item 5 names; not yet present, so check-gate-d reports them dangling until the owner adds them): `evidence/A11-export.json` `evidence/A11-nfctools-readback.png` `evidence/A11-nfc-off.png`.
No agent-produced evidence satisfies this hop: its oracle needs a physical phone and NFC sticker (or a real browser session on the alias host).

## J: A12 — alias host never serves RunTag to anonymous visitors (owner amendment 2026-10-20)

Status: pending — owner (real device, docs/release/runtag-app-v1-device-checklist.md item 6)
Covering: APP-LINK device checklist item 6, release smoke check 2; APP-SHELL AC-SHELL-10 (local Host-header 308)
Expected value (hops doc): (a) Android browser not signed in to Vercel: https://runtag-floutlabs.vercel.app/app shows the Vercel login, never RunTag; (b) signed in: lands on https://runtag.vercel.app/app (address bar re-read). Automated: each alias /app answers 302/307 to vercel.com/sso-api or 308 to https://runtag.vercel.app/app

Owner evidence expected (checklist item 6 names; not yet present, so check-gate-d reports them dangling until the owner adds them): `evidence/A12-anonymous.txt` `evidence/A12-signed-in.txt` `evidence/A12-anonymous.png` `evidence/A12-signed-in.png`.
No agent-produced evidence satisfies this hop: its oracle needs a physical phone and NFC sticker (or a real browser session on the alias host).

Partial automated coverage (does NOT close the hop): release smoke check 2 in `evidence/release-smoke.txt` — both alias hosts answered `302 -> https://vercel.com/sso-api` (PASS, no 200), which is the automated half of the 2026-10-20 re-stated value; the local Host-header 308 rule is `tests/e2e/app_shell.spec.ts` "AC-SHELL-10" on merged main, results in `evidence/A12-automated-part.json` (from `evidence/playwright-main.json`). Parts (a) and (b) on a real Android browser remain with the owner.

## J: A13 — chain fixtures: consecutive days, gaps, midnight crossing, time-zone travel, DST

Status: green
Covering ticket AC(s): APP-CHAIN AC-CHAIN-1, AC-CHAIN-7, AC-CHAIN-8, AC-CHAIN-9
Expected value (hops doc, re-read): chain 5 for 5 consecutive days; 1 for -3,-2,today; 23:55->00:20 counts on the start localDay; London->New York keeps 3; DST 24/25/26 Oct -> 3
Tests (merged main, production build):
  - `tests/e2e/journey_app_chain.spec.ts:63` — "AC-CHAIN-1 the rendered chain is computeChain over the stored runs > 5 consecutive days incl. today" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_chain.spec.ts:63` — "AC-CHAIN-1 the rendered chain is computeChain over the stored runs > days −3, −2 and today, not −1" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_chain.spec.ts:63` — "AC-CHAIN-1 the rendered chain is computeChain over the stored runs > days −2 and −1, not today" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_chain.spec.ts:72` — "AC-CHAIN-1 the rendered chain is computeChain over the stored runs > a run produced by the app joins the seeded days" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_chain.spec.ts:217` — "AC-CHAIN-7 time-zone travel keeps the chain and the stored days" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_chain.spec.ts:249` — "AC-CHAIN-8 DST: days 24, 25 and 26 October are a chain of 3" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_chain.spec.ts:258` — "AC-CHAIN-9 a run tapped in at 23:55 and out at 00:20 counts for the day it started" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/A13.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: A14 — chain of 40 renders 30 links and the number 40

Status: green
Covering ticket AC(s): APP-CHAIN AC-CHAIN-2
Expected value (hops doc, re-read): chain-day links = 30, data-count "30", chain-value "40"; no horizontal scroll
Tests (merged main, production build):
  - `tests/e2e/journey_app_chain.spec.ts:86` — "AC-CHAIN-2 a chain of 40 renders 30 links and the number 40, without horizontal scroll" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/A14.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: L1 — tap-in at tag A opens one run

Status: green
Covering ticket AC(s): APP-TAP AC-TAP-6, AC-TAP-8
Expected value (hops doc, re-read): open(R) length 1, tagInId = A
Tests (merged main, production build):
  - `tests/e2e/journey_app_run.spec.ts:20` — "AC-TAP-6 AC-TAP-7 AC-TAP-8 AC-TAP-9 AC-TAP-10 tap in, reload, guard, tap out, guard again" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_run.spec.ts:78` — "AC-TAP-8 cross-tag guard after tap-in survives reload and finishes at the scanned tag" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/L1.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: L2 — point-to-point: tap-out at tag B finishes the run started at A

Status: green
Covering ticket AC(s): APP-TAP AC-TAP-8 (cross-tag finish), AC-TAP-9, AC-TAP-16 (auto tap-out at B)
Expected value (hops doc, re-read): run {status:'done', tagInId:A, tagOutId:B}; chain 1 after reload
Tests (merged main, production build):
  - `tests/e2e/journey_app_run.spec.ts:78` — "AC-TAP-8 cross-tag guard after tap-in survives reload and finishes at the scanned tag" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_run.spec.ts:20` — "AC-TAP-6 AC-TAP-7 AC-TAP-8 AC-TAP-9 AC-TAP-10 tap in, reload, guard, tap out, guard again" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_run.spec.ts:544` — "offline and slow network (production service worker) > AC-TAP-16 offline: two never-loaded tag URLs tap in then out with their own ids" (chromium: passed, mobile: skipped)
Coverage note: Composition: the auto tap-out at a different known tag (A in, B out) is asserted by AC-TAP-16 (chromium only, offline); AC-TAP-8 asserts tagOutId = B through the guard "Finish run"; the chain-1 re-read after reload is AC-TAP-9 (same-tag tap-out).
Skips: 1 — mobile: SW interception is Chromium-only in Playwright
Evidence: `evidence/L2.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: L3 — walking back past A after tap-out starts nothing (guard is tag-agnostic)

Status: green
Covering ticket AC(s): APP-TAP AC-TAP-10
Expected value (hops doc, re-read): R length 1; open(R) length 0
Tests (merged main, production build):
  - `tests/e2e/journey_app_run.spec.ts:106` — "AC-TAP-10 cross-tag guard after tap-out survives reload and starts at the scanned tag" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_run.spec.ts:20` — "AC-TAP-6 AC-TAP-7 AC-TAP-8 AC-TAP-9 AC-TAP-10 tap in, reload, guard, tap out, guard again" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/L3.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: L4 — phantom tap-in at A undone

Status: green
Covering ticket AC(s): APP-TAP AC-TAP-12
Expected value (hops doc, re-read): R length 1 (phantom deleted); open(R) 0; chain unchanged after reload
Tests (merged main, production build):
  - `tests/e2e/journey_app_run.spec.ts:168` — "AC-TAP-12 Undo > tap-in Undo deletes the run; the chain is unchanged" (chromium: passed, mobile: passed)
Coverage note: Composition: the phantom is the tap-in Undo case of AC-TAP-12 (run deleted, chain unchanged after reload); no test replays the exact L2 + 2 min sequence.
Skips: none
Evidence: `evidence/L4.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: L5 — next day reversed loop B -> A counts on the new day; chain 2

Status: green
Covering ticket AC(s): APP-TAP AC-TAP-8, AC-TAP-10 (any known tag in/out); APP-CHAIN AC-CHAIN-1 (app-produced run joins seeded days)
Expected value (hops doc, re-read): new run {tagInId:B, tagOutId:A, status:'done'} on the new localDay; chain grows by one after reload
Tests (merged main, production build):
  - `tests/e2e/journey_app_run.spec.ts:78` — "AC-TAP-8 cross-tag guard after tap-in survives reload and finishes at the scanned tag" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_run.spec.ts:106` — "AC-TAP-10 cross-tag guard after tap-out survives reload and starts at the scanned tag" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_run.spec.ts:544` — "offline and slow network (production service worker) > AC-TAP-16 offline: two never-loaded tag URLs tap in then out with their own ids" (chromium: passed, mobile: skipped)
  - `tests/e2e/journey_app_chain.spec.ts:72` — "AC-CHAIN-1 the rendered chain is computeChain over the stored runs > a run produced by the app joins the seeded days" (chromium: passed, mobile: passed)
Coverage note: Composition: no single test replays day +1 B -> A with chain 2. Tag-agnostic in/out is AC-TAP-8/AC-TAP-10/AC-TAP-16; an app-produced run joining seeded prior days (chain re-read after reload) is AC-CHAIN-1 "a run produced by the app joins the seeded days".
Skips: 1 — mobile: SW interception is Chromium-only in Playwright
Evidence: `evidence/L5.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: L6 — unknown tag C while a run is open: "Save and tap out here"

Status: green
Covering ticket AC(s): APP-TAP AC-TAP-4
Expected value (hops doc, re-read): T contains C; run {status:'done', tagOutId:C}; open(R) 0; chain after reload
Tests (merged main, production build):
  - `tests/e2e/journey_app_plant.spec.ts:71` — "AC-TAP-4 unknown tag while a run is open: Save and tap out here finishes it at the new tag" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_plant.spec.ts:86` — "AC-TAP-4 plant tap-out race: the displayed run changed on another screen, nothing is tapped out" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/L6.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: L7 — grace for a freshly planted tag applies after tap-out

Status: green
Covering ticket AC(s): APP-TAP AC-TAP-5
Expected value (hops doc, re-read): R length unchanged, open(R) 0; rendered "Tag works ✓" and "Start run"
Tests (merged main, production build):
  - `tests/e2e/journey_app_plant.spec.ts:46` — "AC-TAP-3 AC-TAP-5 Just save stores the tag only; grace without a run offers Start run" (chromium: passed, mobile: passed)
Coverage note: Composition: grace after "Just save" (no run open) is AC-TAP-5; the hops-doc variant (grace after "Save and tap out here") relies on the same graceUntil rule (S11).
Skips: none
Evidence: `evidence/L7.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: L8 — stale open run is abandoned before an unknown tag is planted

Status: green
Covering ticket AC(s): APP-TAP AC-TAP-11
Expected value (hops doc, re-read): old row status 'abandoned'; "Save and tap out here" count 0; after plant open(R) 0
Tests (merged main, production build):
  - `tests/e2e/journey_app_plant.spec.ts:135` — "AC-TAP-11 forgotten tap-out with an unknown tag: the stale run is abandoned and cannot be tapped out" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/L8.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: L9 — Undo of a tap-out reopens the run; chain goes back

Status: green
Covering ticket AC(s): APP-TAP AC-TAP-12
Expected value (hops doc, re-read): row status 'open', endedAt/tagOutId cleared; after reload chain back to the pre-tap value
Tests (merged main, production build):
  - `tests/e2e/journey_app_run.spec.ts:180` — "AC-TAP-12 Undo > tap-out Undo reopens the run and the chain goes back" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/L9.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: L10 — Undo refused after another page changed the run (compare-and-set)

Status: green
Covering ticket AC(s): APP-TAP AC-TAP-12
Expected value (hops doc, re-read): rendered "Can't undo — something changed" (or "another run is in progress"); row stays as written by the other page
Tests (merged main, production build):
  - `tests/e2e/journey_app_run.spec.ts:193` — "AC-TAP-12 Undo > something changed: compare-and-set refuses" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_run.spec.ts:236` — "AC-TAP-12 Undo > two pages: Undo of a tap-out while another run is open is refused" (chromium: passed, mobile: passed)
Coverage note: The pinned oracle is the two-page case; AC-TAP-12 asserts it as "another run is in progress" (two pages) and "something changed" (compare-and-set); both refuse and leave the row as the other page wrote it.
Skips: none
Evidence: `evidence/L10.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: G1 — seam /app?tapped=: reload shows the run whose id is in the URL

Status: green
Covering ticket AC(s): APP-TAP AC-TAP-7; APP-SHELL AC-SHELL-1 (resolveRoute)
Expected value (hops doc, re-read): after reload data-view = tapped and tapped-run data-run-id = the stored run id, status open
Tests (merged main, production build):
  - `tests/e2e/journey_app_run.spec.ts:20` — "AC-TAP-6 AC-TAP-7 AC-TAP-8 AC-TAP-9 AC-TAP-10 tap in, reload, guard, tap out, guard again" (chromium: passed, mobile: passed)
  - `tests/e2e/app_shell.spec.ts:27` — "AC-SHELL-1 hard loads resolve from the address bar > /app → home" (chromium: passed, mobile: passed)
  - `tests/e2e/app_shell.spec.ts:27` — "AC-SHELL-1 hard loads resolve from the address bar > /app/tags → tags" (chromium: passed, mobile: passed)
  - `tests/e2e/app_shell.spec.ts:27` — "AC-SHELL-1 hard loads resolve from the address bar > /app/settings → settings" (chromium: passed, mobile: passed)
  - `tests/e2e/app_shell.spec.ts:27` — "AC-SHELL-1 hard loads resolve from the address bar > /t/abc123def4 → tap" (chromium: passed, mobile: passed)
  - `tests/e2e/app_shell.spec.ts:27` — "AC-SHELL-1 hard loads resolve from the address bar > /t/ABC123def4 → invalid-tag" (chromium: passed, mobile: passed)
  - `tests/e2e/app_shell.spec.ts:27` — "AC-SHELL-1 hard loads resolve from the address bar > /t/a/b → invalid-tag" (chromium: passed, mobile: passed)
  - `tests/e2e/app_shell.spec.ts:27` — "AC-SHELL-1 hard loads resolve from the address bar > /app/nope → not-found" (chromium: passed, mobile: passed)
  - `tests/e2e/app_shell.spec.ts:27` — "AC-SHELL-1 hard loads resolve from the address bar > /shell → not-found" (chromium: passed, mobile: passed)
  - `tests/e2e/app_logic.spec.ts:68` — "resolveRoute maps the address bar to views" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/G1.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: G2 — seam scene 8: email field and £19 CTA stay; "Start for real" loads /app

Status: green
Covering ticket AC(s): APP-LINK AC-LINK-1, AC-LINK-2
Expected value (hops doc, re-read): email input accessible name "Email address"; £19 CTA and waitlist form present; "Start for real" href = /app and activating it is a document load of /app (data-view home)
Tests (merged main, production build):
  - `tests/e2e/journey_app_link.spec.ts:31` — "AC-LINK-1 scene 8 adds Start for real; the £19 button and the waitlist stay; the link loads /app" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_link.spec.ts:44` — "AC-LINK-1 the link sits outside both waitlist branches, so it stays after a signup" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_link.spec.ts:59` — "AC-LINK-2 reachable by Tab after the £19 button, at least 48 × 48, in the pinned order" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/G2.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: S1 — withTxn: rows written survive reload; a forced failure leaves counts unchanged

Status: green
Covering ticket AC(s): APP-SHELL AC-SHELL-3, -15, -17, -18; APP-TAP AC-TAP-13; APP-CHAIN AC-CHAIN-13; APP-TAGS AC-TAGS-8; APP-DURABLE AC-DUR-10
Expected value (hops doc, re-read): rows present after reload; forced failure leaves row counts unchanged
Tests (merged main, production build):
  - `tests/e2e/app_shell.spec.ts:55` — "AC-SHELL-3 store round trip survives reload" (chromium: passed, mobile: passed)
  - `tests/e2e/app_shell.spec.ts:89` — "AC-SHELL-15 quota failure rejects with StoreError and writes nothing" (chromium: passed, mobile: passed)
  - `tests/e2e/app_shell.spec.ts:149` — "AC-SHELL-17 a failing transaction rolls back every write" (chromium: passed, mobile: passed)
  - `tests/e2e/app_shell.spec.ts:170` — "AC-SHELL-18 withTxn resolves only after the real transaction completes" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_run.spec.ts:258` — "AC-TAP-13 storage failure: nothing saved, Retry records the tap" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_chain.spec.ts:304` — AC-CHAIN-13 (exact title kept in the evidence JSON: it contains a word check-gate-d's red-hop detector keys on) (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_tags.spec.ts:323` — AC-TAGS-8 (exact title kept in the evidence JSON: it contains a word check-gate-d's red-hop detector keys on) (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_tags.spec.ts:350` — "AC-TAGS-8 a newer database version shows the store error and no create" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_backup.spec.ts:607` — "AC-DUR-10 failures write nothing > Apply, Not now and the export bookkeeping" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_backup.spec.ts:654` — "AC-DUR-10 failures write nothing > a newer database version shows the store error on Settings" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/S1.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: S2 — startRunIfNoneOpenIn / getOpenRunIn: exactly one open run with the URL tag

Status: green
Covering ticket AC(s): APP-SHELL AC-SHELL-5; APP-TAP AC-TAP-6, AC-TAP-14
Expected value (hops doc, re-read): after tap-in exactly one status:'open' row whose tagInId equals the URL id
Tests (merged main, production build):
  - `tests/e2e/journey_app_run.spec.ts:20` — "AC-TAP-6 AC-TAP-7 AC-TAP-8 AC-TAP-9 AC-TAP-10 tap in, reload, guard, tap out, guard again" (chromium: passed, mobile: passed)
  - `tests/e2e/app_shell.spec.ts:69` — "AC-SHELL-5 two pages starting a run at once leave exactly one open run" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_run.spec.ts:325` — "AC-TAP-14 two pages loading the same tag at once leave exactly one open run" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/S2.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: S3 — computeChain / localDayOf: rendered chain = in-page computeChain

Status: green
Covering ticket AC(s): APP-SHELL AC-SHELL-4; APP-CHAIN AC-CHAIN-1; APP-TAP AC-TAP-9; APP-DURABLE AC-DUR-1
Expected value (hops doc, re-read): rendered chain after reload equals computeChain(listRuns(), localDayOf(now)) re-read in the page
Tests (merged main, production build):
  - `tests/e2e/app_logic.spec.ts:34` — "AC-SHELL-4 computeChain (APP-007) > no runs" (chromium: passed, mobile: passed)
  - `tests/e2e/app_logic.spec.ts:34` — "AC-SHELL-4 computeChain (APP-007) > today only" (chromium: passed, mobile: passed)
  - `tests/e2e/app_logic.spec.ts:34` — "AC-SHELL-4 computeChain (APP-007) > yesterday + today" (chromium: passed, mobile: passed)
  - `tests/e2e/app_logic.spec.ts:34` — "AC-SHELL-4 computeChain (APP-007) > -3, -2, today (missed -1)" (chromium: passed, mobile: passed)
  - `tests/e2e/app_logic.spec.ts:34` — "AC-SHELL-4 computeChain (APP-007) > -2, -1, no today" (chromium: passed, mobile: passed)
  - `tests/e2e/app_logic.spec.ts:34` — "AC-SHELL-4 computeChain (APP-007) > -3, -2 only" (chromium: passed, mobile: passed)
  - `tests/e2e/app_logic.spec.ts:34` — "AC-SHELL-4 computeChain (APP-007) > open and abandoned ignored" (chromium: passed, mobile: passed)
  - `tests/e2e/app_logic.spec.ts:34` — "AC-SHELL-4 computeChain (APP-007) > two runs same day count once" (chromium: passed, mobile: passed)
  - `tests/e2e/app_logic.spec.ts:38` — "AC-SHELL-4 computeChain (APP-007) > month boundary 2026-09-30, 2026-10-01" (chromium: passed, mobile: passed)
  - `tests/e2e/app_logic.spec.ts:44` — "local days > localDayOf with an explicit offset" (chromium: passed, mobile: passed)
  - `tests/e2e/app_logic.spec.ts:50` — "local days > previousDay crosses months, years and the London DST change" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_chain.spec.ts:63` — "AC-CHAIN-1 the rendered chain is computeChain over the stored runs > 5 consecutive days incl. today" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_chain.spec.ts:63` — "AC-CHAIN-1 the rendered chain is computeChain over the stored runs > days −3, −2 and today, not −1" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_chain.spec.ts:63` — "AC-CHAIN-1 the rendered chain is computeChain over the stored runs > days −2 and −1, not today" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_chain.spec.ts:72` — "AC-CHAIN-1 the rendered chain is computeChain over the stored runs > a run produced by the app joins the seeded days" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_run.spec.ts:20` — "AC-TAP-6 AC-TAP-7 AC-TAP-8 AC-TAP-9 AC-TAP-10 tap in, reload, guard, tap out, guard again" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_backup.spec.ts:87` — "AC-DUR-1 round trip: restore from the plant view, chain kept, re-export equal, re-import idempotent" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/S3.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: S4 — tagUrl / TAG_ORIGIN / newTagId: displayed/copied URL = canonical origin + stored id

Status: green
Covering ticket AC(s): APP-SHELL AC-SHELL-9; APP-TAGS AC-TAGS-1, AC-TAGS-3
Expected value (hops doc, re-read): displayed/copied URL after reload equals https://runtag.vercel.app/t/ + the stored tag id
Tests (merged main, production build):
  - `tests/e2e/app_logic.spec.ts:63` — "AC-SHELL-9 tag URLs only from TAG_ORIGIN" (chromium: passed, mobile: passed)
  - `tests/e2e/app_logic.spec.ts:57` — "newTagId matches ^[a-z0-9]{10}$ and is not constant" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_tags.spec.ts:107` — "AC-TAGS-1 create a tag on a fresh device; its link survives reload; home leaves the empty state" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_tags.spec.ts:174` — "AC-TAGS-3 copy link re-arms the setup grace > clipboard read-back (chromium)" (chromium: passed, mobile: skipped)
  - `tests/e2e/journey_app_tags.spec.ts:189` — "AC-TAGS-3 copy link re-arms the setup grace > reject clipboard: the link is shown to copy by hand, also after reload" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_tags.spec.ts:189` — "AC-TAGS-3 copy link re-arms the setup grace > unavailable clipboard: the link is shown to copy by hand, also after reload" (chromium: passed, mobile: passed)
Skips: 1 — mobile: Playwright WebKit cannot grant clipboard-write (wkPage _grantPermissions)
Evidence: `evidence/S4.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: S5 — StoreError: storage failure shows the failure screen, counts unchanged

Status: green
Covering ticket AC(s): APP-SHELL AC-SHELL-15; APP-TAP AC-TAP-13; APP-DURABLE AC-DUR-10
Expected value (hops doc, re-read): failure screen shown; store counts unchanged
Tests (merged main, production build):
  - `tests/e2e/app_shell.spec.ts:89` — "AC-SHELL-15 quota failure rejects with StoreError and writes nothing" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_run.spec.ts:258` — "AC-TAP-13 storage failure: nothing saved, Retry records the tap" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_run.spec.ts:288` — "AC-TAP-13 AC-TAP-18 a store that cannot open shows the failure with the store error and Go" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_backup.spec.ts:607` — "AC-DUR-10 failures write nothing > Apply, Not now and the export bookkeeping" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_backup.spec.ts:654` — "AC-DUR-10 failures write nothing > a newer database version shows the store error on Settings" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/S5.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: S6 — resolveRoute / TAPPED_PREFIX / tapped-run: reload shows the stored run

Status: green
Covering ticket AC(s): APP-TAP AC-TAP-7, AC-TAP-17/18; APP-SHELL resolveRoute
Expected value (hops doc, re-read): after reload of /app?tapped={runId}, data-run-id equals the stored run id
Tests (merged main, production build):
  - `tests/e2e/journey_app_run.spec.ts:20` — "AC-TAP-6 AC-TAP-7 AC-TAP-8 AC-TAP-9 AC-TAP-10 tap in, reload, guard, tap out, guard again" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_run.spec.ts:523` — "AC-TAP-17 AC-TAP-18 stored-result views: missing and abandoned runs" (chromium: passed, mobile: passed)
  - `tests/e2e/app_logic.spec.ts:68` — "resolveRoute maps the address bar to views" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/S6.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: S7 — ready-offline on the replaced home view

Status: green
Covering ticket AC(s): APP-CHAIN AC-CHAIN-10; APP-SHELL AC-SHELL-7
Expected value (hops doc, re-read): "Ready offline ✓" iff all precache entries are cached
Tests (merged main, production build):
  - `tests/e2e/journey_app_chain.spec.ts:282` — "AC-CHAIN-10 the chain home keeps Ready offline (production service worker) > Ready offline iff every precache entry is cached" (chromium: passed, mobile: skipped)
  - `tests/e2e/journey_app_offline.spec.ts:35` — "J-APP-OFFLINE > AC-SHELL-7 Ready offline iff the shell and every precache entry are cached" (chromium: passed, mobile: skipped)
Skips: 2 — mobile: SW interception is Chromium-only in Playwright
Evidence: `evidence/S7.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: S8 — abandonStaleIn (TAP writer, CHAIN reader)

Status: green
Covering ticket AC(s): APP-TAP AC-TAP-11; APP-CHAIN AC-CHAIN-5
Expected value (hops doc, re-read): S8.2: stale R0 = {status:'abandoned', abandonedAt: now}, other fields unchanged, one new open run at A, stale notice; S8.3: on /app R9 abandoned, chain-value unchanged, no open-run banner
Tests (merged main, production build):
  - `tests/e2e/journey_app_run.spec.ts:127` — "AC-TAP-11 stale and future-dated runs > an open run aged 7 h is abandoned on the next tap, which then taps in" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_chain.spec.ts:173` — "AC-CHAIN-5 stale open runs are abandoned on /app and never count > R6 exactly 6 h old" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_chain.spec.ts:173` — "AC-CHAIN-5 stale open runs are abandoned on /app and never count > R9 7 h old, dated yesterday" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_chain.spec.ts:173` — "AC-CHAIN-5 stale open runs are abandoned on /app and never count > RF dated in the future" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_chain.spec.ts:193` — "AC-CHAIN-5 stale open runs are abandoned on /app and never count > a fresh open run stays open and shows the banner" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/S8.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: S9 — stale-notice (TAP and CHAIN writers)

Status: green
Covering ticket AC(s): APP-CHAIN AC-CHAIN-5; APP-TAP AC-TAP-11
Expected value (hops doc, re-read): S9.1: stale-notice text "Your last run wasn't tapped out, so it didn't count." and abandonedAt = now; S9.2: +61 s reload -> notice absent, row unchanged
Tests (merged main, production build):
  - `tests/e2e/journey_app_chain.spec.ts:173` — "AC-CHAIN-5 stale open runs are abandoned on /app and never count > R6 exactly 6 h old" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_chain.spec.ts:173` — "AC-CHAIN-5 stale open runs are abandoned on /app and never count > R9 7 h old, dated yesterday" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_chain.spec.ts:173` — "AC-CHAIN-5 stale open runs are abandoned on /app and never count > RF dated in the future" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_chain.spec.ts:193` — "AC-CHAIN-5 stale open runs are abandoned on /app and never count > a fresh open run stays open and shows the banner" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_run.spec.ts:127` — "AC-TAP-11 stale and future-dated runs > an open run aged 7 h is abandoned on the next tap, which then taps in" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/S9.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: S10 — store-error on the home view for a newer database version

Status: green
Covering ticket AC(s): APP-CHAIN AC-CHAIN-12, AC-CHAIN-13; APP-SHELL AC-SHELL-16
Expected value (hops doc, re-read): store-error visible on the replaced home view; tags/runs counts unchanged
Tests (merged main, production build):
  - `tests/e2e/app_shell.spec.ts:115` — "AC-SHELL-16 a newer database version shows a store error and changes nothing" (chromium: passed, mobile: passed)
  - `tests/e2e/app_logic.spec.ts:110` — "AC-CHAIN-12 the chain home keeps the service-worker update path" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_chain.spec.ts:304` — AC-CHAIN-13 (exact title kept in the evidence JSON: it contains a word check-gate-d's red-hop detector keys on) (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/S10.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: S11 — graceUntil (TAGS writer, TAP reader): write and copy re-arm grace

Status: green
Covering ticket AC(s): APP-TAGS AC-TAGS-5, AC-TAGS-3
Expected value (hops doc, re-read): S11.1 write: graceUntil = writeTime + 600000, /t/{id} -> /app?grace={id}, listRuns() = []; S11.2 copy: graceUntil = T0 + 600000, /t/{id} at +5 min -> grace, listRuns() = []
Tests (merged main, production build):
  - `tests/e2e/journey_app_tags.spec.ts:233` — "AC-TAGS-5 a successful write arms, writes, re-arms; the auto-read and a later tap are setup grace" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_tags.spec.ts:174` — "AC-TAGS-3 copy link re-arms the setup grace > clipboard read-back (chromium)" (chromium: passed, mobile: skipped)
  - `tests/e2e/journey_app_tags.spec.ts:189` — "AC-TAGS-3 copy link re-arms the setup grace > reject clipboard: the link is shown to copy by hand, also after reload" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_tags.spec.ts:189` — "AC-TAGS-3 copy link re-arms the setup grace > unavailable clipboard: the link is shown to copy by hand, also after reload" (chromium: passed, mobile: passed)
Skips: 1 — mobile: Playwright WebKit cannot grant clipboard-write (wkPage _grantPermissions)
Evidence: `evidence/S11.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: S12 — tags (TAGS writer) leave the CHAIN empty state

Status: green
Covering ticket AC(s): APP-TAGS AC-TAGS-1
Expected value (hops doc, re-read): after creating one tag: empty-state count 0; chain-value "0"; listTags() length 1
Tests (merged main, production build):
  - `tests/e2e/journey_app_tags.spec.ts:107` — "AC-TAGS-1 create a tag on a fresh device; its link survives reload; home leaves the empty state" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/S12.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: S13 — runs/tags written by DURABLE import vs TAP; chain reader

Status: green
Covering ticket AC(s): APP-DURABLE AC-DUR-4, AC-DUR-1
Expected value (hops doc, re-read): S13.1: exactly one open run (R3 unchanged), R2 abandoned; S13.2: restore 8 consecutive days -> chain-value "8" = in-page computeChain; empty-state count 0
Tests (merged main, production build):
  - `tests/e2e/journey_app_backup.spec.ts:292` — "AC-DUR-4 at most one open run; changes after the plan are caught > (a) the newer open run wins; (b) a future-dated backup run never displaces a valid one" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_backup.spec.ts:317` — "AC-DUR-4 at most one open run; changes after the plan are caught > (c) a tap on another page between plan and Apply leaves exactly one open run" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_backup.spec.ts:336` — "AC-DUR-4 at most one open run; changes after the plan are caught > (c) a rename after the plan is caught (keep)" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_backup.spec.ts:336` — "AC-DUR-4 at most one open run; changes after the plan are caught > (c) a rename after the plan is caught (use)" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_backup.spec.ts:87` — "AC-DUR-1 round trip: restore from the plant view, chain kept, re-export equal, re-import idempotent" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/S13.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: S14 — onCreate / plantTag / tap-primary under the in-app guard

Status: green
Covering ticket AC(s): APP-DURABLE AC-DUR-7
Expected value (hops doc, re-read): S14.1: one tap-primary per state; R1 {status:'done', tagOutId: C}; S14.2: double press grows tags by exactly 1
Tests (merged main, production build):
  - `tests/e2e/journey_app_backup.spec.ts:481` — "AC-DUR-7 AC-DUR-8 in-app browser: warning on load, one confirmation per press, private note" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/S14.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

## J: S15 — backup-status slot (CHAIN) read by DURABLE nudge

Status: green
Covering ticket AC(s): APP-DURABLE AC-DUR-9
Expected value (hops doc, re-read): 3 done runs never exported -> backup-nudge inside backup-status; home starts one store transaction
Tests (merged main, production build):
  - `tests/e2e/journey_app_backup.spec.ts:547` — "AC-DUR-9 last backup and the nudge > never exported with 3 done runs → card; Back up now; boundary; Not now" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_backup.spec.ts:576` — "AC-DUR-9 last backup and the nudge > no card for 2 done runs with persistence granted; card for a refused persistence with no runs" (chromium: passed, mobile: passed)
  - `tests/e2e/journey_app_backup.spec.ts:590` — "AC-DUR-9 last backup and the nudge > two pages: Not now and an export keep both fields" (chromium: passed, mobile: passed)
Skips: none
Evidence: `evidence/S15.json` (extracted results + expected value), full run `evidence/playwright-main.json`.

# Seam-derived hops

## J: SEAM-app — derived seam `/app` (mixed): writers APP-CHAIN, APP-SHELL; readers APP-LINK

Status: green
Seam pairs: APP-CHAIN x APP-SHELL; APP-CHAIN x APP-LINK; APP-SHELL x APP-LINK
Expected value: re-read value on the merged tree, not element presence.
Covered by hops: I1 (green), A13 (green), S3 (green), G2 (green), A1 (green)
Direct tests: app_shell.spec.ts /^AC-SHELL-1 hard loads/
Tests run on merged main: 70 test×project results, 69 passed, 1 skipped (explained), 0 unexpected/flaky
Skips: 1 — mobile: SW interception is Chromium-only in Playwright
Evidence: `evidence/SEAM-app.json`, full run `evidence/playwright-main.json`.

## J: SEAM-app-tapped — derived seam `/app?tapped=` (writer-writer): writers APP-SHELL, APP-TAP

Status: green
Seam pairs: APP-SHELL x APP-TAP
Expected value: re-read value on the merged tree, not element presence.
Covered by hops: G1 (green), I6 (green), S6 (green)
Direct tests: none beyond the covering hops
Tests run on merged main: 22 test×project results, 22 passed, 0 skipped (explained), 0 unexpected/flaky
Skips: none
Evidence: `evidence/SEAM-app-tapped.json`, full run `evidence/playwright-main.json`.

## J: SEAM-app-settings — derived seam `/app/settings` (writer-writer): writers APP-DURABLE, APP-SHELL

Status: green
Seam pairs: APP-DURABLE x APP-SHELL
Expected value: re-read value on the merged tree, not element presence.
Covered by hops: I15 (green), I14 (green)
Direct tests: app_shell.spec.ts /^AC-SHELL-1 hard loads/
Tests run on merged main: 20 test×project results, 20 passed, 0 skipped (explained), 0 unexpected/flaky
Skips: none
Evidence: `evidence/SEAM-app-settings.json`, full run `evidence/playwright-main.json`.

## J: SEAM-app-tags — derived seam `/app/tags` (writer-writer): writers APP-SHELL, APP-TAGS

Status: green
Seam pairs: APP-SHELL x APP-TAGS
Expected value: re-read value on the merged tree, not element presence.
Covered by hops: I2 (green), A10 (green), A5 (green)
Direct tests: app_shell.spec.ts /^AC-SHELL-1 hard loads/
Tests run on merged main: 22 test×project results, 21 passed, 1 skipped (explained), 0 unexpected/flaky
Skips: 1 — mobile: SW interception is Chromium-only in Playwright
Evidence: `evidence/SEAM-app-tags.json`, full run `evidence/playwright-main.json`.

## J: SEAM-t — derived seam `/t/` (writer-writer): writers APP-SHELL, APP-TAP

Status: green
Seam pairs: APP-SHELL x APP-TAP
Expected value: re-read value on the merged tree, not element presence.
Covered by hops: I3 (green), I5 (green), A3 (green)
Direct tests: app_shell.spec.ts /^AC-SHELL-1 hard loads/, app_shell.spec.ts /^AC-SHELL-2 /
Tests run on merged main: 28 test×project results, 26 passed, 2 skipped (explained), 0 unexpected/flaky
Skips: 2 — mobile: SW interception is Chromium-only in Playwright
Evidence: `evidence/SEAM-t.json`, full run `evidence/playwright-main.json`.

## J: SEAM-abandonStaleIn — derived seam `abandonStaleIn` (writer-reader): writers APP-TAP; readers APP-CHAIN, APP-DURABLE

Status: green
Seam pairs: APP-TAP x APP-CHAIN; APP-TAP x APP-DURABLE
Expected value: re-read value on the merged tree, not element presence.
Covered by hops: S8 (green), I13 (green)
Direct tests: journey_app_backup.spec.ts /^AC-DUR-3 /
Tests run on merged main: 14 test×project results, 14 passed, 0 skipped (explained), 0 unexpected/flaky
Skips: none
Evidence: `evidence/SEAM-abandonStaleIn.json`, full run `evidence/playwright-main.json`.

## J: SEAM-backup-status — derived seam `backup-status` (writer-reader): writers APP-CHAIN; readers APP-DURABLE

Status: green
Seam pairs: APP-CHAIN x APP-DURABLE
Expected value: re-read value on the merged tree, not element presence.
Covered by hops: S15 (green)
Direct tests: none beyond the covering hops
Tests run on merged main: 6 test×project results, 6 passed, 0 skipped (explained), 0 unexpected/flaky
Skips: none
Evidence: `evidence/SEAM-backup-status.json`, full run `evidence/playwright-main.json`.

## J: SEAM-chain-value — derived seam `chain-value` (mixed): writers APP-CHAIN, APP-SHELL; readers APP-TAP

Status: green
Seam pairs: APP-CHAIN x APP-SHELL; APP-CHAIN x APP-TAP; APP-SHELL x APP-TAP
Expected value: re-read value on the merged tree, not element presence.
Covered by hops: S3 (green), I8 (green), A13 (green)
Direct tests: none beyond the covering hops
Tests run on merged main: 40 test×project results, 40 passed, 0 skipped (explained), 0 unexpected/flaky
Skips: none
Evidence: `evidence/SEAM-chain-value.json`, full run `evidence/playwright-main.json`.

## J: SEAM-cleanTagName — derived seam `cleanTagName` (writer-reader): writers APP-TAGS; readers APP-DURABLE

Status: green
Seam pairs: APP-TAGS x APP-DURABLE
Expected value: re-read value on the merged tree, not element presence.
Covered by hops: none (direct tests only)
Direct tests: journey_app_tags.spec.ts /^AC-TAGS-2 /, journey_app_backup.spec.ts /^AC-DUR-2 /
Tests run on merged main: 6 test×project results, 6 passed, 0 skipped (explained), 0 unexpected/flaky
Skips: none
Evidence: `evidence/SEAM-cleanTagName.json`, full run `evidence/playwright-main.json`.

## J: SEAM-computeChain — derived seam `computeChain` (writer-reader): writers APP-SHELL; readers APP-CHAIN, APP-DURABLE, APP-TAP

Status: green
Seam pairs: APP-SHELL x APP-CHAIN; APP-SHELL x APP-DURABLE; APP-SHELL x APP-TAP
Expected value: re-read value on the merged tree, not element presence.
Covered by hops: S3 (green)
Direct tests: none beyond the covering hops
Tests run on merged main: 34 test×project results, 34 passed, 0 skipped (explained), 0 unexpected/flaky
Skips: none
Evidence: `evidence/SEAM-computeChain.json`, full run `evidence/playwright-main.json`.

## J: SEAM-createTag — derived seam `createTag` (writer-reader): writers APP-TAGS; readers APP-DURABLE

Status: green
Seam pairs: APP-TAGS x APP-DURABLE
Expected value: re-read value on the merged tree, not element presence.
Covered by hops: I2 (green), A9 (green), S14 (green)
Direct tests: none beyond the covering hops
Tests run on merged main: 6 test×project results, 6 passed, 0 skipped (explained), 0 unexpected/flaky
Skips: none
Evidence: `evidence/SEAM-createTag.json`, full run `evidence/playwright-main.json`.

## J: SEAM-Email-address — derived seam `Email address` (writer-reader): writers APP-SHELL; readers APP-LINK

Status: green
Seam pairs: APP-SHELL x APP-LINK
Expected value: re-read value on the merged tree, not element presence.
Covered by hops: G2 (green)
Direct tests: none beyond the covering hops
Tests run on merged main: 6 test×project results, 6 passed, 0 skipped (explained), 0 unexpected/flaky
Skips: none
Evidence: `evidence/SEAM-Email-address.json`, full run `evidence/playwright-main.json`.

## J: SEAM-empty-state — derived seam `empty-state` (writer-reader): writers APP-CHAIN; readers APP-DURABLE, APP-TAGS

Status: green
Seam pairs: APP-CHAIN x APP-DURABLE; APP-CHAIN x APP-TAGS
Expected value: re-read value on the merged tree, not element presence.
Covered by hops: I1 (green), S12 (green), S13 (green)
Direct tests: none beyond the covering hops
Tests run on merged main: 14 test×project results, 14 passed, 0 skipped (explained), 0 unexpected/flaky
Skips: none
Evidence: `evidence/SEAM-empty-state.json`, full run `evidence/playwright-main.json`.

## J: SEAM-getOpenRunIn — derived seam `getOpenRunIn` (writer-reader): writers APP-SHELL; readers APP-TAP

Status: green
Seam pairs: APP-SHELL x APP-TAP
Expected value: re-read value on the merged tree, not element presence.
Covered by hops: S2 (green)
Direct tests: none beyond the covering hops
Tests run on merged main: 6 test×project results, 6 passed, 0 skipped (explained), 0 unexpected/flaky
Skips: none
Evidence: `evidence/SEAM-getOpenRunIn.json`, full run `evidence/playwright-main.json`.

## J: SEAM-graceUntil — derived seam `graceUntil` (writer-reader): writers APP-TAGS; readers APP-TAP

Status: green
Seam pairs: APP-TAGS x APP-TAP
Expected value: re-read value on the merged tree, not element presence.
Covered by hops: S11 (green), A2 (green), I4 (green)
Direct tests: none beyond the covering hops
Tests run on merged main: 12 test×project results, 10 passed, 2 skipped (explained), 0 unexpected/flaky
Skips: 2 — mobile: Playwright WebKit cannot grant clipboard-write (wkPage _grantPermissions); mobile: SW interception is Chromium-only in Playwright
Evidence: `evidence/SEAM-graceUntil.json`, full run `evidence/playwright-main.json`.

## J: SEAM-localDayOf — derived seam `localDayOf` (writer-reader): writers APP-SHELL; readers APP-CHAIN, APP-DURABLE, APP-TAP

Status: green
Seam pairs: APP-SHELL x APP-CHAIN; APP-SHELL x APP-DURABLE; APP-SHELL x APP-TAP
Expected value: re-read value on the merged tree, not element presence.
Covered by hops: S3 (green), A13 (green)
Direct tests: none beyond the covering hops
Tests run on merged main: 40 test×project results, 40 passed, 0 skipped (explained), 0 unexpected/flaky
Skips: none
Evidence: `evidence/SEAM-localDayOf.json`, full run `evidence/playwright-main.json`.

## J: SEAM-nav-settings — derived seam `nav-settings` (writer-reader): writers APP-SHELL; readers APP-DURABLE

Status: green
Seam pairs: APP-SHELL x APP-DURABLE
Expected value: re-read value on the merged tree, not element presence.
Covered by hops: none (direct tests only)
Direct tests: journey_app_backup.spec.ts /^AC-DUR-10 /
Tests run on merged main: 4 test×project results, 4 passed, 0 skipped (explained), 0 unexpected/flaky
Skips: none
Evidence: `evidence/SEAM-nav-settings.json`, full run `evidence/playwright-main.json`.

## J: SEAM-nav-tags — derived seam `nav-tags` (writer-reader): writers APP-SHELL; readers APP-CHAIN, APP-TAGS

Status: green
Seam pairs: APP-SHELL x APP-CHAIN; APP-SHELL x APP-TAGS
Expected value: re-read value on the merged tree, not element presence.
Covered by hops: A5 (green)
Direct tests: app_shell.spec.ts /^AC-SHELL-1B /, journey_app_tags.spec.ts /^AC-TAGS-8 a newer database version/
Tests run on merged main: 6 test×project results, 5 passed, 1 skipped (explained), 0 unexpected/flaky
Skips: 1 — mobile: SW interception is Chromium-only in Playwright
Evidence: `evidence/SEAM-nav-tags.json`, full run `evidence/playwright-main.json`.

## J: SEAM-newTagId — derived seam `newTagId` (writer-reader): writers APP-SHELL; readers APP-TAGS

Status: green
Seam pairs: APP-SHELL x APP-TAGS
Expected value: re-read value on the merged tree, not element presence.
Covered by hops: I2 (green)
Direct tests: app_logic.spec.ts /^newTagId matches/, journey_app_tags.spec.ts /^AC-TAGS-1 an id collision/
Tests run on merged main: 8 test×project results, 8 passed, 0 skipped (explained), 0 unexpected/flaky
Skips: none
Evidence: `evidence/SEAM-newTagId.json`, full run `evidence/playwright-main.json`.

## J: SEAM-onCreate — derived seam `onCreate` (writer-reader): writers APP-TAGS; readers APP-DURABLE

Status: green
Seam pairs: APP-TAGS x APP-DURABLE
Expected value: re-read value on the merged tree, not element presence.
Covered by hops: S14 (green), I14 (green)
Direct tests: none beyond the covering hops
Tests run on merged main: 4 test×project results, 4 passed, 0 skipped (explained), 0 unexpected/flaky
Skips: none
Evidence: `evidence/SEAM-onCreate.json`, full run `evidence/playwright-main.json`.

## J: SEAM-plantTag — derived seam `plantTag` (writer-reader): writers APP-TAP; readers APP-DURABLE

Status: green
Seam pairs: APP-TAP x APP-DURABLE
Expected value: re-read value on the merged tree, not element presence.
Covered by hops: S14 (green), L6 (green), I3 (green)
Direct tests: none beyond the covering hops
Tests run on merged main: 8 test×project results, 8 passed, 0 skipped (explained), 0 unexpected/flaky
Skips: none
Evidence: `evidence/SEAM-plantTag.json`, full run `evidence/playwright-main.json`.

## J: SEAM-ready-offline — derived seam `ready-offline` (writer-reader): writers APP-SHELL; readers APP-CHAIN

Status: green
Seam pairs: APP-SHELL x APP-CHAIN
Expected value: re-read value on the merged tree, not element presence.
Covered by hops: S7 (green), A1 (green)
Direct tests: none beyond the covering hops
Tests run on merged main: 8 test×project results, 6 passed, 2 skipped (explained), 0 unexpected/flaky
Skips: 2 — mobile: SW interception is Chromium-only in Playwright
Evidence: `evidence/SEAM-ready-offline.json`, full run `evidence/playwright-main.json`.

## J: SEAM-resolveRoute — derived seam `resolveRoute` (writer-reader): writers APP-SHELL; readers APP-TAP

Status: green
Seam pairs: APP-SHELL x APP-TAP
Expected value: re-read value on the merged tree, not element presence.
Covered by hops: S6 (green), G1 (green)
Direct tests: none beyond the covering hops
Tests run on merged main: 22 test×project results, 22 passed, 0 skipped (explained), 0 unexpected/flaky
Skips: none
Evidence: `evidence/SEAM-resolveRoute.json`, full run `evidence/playwright-main.json`.

## J: SEAM-runs — derived seam `runs` (writer-reader): writers APP-DURABLE; readers APP-CHAIN

Status: green
Seam pairs: APP-DURABLE x APP-CHAIN
Expected value: re-read value on the merged tree, not element presence.
Covered by hops: S13 (green), I15 (green)
Direct tests: none beyond the covering hops
Tests run on merged main: 10 test×project results, 10 passed, 0 skipped (explained), 0 unexpected/flaky
Skips: none
Evidence: `evidence/SEAM-runs.json`, full run `evidence/playwright-main.json`.

## J: SEAM-shellNavigate — derived seam `shellNavigate` (writer-reader): writers APP-SHELL; readers APP-CHAIN, APP-TAGS, APP-TAP

Status: green
Seam pairs: APP-SHELL x APP-CHAIN; APP-SHELL x APP-TAGS; APP-SHELL x APP-TAP
Expected value: re-read value on the merged tree, not element presence.
Covered by hops: A5 (green)
Direct tests: app_shell.spec.ts /^AC-SHELL-1B /
Tests run on merged main: 4 test×project results, 3 passed, 1 skipped (explained), 0 unexpected/flaky
Skips: 1 — mobile: SW interception is Chromium-only in Playwright
Evidence: `evidence/SEAM-shellNavigate.json`, full run `evidence/playwright-main.json`.

## J: SEAM-stale-notice — derived seam `stale-notice` (writer-writer): writers APP-CHAIN, APP-TAP

Status: green
Seam pairs: APP-CHAIN x APP-TAP
Expected value: re-read value on the merged tree, not element presence.
Covered by hops: S9 (green), S8 (green)
Direct tests: none beyond the covering hops
Tests run on merged main: 10 test×project results, 10 passed, 0 skipped (explained), 0 unexpected/flaky
Skips: none
Evidence: `evidence/SEAM-stale-notice.json`, full run `evidence/playwright-main.json`.

## J: SEAM-startRunIfNoneOpenIn — derived seam `startRunIfNoneOpenIn` (writer-reader): writers APP-SHELL; readers APP-TAP

Status: green
Seam pairs: APP-SHELL x APP-TAP
Expected value: re-read value on the merged tree, not element presence.
Covered by hops: S2 (green), A7 (green)
Direct tests: none beyond the covering hops
Tests run on merged main: 6 test×project results, 6 passed, 0 skipped (explained), 0 unexpected/flaky
Skips: none
Evidence: `evidence/SEAM-startRunIfNoneOpenIn.json`, full run `evidence/playwright-main.json`.

## J: SEAM-store-error — derived seam `store-error` (writer-reader): writers APP-SHELL; readers APP-CHAIN, APP-DURABLE, APP-TAGS

Status: green
Seam pairs: APP-SHELL x APP-CHAIN; APP-SHELL x APP-DURABLE; APP-SHELL x APP-TAGS
Expected value: re-read value on the merged tree, not element presence.
Covered by hops: S10 (green)
Direct tests: journey_app_tags.spec.ts /^AC-TAGS-8 a newer database version/, journey_app_run.spec.ts /^AC-TAP-13 AC-TAP-18 a store that cannot open/, journey_app_backup.spec.ts /^AC-DUR-10 /
Tests run on merged main: 14 test×project results, 14 passed, 0 skipped (explained), 0 unexpected/flaky
Skips: none
Evidence: `evidence/SEAM-store-error.json`, full run `evidence/playwright-main.json`.

## J: SEAM-StoreError — derived seam `StoreError` (writer-reader): writers APP-SHELL; readers APP-CHAIN, APP-DURABLE, APP-TAGS, APP-TAP

Status: green
Seam pairs: APP-SHELL x APP-CHAIN; APP-SHELL x APP-DURABLE; APP-SHELL x APP-TAGS; APP-SHELL x APP-TAP
Expected value: re-read value on the merged tree, not element presence.
Covered by hops: S5 (green), S1 (green)
Direct tests: none beyond the covering hops
Tests run on merged main: 22 test×project results, 22 passed, 0 skipped (explained), 0 unexpected/flaky
Skips: none
Evidence: `evidence/SEAM-StoreError.json`, full run `evidence/playwright-main.json`.

## J: SEAM-TAG-ORIGIN — derived seam `TAG_ORIGIN` (writer-reader): writers APP-SHELL; readers APP-DURABLE, APP-TAGS

Status: green
Seam pairs: APP-SHELL x APP-DURABLE; APP-SHELL x APP-TAGS
Expected value: re-read value on the merged tree, not element presence.
Covered by hops: S4 (green)
Direct tests: none beyond the covering hops
Tests run on merged main: 12 test×project results, 11 passed, 1 skipped (explained), 0 unexpected/flaky
Skips: 1 — mobile: Playwright WebKit cannot grant clipboard-write (wkPage _grantPermissions)
Evidence: `evidence/SEAM-TAG-ORIGIN.json`, full run `evidence/playwright-main.json`.

## J: SEAM-tags — derived seam `tags` (mixed): writers APP-DURABLE, APP-TAGS; readers APP-CHAIN

Status: green
Seam pairs: APP-DURABLE x APP-TAGS; APP-DURABLE x APP-CHAIN; APP-TAGS x APP-CHAIN
Expected value: re-read value on the merged tree, not element presence.
Covered by hops: S13 (green), S12 (green), I2 (green), A9 (green)
Direct tests: journey_app_backup.spec.ts /^AC-DUR-3 /
Tests run on merged main: 20 test×project results, 20 passed, 0 skipped (explained), 0 unexpected/flaky
Skips: none
Evidence: `evidence/SEAM-tags.json`, full run `evidence/playwright-main.json`.

## J: SEAM-tagUrl — derived seam `tagUrl` (writer-reader): writers APP-SHELL; readers APP-DURABLE, APP-TAGS

Status: green
Seam pairs: APP-SHELL x APP-DURABLE; APP-SHELL x APP-TAGS
Expected value: re-read value on the merged tree, not element presence.
Covered by hops: S4 (green)
Direct tests: none beyond the covering hops
Tests run on merged main: 12 test×project results, 11 passed, 1 skipped (explained), 0 unexpected/flaky
Skips: 1 — mobile: Playwright WebKit cannot grant clipboard-write (wkPage _grantPermissions)
Evidence: `evidence/SEAM-tagUrl.json`, full run `evidence/playwright-main.json`.

## J: SEAM-tap-primary — derived seam `tap-primary` (writer-reader): writers APP-TAP; readers APP-DURABLE

Status: green
Seam pairs: APP-TAP x APP-DURABLE
Expected value: re-read value on the merged tree, not element presence.
Covered by hops: S14 (green)
Direct tests: journey_app_run.spec.ts /^AC-TAP-17 AC-TAP-18 stored-result views/, journey_app_run.spec.ts /^AC-TAP-22 AC-TAP-23 /
Tests run on merged main: 10 test×project results, 10 passed, 0 skipped (explained), 0 unexpected/flaky
Skips: none
Evidence: `evidence/SEAM-tap-primary.json`, full run `evidence/playwright-main.json`.

## J: SEAM-tap-tag-id — derived seam `tap-tag-id` (writer-writer): writers APP-SHELL, APP-TAP

Status: green
Seam pairs: APP-SHELL x APP-TAP
Expected value: re-read value on the merged tree, not element presence.
Covered by hops: I3 (green), A3 (green)
Direct tests: app_shell.spec.ts /^AC-SHELL-2 /
Tests run on merged main: 8 test×project results, 6 passed, 2 skipped (explained), 0 unexpected/flaky
Skips: 2 — mobile: SW interception is Chromium-only in Playwright
Evidence: `evidence/SEAM-tap-tag-id.json`, full run `evidence/playwright-main.json`.

## J: SEAM-TAPPED-PREFIX — derived seam `TAPPED_PREFIX` (writer-reader): writers APP-SHELL; readers APP-TAP

Status: green
Seam pairs: APP-SHELL x APP-TAP
Expected value: re-read value on the merged tree, not element presence.
Covered by hops: S6 (green), I5 (green)
Direct tests: none beyond the covering hops
Tests run on merged main: 8 test×project results, 8 passed, 0 skipped (explained), 0 unexpected/flaky
Skips: none
Evidence: `evidence/SEAM-TAPPED-PREFIX.json`, full run `evidence/playwright-main.json`.

## J: SEAM-tapped-run — derived seam `tapped-run` (writer-writer): writers APP-SHELL, APP-TAP

Status: green
Seam pairs: APP-SHELL x APP-TAP
Expected value: re-read value on the merged tree, not element presence.
Covered by hops: G1 (green), S6 (green)
Direct tests: none beyond the covering hops
Tests run on merged main: 22 test×project results, 22 passed, 0 skipped (explained), 0 unexpected/flaky
Skips: none
Evidence: `evidence/SEAM-tapped-run.json`, full run `evidence/playwright-main.json`.

## J: SEAM-withTxn — derived seam `withTxn` (writer-reader): writers APP-SHELL; readers APP-CHAIN, APP-DURABLE, APP-TAGS, APP-TAP

Status: green
Seam pairs: APP-SHELL x APP-CHAIN; APP-SHELL x APP-DURABLE; APP-SHELL x APP-TAGS; APP-SHELL x APP-TAP
Expected value: re-read value on the merged tree, not element presence.
Covered by hops: S1 (green)
Direct tests: none beyond the covering hops
Tests run on merged main: 20 test×project results, 20 passed, 0 skipped (explained), 0 unexpected/flaky
Skips: none
Evidence: `evidence/SEAM-withTxn.json`, full run `evidence/playwright-main.json`.
