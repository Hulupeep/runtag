# APP-TAGS — GATE B.5 pre-flight simulation

**Target:** docs/specs/app/APP-TAGS.md (working-tree version, 86 lines) · **Date:** 2026-10-14 · **Mode:** ticket walk against merged APP-SHELL + APP-TAP + APP-CHAIN code
**Context read:** PRDs/runtag-app-prd.md (APP-001, 002, 012, 013, 014, 015, 017, §5, §6, §7, §2 personas), PRDs/runtag-app-verdict.md (§3 S-7/S-8/S-12, §7 APP-TAGS 1–2, §7 APP-DURABLE 2, §7 APP-LINK 3), PRDs/runtag-app-falsification.md (S9, T5, T7), PRDs/runtag-app-persona-lens.md (P2 2a/2f, P3 3a, PL-2, PL-6, PL-8, PL-11, PL-17), PRDs/runtag-app-hops.md (I2, I10, I14, A2, A5, A10, A11, S1, S4, seam list, amendments 2026-10-12, 2026-10-14, 2026-10-14b), docs/specs/app/APP-TAP.md, APP-TAP-preflight.md, APP-CHAIN.md, APP-CHAIN-preflight.md, APP-DURABLE.md, APP-LINK.md, lib/app/{store,chain,route,nav,tap,origin,history}.ts, components/app/Shell.tsx, components/app/AppNav.tsx, components/app/views/{tags,home,tapped,plant,tap}.tsx, docs/contracts/feature_app.yml, feature_app_defaults.yml, journey_app_plant.yml, tests/contracts/contract-scope.test.js, tests/e2e/{tap-helpers.ts, journey_app_plant, journey_app_chain, journey_app_run, journey_app_offline, app_shell}.spec.ts, playwright.config.ts, .claude/hooks/run-journey-tests.sh, evidence/seams-runtag-app.json, node_modules/playwright-core@1.57.0 (server/webkit/wkPage.js, server/chromium/crBrowser.js), Web NFC API shape (`NDEFReader.write(message, {signal, overwrite})`, Chrome Android only, secure context, user activation for the permission prompt).
**Verdict:** NOT build-ready. 0 CRITICAL, 8 P1, 10 P2. Each finding gives the exact ticket edit. The ticket was not edited.

## Personas walked
| Persona | Walk | Result |
|---|---|---|
| P-A Android owner, Chrome, writing 3 stickers in a row | create 3 tags → Write on each in turn; first press shows the NFC permission prompt | Nothing says what the row shows while `write()` waits for a sticker, how to cancel, or what happens when a second row's Write is pressed while the first is pending. `write()` never settles until a sticker arrives, and `AbortError` is unreachable without an `AbortController` (P1-3). Three default "My tag" rows can't be told apart, and a double press on Create makes two tags (P2-10). |
| P-A (refused permission, NFC switched off, sticker pulled away) | deny the prompt; toggle NFC off in Android settings; lift the phone mid-write | Refused → `NotAllowedError` copy is right. NFC off rejects with `NotReadableError` in Chromium, which falls into the catch-all "Hold the phone still on the sticker and try again", so the runner retries forever (P1-4). Pulled away → `NetworkError` copy is right. |
| P-A (OS auto-read straight after the write; OLD tag created days ago) | Write → "Tag ready" with the sticker still on the phone | S-8 is folded, but grace is set only **after** `write()` resolves. If the grace save fails (quota) after a successful write, or the auto-read tab's transaction starts first, the sticker is live with an expired grace and the auto-read is a tap-in at home (PL-8 2a) (P1-1). The old-tag case itself is covered by AC-TAGS-5. |
| P-A (writing the same sticker twice; wrong sticker held) | press Write twice on one row; hold sticker A while writing row B | Same row twice: grace extends twice, harmless. Wrong sticker: `overwrite` defaults to true and Web NFC can't tell, so A becomes B. That's accepted (honour system, A11 read-back), and no edit is needed. |
| P-I iPhone owner, Safari (no Web NFC) | create "Oak at gate" → Copy link → install NFC Tools from the App Store → paste, write → test-tap the sticker at home | Grace is keyed on **creation only** on this path. Install + write + test easily passes 10 min, so the test tap is a tap-in at home and the first real run is out of phase (PL-8 route 3a, the exact P3 walk in the persona lens) (P1-2). In iOS in-app browsers `navigator.clipboard` can be missing or reject. The rule covers it, but no AC exercises "unavailable" (P2-4). |
| P-I in iOS standalone (Add to Home Screen) | `/app/tags` → Create | Hop I14 expects "Plant tags in Safari" and `T` length 0 here, but the guard is APP-DURABLE's. It must edit components/app/views/tags.tsx in the same wave (W3 ‖), and the ticket declares no seam for it (P1-7). |
| P-R returning user | `/app/tags` weeks later: find "Oak at gate"'s URL, rename it to "Bridge" | The list and URL are fine. The rename UX (inline field, save, cancel, testids) is unspecified, and no row carries its tag id, so "that row" can't be addressed (P1-8). |
| P-G grace boundary | create here, then tap the sticker at +2 min (grace) or +3 h (normal tap) | APP-TAP's merged decision handles both (`now < tag.graceUntil`, tap.ts:62). Only AC-TAGS-5 exercises it, and only after a write. The create-only path (hops A2 → A3) is not pinned (P1-6). |
| P-B build engineer | `createTag` id-collision retry in one txn; `markTagWritten` on a missing tag; rename on two pages | Retry is feasible: `withTxn` calls `preventDefault()` on the transaction `error` event (store.ts:99), so a caught `ConstraintError` doesn't abort. The withTxn docstring (store.ts:82-83) says the opposite, the ticket doesn't say which errors to catch, and `put` would silently overwrite a tag (P2-1). `markTagWritten` on a missing row and rename from a stale page are undefined (P2-2). |
| P-C Gate C test author (Playwright 1.57) | AC-TAGS-3…9 | WebKit's permission map has `clipboard-read` only, so `grantPermissions(['clipboard-read','clipboard-write'])` **throws** on `mobile`, and the journey's skip reason is wrong (P2-4). AC-TAGS-4 passes vacuously on an empty list (P1-5). The harness `NDEFReader` can't see user activation unless it records it (P2-5). `checkView` from tap-helpers asserts exactly one `tap-primary`, which the tags view doesn't have (P2-6). Tag ids contain digits. A metric-regex hit needs an id that is all digits plus a unit suffix (`123456789s`), about 6×10⁻⁷ per id, so it's negligible (P2-6). |
| P-X regression (merged APP-SHELL / APP-CHAIN / APP-TAP suites) | AC-SHELL-1/1B, AC-SHELL-11 (on `/app/tags`, real date), journey_app_offline AC-SHELL-6 (`nav-tags` offline), AC-CHAIN-6 (`empty-plant-link` → `data-view=tags`), APP-DURABLE's future wrap of create | All survive if the view keeps `<AppNav/>`, renders only client-side (Shell's server snapshot is `null`, Shell.tsx:30) and has no relative dates or durations (P2-6, P2-10). AC-TAGS-9's static "no `navigator.userAgent`" check will fail once APP-DURABLE adds its UA-token guard to the same view (P1-7). |

## Stipulation fold-in check (verdict §7 APP-TAGS 1–2, plus items elsewhere that land on this view)
| # | Stipulation | Folded? | Gap → finding |
|---|---|---|---|
| 1 | S-7: displayed and copied URL = `TAG_ORIGIN + '/t/' + id`; oracle = rendered URL text after reload | Yes (Rules line 16, AC-TAGS-1, AC-TAGS-3; APP-ORIGIN contract) | The copied URL is not re-read after a reload (S4 wording) (P2-4) |
| 2 | S-8: on successful `NDEFReader.write`, `graceUntil = Date.now() + 600 000` before "Tag ready"; plain-language errors with copy-link fallback (PL-17); feature-detect only | Yes (Rules lines 20–21, AC-TAGS-5/6/9) | The order leaves the auto-read outside grace when the grace save fails or loses the race (P1-1). `NotReadableError` (NFC off) gets wrong advice (P1-4). There is no pending or cancel state, so `AbortError` is unreachable (P1-3) |
| — | S-8 root cause (verdict §3 S-8, PL-8 "created **or written**") on the no-Web-NFC path | No | iPhone writer-app path re-creates PL-8 3a (P1-2) |
| — | S-12 / APP-013 (verdict §7 APP-DURABLE 2; hop I14 is on `/app/tags`) | Deferred to APP-DURABLE (Not-in-scope line 13) | No seam, no file ownership, W3 parallel, and AC-TAGS-9 conflicts with it (P1-7) |
| — | T5 / S-5: `/app/tags` innerText metric check (owned by APP-SHELL AC-SHELL-11; extended here by AC-TAGS-9) | Yes | `checkView` reuse trap; user-entered names (P2-6) |
| — | M-6: no countdowns or durations in copy | Implicit (Rules line 25) | "Tag ready" / instruction copy must not mention "10 minutes" (P2-6) |

## Hop coverage check (pinned I2, A10, A11; shared S1, S4; seam APP-TAGS×APP-TAP on `tag.graceUntil`; plus A2/A5, which the APP-TAP B.5 assigned here)
| Hop | Criterion | Re-read oracle in ticket? | Gap |
|---|---|---|---|
| I2 | AC-TAGS-1 (+ AC-TAGS-4 for "Write to tag" = 0 on WebKit) | partial | The button label in I2 is "Create tag", but Rules and AC-TAGS-9 say "Create" (P1-8). `createdAt` = the fixed clock is not asserted. I2 is a Persona 1 (`mobile`) hop, and the ticket doesn't say AC-TAGS-1 runs in both projects (P1-8) |
| A10 | AC-TAGS-4 | **vacuous** | On a fresh device there are no rows, so "Write to tag count 0" and "`listTags()` unchanged" both hold trivially. There is no positive control showing the button appears when `NDEFReader` exists (P1-5) |
| A11 | none (delegated to APP-LINK) | **orphaned** | APP-LINK.md AC-3 and verdict §7 APP-LINK 3 don't list A11 (Web NFC read-back, `graceUntil`, auto-read creates no run) (P1-6) |
| S1 | AC-TAGS-8 | partial | Create failure only. Rename and grace-reset failures aren't asserted, and non-retryable store errors get Retry (P2-3) |
| S4 | AC-TAGS-1 (displayed), AC-TAGS-3 (copied) | partial | The copied URL is re-read without a reload, and only in Chromium (P2-4) |
| APP-TAGS×APP-TAP `graceUntil` | AC-TAGS-5 | partial | "lands on the grace view" names no URL or selector. The immediate auto-read (at write time) isn't checked. Failure after a successful write isn't covered (P1-1, P2-5) |
| A2 | none | — | "create A and B on `/app/tags` online, clock +11 min → both `graceUntil` < now". It's the create-only grace path and has no owner (P1-6) |
| A5 | none | — | Offline `/app` → in-app link → `/app/tags` lists both names, `T` length 2. APP-TAP.md:8 and APP-TAP-preflight P1-11 assign it to APP-TAGS (P1-6) |
| I10 | AC-TAGS-9 | yes | Harness caveat (P2-6) |
| I14 | none (APP-DURABLE) | seam undeclared | P1-7 |

---

## Pre-flight Findings

### CRITICAL
None. The merged tap decision (tap.ts:57-67) already honours `graceUntil`, and `withTxn` (store.ts:85-117) gives the atomicity the ticket needs. Every gap below is in definition, ordering or testability. None loses a stored tag or run on a path the ticket specifies.

### P1

#### P1-1 — Grace is set after the write, so the Android auto-read can still land outside grace
- **What breaks:** Rules line 20 orders it `write()` → `markTagWritten` → "Tag ready". There are two reachable ways the sticker is live while `graceUntil` is still the old (expired) value:
  1. **The grace save fails after a successful write.** This is the quota or tx-aborted path that Rules line 24 itself defines. The sticker now carries the URL, the runner sees "That wasn't saved", and the auto-read (or the test tap) is a tap-in at home. That is the PL-8 2a phase inversion that S-8 exists to prevent, and Retry can't undo the write.
  2. **Ordering.** The OS dispatch opens `/t/{id}` in another tab or the installed PWA. Its `tapAtTag` readwrite transaction serializes with `markTagWritten`'s in creation order. If the tap's transaction is created first, it reads the old `graceUntil` (tap.ts:62) and starts a run. The window is small, but nothing in the ticket closes it, and the device check A11 can't prove it is closed.
  
  Arming grace **before** calling `write()` closes both windows. A failed arm means `write()` is never called. A failed or cancelled write leaves a harmless 10-minute grace: a real tap in that window shows "Tag works ✓" with an explicit Start/Finish button (APP-TAP grace view). The S-8 wording ("set … on successful write, before 'Tag ready'") still holds if the grace is set again on success.
- **AC/step:** Rules lines 20, 21, 24; AC-TAGS-5, AC-TAGS-6; verdict §7 APP-TAGS 2; seam APP-TAGS×APP-TAP.
- **Evidence:** lib/app/tap.ts:57-62 (grace read inside the tap transaction). lib/app/store.ts:85-117 (one transaction per call, so separate calls serialize). PRDs/runtag-app-persona-lens.md:48,116. PRDs/runtag-app-hops.md:56 (A11: "the OS auto-read straight after the write creates no run").
- **Ticket edit:** replace the second and third sentences of the Web NFC rule (line 20) with:
  > On press, the view first calls `markTagWritten(id, Date.now())` (arm). If that rejects, it shows the S1 failure and **does not call `write()`**. After the arm commits, it calls `new NDEFReader().write({ records: [{ recordType: 'url', data: tagUrl(id) }] }, { signal })` from the same click task's continuation (transient activation lasts long enough for one IndexedDB commit). On success it calls `markTagWritten(id, Date.now())` again, and only after that commits does the row show "Tag ready". If this second save fails, the row shows "Tag written. That wasn't saved" with Retry for the save only (never a rewrite). Grace is already armed.

  Replace the last sentence of line 21 with: "Every error keeps the armed `graceUntil` (harmless: a tap inside it shows 'Tag works ✓' with an explicit Start/Finish) and shows the copy-link fallback."
  
  In AC-TAGS-6, replace "row `graceUntil` deep-equals its value before" with "row `graceUntil` = pressTime + 600000 (armed), all other fields deep-equal their values before".
  
  Add a criterion, named AC-TAGS-11 in the table: "Arm failure: fail-writes armed (AC-TAGS-8 harness) → press Write: 'That wasn't saved' + Retry, harness `write` call count = 0, no `tag-ready`, row deep-equals its value before (re-read in the same context). Post-write save failure: the harness `write` disarms nothing and resolves; the init script arms failure on the 2nd `put` → 'Tag written. That wasn't saved', no `tag-ready`, row `graceUntil` = pressTime + 600000; `/t/{id}` at the same clock → `/app?grace={id}`, `listRuns()` = `[]`."

#### P1-2 — The iPhone (no Web NFC) path never re-arms grace, so the test tap after a writer-app write is a tap-in at home
- **What breaks:** On the no-NFC path, grace is keyed on creation only (`createdAt + 600000`). The iPhone owner creates the tag, copies the link, installs NFC Tools, finds Write → Add a record → URL, pastes, writes, and then (as NFC Tools and common sense suggest) taps the sticker to test it. That usually takes well over 10 minutes, so the test tap is a **tap-in at home**. The real start tap at the park then becomes a tap-out ("Day 1. Chain unbroken." at the start line), and the next day shows "didn't count". This is persona-lens route P3 3a word for word. PL-8's own fix says "created **or written**", and verdict §3 S-8 names "the Web NFC write later than 10 min" only because no other write signal exists in the app. The instructions (line 22) also never tell the user to test, so the grace's purpose isn't explained to them.
  
  Copy link is the step immediately before the paste-and-write on this path, so re-arming grace on copy is the cheapest available signal. Copying for any other reason only produces the harmless grace view. On iOS Safari `navigator.clipboard.writeText` must be called inside the tap's user-activation, so the clipboard call must come **before** any awaited store call.
- **AC/step:** Rules lines 19, 22; AC-TAGS-3, AC-TAGS-4; hop I2 (iPhone persona); PRD APP-017.
- **Evidence:** PRDs/runtag-app-persona-lens.md:30,68,116. PRDs/runtag-app-verdict.md:109 (S-8). docs/specs/app/APP-TAGS.md:19,22. lib/app/tap.ts:62.
- **Ticket edit:** append to the Copy link rule (line 19):
  > `writeText` is called synchronously in the click handler (before any `await`). After it settles, or after the fallback field is shown, the view calls `markTagWritten(id, Date.now())`, so the test tap after a writer-app write lands in setup grace. A failed re-arm doesn't hide the link. It shows the S1 failure under it.

  Append to the No Web NFC instructions: "5. Tap the sticker once with your phone to test it. You'll see 'Tag works ✓'."
  
  Add to AC-TAGS-3: "tag seeded with `createdAt` = T0 − 1 h; Copy at T0 → row `graceUntil` = T0 + 600000 (re-read); `/t/{id}` at T0 + 5 min (fixed clock) → `/app?grace={id}`, `listRuns()` = `[]` (both projects, clipboard rejecting or granted)."

#### P1-3 — Writing has no pending state, no cancel and no one-at-a-time rule
- **What breaks:** `NDEFReader.write()` returns a promise that stays pending until a sticker enters the field. It never times out. The ticket defines only success and error. So:
  1. Nothing tells the runner to "hold the phone on the sticker" while it waits.
  2. There is no way to stop waiting. `AbortError` → "Writing was cancelled." (line 21) can only arise from an `AbortSignal`, and the ticket never creates one.
  3. With three rows, pressing Write on row B while row A's write is pending is undefined: a second concurrent `write()`, a replaced push, or a stale "Tag ready" on the wrong row. That is P-A's three-stickers-in-a-row walk.
- **AC/step:** Rules lines 20–21; AC-TAGS-5, AC-TAGS-6; PL-17.
- **Evidence:** docs/specs/app/APP-TAGS.md:20-21,43-44. The Web NFC API shape: `write(message, { signal })` only settles on tag contact, error or abort.
- **Ticket edit:** add a rule after line 20:
  > **Pending write:** at most one write at a time. While it is pending, that row shows `data-testid="tag-writing"` "Hold your phone on the sticker." and a **Cancel** button (`tag-write-cancel`), which calls `controller.abort()` on the `AbortController` passed as `{ signal }`. Every other row's Write button is disabled. Cancel → `AbortError` → "Writing was cancelled." Navigating away from the view also aborts it.

  Add to AC-TAGS-6: "harness `write` that stays pending: `tag-writing` visible, the other rows' `tag-write` disabled; Cancel → the recorded `signal.aborted === true`, 'Writing was cancelled.', `tag-writing` gone, every `tag-write` enabled."

#### P1-4 — The error map sends "NFC is switched off" to the generic retry advice
- **What breaks:** Chromium's Web NFC reports a disabled NFC setting as `NotReadableError` ("NFC setting is disabled."). The ticket maps only `NotAllowedError`, `NotSupportedError` and `AbortError`, so "NFC off", the most common Android failure, gets "Hold the phone still on the sticker and try again". The runner retries indefinitely. Two smaller gaps: `InvalidStateError` (document hidden or not top-level) is unmapped, and the `NotSupportedError` copy blames the phone even when the cause is an incompatible sticker (unverified; A11 device check). PL-17 asks for plain language about the actual cause.
- **AC/step:** Rules line 21; AC-TAGS-6; PL-17.
- **Evidence:** docs/specs/app/APP-TAGS.md:21,44. PRDs/runtag-app-persona-lens.md:62,125. Chromium Web NFC error types (NOT_ALLOWED, NOT_SUPPORTED, NOT_READABLE, OPERATION_CANCELLED, IO_ERROR → `NotAllowedError`, `NotSupportedError`, `NotReadableError`, `AbortError`, `NetworkError`); confirm the NFC-off name on the A11 device.
- **Ticket edit:** in line 21, insert after the `NotSupportedError` clause:
  > `NotReadableError` → "NFC is switched off. Turn on NFC in your phone's settings, then try again, or copy the link instead."; `InvalidStateError` → "Keep RunTag open on screen while writing, then try again."

  Change the `NotSupportedError` text to "This phone or sticker can't be written here. Copy the link instead." Add `NotReadableError` and `InvalidStateError` to the AC-TAGS-6 rejection list, and add the A11 device line "NFC switched off → the NotReadableError message".

#### P1-5 — AC-TAGS-4 (hop A10) passes on an empty list and has no positive control
- **What breaks:** "Write to tag" is a per-row button (line 18). On a fresh device there are no rows, so `tag-write` count 0 holds whether or not feature detection works, and "`listTags()` unchanged by viewing" is `[] → []`. An implementation that never renders Write, or that UA-sniffs, passes A10. The hops' assertion bar rejects presence-only and trivially true checks (hops:9).
- **AC/step:** AC-TAGS-4; hop A10; APP-014.
- **Evidence:** docs/specs/app/APP-TAGS.md:18,42. PRDs/runtag-app-hops.md:9,55. tests/e2e/tap-helpers.ts:38-42 (`seedTag`).
- **Ticket edit:** replace the AC-TAGS-4 oracle with:
  > Seed tags A and B (`seedTag`). Without a harness (`'NDEFReader' in window` is false in both projects): `tag-row` count 2, `tag-write` count 0, `nfc-instructions` text equals the line-22 copy, and after reload `listTags()` sorted by id deep-equals the seeded rows. Positive control in a fresh page with the harness `NDEFReader` init script: `tag-write` count 2 and `nfc-instructions` count 0.

#### P1-6 — Hops A2, A5 and A11 have no owner that asserts them
- **What breaks:**
  - **A5** (offline: `/app` → in-app link → `/app/tags` lists both names, `T` length 2). It is assigned to APP-TAGS by APP-TAP.md:8 and APP-TAP-preflight P1-11. The ticket header doesn't pin it, and journey_app_offline only checks `data-view=tags` (journey_app_offline.spec.ts:77-78).
  - **A2** (create A and B on `/app/tags` online, clock +11 min, both `graceUntil` < now). This is the only hop for the create-only grace expiry. APP-TAP covered A3/A4 with seeded tags, so A2 is unowned.
  - **A11** (real Android: read-back URL, `graceUntil` ≥ write time + 600000, auto-read creates no run). It is delegated to "APP-LINK device checklist", but APP-LINK.md AC-3 and verdict §7 APP-LINK 3 don't list it. Gate D would walk a hop nobody has.
- **AC/step:** header line 6; Not in scope line 13; DoD.
- **Evidence:** PRDs/runtag-app-hops.md:47,50,56. docs/specs/app/APP-TAP.md:8. docs/specs/app/APP-TAP-preflight.md:42,177-180. docs/specs/app/APP-LINK.md:11. PRDs/runtag-app-verdict.md:234-242.
- **Ticket edit:** change the header to "Pinned hops: I2, A2, A5, A10 (automated); A11 (real Android, added to the APP-LINK #19 checklist by this ticket's DoD); shared-contract hops S1, S4; seam APP-TAGS×APP-TAP on `graceUntil` (PRDs/runtag-app-hops.md)." Add a criterion, named AC-TAGS-10 in the table:
  > Create-only grace and offline list (A2, A5, chromium only: `test.skip(browserName !== 'chromium', 'SW interception is Chromium-only in Playwright')`). Online, after Ready offline ✓: create "Gate A" at T0 and "Gate B" at T0 + 1 min through the UI. At T0 + 12 min, both rows re-read have `graceUntil` < `Date.now()` and `/t/{A.id}` at that clock → `TAPPED_PREFIX + run.id` with `tagInId` = A.id (no grace). Then `setOffline(true)`, `goto('/app')`, click `nav-tags` → `tag-row` names = ["Gate B", "Gate A"], `listTags()` length 2.

  Add a DoD line: "- [ ] APP-LINK #19 AC-3 lists A11 verbatim: 'Android Chrome: Write to tag on `https://runtag.vercel.app/app/tags`; NFC Tools read-back = `https://runtag.vercel.app/t/<id>`; export `graceUntil` ≥ write time + 600000; the auto-read straight after writing creates no run; NFC switched off shows the NotReadableError message.'"

#### P1-7 — The APP-DURABLE wrap of Create is an undeclared writer×writer seam, and AC-TAGS-9 conflicts with it
- **What breaks:** Not-in-scope line 13 says APP-DURABLE "will wrap the create action declared here". Hop I14 (`navigator.standalone = true` → `/app/tags` → "Plant tags in Safari", `T` length 0) and the S-12 UA-token guard can only be built by editing components/app/views/tags.tsx, a file only APP-TAGS declares. Both tickets are in W3 and run in parallel (PRD §9), and APP-DURABLE.md declares neither the file nor `createTag`. Two more effects:
  - AC-TAGS-9 requires "tags code contains no `navigator.userAgent`". APP-DURABLE's closed detection list is UA tokens (verdict §7 APP-DURABLE 2), so once it lands in the tags view, APP-TAGS's own test goes red.
  - APP-012's `navigator.storage.persist()` "when the first tag is planted" needs a hook after `createTag` commits.
- **AC/step:** Not in scope line 13; AC-TAGS-9; Declarations; hops I14, A9; seam list ("tags" writer-writer APP-DURABLE/APP-TAGS/APP-TAP).
- **Evidence:** docs/specs/app/APP-TAGS.md:13,47,75-77. docs/specs/app/APP-DURABLE.md:3,13. PRDs/runtag-app-hops.md:38,54,129-131. PRDs/runtag-app-verdict.md:227. PRDs/runtag-app-prd.md:60-61,184.
- **Ticket edit:** replace the APP-DURABLE clause in line 13 with:
  > …the storage-silo guard and `navigator.storage.persist()` (APP-DURABLE #18, which **depends on this ticket** and is built after it merges). APP-DURABLE gates the single create entry point `onCreate` in components/app/views/tags.tsx and calls persist after `createTag` resolves. Its UA-token detection lives in its own module (`lib/app/silo.ts`), never in tags.tsx or lib/app/tags.ts. Hop I14 and the in-app-browser variant on `/app/tags` are asserted by APP-DURABLE.

  Replace the last clause of AC-TAGS-9 with: "lib/app/tags.ts and components/app/views/tags.tsx contain no `userAgent` and detect Web NFC only with `'NDEFReader' in window`". Add `createTag` and `tag-create` to the seam note "read by APP-DURABLE #18".

#### P1-8 — The selector and copy map can't address per-row oracles
- **What breaks:** AC-TAGS-5/6/7 talk about "the row" and "that row" among three tags, but `tag-row` carries no tag id. `tag-name` is ambiguous between the create input, the row's name text and the rename field. There are no testids for the copied status, the fallback field, the pending state, the failure and Retry, or the rename input/save/cancel. The button label is "Create" (line 47) but "Create tag" in I2 and the Gherkin (line 54). Without one map, two test authors write incompatible locators, and AC-TAGS-7's "renders newest first" has nothing to read the order from.
- **AC/step:** Rules lines 17–24; AC-TAGS-1…9; Declarations line 75; hop I2.
- **Evidence:** docs/specs/app/APP-TAGS.md:18,39-47,54,75. PRDs/runtag-app-hops.md:26.
- **Ticket edit:** add a "Views and copy" table after Rules:
  > | Element | testid / attributes | Copy |
  > |---|---|---|
  > | heading | — | "Your tags" (h1, kept) + `<AppNav/>` (kept) |
  > | create name input | `tag-create-name`, `aria-label="Tag name"`, `maxLength={40}` | default "My tag" |
  > | create button | `tag-create` | "Create tag" |
  > | row | `tag-row`, `data-tag-id={id}`, list order = DOM order | — |
  > | row name | `tag-row-name` | the stored name |
  > | row URL | `tag-url` | `tagUrl(id)` |
  > | copy | `tag-copy` → status `tag-copied` (`role="status"`) | "Copy link" → "Link copied" |
  > | copy fallback | `tag-copy-fallback` (read-only input, `aria-label="Tag link"`) | "Copy this link:" |
  > | write | `tag-write` → `tag-writing` + `tag-write-cancel` → `tag-ready` (`role="status"`) | "Write to tag" → "Hold your phone on the sticker." / "Cancel" → "Tag ready" |
  > | write error | `tag-error` (`role="alert"`) | the line-21 messages |
  > | rename | `tag-rename` → `tag-rename-input` (`aria-label="New name"`) + `tag-rename-save` / `tag-rename-cancel` (Enter saves, Escape cancels) | "Rename" / "Save" / "Cancel" |
  > | failure | `tag-failed` + `tag-retry` | "That wasn't saved" / "Retry" |
  > | instructions | `nfc-instructions` | line 22 |

  Change AC-TAGS-9's button list to "Create tag / Copy link / Write to tag / Rename / Save / Cancel / Retry". Add to AC-TAGS-1: "runs in `chromium` and `mobile`; `createdAt` = T0 (fixed clock)". Update `writes` accordingly (P2-9).

### P2

#### P2-1 — `createTag` retry: say exactly which error is retried, and never `put`
- **What breaks:** Retrying inside one transaction works only because `withTxn` calls `ev.preventDefault()` on the transaction `error` event (store.ts:99), so a caught `ConstraintError` from `req(s.tags.add(…))` doesn't abort. The withTxn docstring (store.ts:82-83, "a request fails → aborted") tells the builder the opposite, which invites `put`. `put` would silently overwrite an existing tag's name, `createdAt` and `graceUntil`. A catch-all would also retry the AC-TAGS-8 `QuotaExceededError`, which is thrown synchronously by the wrapped `add`. Other gaps: after 3 collisions, nothing is specified. `createTag(name, …)` doesn't say whether it cleans the name. No AC reaches the branch, since the odds are 36⁻¹⁰.
- **Evidence:** lib/app/store.ts:80-117. lib/app/chain.ts:44-54 (`newTagId`: an all-zero `getRandomValues` fill yields `aaaaaaaaaa`). lib/app/tap.ts:79 (plant uses `add`, never overwrites).
- **Ticket edit:** replace the Create rule's transaction sentence with:
  > `createTag(name, now)` rejects with `TypeError` if `cleanTagName(name)` is null, and stores the cleaned name. In one `withTxn('readwrite')` it tries up to 3 ids. Each try is `await req(s.tags.add(row))` in a `try` that catches **only** `e.name === 'ConstraintError'` and rethrows everything else. It never uses `put`. A 3rd collision rejects, and the S1 failure applies. Retrying works because `withTxn` `preventDefault`s request errors (store.ts:99), so a caught request error doesn't abort.

  Add to AC-TAGS-1: "collision: seed tag `aaaaaaaaaa`; an init script zero-fills the first `Crypto.prototype.getRandomValues` call after `sessionStorage['runtag-collide']==='1'`; Create → `listTags()` has 2 rows, the seeded row deep-equals its seed, and the new id ≠ `aaaaaaaaaa`."

#### P2-2 — Missing rows and stale pages for `markTagWritten` and `renameTag`
- **What breaks:** `markTagWritten` on an absent id is undefined. `put({...undefined, graceUntil})` throws `DataError` (no key), which shows "That wasn't saved" + Retry, and Retry fails forever. The same applies to rename. Rename from a stale page is safe only if the row is re-read **inside** the transaction. Building it from the React copy would revert a `graceUntil` that another page just set. AC-TAGS-7 checks only "other rows", not the renamed row's other fields.
- **Ticket edit:** in the Module contract: "`renameTag`/`markTagWritten` `get` the row inside their transaction and `put({...row, name})` / `put({...row, graceUntil})`. If the row is absent they write nothing and resolve `null`, and the view re-lists." Add to AC-TAGS-7: "two pages: page 2 writes A (harness) after page 1 rendered the list; page 1 renames A → after reload A = `{...page2Row, name:'Bridge'}` (page 2's `graceUntil` kept)."

#### P2-3 — S1 coverage and store errors that can't be retried
- **What breaks:** AC-TAGS-8 covers only Create. Rename failure (name unchanged) isn't asserted, and grace-arm failure is added in P1-1. The view's initial `listTags()` failure (newer schema, blocked, unavailable) is unspecified. Rules line 24 offers Retry for every failure, but APP-TAP's `FailedView` offers Retry only for `quota`/`tx-aborted`, and `useAction` maps non-`StoreError` rejections to `unavailable`. `FailedView` itself can't be reused, because its h1 is "This tap wasn't saved" and its button is `tap-primary`.
- **Evidence:** components/app/views/tapped.tsx:41-73. components/app/views/home.tsx:61-69 (`store-error` pattern). tests/e2e/app_shell.spec.ts:115-133 (AC-SHELL-16 harness).
- **Ticket edit:** "Retry only for `StoreError` kinds `quota`/`tx-aborted`. For other kinds, and when the initial list load rejects, render `<p data-testid="store-error" role="alert">RunTag can't open its storage on this device ({kind}).</p>` with `<AppNav/>`. Use `useAction` from tapped.tsx for pending/retry, not `FailedView`." AC-TAGS-8 adds: "rename armed → name unchanged (re-read), disarm, Retry → renamed; database pre-created at version 2 → `/app/tags` shows `store-error`, no `tag-create`."

#### P2-4 — Clipboard harness facts and branches
- **What breaks:** In Playwright 1.57, WebKit's `_grantPermissions` maps only `geolocation`, `notifications` and `clipboard-read`, and **throws** `Unknown permission: clipboard-write` (wkPage.js:1067-1076). The journey's reason "WebKit has no permission API for it" is wrong, and a shared `grantPermissions(['clipboard-read','clipboard-write'])` fails the `mobile` project rather than skipping it. The reject branch and the "clipboard unavailable" branch (iOS in-app browsers) don't depend on permissions, so they can run in both projects. The copied value isn't re-read after a reload (hop S4).
- **Evidence:** node_modules/playwright-core/lib/server/webkit/wkPage.js:1067-1076. lib/server/chromium/crBrowser.js:384-385. PRDs/runtag-app-hops.md:160.
- **Ticket edit:** replace the clipboard sentence of the Journey with:
  > Clipboard read-back: chromium grants `['clipboard-read','clipboard-write']`. `mobile` grants `['clipboard-read']` only and asserts `readText()` where it resolves; otherwise `test.skip(browserName === 'webkit', 'Playwright WebKit cannot grant clipboard-write (wkPage _grantPermissions)')`. The reject branch (`Clipboard.prototype.writeText` overridden to reject) and the unavailable branch (`Object.defineProperty(Navigator.prototype, 'clipboard', { get: () => undefined })`) run in both projects.

  AC-TAGS-3 adds: "after `page.reload()`, Copy on the reloaded row; fallback field value = `tagUrl(id)` in both the reject and unavailable cases."

#### P2-5 — Make the `NDEFReader` harness and the AC-TAGS-5 oracle exact
- **What breaks:** "lands on the grace view" names no URL or element. The real auto-read happens at write time, not at +2 min. The fake can't prove the call happened under user activation (needed on a real device for the permission prompt) unless it records it. "Exactly one record" doesn't pin the call count per press.
- **Evidence:** components/app/views/tap.tsx:71 (`/app?grace={tagId}`). components/app/views/tapped.tsx:175-183 (`tap-result[data-state=grace]`, "Tag works ✓"). tests/e2e/journey_app_plant.spec.ts:39-44 (pattern).
- **Ticket edit:** the Journey defines the harness as an init script `window.NDEFReader = class { async write(message, options) { … } }`. Each call is recorded as `{ message, signalPresent: !!options?.signal, active: navigator.userActivation?.isActive }`, then resolves, rejects with `new DOMException('x', name)`, or stays pending, as the test arms it through `sessionStorage['runtag-ndef']`. AC-TAGS-5's oracle becomes: "one recorded call per press, `active === true` (chromium), `message` deep-equals `{records:[{recordType:'url', data: tagUrl(id)}]}`; at writeTime and again at writeTime + 2 min, `/t/{id}` → URL `/app?grace={id}`, `[data-testid=tap-result][data-state=grace]` contains 'Tag works ✓', primary 'Start run', `listRuns()` = `[]`; precondition before Write: row `graceUntil` = createdAt + 600000 < writeTime".

#### P2-6 — Metric check: harness and copy traps
- **What breaks:**
  - `checkView` in tap-helpers asserts exactly one `[data-testid=tap-primary][data-primary]` (tap-helpers.ts:94), so reusing it on `/app/tags` fails.
  - Tag names are user content and render verbatim. A fixture like "5 min loop" trips the duration regex, and the ticket doesn't say names are exempt or that fixtures are metric-free.
  - Random ids only trip the regex when they are all digits plus a unit suffix (about 6×10⁻⁷ per id). That's negligible, but an id must never be rendered after a bare number.
  - M-6: copy such as "test within 10 minutes" or "created 3 h ago" would break AC-TAGS-9 and AC-SHELL-11, which runs on `/app/tags` at the real date.
- **Evidence:** tests/e2e/tap-helpers.ts:90-99. tests/e2e/app_shell.spec.ts:191-199. PRDs/runtag-app-verdict.md:125 (M-6).
- **Ticket edit:** add to Rules line 25: "No dates, relative times or durations on this view, including 'Tag ready' and the instructions. Tag names are user content; test fixtures use metric-free names." Add to AC-TAGS-9: "apply only the regex and `FORBIDDEN_TERMS` part of `checkView` (not its one-primary assertion), on: empty view, 3 rows, copied, fallback, writing, ready, each error, rename open, failure."

#### P2-7 — A11Y contract traps on the new inputs, and live regions
- **What breaks:** APPD-A11Y-003's lookahead `<input(?![^>]*(?:aria-label|aria-labelledby|id\s*=))[^>]*>` stops at the first `>`. A JSX attribute like `onChange={(e) => …}` or `onFocus={(e) => e.currentTarget.select()}` placed **before** `aria-label` ends the scan at `=>`'s `>`, and the contract test flags a labelled input. The plant view avoids this only because `aria-label` comes first (plant.tsx:41-48). APP-015 asks for 48×48 targets, but AC-TAGS-9 checks height only. Status changes ("Link copied", "Tag ready", errors) have no live region, so screen readers miss them.
- **Evidence:** docs/contracts/feature_app_defaults.yml:148-163. components/app/views/plant.tsx:41-48.
- **Ticket edit:** Rules line 25: "Every `<input>` puts `aria-label` (or `id` with a `<label htmlFor>`) **before** any attribute containing `=>`. Status text uses `role="status"`, errors `role="alert"`." AC-TAGS-9: "buttons ≥ 48 × 48 px; `npm run test:contracts` green with the new inputs."

#### P2-8 — The journey id `J-APP-PLANT` is already taken
- **What breaks:** docs/contracts/journey_app_plant.yml:3 already defines `J-APP-PLANT` (tap part). A second contract with that id makes the journey hook resolve the id to the **first** matching file alphabetically, journey_app_plant.yml. So `tests/e2e/journey_app_tags.spec.ts` never runs from a commit that cites the issue.
- **Evidence:** .claude/hooks/run-journey-tests.sh:82-100. docs/contracts/journey_app_plant.yml:1-3,35-36.
- **Ticket edit:** Journey: "J-APP-TAGS (`docs/contracts/journey_app_tags.yml`, `covers_reqs` includes the J-APP-PLANT setup steps of PRD §6)". The Gherkin title stays.

#### P2-9 — Declarations
- **What breaks:**
  - `writes` lacks the `tags` store, a pinned seam (APP-DURABLE/APP-TAGS/APP-TAP, hops:129-131), even though APP-CHAIN reads `tags` for its empty state.
  - `graceUntil` already resolves pre-build (store.ts:5, tap.ts:62), so it is vacuous like `/app/tags`.
  - The P1-8 testids are missing.
  - `useAction` (if reused) isn't in `reads`.
  - `files` lacks `evidence/seams-app-tags.json`, which the DoD runs, and the APP-TAGS entry in evidence/seams-runtag-app.json still declares only `/app/tags`.
  - There's no cross-slice check that a created tag clears APP-CHAIN's empty state (`empty = runs 0 && tags 0`, home.tsx:86).
- **Ticket edit:**
  - writes: add `tags`, `onCreate`, `tag-create-name`, `tag-row-name`, `tag-copied`, `tag-copy-fallback`, `tag-writing`, `tag-write-cancel`, `tag-rename-input`, `tag-rename-save`, `tag-rename-cancel`, `tag-failed`, `tag-retry`; replace `tag-name` with `tag-create-name`.
  - reads: add `useAction`, `store-error`, `empty-state`.
  - Add the note "`graceUntil`, `/app/tags`, `nav-tags` resolve pre-build (vacuous); covered by `markTagWritten`, `tag-create`, `tag-url`".
  - files: add `evidence/seams-app-tags.json` and `evidence/seams-runtag-app.json`, and regenerate both from the edited lists.
  - AC-TAGS-1 adds: "then `goto('/app')` + reload: `empty-state` count 0, `chain-value` `"0"` (seam APP-TAGS → APP-CHAIN on `tags`)".

#### P2-10 — Create UX for several stickers in a row
- **What breaks:** A double press on Create (or Enter plus click) makes two tags, because the ticket has no pending rule. APP-TAP disables buttons while pending. After Create, the field's state is unspecified, so three "My tag" rows are indistinguishable except by URL. Equal `createdAt` (same ms, or tests on a fixed clock) has no tie-break for "newest first". The view must also keep `<h1>Your tags</h1>` and `<AppNav/>` (AC-SHELL-1B and journey_app_offline click `nav-tags`).
- **Evidence:** docs/specs/app/APP-TAP.md (buttons "disabled while pending"). components/app/views/tags.tsx:7-9. tests/e2e/app_shell.spec.ts:37-46. tests/e2e/journey_app_offline.spec.ts:77-78.
- **Ticket edit:** Rules: "Create is disabled while pending, so one press makes one tag. After a commit the field resets to empty and keeps focus, Create stays disabled until a name is typed, and `role="status"` announces 'Tag created'. The list sorts by `createdAt` descending, then `id` ascending. The view keeps the 'Your tags' h1 and `<AppNav/>`." AC-TAGS-2 adds: "`dblclick` on `tag-create` → `listTags()` grows by exactly 1".

---

## Regression notes (no ticket edit needed beyond P1-7, P2-6, P2-10)
- AC-SHELL-1 (`/app/tags` → `data-view=tags`, no hydration warnings) is safe. Views render only after the client snapshot (Shell.tsx:28-45), so `'NDEFReader' in window` during render can't cause a hydration mismatch.
- AC-SHELL-1B, journey_app_offline AC-SHELL-6 (`nav-tags` offline → `data-view=tags`) and AC-CHAIN-6 (`empty-plant-link` → `data-view=tags`, journey_app_chain.spec.ts:202-215) only need the view to keep `<AppNav/>` and the shell route. No test reads the placeholder text "Tag setup arrives in the next update."
- AC-SHELL-11 renders `/app/tags` with an empty database at the real date. The line-22 instructions don't trip the regexes. A list rendered as `<ol>` keeps the step numbers out of `innerText` either way.
- APP-ORIGIN (`location.(origin|host|hostname|href)`) and APP-GLOBALS apply to the new files. `tagUrl(id)` (origin.ts:4-6) is the only URL builder needed. APPD-TEST-003 forbids `.catch(() => undefined|null|false|{})` in `lib/**/*.ts` and `components/**/*.ts` (feature_app_defaults.yml:264-280), so the clipboard fallback must handle the rejection explicitly.
