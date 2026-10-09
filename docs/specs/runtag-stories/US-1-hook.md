# US-1: First-time visitor hook

**Priority:** P0  ·  **Journey criticality:** critical  ·  **Spec depth:** thin (no tier promotion yet)
**Source:** docs/prd.md §5 US-1, §4 invariants, §8 copy  ·  **Goal:** docs/goal.md
**Persona:** First-time visitor
**Promise:** "Within seconds I get the provocation and one obvious way to try it."

## Scope
### In Scope
- Behaviour and exact copy defined for US-1 in docs/prd.md
### Not In Scope
- Real mobile app, physical NFC tags, accounts, fulfilment

## Data Contract
N/A — client-side demo state only (hooks/useDemoState.ts).

## Frontend Interface
data-testids: `scene-1`, `start-demo-button`

## Invariants Referenced
- **INV-D7** — docs/prd.md §4 / docs/contracts/feature_demo.yml

## Acceptance Criteria (with verification status)
Statuses are against the working tree at commit 41b6d95 and the captured Playwright run of 2026-09-27 (local dev server, projects: chromium + mobile/WebKit iPhone 13). A passing test case is not full journey coverage; only VERIFIED rows are proven.

| AC | Criterion | Status |
|---|---|---|
| AC-US1-1 | Headline reads exactly "Your watch is making you fat." | PARTIAL — demo-flow.spec.ts:13; asserts only the substring "fat" |
| AC-US1-2 | Subhead reads exactly "You spent £400 on metrics. You haven't run in three weeks." (PRD §8) | DEVIATION — Scene1Hook.tsx:99 renders a longer subhead adding "You check your VO2 max. You compare your splits."; no assertion |
| AC-US1-3 | Start button accessible name is exactly "Try RunTag Demo →" (PRD §8) | FAILS — accessibility.spec.ts:33 — Scene1Hook.tsx:242 hard-codes "Try Interactive Demo →" instead of COPY.scene1.cta |
| AC-US1-4 | Start button is keyboard-focusable with a visible focus indicator | PARTIAL — accessibility.spec.ts:12; asserts focus, not a visible indicator |
| AC-US1-5 | Page loads in under 2 seconds | UNVERIFIED — no spec measures load time |

**Coverage:** 2 PARTIAL, 1 DEVIATION, 1 FAILS, 1 UNVERIFIED. Journey coverage incomplete — not done.

## Gherkin Scenarios (PRD §5, verbatim)
```gherkin
Feature: Landing hook captures attention

Scenario: Visitor sees provocative headline
  Given I am a new visitor
  When I land on the demo page
  Then I should see the headline "Your watch is making you fat"
  And I should see a "Try RunTag Demo" button
  And the page should load in under 2 seconds
```

## Journey (Definition of Done)
- **J-ID:** J-DEMO-COMPLETE (+ J-DEMO-A11Y)
- **Mapped specs:** see Status column; each VERIFIED/PARTIAL row names file:line

## Simulation Findings (proposed)
Source: docs/specs/runtag-stories-simulation.md
- No additional findings beyond the AC table.

## Definition of Done
- [ ] Every AC is VERIFIED by an assertion in a mapped Playwright spec
- [ ] Mapped specs pass on chromium and mobile projects
- [ ] `npm run test:contracts` passes
- [ ] Journey gate Tier 1 result posted to this issue
