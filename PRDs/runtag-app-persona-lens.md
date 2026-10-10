# RunTag App v1 — Persona lens (spec-build adversary stage)

**Target:** PRDs/runtag-app-prd.md (draft for Gate A) · **Inputs:** PRDs/runtag-app-grounding.md, docs/prd.md §1–§2/§4 (INV-D4), docs/specs/runtag-stories-simulation.md · **Date:** 2026-10-10
**Role:** fresh-context persona lens. Walks real people through the journeys on paper and asks whether a person can actually do this. This lens reports gaps and proposes edits. It does not set the verdict, and it does not edit the PRD.

Severity: **CRITICAL** means a person cannot complete the core job, or loses their chain or data without being told. **MAJOR** means the core job completes but the state machine or data visibly goes wrong, or two engineers would build different things. **MINOR** means friction, wording or polish.

Product test applied throughout (docs/prd.md §1): *"Did you go?"* The chain must reflect whether the runner showed up. It must never punish them for a platform quirk, and it must never show a number that judges the run.

---

## 1. Personas

| # | Persona | Device / context | What stresses the PRD |
|---|---|---|---|
| P1 | **Owner-runner, iPhone** | iPhone 13, Safari; tempted to "Add to Home Screen"; sometimes sets Chrome as default browser; uses "Clear History and Website Data" | iOS storage silos, ITP eviction, NFC notification while locked, private tabs |
| P2 | **Owner-runner, Android** | Pixel or Samsung, installs PWA from Chrome, writes tags in-app with Web NFC; Samsung default browser is Samsung Internet | Web NFC write followed by an immediate OS read, double reads, default-browser silo |
| P3 | **First-timer with stickers** | Bought blank NTAG213 stickers; only guidance is in the app; may have arrived via an Instagram link (in-app browser); may receive a sticker a friend already wrote | First visit, first ever tap, "test the tag" habit, offline first tap |
| P4 | **Point-to-point looper** | Two tags: A (start), B (end), reversed some days | Unknown-tag-with-open-run, tag B not planted on this device, walking back past A |
| P5 | **Gamer / cheater** | Wants the chain without the run | Car-park tap in/out, bookmarked URL, device clock, crafted import |

---

## 2. Per-persona routes

Each route lists its steps, what the PRD says, and where it breaks. Gap IDs (PL-n) are consolidated in §3.

### P1: Owner-runner on iPhone (Safari)

**Happy path.** Opens `/app` in Safari and reads the empty state. Goes to `/app/tags`, creates "Oak at gate", copies the URL, writes it with NFC Tools. At the trailhead the screen is on and the phone locked: the iOS notification appears, Face ID, Safari opens `/t/{id}` and shows TAGGED. Runs. Taps again 40 min later: tap-out, "Day 1. Chain unbroken." Works **if** the planting browser, the tap browser and the viewing browser are all the same Safari storage. The happy path holds.

**Route 1a: Add to Home Screen.** P1 adds `/app` to the Home Screen and plants tags *inside the standalone app*, because that is where they now live. The trailhead tap opens **Safari**, which has a different storage partition, so the tag is unknown there and they see "Plant this tag". They plant it again in Safari. From then on every run is recorded in Safari, and the home-screen app shows chain 0 forever. APP-013 shows a one-time banner, but it still allows planting inside the silo, and it doesn't say where the chain actually lives. → **PL-6 (MAJOR)**.

**Route 1b: Chrome set as default browser on iOS, or Safari private tab.** The NFC URL opens in the default browser. If that browser is not the one that planted the tags, every tap shows "Plant this tag" (a silo again). If the tap lands in a **Private** Safari tab, IndexedDB is ephemeral: tap-in shows TAGGED, the tab closes, and the run disappears. The tap-out later sees the tag as unknown, or sees no open run and opens a *new* run. The chain never grows and nothing explains why. APP-013 covers only iOS standalone, and no requirement detects or warns about any other silo. → **PL-2 (CRITICAL)**.

**Route 1c: Data silently wiped.** P1 is ill for 9 days and doesn't open RunTag. Safari's 7-day ITP rule evicts script-writable storage; `persist()` was probably denied in a Safari tab, and APP-012 only shows that result buried in Settings. Alternatively P1 runs "Clear History and Website Data" or moves to a new iPhone. Next tap: "Plant this tag" for a tag they planted months ago, and the chain is 0. Export existed, but nothing ever prompted it, so there is no backup. The plant screen offers no "restore" path. → **PL-1 (CRITICAL)**.

**Route 1d: Travels to another time zone.** Ran at 00:30 on Tuesday in London, then flies to New York. If the local date is derived at render time from a UTC `startedAt` (APP-007 says "local date of `startedAt`" but doesn't say *whose* local), that run now falls on Monday 19:30. Monday counted twice and Tuesday is empty, so the **chain breaks retroactively** with no missed run. Flying east across the date line can skip a whole calendar day in the same way. → **PL-3 (CRITICAL)** and **OQ-5**.

**Route 1e: Storage write fails.** "Block All Cookies" is on, or Lockdown Mode, or the quota is full. The IndexedDB open or write throws. The PRD doesn't say whether the TAGGED or "Day N" screen may render before the transaction commits. If the UI is optimistic, P1 sees "Day 5. Chain unbroken." while nothing was saved. → **PL-4 (CRITICAL)**.

**Route 1f: Runs past midnight.** Taps in at 23:40 Monday and out at 00:25 Tuesday. APP-007 keys the run to Monday, which is correct. The success screen says "Day 5. Chain unbroken.", then `/app` immediately shows **at risk** for Tuesday. That is consistent but jarring. → **PL-19 (MINOR)**.

### P2: Owner-runner on Android Chrome, PWA installed, writes tags in-app

**Happy path.** Installs the PWA, then `/app/tags`, Create, Write to tag, hold the sticker, "Tag ready". Trailhead tap: Android opens the URL (in the PWA if the WebAPK captures the scope, otherwise in Chrome; Android shares storage, so either is fine). Tap in, run, tap out. Works.

**Route 2a: Writing triggers an immediate read.** After "Tag ready", the sticker is still against the phone. Android's tag dispatch reads the freshly written URI and opens `/t/{id}`. The tag is known and no run is open, so this is a **tap-in at home**. P2 drives 30 min to the park and taps: still under 6 h, so it's a **tap-out**, and they see "Day 1. Chain unbroken." *at the start* of the run. At the end of the run they tap again and a new run opens. The next day they see "Your last run wasn't tapped out, so it didn't count." The state machine is now one phase out of step. Nothing in APP-014 or APP-003 prevents a tap-in straight after setup. → **PL-8 (MAJOR)**.

**Route 2b: Double read at tap-out.** Grounding fact 6 says NFC can fire twice. APP-005 only guards the 60 s after **tap-in**. At the end of the run the first read taps out (done) and the second read, 1 s later, finds no open run and **taps in**. That leaves a phantom open run after every double read. The consequences:
- Next run more than 6 h later: "Your last run wasn't tapped out, so it didn't count." This is false, because the real run did count, and it erodes trust.
- Next run less than 6 h later (a second run that day, or an evening run then a 04:30 start): the start tap closes the phantom and the end tap opens another. Today's real run is recorded as the phantom's tap-out, keyed to **yesterday's** `startedAt`, so today never counts. The chain breaks even though P2 went.

→ **PL-5 (MAJOR, borderline CRITICAL)**.

**Route 2c: Two page loads race.** A double read opens two tabs, or a tab plus the PWA, within milliseconds. Both read "no open run" and both create a run, which gives **two open runs**. APP-005's guard assumes the first write is visible to the second read. APP-010 says writes are transactional but doesn't require the read-decide-write to happen in *one* readwrite transaction. → **PL-9 (MAJOR)**.

**Route 2d: Default browser is Samsung Internet or Firefox.** P2 planted in Chrome or the PWA. Unless the WebAPK captures the URL, the tag opens in Samsung Internet, which has separate storage, so P2 is in the PL-2 silo. Whether WebAPK capture happens on Samsung devices is a platform claim that needs testing at Gate A. → **PL-2**.

**Route 2e: Bad signal at the trailhead ("lie-fi").** One bar, so requests hang rather than fail. APP-011 says the app works "with no network", but if the service worker is network-first for `/t/*`, the tap waits for a network timeout (15–60 s) before falling back. That breaks the < 2 s metric in §7 and the core job, and it is the most common trailhead condition. → **PL-10 (MAJOR)**.

**Route 2f: Web NFC write fails.** The tag is read-only, too small, moved away mid-write, or a different tag type. APP-014 only defines the success state. → **PL-17 (MINOR)**.

### P3: First-timer with stickers, guided only by the app

**Happy path.** Arrives at `/` (demo) and taps the CTA to `/app` (APP-101, which is P2 and in the **last** wave). Reads the empty state, plants a tag, gets copy-link and instructions, writes the tag with NFC Tools on iPhone, sticks it on a tree, taps it the next morning. Works only if the earlier steps happened in the same browser and online.

**Route 3a: "Test the tag" at home.** The NFC Tools guide, and common sense, say to test the tag after writing it. P3 taps it at the kitchen table. Safari opens `/t/{id}`. If the tag was created in `/app/tags` it's known, so the test is a **tap-in at home**. If it wasn't, they see the plant screen with a big "Tap in now", which they press because it's the obvious next step. Either way, the real start tap at the park becomes a tap-out (the same phase inversion as 2a). P3's very first real run is recorded wrongly, and their first message from the product is "Day 1" at the start line followed by "your last run didn't count". → **PL-8 (MAJOR)**.

**Route 3b: First ever tap happens at the trailhead with no signal.** P3 wrote the tag with an NFC app and never opened the URL online in this browser. Or the first visit was in Instagram's in-app browser, whose service worker and storage don't carry over to Safari. The tap URL can't load at all; Safari shows its own offline error. APP-011's precondition ("after one successful visit") can't be checked by the user, and nothing tells P3 "this phone is ready for offline taps". → **PL-11 (MAJOR)**.

**Route 3c: Plants at the trailhead and doesn't press "Tap in now".** P3 taps a new sticker at the park, names it and saves. They get a phone call, then go running without pressing "Tap in now". At the end the tag is known with no open run, so this is a **tap-in**: "You're in. Now go." at the finish line. The first run doesn't count, and an open run is left behind. → **PL-8 (MAJOR)** (same root cause: setup taps and real taps are indistinguishable).

**Route 3d: A friend hands over a sticker they already wrote.** P3 taps it and sees "Plant this tag", which works because the ID is just new to P3's device. But the plant screen doesn't say what RunTag is, that data stays on this phone, or that nothing is shared with the friend. → **PL-21 (MINOR)**. (Sharing one tag between two people's phones works by design because storage is per device. That is a non-gap worth stating in the PRD.)

**Route 3e: Stranger taps P3's tag.** P3 is unaffected, since storage is per device. The stranger sees "Plant this tag". This is a non-gap. However, Vercel request logs record `tagId` + IP + timestamp for every tap, which builds a location-and-time trail that contradicts "on-device only". → **PL-22 (MINOR)** / **OQ-8**.

**Route 3f: Empty history looks like failure.** P3 opens `/app` on day 1. APP-009 defines the 14-day ticks as done / missed / today-pending, so the 13 days before P3 ever ran render as **missed** (red). That is guilt on day 1, against the JTBD's emotional line. → **PL-16 (MINOR)**.

### P4: Looper between two tags (in at A, out at B)

**Happy path.** A and B are both planted on this device. Tap A (tap-in), run, tap B (APP-004 allows any known tag). Works.

**Route 4a: B is not planted on this device.** P4 planted B from a different browser, a friend wrote it, or it's new. Tap B with a run open: APP-002 shows "Plant this tag", saves, then **offers "Tap in now"** *while a run is open*. The PRD doesn't define a tap-in while a run is open: does it abandon the open run, close it, or create a second open run? The loop run can't be finished correctly. → **PL-7 (MAJOR)**.

**Route 4b: Walks back past A out of habit.** P4 taps out at B, walks home past A and taps it. No run is open, so a **phantom tap-in** starts. The next day they see "Your last run wasn't tapped out, so it didn't count", which is false and alarming. There is no undo for a mistaken tap. → **PL-12 (MAJOR)**, **PL-18 (MINOR wording)**.

**Route 4c: Taps the wrong tag mid-run.** For example, a friend's tag on the same tree, or tag B passed early. If it's known, that's a tap-out after only a few minutes (no undo). If it's within 60 s of tap-in, APP-005 says "a second `/t/{tagId}`… (same run)", which is ambiguous: same *tag*, or any tag in the same run? → **PL-12**, **PL-20 (MINOR)**.

**Route 4d: Forgets to tap out at B.** P4 gets home, opens `/app` and sees the "open run" banner. APP-009 doesn't say whether that banner offers "Finish run" (APP-005 offers it, but only on the double-read screen). Without it, the run will be abandoned. With it, every run can be finished from the sofa (the P5 concern). The next day, a 20-hour-old run still shows as "in progress", because staleness is only evaluated "on the next tap" (APP-006). → **PL-13 (MAJOR)** + **OQ-2**.

### P5: Cheater / gamer

| Route | Steps | PRD result |
|---|---|---|
| 5a Car-park run | Tap in, press "Finish run" at 10 s (APP-005 escape hatch) or re-tap at 61 s | Counts as a done run. No minimum exists. |
| 5b Sofa run | Bookmark `https://runtag.vercel.app/t/{id}` and open it twice from home | Counts. A URL-on-tag can't prove you were physically there. |
| 5c Backfill a missed day | Set the device date back a day, tap in/out, restore the date | Counts. `startedAt` comes from the device clock. |
| 5d Forged history | Edit the export JSON to add runs, then Import | APP-012 says "validated" but doesn't define validation, so runs are probably accepted. |

These are **owner decisions**, not defects. RunTag v1 has no social layer, so cheating only fools the cheater, and that is consistent with "Did you go?" as self-accountability. The PRD should still *state* honor-system semantics so nobody builds speculative anti-cheat, such as a minimum duration that would make the app track time. → **OQ-1, OQ-2, OQ-3**. One defect does follow: the "Finish run" escape hatch at 10 s also lets an *accidental* zero-length run through (bumped tag, fumbled phone). The PRD should decide whether that's intended. → **OQ-1**.

---

## 3. Consolidated gaps

| ID | Sev | Persona / route | Requirement silent or wrong | Proposed PRD edit |
|---|---|---|---|---|
| **PL-1** | CRITICAL | P1 1c (ITP 7-day eviction, cleared website data, new phone) | APP-012 hides the `persist()` result in Settings. Export is never prompted. APP-002 offers no restore path. | **New APP-016 Backup visibility:** "`/app` shows *Last backup: never / {date}*. When `persist()` was not granted, or there has been no export in the last 7 days and at least 3 done runs exist, `/app` shows a non-modal *Back up your chain* card that exports in one tap. Dismissing it hides it for 7 days." **Amend APP-002:** "The *Plant this tag* screen includes *Already use RunTag? Restore from backup* (opens Import)." **Gherkin:** `Given persist() returned false and 3 done runs exist and no export has been made / When I open "/app" / Then I see "Back up your chain"`. |
| **PL-2** | CRITICAL | P1 1b, P2 2d, P3 3b (default browser ≠ planting browser; private tab; in-app browser) | APP-013 covers only iOS standalone. APP-002 treats every unknown tag as new. | **Generalise APP-013 into "Storage context check":** "Before planting (in `/app/tags` or `/t/*`), the app detects an ephemeral or non-default context where possible (iOS standalone, known in-app browser user agents, storage quota estimate consistent with private mode) and shows *Tags open in your phone's default browser. Plant and check your chain there.* with a copy-link action. Planting stays possible, but needs a second confirmation in these contexts." **Amend APP-012/§8:** document that one device + one browser = one chain. **Gate A falsification:** on iOS with Chrome as default, and on Samsung with Samsung Internet as default (PWA installed from Chrome), which browser opens an NDEF URI? Does iOS ever open it in a Private tab? |
| **PL-3** | CRITICAL | P1 1d (time-zone travel) | APP-007 "local date of `startedAt`" doesn't say whose local or when it's computed. | **Amend APP-007 / APP-010:** "At tap-in, store `localDate` (YYYY-MM-DD in the device's time zone at that moment) and `tzOffsetMin` on the run. Chain and ticks use the stored `localDate`, never a re-derivation from `startedAt`. *Today* is the device's current local date." **Gherkin:** `Given a done run with localDate "2026-10-13" recorded in Europe/London at 00:30 / When the device time zone becomes America/New_York / Then the run is still on 2026-10-13 and the chain is unchanged`. The date-line skip goes to OQ-5. |
| **PL-4** | CRITICAL | P1 1e (storage blocked, quota, private) | APP-010 says "transactional" but doesn't order UI after commit. There is no failure state. | **Amend APP-010:** "TAGGED, *Run started* and *Day N* screens render only after the IndexedDB transaction's `complete` event. If the database cannot open or a write fails, show *This tap wasn't saved. {reason}* with a Retry button, and never a success screen." **Gherkin:** `Given IndexedDB writes fail / When I open "/t/abc123def4" / Then I see "This tap wasn't saved" / And I do not see "TAGGED"`. |
| **PL-5** | MAJOR (borderline CRITICAL) | P2 2b (NFC double read at tap-out) | APP-005 guards only after tap-in. | **Amend APP-005:** "A `/t/{tagId}` for any known tag within 60 s of a **tap-out** re-shows that run's success screen and does not open a new run. That screen offers an explicit *Start a new run* button." **Gherkin:** `Given I tapped out on "abc123def4" 5 seconds ago / When I open "/t/abc123def4" / Then no run is open / And I see "Chain unbroken."`. |
| **PL-6** | MAJOR | P1 1a (iOS Add to Home Screen) | APP-013 is one-time and allows planting in the silo. | **Amend APP-013:** "In iOS standalone mode the notice is persistent on `/app` and `/app/tags` (not one-time). *Create tag* is replaced by *Open RunTag in Safari to plant tags*. Any chain shown is labelled *This copy only*." (Whether to block or only warn is an owner call: **OQ-6**.) |
| **PL-7** | MAJOR | P4 4a (unknown tag while a run is open) | APP-002 always offers "Tap in now". APP-003 and APP-004 don't cover unknown + open run. | **Amend APP-002:** "If a run is open (and not stale under APP-006), the plant screen's primary action after saving is **Finish run here** (tap-out to the new tag), not *Tap in now*." **Invariant:** "At most one run has `status:'open'` at any time." **Gherkin:** `Given a run is open from tag "aaaaaaaaaa" / And tag "bbbbbbbbbb" is unknown / When I open "/t/bbbbbbbbbb" and plant it / Then I am offered "Finish run here" / And not "Tap in now"`. |
| **PL-8** | MAJOR | P2 2a, P3 3a, P3 3c (setup or test taps create real tap-ins; a dismissed plant leaves the phase wrong) | APP-003 and APP-014 don't separate setup taps from real ones. | **New APP-017 Setup grace:** "For 10 minutes after a tag is created or written (from `/app/tags` or the plant screen), a tap on that tag shows **Tag works ✓, tap it at your spot to start a run** and changes no run state. The screen also offers an explicit *Start run now* button." **Amend APP-002:** the save button reads **Save and start run**, with a secondary **Just save**, so the run phase is a decision the user makes and doesn't depend on an easy-to-miss follow-up offer. **Gherkin:** `Given I created tag "abc123def4" 1 minute ago / When I open "/t/abc123def4" / Then I see "Tag works" / And no run is open`. |
| **PL-9** | MAJOR | P2 2c (concurrent page loads) | APP-005 and APP-010 don't make check-and-set atomic. | **Amend APP-010:** "The tap state machine (read open run → decide → write) runs inside a single `readwrite` transaction over `runs`. Two simultaneous loads of `/t/{id}` produce exactly one transition." **Gherkin (two browser contexts, same storage):** `When "/t/abc123def4" is opened twice concurrently / Then exactly one run exists and it is open`. |
| **PL-10** | MAJOR | P2 2e (lie-fi at the trailhead) | APP-011 defines no-network only, not degraded network, and no caching strategy. | **Amend APP-011:** "`/t/*`, `/app` and their assets are served **cache-first** (stale-while-revalidate). No tap waits on the network. The tap state machine performs no network request." **Gherkin:** `Given I visited "/app" once online / And the network responds with 30 s latency / When I open "/t/abc123def4" / Then "TAGGED" is visible within 1 s`. |
| **PL-11** | MAJOR | P3 3b (first tap offline; precondition invisible) | APP-011 "after one successful visit" can't be checked by the user. | **Amend APP-014 / APP-009:** "`/app/tags` and the plant success screen show **Ready offline ✓** only after the service worker reports the shell precached. Until then they show *Open RunTag once on Wi-Fi before your first run*. The setup instructions tell the user to tap the tag once at home (covered by APP-017) to confirm." |
| **PL-12** | MAJOR | P4 4b, 4c (mistaken tap, phase inversion) | No undo exists for a mistaken transition. | **New APP-018 Undo last tap:** "Every tap result screen offers **Undo** for 60 s, which reverts that transition exactly (tap-in deletes the new run; tap-out restores `status:'open'`)." **Gherkin:** `Given I tapped in 20 seconds ago by mistake / When I press "Undo" / Then no run is open and the chain is unchanged`. (Whether the window is 60 s is the owner's call, folded into Q1.) |
| **PL-13** | MAJOR | P4 4d (forgot to tap out; stale banner) | APP-009's banner has no defined action. APP-006 evaluates staleness only "on the next tap". | **Amend APP-009:** "The open-run banner reflects APP-006 at render time: a run older than 6 h shows *Last run wasn't tapped out* (no *in progress*). Whether the banner offers *Finish run* is **OQ-2**." Two engineers would build different banners today. |
| **PL-14** | MAJOR | Two phones / import (P1, P2) | APP-012 "merge by id, never silent overwrite" doesn't define conflict resolution or the open-run invariant. | **Amend APP-012:** "Import: records with new ids are added. Records with the same id and identical content are skipped. For the same id with different content, show a list (*Keep mine / Use backup*), defaulting to *Keep mine*. After import, if more than one run is open, keep the newest open and mark the others `abandoned`. The import summary shows counts added, skipped and conflicted." |
| **PL-15** | MAJOR | All (stickers are permanent; origin = storage) | APP-001 freezes the path but not the **origin**. IndexedDB is per origin, so moving to a custom domain later breaks every printed sticker *and* strands all on-device data. | **Amend APP-001:** "The tag origin is fixed before the first physical tag is written, and never changes. Any future domain must keep serving `/t/*` on this origin." The choice of origin is **OQ-4**. |
| **PL-16** | MINOR | P3 3f | APP-009 ticks before the first run render as "missed". | **Amend APP-009:** "Days before the first ever done run render as neutral (no tick), not *missed*." |
| **PL-17** | MINOR | P2 2f | APP-014 defines success only. | **Amend APP-014:** "Web NFC write errors (read-only, moved away, unsupported, permission denied) show a plain-language message and fall back to copy-link instructions. Offer an optional *Lock tag* (`makeReadOnly`) with an irreversibility warning. For NFC Tools instructions, recommend locking so others can't rewrite the sticker." |
| **PL-18** | MINOR | P4 4b, P2 2b | APP-006 copy "didn't count" is wrong when the abandoned run was a phantom. | Reword APP-006: *"An earlier tap-in wasn't finished, so it was cleared. Your chain is unchanged."* (keep "didn't count" only when that day has no done run). |
| **PL-19** | MINOR | P1 1f | Success copy vs at-risk state after midnight. | **Amend APP-004:** when the run's `localDate` ≠ today, the success screen says *"Counted for {weekday}. Day N."* |
| **PL-20** | MINOR | P4 4c | APP-005 "second `/t/{tagId}`… (same run)" is ambiguous about whether it means the same tag or any tag. | State explicitly: "any known tag" (recommended) or "the tap-in tag only". |
| **PL-21** | MINOR | P3 3d | The plant screen has no context for someone who has never used RunTag. | **Amend APP-002:** the plant screen shows one line, *"RunTag records whether you went. It's stored on this phone only."*, plus a link to `/`. |
| **PL-22** | MINOR | P3 3e | "On-device only" while server logs see every tap. | **Amend §3/§8:** no analytics scripts on `/t/*` and `/app/*`. With cache-first (PL-10), most taps never reach the server. Log retention is **OQ-8**. |
| **PL-23** | MINOR | P1 (copy) | "Day 1. Chain unbroken." after a broken chain reads oddly. | Success copy for N=1: *"Day 1. New chain."* |
| **PL-24** | MINOR | P5 5c, clock edits | A future `startedAt` (clock moved back) breaks the 6 h arithmetic. | **Amend APP-006:** "A run with `startedAt` in the future relative to now is treated as stale." |

---

## 4. Open questions (owner decisions; not invented here)

| # | Question | Why it matters / options |
|---|---|---|
| OQ-1 | **Is there a minimum run before tap-out counts?** | Today "Finish run" at 10 s counts (P5 5a, plus accidental bumps). Options: (a) none, honor system (fits "Did you go?"); (b) a silent minimum with no number shown (INV-D4-safe, but means tracking time internally); (c) a confirmation step under N minutes. |
| OQ-2 | **May a run be finished without a tag** (home banner "Finish run")? | Usability for forgotten tap-outs (P4 4d) vs Q2's ritual of "in **and** out". If yes, do abandoned runs ever become recoverable? |
| OQ-3 | **Is RunTag explicitly an honor system?** | Bookmark taps, clock edits and forged imports (P5 5b–5d) can't be prevented without a backend. State it so nobody builds partial anti-cheat. |
| OQ-4 | **Which origin goes on the stickers?** `runtag.vercel.app` vs a custom domain bought now. | Permanent for both the URLs and the on-device data (PL-15). This must be decided before the first sticker is written. |
| OQ-5 | **Travel grace:** if a date-line crossing or long-haul flight removes a calendar day, does the chain break? | Stored `localDate` (PL-3) fixes retroactive shifts but not a genuinely skipped day. Options: break, or a "travel day" allowance. |
| OQ-6 | **iOS standalone: block planting or only warn?** | PL-6. Blocking prevents the silo but makes the installed app feel broken. |
| OQ-7 | **Backup cadence and wording** (PL-1): how often to nudge, and does a nudge conflict with "no guilt"? | Data loss vs nagging. |
| OQ-8 | **Server-side logs of tag hits:** acceptable, minimised, or disabled? | Privacy promise of "on-device only" (PL-22). |
| OQ-9 | **Should the starter-kit stickers come pre-written** with tag URLs? | That would remove the iPhone NFC-writer-app step for P3 entirely. It links to demo open question 1 (starter kit). |

---

## 5. Gate A falsification asks raised by this lens

1. iOS: with Chrome set as the default browser, does a background NDEF URI read open in Chrome or Safari? Can it open in a Safari **Private** tab? (PL-2)
2. Android Samsung: with Samsung Internet as default and the PWA installed from Chrome, which app handles the tag URL? (PL-2)
3. iOS Safari tab: does `navigator.storage.persist()` ever resolve `true`? Does a navigation that comes from an NFC tap count as "user interaction" for ITP's 7-day rule? (PL-1)
4. Android: after a Web NFC `write()` succeeds with the tag still in the field, does the OS dispatch a read and open the URL? (PL-8)
5. Measure how often a single physical tap produces two page loads on each platform. (PL-5, PL-9)
