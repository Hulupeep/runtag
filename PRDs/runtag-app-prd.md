# RunTag App v1 — PRD

**Status:** draft for Gate A · **Owner:** @hulupeep · **Grounding:** PRDs/runtag-app-grounding.md · **Date:** 2026-10-10
**Origin:** https://runtag.vercel.app (Vercel Git integration: `main` → production)

## 1. Job to be done
> *When I get to my running spot, I want to tap my phone on the tag and go — and tap again when I'm back — so that the only thing I track is whether I showed up, and I can see my chain grow without any number judging the run.*

Functional: record "I went" with zero typing. Emotional: momentum and pride in an unbroken chain; no guilt from metrics. Social: none in v1.

## 2. Users
| Persona | Device | Notes |
|---|---|---|
| **Owner-runner** (primary) | own phone (iPhone or Android, unknown) | plants 1–3 tags, runs most days |
| iPhone runner | iPhone XS or newer, Safari | tag opens Safari; may try "Add to Home Screen" |
| Android runner | Chrome | can install PWA; can write tags in-app via Web NFC |

## 3. Scope
### In scope (v1)
- App at `/app` (home = chain), tag endpoint `/t/{tagId}`, tag setup at `/app/tags`; marketing demo stays at `/`.
- Tag planting (create, name, get URL, write to tag on Android Chrome), tap-in/tap-out state machine, chain + history, offline after first load, on-device durability (persist + export/import).
### Out of scope (v1)
Accounts, cloud sync, route discovery/map, sharing, notifications/reminders, native apps, payments/waitlist changes, the parked demo-copy slice #12.

## 4. Rules and requirements
Requirement IDs: `APP-0xx` (MUST), `APP-1xx` (SHOULD).

| ID | Requirement |
|---|---|
| APP-001 | Tag URL is exactly `https://runtag.vercel.app/t/{tagId}`; `tagId` matches `^[a-z0-9]{10}$`, generated with `crypto.getRandomValues`. URLs are permanent: no route rename may break `/t/{tagId}`. |
| APP-002 | Opening `/t/{tagId}` for a tag unknown on this device shows **Plant this tag**: name it (1–40 chars, default "My tag"), save → tag stored, then immediately offered **Tap in now**. Invalid `tagId` shows a "This isn't a RunTag tag" screen with no state change. |
| APP-003 | Known tag + **no open run** → tap-in: create run `{status:'open', tagInId, startedAt}`; show `TAGGED` / `Run started` and "You're in. Now go." with the NFC ripple. |
| APP-004 | Known tag + **open run** → tap-out: set `endedAt`, `tagOutId` (any known tag — point-to-point allowed), `status:'done'`; show success screen with the chain (e.g. "Day 5. Chain unbroken.") |
| APP-005 | Double-read guard: a second `/t/{tagId}` within **60 s** of tap-in (same run) does not tap out; it re-shows "You're in. Now go." with a visible "Finish run" escape hatch requiring an explicit button press. |
| APP-006 | Stale run: an open run older than **6 h** is set `status:'abandoned'` on the next tap; abandoned runs never count. The screen says "Your last run wasn't tapped out, so it didn't count." then proceeds as tap-in. |
| APP-007 | Chain = number of consecutive local calendar days, ending today (or yesterday if today has no done run), with ≥1 `done` run, keyed by the **local date of `startedAt`**. Multiple runs per day count once. |
| APP-008 | **No metrics (INV-D4):** never render duration, elapsed time, clock time of a run, pace, distance, calories, heart rate, or comparative stats. Dates (day names / calendar ticks) are allowed. |
| APP-009 | Home `/app` shows chain count, last 14 days as ticks (done / missed / today-pending), "at risk" state when yesterday counted and today has not, and an "open run" banner when a run is in progress. Empty state explains how to plant a first tag. |
| APP-010 | Storage: IndexedDB database `runtag` v1 with stores `tags`, `runs`; all writes transactional; schema versioned for migrations. |
| APP-011 | Offline: a service worker precaches the app shell so `/t/{tagId}` and `/app` load and work with no network after one successful visit. |
| APP-012 | Durability: on first tag plant call `navigator.storage.persist()` and show the result in Settings; Settings offers **Export** (JSON download of tags+runs) and **Import** (validated JSON, merge by id, never silent overwrite). |
| APP-013 | iOS home-screen silo: when running as an installed standalone app on iOS, show a one-time banner: "Tags open in Safari — keep using RunTag in Safari so your chain stays in one place." App remains usable. |
| APP-014 | Tag setup on Android Chrome with Web NFC: "Write to tag" writes the URL as an NDEF URI record; on success show "Tag ready". Elsewhere show copy-link + step-by-step instructions for writing with a free NFC writer app (e.g. NFC Tools). |
| APP-015 | Accessibility: all controls keyboard/screen-reader operable, 48×48 px targets, WCAG AA contrast (INV-D6, INV-D7 carried over). |
| APP-101 | The marketing demo's final CTA links to `/app` ("Start for real"). |
| APP-102 | Installable PWA (manifest, icons, `display: standalone`) — recommended on Android only. |

## 5. Acceptance (Gherkin, canonical)
```gherkin
Feature: Plant a tag
  Scenario: First scan of a new tag
    Given RunTag has no tag "abc123def4" on this device
    When I open "/t/abc123def4"
    Then I see "Plant this tag"
    When I name it "Oak at gate" and save
    Then tag "abc123def4" is stored with name "Oak at gate"
    And I am offered "Tap in now"

Feature: Run
  Scenario: Tap in then tap out
    Given tag "abc123def4" is planted and no run is open
    When I open "/t/abc123def4"
    Then I see "TAGGED" and "You're in. Now go."
    And one run is open
    When 61 seconds pass and I open "/t/abc123def4"
    Then the run is done
    And I see "Day 1. Chain unbroken."

  Scenario: Double read does not end the run
    Given I tapped in on "abc123def4" 10 seconds ago
    When I open "/t/abc123def4"
    Then the run is still open
    And I see "You're in. Now go." and a "Finish run" button

  Scenario: Forgotten tap-out
    Given a run opened 7 hours ago is still open
    When I open "/t/abc123def4"
    Then that run is abandoned and does not count
    And a new run is open

Feature: Chain
  Scenario: Consecutive days
    Given done runs started on the last 5 local days including today
    When I open "/app"
    Then the chain shows 5
    And no duration, pace, distance or clock time appears anywhere on the page

  Scenario: Missed day breaks chain
    Given done runs on days -3, -2 and today but not day -1
    Then the chain shows 1

Feature: Offline
  Scenario: Trailhead with no signal
    Given I visited "/app" once online
    And the device is offline
    When I open "/t/abc123def4"
    Then the tap is recorded
```

## 6. Journeys (Definition of Done)
| J-ID | Steps | Spec |
|---|---|---|
| J-APP-PLANT | /app/tags → create → name → URL shown (copy) → (Android) write; and /t/{new} → plant → tap in | tests/e2e/journey_app_plant.spec.ts |
| J-APP-RUN | /t/{id} tap in → double read guarded → tap out → chain incremented on /app (re-read from IndexedDB after reload) | tests/e2e/journey_app_run.spec.ts |
| J-APP-CHAIN | seeded runs over days (clock mocked) → chain value, ticks, at-risk, missed-day reset | tests/e2e/journey_app_chain.spec.ts |
| J-APP-OFFLINE | visit online → go offline → /t/{id} tap recorded → back online state intact | tests/e2e/journey_app_offline.spec.ts |
| J-APP-BACKUP | export → clear storage → import → chain identical | tests/e2e/journey_app_backup.spec.ts |

## 7. Success metrics
- **Primary:** owner completes ≥5 real runs with physical tags within 7 days of release, and the chain on `/app` equals the owner's own count (manual tally) every day.
- Tap → feedback visible in < 2 s on 4G and < 1 s offline (cached) on owner's phone.
- Zero data loss events across the first 14 days (verified by export diff).
- Guardrail: INV-D4 contract test green; no metric text in any app screen.

## 8. Dependencies
- Vercel project `runtag` (exists; production = main).
- Physical NTAG213/215 stickers (owner buys); iOS writing via a free NFC writer app.
- No new paid services.

## 9. Proposed slicing (priority order)
1. **APP-SHELL** (P0, foundation): `/app` route, IndexedDB store module (APP-010), service worker + manifest (APP-011, APP-102), app layout; contract rules for INV-D4 extended to app routes.
2. **APP-TAP** (P0): `/t/{tagId}` state machine APP-002..006 incl. unknown-tag planting.
3. **APP-CHAIN** (P0): home chain + history APP-007..009.
4. **APP-TAGS** (P1): tag setup screen, copy link, Web NFC write, instructions APP-014.
5. **APP-DURABLE** (P1): persist, export/import, iOS silo banner APP-012, APP-013.
6. **APP-LINK** (P2): demo CTA to `/app` APP-101.
Waves: W1 = APP-SHELL · W2 = APP-TAP + APP-CHAIN (share the store) · W3 = APP-TAGS + APP-DURABLE · W4 = APP-LINK + real-device release check.

## 10. Open questions (defaults chosen; owner may override)
- Q1 Abandoned-run cutoff 6 h and double-read window 60 s — defaults.
- Q2 Abandoned runs don't count (ritual = in **and** out) — default.
- Q3 Which phone does the owner use? Both platforms supported; iOS path avoids home-screen install.
