# RunTag stories — simulation (specflow-simulate, 2026-09-27)

Input: docs/specs/runtag-stories/US-1..US-10. Walked against story text **and** current code paths.

## Personas
| # | Persona | Why it stresses these stories |
|---|---|---|
| P1 | Impatient clicker (desktop) | double-taps, clicks during auto-advance, refreshes, hits Back |
| P2 | Keyboard + screen-reader user | auto-advancing scenes, focus after transitions, button names |
| P3 | Phone scroller (iOS Safari, one hand, may rotate) | touch targets, viewport height, landscape, slow network |
| P4 | Convinced buyer | wants to pay or sign up now; typos email; flaky network; signs up twice |
| P5 | Presenter showing a friend | restarts mid-demo, replays repeatedly, reduced-motion laptop |

## Routes and gaps
**P1** — double-tap on tag (US-3/US-5): story has AC but no spec. Refresh on Scene 5: no URL/session state, returns to Scene 1 — consistent with INV-D1 but unstated. Browser Back leaves the site entirely. Click "Continue" on Scene 6 at the same instant the 3 s timer fires → possible double advance (skip Scene 7) — unstated.
**P2** — Scene 3 (2 s) and Scene 6 (3 s) auto-advance with no pause control; a screen-reader user may not hear the payoff before it disappears (WCAG 2.2.1 Timing Adjustable). Start button name drift already failing (US-1).
**P3** — journey_mobile rewrite dropped the old *landscape* scenario; no AC covers landscape or `100vh` on iOS Safari. 16 px body minimum unasserted.
**P4** — Scene 8 has one button labelled "Get Starter Kit – £19" that actually submits the waitlist form: a buyer expects checkout and gets a waitlist. No starter-kit destination exists. `/api/waitlist` validates with `includes('@')` only; duplicate signup behaviour unknown; **raw email is interpolated into the owner-notification HTML (HTML injection)** and the endpoint is unauthenticated with no rate limit, so it can send Resend "welcome" mail to arbitrary addresses (abuse vector). Missing `RESEND_API_KEY` returns 500 — UI message unspecified.
**P5** — Restart only exists on Scene 8. If restart is added to Scenes 3/4/6, pending auto-advance timers must be cancelled or the demo jumps from Scene 1 to a later scene. `prefers-reduced-motion` is handled in CSS only; JS timers (5 s run) still gate progress — acceptable but unstated.

## Proposed additions (fold via specflow-audit uplift)
| ID | Story | Type | Proposed addition | From |
|---|---|---|---|---|
| SIM-1 | US-3, US-5 | AC + Playwright | Double-activation within 300 ms advances exactly one scene | P1 |
| SIM-2 | US-6 | AC | Clicking Continue as the auto-advance fires advances exactly one scene (Scene 7 always shown) | P1 |
| SIM-3 | US-9 | AC | Browser refresh on any scene returns to Scene 1 with chain = 4 (explicit INV-D1 behaviour) | P1 |
| SIM-4 | US-9 | AC | Restart during Scene 3/4/6 cancels pending timers; Scene 1 remains for ≥ 6 s with no auto-advance | P5 |
| SIM-5 | US-6 | Open question → AC | Auto-advance on Scene 6 either removed or pausable (WCAG 2.2.1) | P2 |
| SIM-6 | US-10 | AC | Landscape at 667×375: no clipped content, tag still ≥ 48 px, demo completable | P3 |
| SIM-7 | US-8 | AC (security) | Owner-notification email HTML-escapes the submitted address | P4 |
| SIM-8 | US-8 | AC (security) | `/api/waitlist` rate-limited per IP; server-side email format validation | P4 |
| SIM-9 | US-8 | AC | Duplicate signup returns a friendly "already on the list" state, not 500 | P4 |
| SIM-10 | US-8 | AC | Missing Resend config / 5xx shows a retryable error and preserves the typed email | P4 |
| SIM-11 | US-4, US-10 | AC | With `prefers-reduced-motion: reduce`, all scenes still complete and no copy is lost | P5 |

## Open questions (human decision — not invented)
1. **Starter kit:** where does "Get Starter Kit – £19" go (Stripe link, preorder form, or waitlist-with-intent)? Blocks US-8 AC-3.
2. **Social proof:** "2,847 chains unbroken this week" is a hard-coded number with no users behind it. Keep, soften, or replace with a real waitlist count? (VALUE-PROP.md: no real-world use evidence.)
3. **Scene 6 auto-advance:** keep 3 s auto-advance (current) or make the user click "See what's next →" (PRD)? Resolves SIM-5.
