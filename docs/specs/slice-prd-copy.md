# Slice: Match shipped copy to PRD §8 (Scenes 1, 2, 5, 6, 7)

**Parent stories:** US-1 (#2), US-2 (#3), US-5 (#6), US-6 (#7), US-7 (#8)
**Priority:** P0 · **Persona:** first-time visitor · **Journey:** J-DEMO-COMPLETE, J-DEMO-A11Y
**Promise:** "Every line I read in the demo is the line the PRD wrote."

## Scope

### In Scope — exact copy changes (PRD §8 is canonical)
| ID | Where | Current | Target (PRD §8) |
|---|---|---|---|
| CP-1 | Scene1Hook.tsx start button | `Try Interactive Demo →` (hard-coded) | `Try RunTag Demo →` via `COPY.scene1.cta` |
| CP-2 | Scene1Hook.tsx `.hero-subhead` | `You spent £400 on metrics. You check your VO2 max. You compare your splits. You haven't run in three weeks.` | `You spent £400 on metrics. You haven't run in three weeks.` |
| CP-3 | Scene 2 narrative | (absent) | add `Your RunTag is waiting.` after `It's 7am. You're at the edge of the woods.` |
| CP-4 | Scene 2 instruction | `Tap the tag to start your run.` | `Tap the tag to start your run →` |
| CP-5 | Scene 5 instruction | `Tap the tag to finish.` | `Tap the tag to finish →` |
| CP-6 | Scene 6 second line | `Keep it going.` | `That's it. That's all that matters.` |
| CP-7 | Scene 6 button | `Continue` | `See what's next →` |
| CP-8 | Scene 7 lead line | (absent) | add `Bored of your usual loop?` before `Discover routes others have created.` |
| CP-9 | Scene 7 subline | `Find new tags. Explore new paths.` | `Or plant your own tags for others to find.` |
| CP-10 | Scene 7 button | `See How It Works` | `Get RunTag →` |

All strings live in `lib/constants.ts` `COPY`; components render from `COPY` (no hard-coded copy).

### Not In Scope
- **Scene 8 CTAs** ("Join the Waitlist" / "Get Starter Kit - £19"): the PRD's two-action layout needs a starter-kit destination — open product question 1 in docs/specs/runtag-stories-simulation.md. The £19 offer stays as shipped.
- **Scene 6 auto-advance** (behaviour, not wording) — open question 3.
- Scene 1 sections below the hero (manifesto, steps) — not specified in PRD §8.

## Acceptance Criteria (acceptance-checks)
| AC | Criterion | Check (Playwright, both projects) |
|---|---|---|
| AC-1 | Start button accessible name is exactly `Try RunTag Demo →` | `getByRole('button', { name: 'Try RunTag Demo →', exact: true })` visible; existing accessibility.spec.ts:33 passes |
| AC-2 | Hero subhead text equals CP-2 target | `.hero-subhead` `toHaveText` exact |
| AC-3 | Scene 2 shows both narrative lines and CP-4 instruction | `getByText(..., { exact: true })` for each |
| AC-4 | Scene 5 instruction equals CP-5 | exact text |
| AC-5 | Scene 6 shows `Day 5. Chain unbroken.` and CP-6 | exact text |
| AC-6 | Scene 6 button is `See what's next →` and advances to Scene 7 | role button exact name, click, scene-7 visible |
| AC-7 | Scene 7 shows CP-8, `Discover routes others have created.`, CP-9 | exact text |
| AC-8 | Scene 7 button is `Get RunTag →` and advances to Scene 8 | role button exact name, click, scene-8 visible |
| AC-9 | No stale labels remain in tests or source (`Continue`, `See How It Works`, `Try Interactive Demo`) | grep in contract test |
| AC-10 | INV-D4 still holds and the Scene 1 manifesto is unchanged (only the hero subhead drops "VO2 max"/"splits") | existing: contract-enforcement INV-D4 + invariants.spec.ts INV-D4 pass. **planned:** assert the manifesto list still contains `Your lungs don't care about VO2 max` (Scene1Hook.tsx:137) so the subhead edit cannot remove it |
| AC-11 | At 375×667, Scene 7's `Get RunTag →` button is within the viewport without scrolling | **planned:** `page.setViewportSize({ width: 375, height: 667 })`, reach Scene 7, assert the button's bounding box bottom ≤ 667 before any scroll |

Existing vs planned: AC-1 reuses accessibility.spec.ts:33; AC-10 reuses the INV-D4 checks plus one planned manifesto assertion; AC-2..AC-9 and AC-11 are planned assertions added in the implementation slice.

Gates: `npm run test:contracts` (jest) and the full Playwright suite (chromium + mobile) must pass; the suite is currently 44/46 and AC-1 is expected to turn both failures green.

## Persona walkthrough (paper)
1. **First-time visitor (desktop):** lands → reads the two-sentence subhead (CP-2) → clicks "Try RunTag Demo →" → reads "It's 7am…" / "Your RunTag is waiting." / "Tap the tag to start your run →" → taps → runs → "Tap the tag to finish →" → taps → "Day 5. Chain unbroken." / "That's it. That's all that matters." → clicks "See what's next →" → "Bored of your usual loop?" … → "Get RunTag →" → Scene 8 unchanged. No dead end; every button label names its destination.
2. **Screen-reader user:** button accessible names change to CP-1/CP-7/CP-10 with the arrow glyph; arrows are read as "right arrow" by VoiceOver — acceptable and matches PRD. aria-live scene announcements are unchanged.
3. **Phone user:** longer Scene 7 copy (one extra line) must not push the CTA below a 375×667 fold → AC-11.

## Simulation (slice-level)
Reuses docs/specs/runtag-stories-simulation.md (personas P1–P5). Slice-relevant findings:
- P1/P5: Scene 6 auto-advance still fires after 3 s, so a user may never click "See what's next →" — behaviour unchanged by this slice (open Q3); the label is still correct when clicked.
- P2: renaming buttons breaks any test selecting by old name — AC-9 guards this.
- No new gaps found that this slice can close without a product decision.

## Pre-flight Findings
### CRITICAL
- none
### P1
- none
### P2
- Scene 6 auto-advance may preempt CP-7 (tracked as open Q3; out of scope).
- Scene 8 remains off-PRD (tracked as open Q1; out of scope).

## Definition of Done
- [ ] CP-1..CP-10 shipped from `COPY`
- [ ] AC-1..AC-10 asserted and passing on chromium + mobile
- [ ] `npm run test:contracts` passes
- [ ] Full Playwright suite passes (no known failures)
