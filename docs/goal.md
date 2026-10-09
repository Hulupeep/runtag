# RunTag demo — shared goal

**Mission (docs/prd.md §1):** convert visitors into runners by letting them *experience* RunTag — tap in, run with no metrics, tap out, watch the chain grow — then join the waitlist or buy a starter kit.

**Objective of current work:** the PRD's 10 user stories (US-1..US-10) are tracked as Specflow-compliant GitHub issues whose journeys map to executed Playwright specs, and the shipped copy matches PRD §8.

**Current support (evidence: local Playwright run 2026-09-27, 44/46):** the 8-scene flow, tap interactions, chain 4→5, mobile layout, keyboard access.

**Known unsupported / unknown:** Restart is only reachable on Scene 8 (PRD US-9 says any scene after 1); Scene 8 merges "Join the Waitlist" and "Get Starter Kit" into one button; no test measures the 2 s load budget; waitlist delivery depends on Resend env config that is not verified; no demand evidence exists (VALUE-PROP.md).

**Not in scope:** the real mobile app, physical NFC tags, accounts, fulfilment.
