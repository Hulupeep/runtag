# GATE D result — RunTag App v1

- Merged main: `f086ead5d958c97f22aa316af1fdf976910695e1` (f086ead, merge of PR #37)
- Date: 2026-10-20
- Oracle: PRDs/runtag-app-hops.md (PRD SHA-256 f6c230c7…), amendments through 2026-10-20
- Verdict: **not yet passable — waiting on owner real-device evidence.** Every automated hop is green; 4 real-device hops are pending with the owner.

## Counts

| | Hops |
|---|---|
| Total in journey-map.md | 95 (43 pinned I/A/L/G + 15 shared-contract S1–S15 + 37 seam-derived) |
| Green (automated) | 91 (39 pinned, 15 shared-contract, 37 seam-derived) |
| Red | 0 |
| Pending owner (real device) | 4: I16, I17, A11, A12 |

## Automated run on merged main

- `npm run build` exit 0 (sw.js generated, 26 precache entries)
- `PW_PROD=1 npx playwright test --reporter=json` → `evidence/playwright-main.json`: ran against LOCAL production server (`next start`, http://localhost:3000), projects chromium + mobile (iPhone 13 WebKit), all spec files: 346 passed, 0 unexpected, 0 flaky, 8 skipped.
  - Skipped (all explained, all on `mobile`): 7 × "SW interception is Chromium-only in Playwright" (AC-CHAIN-10, AC-SHELL-7, AC-SHELL-6, AC-SHELL-6B, AC-TAP-16, AC-TAP-20, AC-TAGS-10 "A2 and A5"); 1 × "Playwright WebKit cannot grant clipboard-write" (AC-TAGS-3 clipboard read-back; the reject/unavailable branches run on both projects). Each of these tests passed on chromium.
- `npx jest --json` → `evidence/contracts-main.json`: 281/281 passed (3 suites).
- Per-hop extraction: `evidence/<hopId>.json` (titles, projects, status, duration, expected value from the hops doc / ticket AC).
- Hops covered by composition of ticket ACs rather than one literal replay of the hops-doc row are flagged with a "Coverage note" in findings.md: L2, L4, L5, L7, L10.

## Red hops

None. No `disposition: bug` entries were needed.

## Pending owner evidence

These entries reference the device checklist's own evidence file names, which do not exist yet, so `check-gate-d` reports them as dangling. That is the intended hand-off; no agent evidence was produced for them.

| Hop | Checklist item (docs/release/runtag-app-v1-device-checklist.md) | Files to drop into `gate-d/runtag-app/evidence/` |
|---|---|---|
| I16 | 2. iPhone tap (latency) | I16-timeline.txt, I16-export-after-in.json, I16-export-after-out.json, I16-latency.txt, I16-first-tagged-frame.png |
| I17 | 4. iPhone retention (≥ 8 days) | I17-export-<YYYY-MM-DD>.json (one per day), I17-tally.txt, I17-silo.png |
| A11 | 5. Android writing | A11-export.json, A11-nfctools-readback.png, A11-nfc-off.png |
| A12 | 6. Alias domain (owner amendment 2026-10-20) | A12-anonymous.txt, A12-signed-in.txt, A12-anonymous.png, A12-signed-in.png |

A12 partial automated coverage already in place (does not close the hop): `evidence/release-smoke.txt` check 2 (both aliases 302 → vercel.com/sso-api, no 200) and AC-SHELL-10 on merged main (`evidence/A12-automated-part.json`).

Checklist items without a hop (1 stickers, 3 iPhone default browser, 7 unauthenticated tag URL / ledger #21, 8 primary metric, 10 day change) and item 9 (G2 on a phone; G2 itself is green on the automated AC-LINK-1/AC-LINK-2 oracle) are release checks outside the hop map; they do not affect `check-gate-d`. Release smoke check "shell 200 /t/…" in `evidence/release-smoke.txt` covers the automated half of item 7.

## How to finish

1. Owner runs checklist items 2, 4, 5 and 6 (and the non-hop items) on real phones and stickers against https://runtag.vercel.app.
2. Drop each file into `gate-d/runtag-app/evidence/` with exactly the checklist's name.
3. Update the I16, I17, A11 and A12 entries in `findings.md`: replace `Status: pending — owner …` with `Status: green` and the observed values. If a value does not match, set the status to red with `disposition: bug` (naming the seam pair / last-merged writer) or `disposition: stale-oracle` plus an `amendment:` path to PRDs/runtag-app-hops.md. For I17, also reference each `evidence/I17-export-YYYY-MM-DD.json` by name.
4. Run `node scripts/teardown-gate.cjs check-gate-d gate-d/runtag-app/` → it must exit 0.

## Sign-off policy

`signoff-policy.json` mirrors QA/loops/feature-build.yaml `epic_gate.signoff_policy`: `required: false`, no artifacts. `check-gate-d` therefore enforces no hash-bound signatures. No sign command was run by the agent. Closing the epic on a red or incomplete GATE D remains a human-only action.

## Initial check

`evidence/check-gate-d-initial.txt`: exit 1. The only errors are the 14 dangling owner-evidence references for I16, I17, A11 and A12. There are no missing-findings, missing-evidence, value-evidence or disposition errors for any automated hop.
