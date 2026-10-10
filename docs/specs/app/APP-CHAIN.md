# APP-CHAIN: chain home and 14-day history at `/app`

**Epic:** RunTag App v1 · **Wave:** W2 · **Priority:** P0 · **Spec depth:** thin
**Depends on:** APP-SHELL (`computeChain`, store) · parallel with APP-TAP
**Promise:** "Open the app and see one number that matters, and the days behind it."
**Covers:** APP-007, APP-009 (+ open-run banner and stale handling display from APP-006)

## Outcome / behaviour acceptance (outline)
- AC-1 Chain value from `computeChain` (no `CHAIN.*` constants; app variables not named `chainCount` — M-3)
- AC-2 Last 14 days: done / missed / today-pending; days before the first ever done run neutral; at-risk state
- AC-3 Long chains capped at last 30 links + numeric count
- AC-4 Open-run banner; stale run abandoned on render (APP-006)
- AC-5 Empty state explains planting the first tag; backup status slot (filled by APP-DURABLE)
- AC-6 No metrics in rendered text (APP-008)

## Gate A stipulations to fold in at promotion
Verdict §7 APP-CHAIN 1–3 (S-11 fixed-time TZ + London DST scenarios with `timezoneId` contexts, T12 cap/neutral days, M-3).

## Journey
J-APP-CHAIN
