# APP-LINK: demo link to the app + real-device release check

**Epic:** RunTag App v1 · **Wave:** W4 · **Priority:** P2 · **Spec depth:** thin
**Depends on:** all W1–W3 tickets merged and deployed
**Promise:** "The demo leads to the real thing, and the real thing works on a real phone."
**Covers:** APP-101 + release checklist

## Outcome / behaviour acceptance (outline)
- AC-1 Scene 8 gains a secondary "Start for real" link to `/app`; £19 CTA and waitlist untouched (M-8)
- AC-2 Ticket states: Revenue none in v1; validation only (M-11/M-1)
- AC-3 Real-device checklist (owner, physical tags): unauthenticated 200 on `https://runtag.vercel.app/t/{id}`; alias 308; iOS default-browser behaviour; iOS writer app read-back; latency by screen recording; 8-day iOS retention; dated manual tally before opening `/app`; A11 (from APP-TAGS #17 DoD): Android Chrome: Write to tag on `https://runtag.vercel.app/app/tags`; NFC Tools read-back = `https://runtag.vercel.app/t/<id>`; export `graceUntil` ≥ write time + 600000; the auto-read straight after writing creates no run; NFC switched off shows the NotReadableError message

## Gate A stipulations to fold in at promotion
Verdict §7 APP-LINK 1–3.

## Journey
Gate D teardown walk over PRDs/runtag-app-hops.md on merged main
