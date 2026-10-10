# RunTag App v1 — PRD (v2)

**Status:** v2 for Gate A re-review · **Owner:** @hulupeep · **Grounding:** PRDs/runtag-app-grounding.md · **Date:** 2026-10-10
**Origin (permanent):** https://runtag.vercel.app — Vercel Git integration, `main` → production
**v1 → v2:** applies falsification stipulations S1–S16 (PRDs/runtag-app-falsification.md) and persona-lens CRITICAL/MAJOR gaps PL-1…PL-15 (PRDs/runtag-app-persona-lens.md). Change log in §11.

## 1. Job to be done
> *When I get to my running spot, I want to tap my phone on the tag and go — and tap again when I'm back — so that the only thing I track is whether I showed up, and I can see my chain grow without any number judging the run.*

Functional: record "I went" with zero typing. Emotional: momentum, pride in an unbroken chain, no guilt from metrics. Social: none in v1. **Honour system:** v1 has no server; bookmarked tag URLs, changed phone clocks or edited backups cannot be prevented and are not defended against.

## 2. Users and the real tap flow
| Persona | Device | Real tap flow (S8) |
|---|---|---|
| **Owner-runner** (primary) | own phone, platform unknown | see rows below |
| iPhone runner | iPhone XS+, Safari | screen on → hold to tag → tap the "Open in Safari" banner → (unlock if locked) → page. No background read while camera, Wallet/Apple Pay or Airplane Mode is active. |
| Android runner | Chrome | screen unlocked → hold to tag → opens in default browser. Can install PWA; can write tags in-app (Web NFC). |

## 3. Scope
### In scope (v1)
App at `/app` (home = chain), tap endpoint `/t/{tagId}`, tag setup `/app/tags`, settings `/app/settings`; marketing demo stays at `/`. Tag planting, tap state machine, chain + history, offline, on-device durability (best-effort persist, export/import, backup nudges), undo.
### Out of scope (v1)
Accounts, cloud sync, route discovery/map, sharing, notifications, native apps, payments/waitlist, pre-written starter-kit stickers, demo-copy slice #12, server-side tap logging (Vercel access logs contain only random tag IDs, no personal data).

## 4. Requirements
`APP-0xx` = MUST, `APP-1xx` = SHOULD.

### Identity, routing, origin
| ID | Requirement |
|---|---|
| APP-001 | Tag URL is exactly `https://runtag.vercel.app/t/{tagId}`, `tagId` ∈ `^[a-z0-9]{10}$` from `crypto.getRandomValues`. **Origin permanence (S7, PL-15):** the Vercel project/domain `runtag.vercel.app` must never be renamed, deleted or transferred; a future custom domain must keep serving `/t/*` on this origin (no redirect), because on-device data is bound to the origin. |
| APP-002 | Unknown tag on this device → **Plant this tag**: name (1–40 chars, default "My tag"). Primary button "Save and start run", secondary "Just save". Link "Already use RunTag? Restore from backup" → import (PL-1). If a run is **open**, the screen instead offers "Save and tap out here" (S14, PL-7). Invalid `tagId` → "This isn't a RunTag tag", no state change. |
| APP-003 | Known tag, no open run → **tap-in**: create run `{id, status:'open', tagInId, startedAt, localDay, tzOffsetMin, lastTapAt}`; show `TAGGED` / `Run started` / "You're in. Now go." with NFC ripple. |
| APP-004 | Known tag, open run → **tap-out**: `endedAt`, `tagOutId` (any known tag; point-to-point allowed), `status:'done'`, `lastTapAt`; show success with chain ("Day N. Chain unbroken."). At most **one** open run exists at any time. |

### Tap safety
| ID | Requirement |
|---|---|
| APP-005 | **Double-read guard (S2, PL-5):** if `now − lastTapAt < 60 000 ms` for the most recent run, a tap changes nothing. After a tap-in it re-shows "You're in. Now go." plus a "Finish run" button (explicit press required); after a tap-out it re-shows the success screen plus a "Start another run" button. |
| APP-006 | **Stale run (S6, PL-13):** an open run with `now − startedAt ≥ 6 h` becomes `abandoned` (never counts) on the next tap *or* whenever `/app` renders. Message: "Your last run wasn't tapped out, so it didn't count." A tap then proceeds as tap-in. |
| APP-016 | **One tap per navigation (S1):** tap logic runs only when the document is visible, not prerendering (await `prerenderingchange`), and not restored from bfcache (`pageshow.persisted`); after handling, `history.replaceState` to `/app?tapped={runId}` so reload/Back/tab-restore never re-tap. |
| APP-017 | **Setup grace (PL-8):** for 10 min after a tag is created on this device, a tap on it shows "Tag works ✓" and changes no run state (covers Web NFC auto-read after write and testing at home). |
| APP-018 | **Undo (PL-12):** every tap result screen offers "Undo" for 60 s; undo restores the exact prior state (delete the new run, or reopen the run that was closed). |
| APP-019 | **Saved-before-success (PL-4):** success screens render only after the IndexedDB transaction commits; on failure show "This tap wasn't saved" with Retry and no success visuals. |
| APP-020 | **Atomic decision (PL-9):** read state, decide, write runs in a single IndexedDB `readwrite` transaction over `runs` + `tags`; concurrent loads cannot create two open runs. |
| APP-021 | **Interaction anchor (S3):** every tap screen shows one primary button ("Go" after tap-in, "Done" after tap-out) as an on-page user interaction (WebKit storage-retention signal). State changes never wait for this press. |

### Chain and home
| ID | Requirement |
|---|---|
| APP-007 | **Chain (S11, PL-3):** `localDay` (YYYY-MM-DD in the device's zone at tap-in) is stored and never recomputed. Chain = length of the run of consecutive calendar dates ending today, or yesterday if today has no `done` run, where each date has ≥1 `done` run by `localDay`; chain = 0 if neither today nor yesterday has one. Multiple runs/day count once. Time-zone travel and DST never change stored days. |
| APP-008 | **No metrics (INV-D4, S12):** never render durations, elapsed time, clock times, pace, distance, calories, heart rate or comparisons. Dates/day names allowed. Enforced by contract patterns incl. `\b\d{1,2}:\d{2}\b` and `\b\d+\s?(min|mins|minutes|h|hr|hrs|hours|s|sec|secs|seconds)\b` over app routes, and whole-word runtime term checks (so "space" ≠ "pace"). |
| APP-009 | `/app` shows chain count, last 14 days (done / missed / today pending), "at risk" when yesterday counted and today not, open-run banner (with stale handling per APP-006), "Ready offline ✓" once the shell is cached (PL-11), backup status, and an empty state explaining how to plant a first tag. Long chains render capped (S15). |

### Storage, offline, durability
| ID | Requirement |
|---|---|
| APP-010 | IndexedDB `runtag` v1, stores `tags`, `runs`, `meta` (lastExportAt, persistResult, schemaVersion); versioned migrations. |
| APP-011 | **Offline (S10, PL-10):** service worker precaches the app shell; for any `/t/*` and `/app*` navigation it serves the cached shell **cache-first** (never waits on the network), so an offline tap works even for a tag URL never loaded online; a tap makes no network request. |
| APP-012 | **Best-effort persistence (S5):** call `navigator.storage.persist()` when the first tag is planted, store result in `meta`; if false show "Your phone may clear this data. Export a backup." Settings: **Export** (JSON tags+runs+meta, schema-versioned) and **Import** (validated; merge by id; per-conflict "Keep mine / Use backup", default Keep mine; newest open run wins). |
| APP-013 | **Storage-silo guard (PL-2, PL-6):** before planting, detect contexts whose storage is not where tag taps will land — iOS standalone (`navigator.standalone`), known in-app browsers (UA tokens: Instagram, FBAN/FBAV, Line, TikTok), and storage-quota/private signals where detectable — show a persistent warning naming the fix ("Open RunTag in Safari/your default browser") and require a second confirmation to plant there. iOS standalone: planting blocked with "Plant tags in Safari". |
| APP-014 | **Tag writing (S9):** if `'NDEFReader' in window`, offer "Write to tag" (NDEF URI record = the tag URL); success → "Tag ready". Otherwise copy-link + step-by-step instructions for a free NFC writer app. Never UA-sniff for Web NFC. |
| APP-015 | Accessibility: keyboard/screen-reader operable, 48×48 px targets, WCAG AA (INV-D6, INV-D7). |
| APP-022 | **Backup nudge (PL-1, S5):** when `persistResult` is false, or no export in 7 days with ≥3 done runs, `/app` shows a one-tap "Back up your chain" card (dismissible for 7 days). |
| APP-101 | Demo final CTA links to `/app` ("Start for real"). |
| APP-102 | Installable PWA manifest/icons, recommended on Android only. |

## 5. Acceptance (Gherkin, canonical)
```gherkin
Feature: Plant a tag
  Scenario: First scan of a new tag
    Given no tag "abc123def4" exists on this device and no run is open
    When I open "/t/abc123def4"
    Then I see "Plant this tag" and "Restore from backup"
    When I name it "Oak at gate" and press "Save and start run"
    Then tag "abc123def4" is stored as "Oak at gate"
    And a tap-in is NOT recorded during the 10-minute setup grace
    And I see "Tag works ✓"

  Scenario: Unknown tag while a run is open
    Given a run is open from tag "aaaaaaaaaa"
    When I open "/t/bbbbbbbbbb" which is unknown
    Then I am offered "Save and tap out here"

Feature: Run
  Scenario: Tap in then tap out
    Given tag "abc123def4" was planted more than 10 minutes ago and no run is open
    When I open "/t/abc123def4"
    Then I see "TAGGED" and "You're in. Now go." only after the run row is committed
    And the URL becomes "/app?tapped=<runId>"
    When 61 seconds pass and I open "/t/abc123def4"
    Then the run is done
    And I see "Day 1. Chain unbroken."

  Scenario: Reload does not re-tap
    Given I tapped in 61 seconds ago and the page was replaced with "/app?tapped=<runId>"
    When I reload the page
    Then the run is still open

  Scenario: Double read after tap-out
    Given I tapped out 5 seconds ago
    When I open "/t/abc123def4"
    Then no new run is opened
    And I see the success screen and "Start another run"

  Scenario: Forgotten tap-out
    Given a run opened 6 hours ago is still open
    When I open "/app"
    Then that run is abandoned and does not count

  Scenario: Undo
    Given I just tapped in by mistake
    When I press "Undo" within 60 seconds
    Then no run is open and the chain is unchanged

  Scenario: Storage failure
    Given IndexedDB writes fail
    When I open "/t/abc123def4"
    Then I see "This tap wasn't saved" and "Retry"
    And no success screen is shown

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

Feature: Offline
  Scenario: Trailhead with no signal
    Given I visited "/app" once online
    And the device is offline
    When I open "/t/abc123def4" whose URL was never loaded before
    Then the tap is recorded as a run row in IndexedDB

Feature: Backup
  Scenario: Round trip
    Given 3 tags and 10 runs
    When I export, clear site data and import the file
    Then a fresh export equals the first export exactly
    And importing the same file twice creates no duplicates
```

## 6. Journeys (Definition of Done; run against `next build && next start` — S13)
| J-ID | Steps | Spec | Projects |
|---|---|---|---|
| J-APP-PLANT | /t/{new} → plant → grace "Tag works ✓"; /app/tags → create → URL shown/copy; unknown-tag-while-open → tap out here | tests/e2e/journey_app_plant.spec.ts | chromium, mobile |
| J-APP-RUN | tap in → reload safe → double read guarded → tap out → chain re-read from IndexedDB after reload; undo; storage failure | tests/e2e/journey_app_run.spec.ts | chromium, mobile |
| J-APP-CHAIN | seeded runs + `page.clock` → chain value, ticks, at-risk, missed day, 23:55, zone change, stale abandon | tests/e2e/journey_app_chain.spec.ts | chromium, mobile |
| J-APP-OFFLINE | online visit → offline → never-loaded /t/{id} → run row in IndexedDB | tests/e2e/journey_app_offline.spec.ts | **chromium only** (Playwright SW support); iOS offline = manual real-device check |
| J-APP-BACKUP | export → clear → import → byte-equal re-export; double import idempotent | tests/e2e/journey_app_backup.spec.ts | chromium, mobile |

Assertions re-read stored values (IndexedDB rows or rendered value after reload), never element presence alone.

## 7. Success metrics (S4)
- **Primary:** owner completes ≥5 real runs with physical tags within 7 days of release; the `/app` chain equals the owner's manual tally every day.
- **Durability:** zero *unexplained* data loss for 14 days after APP-DURABLE ships, measured by daily owner exports (each export's run-id set ⊇ the previous) + manual tally; plus one iOS real-device check of ≥ 8 days using only NFC-launched visits.
- **Latency (S8):** banner-tap (iOS) / tag-tap (Android) → feedback < 2 s on 4G, < 1 s offline.
- **Guardrail:** INV-D4 contract + runtime checks green on all app routes.

## 8. Dependencies
Vercel project `runtag` (exists). NTAG213/215 stickers (owner buys). iOS tag writing via a free NFC writer app — **unverified; real-device check in W4**. No new paid services.

## 9. Slicing (priority order; reuse `components/ChainVisual.tsx`, `components/NFCTag.tsx`, COPY — S15)
1. **APP-SHELL** (P0): `/app` route + layout, IndexedDB store module (APP-010, APP-020), service worker + manifest (APP-011, APP-102), "Ready offline" signal, INV-D4 contract extension to app routes (APP-008).
2. **APP-TAP** (P0): `/t/{tagId}` state machine APP-002…006, APP-016…021.
3. **APP-CHAIN** (P0): `/app` chain + 14-day history APP-007, APP-009.
4. **APP-TAGS** (P1): `/app/tags` setup, copy link, Web NFC write, instructions APP-014.
5. **APP-DURABLE** (P1): persist, export/import, backup nudge, silo guard APP-012, APP-013, APP-022.
6. **APP-LINK** (P2): demo CTA APP-101 + real-device release checklist (iOS banner flow, iOS writer app, 8-day iOS retention check).
Waves: W1 APP-SHELL · W2 APP-TAP ‖ APP-CHAIN · W3 APP-TAGS ‖ APP-DURABLE · W4 APP-LINK.

## 10. Owner decisions (defaults applied under owner authority 2026-10-10; override any)
| Q | Default |
|---|---|
| Minimum run length | none (honour system) |
| Finish a run without the tag | no, except the in-guard "Finish run" button at a tag |
| Sticker domain | `runtag.vercel.app` permanently (APP-001) |
| iOS home-screen app | warn persistently; block planting there |
| Backup nudge cadence | 7 days, dismissible (APP-022) |
| Abandon cutoff / double-read window / setup grace / undo | 6 h / 60 s / 10 min / 60 s |
| Date-line crossing | stored `localDay` only; a skipped calendar date can break the chain (documented) |
| Pre-written starter stickers | out of scope |

## 11. Change log v1 → v2
S1→APP-016 · S2→APP-005 · S3→APP-021 · S4→§7 · S5→APP-012/APP-022 · S6→APP-006 · S7→APP-001 · S8→§2/§7 · S9→APP-014 · S10→APP-011 · S11→APP-007 · S12→APP-008 · S13→§6 · S14→APP-002 · S15→§9 · S16→§5 Backup.
PL-1→APP-002/APP-022 · PL-2/PL-6→APP-013 · PL-3→APP-007 · PL-4→APP-019 · PL-5→APP-005 · PL-7→APP-002/APP-004 · PL-8→APP-017/APP-002 · PL-9→APP-020 · PL-10→APP-011 · PL-11→APP-009 · PL-12→APP-018 · PL-13→APP-006 · PL-14→APP-012 · PL-15→APP-001.
