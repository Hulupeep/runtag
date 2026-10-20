# APP-LINK — GATE B.5 pre-flight simulation

**Target:** docs/specs/app/APP-LINK.md (working-tree version, 75 lines; HEAD has the 17-line thin outline whose AC-3 carried the A11 and I17 text) · **Date:** 2026-10-19 · **Mode:** ticket walk against merged APP-SHELL/TAP/CHAIN/TAGS/DURABLE code and the demo
**Context read:** PRDs/runtag-app-prd.md (§3 out-of-scope sentence, APP-021, APP-101, §7 Primary/Durability, §8 dependencies), PRDs/runtag-app-verdict.md (§2 ledger #17–#22, #26; §4 M-1, M-7, M-8, M-10, M-11; S-7; §7 APP-LINK 1–3), PRDs/runtag-app-falsification.md (overclaim table, T7, T12), PRDs/runtag-app-persona-lens.md (PL-21, PL-22, OQ-8, §5 device asks 1–5), PRDs/runtag-app-hops.md (assertion bar, G2, I16, I17, A11, A12, amendments 2026-10-12, 2026-10-14, 2026-10-14b, 2026-10-14c, 2026-10-19), `git show HEAD:docs/specs/app/APP-LINK.md`, docs/specs/app/APP-TAGS.md:109 and APP-DURABLE.md:143 (DoD lines), APP-CHAIN.md:17, APP-SHELL.md AC-SHELL-10/12, components/scenes/Scene8CTA.tsx, Scene7Discovery.tsx, app/page.tsx, hooks/useDemoState.ts, lib/constants.ts (COPY.scene8, FORBIDDEN_TERMS, TIMING), app/globals.css (`.cta-button`), app/layout.tsx, app/(shell)/layout.tsx, components/app/views/{tags,plant,settings,tapped}.tsx (copy the checklist quotes), tests/e2e/{demo-flow,mobile,accessibility,interactions,app_shell}.spec.ts, tests/invariants/invariants.spec.ts, docs/contracts/{feature_demo,feature_app,feature_app_defaults,journey_demo_complete}.yml, next.config.mjs, scripts/sw/{build-sw.mjs,sw.template.js}, scripts/vercel-ignore.sh, scripts/verify-seams.cjs, evidence/seams-check.sh, evidence/seams-runtag-app.json (APP-LINK entry), evidence/publication/app-shell-26-closed.md, .specflow/specification/24.json:278, playwright.config.ts, .github/workflows/e2e.yml, QA/loops/feature-build.yaml (`epic_gate`), scripts/teardown-gate.cjs (`check-gate-d`), docs/specs/slice-prd-copy.md (#12), docs/specs/runtag-stories/US-8-cta.md.
**Probes (2026-10-19, read-only):** anonymous `curl` → `https://runtag.vercel.app/t/zz9yx8wv7u` 200 (`<title>RunTag`, `data-testid="view"`); `https://runtag-floutlabs.vercel.app/app` and `/t/…` → **302 `Location: https://vercel.com/sso-api?…`**; `https://runtag-git-main-floutlabs.vercel.app/app` → 302 to SSO; `Host: runtag-floutlabs.vercel.app` sent to the canonical IP → the same 302; `/sw.js` 200 with `const BUILD_ID = 'Gz21jV-mQ0f_OS1RPRTtp'`; one chunk referenced by `/` (`6c363fca2bedf263.js`) contains `restart-button` (scene 8 ships in a chunk the demo HTML references; the HTML itself has no scene-8 text). Scratchpad Playwright probe (chromium and WebKit iPhone 13): from an `aria-label="Email address"` input, Tab → submit button → `<a href>` → next button in both.
**Verdict:** NOT build-ready. 1 CRITICAL, 5 P1, 4 P2. Each finding gives the exact ticket edit. The ticket was not edited.

## Personas walked
| Persona | Walk | Result |
|---|---|---|
| V-P demo visitor on a phone (canonical origin) | `/` → scenes 1–7 → scene 8 → reads headline, form, "Get Starter Kit – £19", social proof → "Start for real" → `/app` | Works with a plain `<a>`: the full navigation reaches the shell rewrite (next.config.mjs:16-18) and the SW does not intercept `/` (sw.template.js:22,31). Gaps: the link's position relative to social proof, its classes and whether it survives a waitlist submission are unpinned. The form is inside `{!submitted ? … : …}` (Scene8CTA.tsx:60-98), so a link placed "below the waitlist form" inside that branch disappears after "You're on the list!" (P2-1). |
| V-K keyboard / screen-reader visitor | Tab from the email input | Probe: Tab lands on the £19 submit button first, then the link, in chromium and WebKit iPhone 13. "Reachable by Tab from the email input" (AC-LINK-2) is true but the sequence isn't pinned (P2-1). Accessible name "Start for real" is fine. `.cta-button` gives a focus ring (globals.css:150). |
| V-I visitor in an alias host | `runtag-floutlabs.vercel.app/` | Not reachable: Vercel SSO answers before Next (probe). The link can't create an alias-origin silo for anonymous visitors. That is good for S-7 but breaks the ticket's alias oracle (C1). |
| O-R owner running the release | merge → Vercel deploy → `bash scripts/release-smoke.sh` | Check 2 (alias → 308) **fails today** (302 to SSO; evidence/publication/app-shell-26-closed.md:9 already said so) (C1). Check 3 ("sw.js containing `BUILD_ID`") passes on any build, even an unrendered template, because the literal `BUILD_ID` is always in sw.js (sw.template.js:2,4). Nothing proves the merged commit is live (ledger #20) (P1-1). No output path, no wait for the deploy, CI vs owner-run unstated (P2-3). |
| O-D owner walking the device checklist for Gate D | items 1–9 on iPhone and Android, then `node scripts/teardown-gate.cjs check-gate-d gate-d/<epic>/` | `check-gate-d` accepts evidence only as `evidence/*.png|jpg|jpeg|webp|txt|json|md` and needs `.txt`/`.json` for value-bearing hops (teardown-gate.cjs:121-170). The checklist names no hop id per item, no evidence file, and I16's evidence is a screen recording (a video is not accepted). The owner can't produce a passing Gate D from the checklist as written (P1-2). APP-CHAIN's delegated day-change check is missing (P1-4). Item 6 (A12) can't pass on a phone not signed in to Vercel (C1). |
| C-T Gate C test author | J-APP-LINK in chromium + mobile; static doc checks | Reaching scene 8 copies demo-flow.spec.ts:70-80, which clicks `getByRole('button', { name: 'See How It Works' })`. That label is hard-coded (Scene7Discovery.tsx:58) and parked slice #12 renames it to "Get RunTag →" (slice-prd-copy.md:40) (P2-2). "Verbatim" and "character for character" have no extraction rule: the DoD lines wrap the text in `"…"`, the strings contain backticks, and the Rules bullet quotes the replaced sentence that AC-LINK-4 forbids (P1-3). AC-LINK-3 lists three demo suites but tests/e2e/accessibility.spec.ts and interactions.spec.ts also walk the demo (P2-2). `data-view=home` + path `/app` would also pass a `next/link` soft navigation (P2-1). |
| X regression | INV-D4 on scene-8 textContent; feature_demo INV-D7; journey_demo_complete step 8–9; AC-SHELL-12 `Email address`; G2 | "start for real" contains none of FORBIDDEN_TERMS (constants.ts:73-84), so invariants.spec.ts:93-96 stays green as long as no helper copy is added (P2-1). The contract scopes for `next/link`/`location.*` bans don't cover components/scenes (feature_app.yml:21-24, 38-41). APPD-PROD-002's localhost ban doesn't scope scripts/ or docs/, and the https URLs aren't forbidden anyway. The seam DoD fails on a file-path surface (P1-5). |

## Stipulation fold-in check (verdict §7 APP-LINK 1–3, incl. T12 parts; falsification overclaim table and T12)
| # | Stipulation | Folded? | Gap → finding |
|---|---|---|---|
| 1 | M-8: "Start for real" → `/app` **added** as a secondary link; £19 CTA and waitlist untouched | Yes (lines 13, 21, AC-LINK-1) | Placement vs the `submitted` branch and social proof unpinned (P2-1) |
| 2 | M-11 / M-1 revenue statement in the ticket body | Yes, verbatim (line 9) | Release notes say "the revenue statement above" without the exact string; the header copy is bold and carries "(M-11 / M-1)" (P1-3) |
| 3a | M-10 sticker purchase date before W4 | Yes (item 1) | No evidence file (P1-2) |
| 3b | Ledger #21 unauthenticated `/t/{id}` → 200 | Yes (smoke check 1, item 7) | Verified 200 today (probe); "the shell document" has no marker (P1-1) |
| 3c | Ledger #19 / S-7 alias → 308 to canonical | Written, but **cannot pass** | Alias hosts are behind Vercel SSO: anonymous 302 to `vercel.com/sso-api` (C1) |
| 3d | Ledger #26 / T7 iOS default browser ≠ Safari, Private tab | Yes (item 3) | — |
| 3e | iOS writer app read-back exact | Yes (item 2) | Where the id comes from (hop I16 "the URL from I2") unstated (P2-4) |
| 3f | M-7 latency by screen recording < 2 s on 4G | Yes (item 2) | A video can't be Gate D evidence; needs a frame-count `.txt` + frame screenshots (P1-2) |
| 3g | 8-day iOS retention | Via I17 (item 4) | APP-021 hypothesis outcome (ledger #26 "ITP interaction signal") never recorded (P1-4) |
| 3h | Ledger #20 git `main` → production | **No** | Listed in §7 APP-LINK 3's sources; nothing checks it (P1-1) |
| T12-a | §3 Vercel-log sentence replaced by the overclaim text | Yes (line 23, AC-LINK-4) | The Rules bullet's parenthetical quotes the forbidden phrase; extraction rule for backticks (P1-3) |
| T12-b | §7 tally in a dated note before opening `/app` | Yes (item 8; inside I17 text) | — |
| T12-c | APP-021 worded as a hypothesis | Yes (line 24) | — |
| T7 | Private browsing not detected (overclaim text) | Yes (line 26) | — |
| — | PL-22 / OQ-8 "no analytics scripts on `/t/*` or `/app*`" | Claimed in release notes | Not checked anywhere; layouts load no third-party script today (app/layout.tsx, app/(shell)/layout.tsx), so a cheap smoke check keeps the claim true (P2-3) |

## Hop coverage check (G2, I16, I17, A11, A12, and every check delegated to "APP-LINK checklist" / "real device", incl. all dated amendments)
| Hop / delegated check | Source | Criterion in ticket | Re-read oracle? | Gap |
|---|---|---|---|---|
| G2 | hops:143, amendment 2026-10-12 (`Email address` carries the seam) | AC-LINK-1 | yes: email accessible name, £19 text, `href`, then a new document `/app` with `data-view=home` | Soft-navigation false pass; label-coupled scene-7 step (P2-1, P2-2) |
| I16 | hops:40 | item 2 | owner | No hop id / evidence files; video not accepted by `check-gate-d` (P1-2) |
| I17 | hops:41; amendment 2026-10-19; APP-DURABLE.md:143 | item 4 "verbatim" | owner | Extraction rule undefined (P1-3); evidence files (P1-2); APP-021 outcome (P1-4) |
| A11 | hops:56; amendment 2026-10-14c; APP-TAGS.md:109 | item 5 "verbatim" | owner | Same as I17; the actual NotReadableError copy (tags.tsx:31) isn't given as Expected (P2-4) |
| A12 | hops:57 | item 6, smoke check 2 | owner + script | **Unreachable as written** (C1) |
| Ledger #20 main → production | verdict §2 #20, §7 APP-LINK 3 | none | — | P1-1 |
| Ledger #21 unauthenticated 200 | verdict §2 #21 | smoke 1, item 7 | yes (status) | Shell marker unpinned (P1-1) |
| APP-CHAIN day change | APP-CHAIN.md:17 "(manual check in the APP-LINK device list)" | **none** | — | Orphaned (P1-4) |
| §7 Durability 14 days | PRD:170 | none | — | Owner metric with no checklist home (P2-4) |
| Persona-lens §5 asks 2 (Samsung default) and 5 (double page loads per tap) | persona-lens:155,158 | none | — | Neither owned nor declared out of scope (P2-4) |
| Seam `/app` (mixed incl. APP-LINK) | hops:89-92 | AC-LINK-1 | yes | — |

---

## Pre-flight Findings

### CRITICAL

#### C1 — The alias hosts sit behind Vercel SSO, so smoke check 2, checklist item 6 and hop A12 can't pass as written
- **What breaks:** Rules line 27 expects `GET https://runtag-floutlabs.vercel.app/app` → 308 with `Location: https://runtag.vercel.app/app`. Today the anonymous answer is **302 `Location: https://vercel.com/sso-api?url=…`** for `/app` and `/t/…`, and the same for `runtag-git-main-floutlabs.vercel.app` (probe 2026-10-19). Vercel answers before Next, so the redirect in next.config.mjs:21-27 never runs. Sending `Host: runtag-floutlabs.vercel.app` to the canonical address gets the same 302, so no script can reach the rule without a protection-bypass secret. AC-LINK-6 exits non-zero on every run, and item 6 fails on any Android phone not signed in to Vercel. The APP-SHELL close-out already recorded this (evidence/publication/app-shell-26-closed.md:9), but the ticket didn't absorb it. A12 is a pinned hop: changing its expected value is a `stale-oracle` amendment, which `epic_gate.never_without_human` reserves for the owner (QA/loops/feature-build.yaml:148-160). So the build agent can't settle this alone.
- **Why it's safe to resolve without infra change:** S-7's goal is that no second origin stores RunTag data. SSO already makes the aliases unusable for everyone except a Vercel-signed-in owner, and for that owner the 308 still runs after SSO. The rule itself is covered locally by AC-SHELL-10 (app_shell.spec.ts:236-254, `Host:` header against the production build).
- **AC/step:** Rules line 27; checklist item 6; AC-LINK-6; hop A12; verdict S-7, §7 APP-LINK 3.
- **Evidence:** docs/specs/app/APP-LINK.md:27,34,48. next.config.mjs:6-10,21-27. evidence/publication/app-shell-26-closed.md:9. PRDs/runtag-app-hops.md:57. PRDs/runtag-app-verdict.md:185,237. QA/loops/feature-build.yaml:147-160. The probe above.
- **Ticket edit (owner decision required; recommended option A):**
  - **Option A (keep Vercel SSO; recommended).** Replace the smoke's second check with:
    > `GET https://runtag-floutlabs.vercel.app/app` and `GET https://runtag-git-main-floutlabs.vercel.app/app`, anonymous, no redirects followed → each is either 302/307 with `Location` starting `https://vercel.com/sso-api` **or** 308 with `Location: https://runtag.vercel.app/app`. A 200, or any other status, fails.
  - Replace checklist item 6 with:
    > A12 (owner amendment <date>): (a) on an Android browser **not** signed in to Vercel, `https://runtag-floutlabs.vercel.app/app` shows the Vercel login, never RunTag; (b) in a browser signed in to Vercel, the same URL lands on `https://runtag.vercel.app/app` (address bar re-read).
  - Add to the DoD:
    > - [ ] PRDs/runtag-app-hops.md carries a dated, owner-approved amendment re-stating A12 as in checklist item 6 (stale-oracle disposition recorded before the build; the build agent doesn't write it).
  - **Option B (owner relaxes Deployment Protection so aliases are public).** The ticket stays as written, and the DoD adds "Vercel project `runtag` Deployment Protection changed by the owner on <date>; probe re-run shows 308". This exposes `runtag-git-main-…` publicly too, so option A is the lighter path.

### P1

#### P1-1 — The smoke's build check is vacuous, the shell document has no marker, and nothing proves the merge is live (ledger #20)
- **What breaks:**
  - "`/sw.js` → 200 containing `BUILD_ID`" holds for **every** sw.js, including an unrendered template. The identifier `BUILD_ID` is in the template (sw.template.js:2,4), and the `__BUILD_ID__` placeholder contains it too.
  - "200 and the shell document" names no marker. The demo `/` is also a 200 HTML page. The shell differs by `<title>RunTag</title>` (app/(shell)/layout.tsx:4) and `data-testid="view"` (Shell.tsx:44,51) (probe).
  - Verdict §7 APP-LINK 3 cites ledger #20 ("Git `main` → production", UNVERIFIED), and no check covers it. AC-LINK-6 can pass against the **previous** deployment, so "captured after the merge deploys" is unverifiable.
  - The scene-8 code ships in a chunk referenced by `/` (probe: `6c363fca2bedf263.js` contains `restart-button`). After this ticket, that chunk contains `start-for-real`, so the deploy can be proven with plain HTTP.
- **AC/step:** Rules line 27; AC-LINK-6; verdict ledger #20, #21.
- **Evidence:** docs/specs/app/APP-LINK.md:27,48. scripts/sw/sw.template.js:2,4. scripts/sw/build-sw.mjs:23-25. app/(shell)/layout.tsx:3-6. components/app/Shell.tsx:44,51. PRDs/runtag-app-verdict.md:156,234. The probe.
- **Ticket edit:** replace the Release smoke rule with:
  > **Release smoke** (`scripts/release-smoke.sh`, `set -euo pipefail`, `curl -sS --max-redirs 0`, no cookies, read-only GETs). It prints one line per check: `<check> <status> <location-or-marker> PASS|FAIL`, and exits 0 only if all of these pass:
  > 1. **Shell:** `GET https://runtag.vercel.app/t/{id}`, where `{id}` is a fresh `[a-z0-9]{10}` from `/dev/urandom` → 200, and the body contains `<title>RunTag</title>` and `data-testid="view"`.
  > 2. **Aliases:** per C1.
  > 3. **Service worker:** `GET https://runtag.vercel.app/sw.js` → 200, with `Cache-Control: no-cache`, and the body matches `const BUILD_ID = '([^'_][^']*)'` (a rendered id, never `__BUILD_ID__`).
  > 4. **This release is live (ledger #20):** `GET https://runtag.vercel.app/` → 200; at least one `/_next/static/chunks/*.js` referenced by that HTML contains `start-for-real`. The script polls check 4 every 30 s for up to 10 min, so it can be started as soon as the merge lands, before checks 1–3 run.
  >
  > Raw output → `evidence/release-smoke-<issue>.txt`.

  AC-LINK-6 becomes: "`bash scripts/release-smoke.sh` after the merge → exit 0. The captured file shows four PASS lines and the BUILD_ID value."

#### P1-2 — The device checklist can't produce Gate D evidence that `check-gate-d` accepts
- **What breaks:**
  - Gate D validates `gate-d/<epic>/findings.md` per hop. Each section needs at least one existing `evidence/<name>.(png|jpg|jpeg|webp|txt|json|md)`, and value-bearing hops need a `.txt` or `.json` (teardown-gate.cjs:121-170).
  - The checklist items have "Expected" + "Result / date / phone" only. No item names its hop id, so the Gate D materialization can't map items 2, 4, 5 and 6 to I16, I17, A11 and A12.
  - No item names the evidence files. I16's latency proof is a screen recording, which isn't an accepted evidence type, so the latency value has no admissible carrier.
  - AC-LINK-5 checks only that "Expected" and "Result" fields exist, so a checklist without evidence slots passes Gate C and fails Gate D later.
- **AC/step:** Device checklist rule (lines 28–37); AC-LINK-5; Journey line 60; DoD line 75; hops I16, I17, A11, A12; feature-build `epic_gate`.
- **Evidence:** docs/specs/app/APP-LINK.md:28-37,47,60,75. scripts/teardown-gate.cjs:66,121-170. QA/loops/feature-build.yaml:126-160. PRDs/runtag-app-hops.md:40-41,56-57.
- **Ticket edit:** in the Device checklist rule, replace "each "Expected" + "Result / date / phone"" with:
  > Each item is a `### <n>. <title>` section with these lines, in this order:
  > - `Hop:` the hop id, or `—`
  > - `Expected:`
  > - `Evidence:` file names under `gate-d/runtag-app/evidence/`
  > - `Result:`
  > - `Date:`
  > - `Phone / OS / browser:`
  >
  > Evidence names:
  > - item 1 `stickers-purchase.png`
  > - item 2 `I16-export-after-in.json`, `I16-export-after-out.json`, `I16-latency.txt` (fps, banner-tap frame number, first TAGGED frame number, ms), `I16-first-tagged-frame.png`. Keep the recording itself, but it isn't Gate D evidence.
  > - item 3 `iOS-default-browser.txt`
  > - item 4 `I17-export-<YYYY-MM-DD>.json` for each day, `I17-tally.txt`, `I17-silo.png`
  > - item 5 `A11-export.json`, `A11-nfctools-readback.png`, `A11-nfc-off.png`
  > - item 6 `A12-anonymous.png`, `A12-signed-in.png`
  > - item 7 `unauth-t.png`
  > - item 8 `primary-metric.txt` (dated tally rows + chain value per day)
  > - item 9 `demo-link.png`
  > - item 10 (P1-4) `day-change.png`
  >
  > The release smoke output is copied to `gate-d/runtag-app/evidence/release-smoke.txt`.

  AC-LINK-5 adds: "every item section has non-empty `Hop:`, `Expected:` and `Evidence:` lines. Items 2, 4, 5 and 6 carry `Hop: I16`, `I17`, `A11` and `A12`. Every evidence name ends in .png, .txt or .json, and items 2, 4, 5 and 8 list at least one .txt or .json."

#### P1-3 — "Verbatim" and "character for character" have no extraction rule, and the forbidden phrase sits in the text to be copied
- **What breaks:**
  1. **DoD extraction.** AC-LINK-5 compares the checklist's A11/I17 lines with "the DoD lines" character for character. The DoD lines are `- [ ] APP-LINK #19 device checklist (…) lists A11 verbatim: "Android Chrome: …"` (APP-TAGS.md:109) and `… lists, verbatim: "I17 (iPhone Safari, …)…'Plant here anyway'."` (APP-DURABLE.md:143). A literal whole-line comparison can never be true. The quoted part contains backticks and inner single quotes, and the A11 quote doesn't start with "A11". Two authors will extract different strings.
  2. **Release-notes strings.** Line 23 includes backticks (`` `/t/*` ``, `` `/app*` ``). Whether the release notes keep them (raw markdown) or render them isn't stated.
  3. **Revenue statement.** "The revenue statement above" (line 25) points at a bold header that also carries "(M-11 / M-1)".
  4. **Forbidden phrase.** The bullet at line 23 ends with "(replaces PRD §3 "Vercel access logs contain only random tag IDs, no personal data")". A builder who copies the bullet into the release notes fails AC-LINK-4's own negative check ("does not contain 'contain only random tag IDs'").
- **AC/step:** Rules lines 22–26; AC-LINK-4, AC-LINK-5.
- **Evidence:** docs/specs/app/APP-LINK.md:9,22-26,46-47. docs/specs/app/APP-TAGS.md:109. docs/specs/app/APP-DURABLE.md:143. PRDs/runtag-app-falsification.md:96-98. PRDs/runtag-app-verdict.md:233.
- **Ticket edit:** replace the "Release notes contain verbatim" bullet list with:
  > **Release notes** contain each of these four strings exactly, as raw markdown (backticks included), each on its own line:
  > - R1 = `Vercel request logs record tag ID, IP, user agent and time for online taps (plan retention); no analytics scripts on `/t/*` or `/app*`.`
  > - R2 = `Every tap screen shows one primary button (hypothesised WebKit user-interaction signal; confirmed or refuted by the §7 8-day iOS check).`
  > - R3 = `Revenue: none in v1; validation only. Alternative today: calendar/streak app or iOS Shortcuts NFC automation; delta: no install, no typing, metric-free chain.`
  > - R4 = `Private browsing is not detected (no reliable signal); the plant screen states 'Private tabs forget your chain.'`
  >
  > The release notes never quote the replaced PRD §3 sentence. The parenthetical notes in this ticket are commentary, not release-note text.

  Replace AC-LINK-5's verbatim clause with:
  > for each of docs/specs/app/APP-TAGS.md and docs/specs/app/APP-DURABLE.md, the spec reads the single line containing `APP-LINK #19 device checklist` and extracts the text between the first `"` after `verbatim:` and the last `"` on that line. The checklist's item 5 (APP-TAGS) and item 4 (APP-DURABLE) `Expected:` line contains that text as an exact substring.

  AC-LINK-4 reads R1–R4 from the spec's own constants, not re-typed copies.

#### P1-4 — Two delegated device checks are missing: APP-CHAIN's day change, and the APP-021 hypothesis outcome
- **What breaks:**
  - APP-CHAIN.md:17 makes the day-change refresh ("home re-runs the load on `visibilitychange` to `visible` when `localDayOf(Date.now())` differs") a **"manual check in the APP-LINK device list"**. The checklist has no such item, so that behaviour has no owner anywhere.
  - Release-note R2 promises the APP-021 hypothesis is "confirmed or refuted by the §7 8-day iOS check" (ledger #26). I17's verbatim text records exports and the tally, but no item records the verdict on the hypothesis. So the release notes make a promise the walk never discharges.
- **AC/step:** Device checklist rule; AC-LINK-5 ("items 1–9"); verdict ledger #26; falsification overclaim row APP-021.
- **Evidence:** docs/specs/app/APP-CHAIN.md:17. docs/specs/app/APP-LINK.md:24,28-37,47. PRDs/runtag-app-verdict.md:162. PRDs/runtag-app-falsification.md:48,97.
- **Ticket edit:** add checklist item 10:
  > Day change (APP-CHAIN #29 P2-6): `/app` open in iPhone Safari before local midnight, switch to another app, and return after midnight without reloading → today's link and the "today" state show the new day.

  Add to item 4's section a line:
  > `APP-021 hypothesis:` confirmed (no data lost over ≥ 8 days of NFC-launched visits) / refuted (loss observed: date and what was lost)

  AC-LINK-5: "items 1–10 present"; item 4 has a non-empty `APP-021 hypothesis:` line placeholder.

#### P1-5 — The seam DoD fails by construction: a file path is declared as a `writes` surface
- **What breaks:** `verify-seams` resolves a surface only as a substring of code files (`.ts/.tsx/.js/.jsx/.html/.cjs/.mjs`; verify-seams.cjs:75-90). `components/scenes/Scene8CTA.tsx` appears in no code file (checked), so `bash evidence/seams-check.sh evidence/seams-app-link.json` exits 1 after the build. This is the defect recorded for APP-SHELL (.specflow/specification/24.json:278). There are further problems:
  - `view` resolves trivially anywhere and is vacuous.
  - `files` lacks `evidence/seams-app-link.json`, which the DoD runs, and `evidence/seams-runtag-app.json`, whose APP-LINK entry still declares only `start-for-real` / `/app`, `Email address`.
  - The ticket also adds `scripts/release-smoke.sh` and release docs that later slices don't read, so no new seams.
- **AC/step:** Declarations lines 63–68; DoD line 74.
- **Evidence:** docs/specs/app/APP-LINK.md:63-68,74. scripts/verify-seams.cjs:75-90,100-110. evidence/seams-check.sh:6-14. evidence/seams-runtag-app.json (APP-LINK entry). .specflow/specification/24.json:278.
- **Ticket edit:** Declarations:
  > writes: [`start-for-real`, `Start for real`]
  > reads: [`/app`, `scene-8`, `Email address`, `restart-button`, `data-view`]
  > files: add `evidence/seams-app-link.json`, `evidence/seams-runtag-app.json`
  >
  > Note: "`scene-8`, `Email address`, `restart-button`, `/app` resolve pre-build (APP-SHELL/demo); `start-for-real` and `Start for real` resolve only after this build. The APP-LINK entry of evidence/seams-runtag-app.json is updated to the same writes/reads, and the epic graph is recomputed with `--no-resolve`."

### P2

#### P2-1 — Link placement, styling and navigation type are under-pinned
- **What breaks:**
  - "Below the waitlist form" is ambiguous relative to social proof. If the link sits inside the `!submitted` branch (Scene8CTA.tsx:60-98), it vanishes after a successful signup, which is exactly when an interested visitor wants it.
  - A `motion.*` wrapper with a delayed fade or a `y` offset gives an unstable box during the 48 × 48 measurement. Adding helper copy ("No account. Your phone keeps it.") risks INV-D4's substring scan of scene-8 `textContent` (invariants.spec.ts:93-96).
  - A `next/link` (not banned in components/scenes, feature_app.yml:21-24) would soft-navigate. `/app` + `data-view=home` could still pass, but the shell's layout metadata (manifest) and the SW-registration path differ from a real document load.
  - The Tab sequence passes through the £19 submit button first (probe).
- **Ticket edit:** replace the Link rule with:
  > **Link:** a plain `<a href="/app" data-testid="start-for-real" className="cta-button secondary inline-flex min-h-[48px] min-w-[48px] items-center justify-center">Start for real</a>`. It is not a `motion` element and not `next/link`, and its text is exactly "Start for real" with no other added copy. It is placed after the `{!submitted ? form : success}` block and before the social-proof `<p>`, so it is rendered whether or not the waitlist was submitted. "Restart Demo" stays last.

  AC-LINK-1 adds: "after activation `page.evaluate(() => performance.getEntriesByType('navigation')[0].name)` ends with `/app` (a document load, not a soft navigation)."

  AC-LINK-2 becomes:
  > focus the email input; Tab → the £19 button is focused; Tab → `start-for-real` is focused; Enter → `/app` document load. Its `boundingBox()` (read before any hover) is ≥ 48 × 48. The DOM order inside `scene-8` is the form → `start-for-real` → the social-proof text → `restart-button` (`compareDocumentPosition`).

#### P2-2 — Gate C harness: reaching scene 8 robustly, and the full demo regression set
- **What breaks:**
  - demo-flow.spec.ts:72-77 and mobile.spec.ts:84-104 reach scene 8 through `getByRole('button', { name: 'See How It Works' })`. That label is hard-coded (Scene7Discovery.tsx:58), and parked slice #12 renames it to "Get RunTag →" (slice-prd-copy.md:40). J-APP-LINK would then break for a copy change it doesn't own.
  - AC-LINK-3 names three suites, but tests/e2e/accessibility.spec.ts and interactions.spec.ts also walk the demo.
  - The node-side static checks run once per project (testMatch `**/*.spec.ts`, two projects). Duplication is harmless but should be stated.
- **Ticket edit:** Journey line 60 adds:
  > Scene 8 is reached with testids: `start-demo-button` → `nfc-tag` → `scene-5` (timeout 10 000, TIMING.runAnimation 5000 + autoAdvanceDelay 2000) → `nfc-tag` → `page.getByTestId('scene-6').getByRole('button')` → `page.getByTestId('scene-7').getByRole('button')` → `scene-8` visible. Use `tap()` on `mobile` and `click()` on `chromium`. The static release-document checks run in both projects (read-only, idempotent).

  AC-LINK-3 becomes: "every pre-existing Playwright spec (all of tests/e2e and tests/invariants except journey_app_link.spec.ts) passes, and `git diff --stat main -- tests/` lists only the new spec."

#### P2-3 — Release smoke: who runs it, when, and where its output goes; the PL-22 claim stays true
- **What breaks:**
  - The smoke hits production after deploy. It can't be in the PR CI (e2e.yml runs before the merge deploys) or in `npm test` (network, production state).
  - The ticket doesn't say who runs it, when, or where the "raw output" is kept.
  - A docs-only evidence commit after the merge is skipped by scripts/vercel-ignore.sh:11-13, so committing the evidence doesn't redeploy. That's fine, but it should be stated.
  - Release-note R1 asserts "no analytics scripts on `/t/*` or `/app*`", and no check backs it.
- **Ticket edit:** Rules adds:
  > The smoke is owner/agent-run after the merge (never in CI or `npm test`; it isn't a `*.spec.ts`). The build agent runs it once Vercel shows the merge commit's production deployment READY. It commits the output to `evidence/release-smoke-<issue>.txt` in a docs-only follow-up (the Ignored Build Step skips that deploy).
  >
  > Check 1 also asserts that every `<script src=…>` in the `/t/{id}` document starts with `/_next/static/` (PL-22: no third-party scripts).

#### P2-4 — Checklist content: I16 setup, expected copy, and the unowned device questions
- **What breaks:**
  - Hop I16 uses "the URL from I2", which means a tag created on that iPhone in Safari. Item 2 doesn't say so. A tag created in another browser makes the tap show "Plant this tag", and the walk reads as a false red.
  - Item 5's A11 text says "shows the NotReadableError message" without the text. The merged copy is "NFC is switched off. Turn on NFC in your phone's settings, then try again, or copy the link instead." (tags.tsx:31). The I17 text's expected strings exist ('Plant tags in Safari…', settings.tsx:21; 'Plant here anyway', plant.tsx:81).
  - PRD §7 Durability's 14-day "zero unexplained data loss" (PRD:170) and persona-lens §5 asks 2 (Samsung default browser) and 5 (double page loads per tap) have no owner.
- **Ticket edit:**
  - Item 2 starts: "On the iPhone, in Safari, create the tag at `https://runtag.vercel.app/app/tags` and copy its link; write that link with the iOS writer app; …".
  - Item 5 adds a second line, `Expected copy: "NFC is switched off. Turn on NFC in your phone's settings, then try again, or copy the link instead."`, after the verbatim line.
  - Not in scope adds: "PRD §7 14-day durability metric (owner, from the daily I17 exports, recorded in Gate D findings); persona-lens §5 asks 2 and 5 (recorded as observations if seen, not release blockers)."

---

## Regression notes (no ticket edit needed beyond P2-1 and P2-2)
- **INV-D4.** invariants.spec.ts:93-96 lower-cases scene-8 `textContent` and checks substrings of FORBIDDEN_TERMS (constants.ts:73-84). "start for real" contains none of them, so it stays green only while the link text is the only added copy (P2-1).
- **INV-D7 / APPD-A11Y.** No positive `tabIndex` (feature_demo.yml INV-D7). The `<a>` has text content, so APPD-A11Y-002 (icon-only `<button>`) and -003 (`<input>`) don't apply.
- **Contract scopes.** `next/link`, `usePathname` and `location.*` bans cover `app/(shell)`, `components/app`, `lib/app` only (feature_app.yml:21-24, 38-41), so a plain `<a>` in components/scenes is unconstrained, and P2-1 pins it. APPD-PROD-002 (localhost/example URLs) scopes app/components/lib/hooks, not scripts/ or docs/, and the smoke's `https://runtag…vercel.app` URLs aren't forbidden patterns anyway.
- **journey_demo_complete.yml steps 8–9** (scene-8 text, `restart-button`) and **AC-SHELL-12** (`Email address` on Scene8CTA) are unaffected because the form and button aren't touched.
- **Service worker.** A visitor who follows the link registers the SW with scope `/` (Shell.tsx:39). It intercepts navigations only for `/app*` and `/t/*` (sw.template.js:22,31), so later visits to the demo `/` still hit the network for the document. Hashed `/_next/static/` assets are cache-first, which is safe.
- **Parked slice #12** touches Scene 1/7 copy and keeps "Scene 8 unchanged" (slice-prd-copy.md:26,50,67). J-APP-LINK survives it only with the testid-based path in P2-2.
- **Vercel Ignored Build Step.** The APP-LINK PR changes components/, so it builds and deploys. A docs-only evidence follow-up does not (vercel-ignore.sh:11-13).
