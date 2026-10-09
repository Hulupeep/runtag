# US-4: Run animation with no metrics

**Priority:** P0  ·  **Journey criticality:** critical  ·  **Spec depth:** thin (no tier promotion yet)
**Source:** docs/prd.md §5 US-4, §4 invariants, §8 copy  ·  **Goal:** docs/goal.md
**Persona:** Visitor who has tapped in
**Promise:** "I feel the run without any number telling me how I did."

## Scope
### In Scope
- Behaviour and exact copy defined for US-4 in docs/prd.md
### Not In Scope
- Real mobile app, physical NFC tags, accounts, fulfilment

## Data Contract
N/A — client-side demo state only (hooks/useDemoState.ts).

## Frontend Interface
data-testids: `scene-4`, `runner-animation`

## Invariants Referenced
- **INV-D4** — docs/prd.md §4 / docs/contracts/feature_demo.yml

## Acceptance Criteria (with verification status)
Statuses are against the working tree at commit 41b6d95 and the captured Playwright run of 2026-09-27 (local dev server, projects: chromium + mobile/WebKit iPhone 13). A passing test case is not full journey coverage; only VERIFIED rows are proven.

| AC | Criterion | Status |
|---|---|---|
| AC-US4-1 | Runner silhouette animates along a dotted path | PARTIAL — demo-flow.spec.ts:38; runner visible; path not asserted |
| AC-US4-2 | Copy "No pace to check. No watch to glance at." and "Just you and the trail." visible | PARTIAL — demo-flow.spec.ts:37; only "No pace to check." asserted |
| AC-US4-3 | No pace, distance, time/duration, calories or heart rate rendered in Scenes 2–8 | PARTIAL — invariants.spec.ts:58-95 + contract-enforcement.test.js INV-D4; runtime check covers Scenes 2, 5, 6, 8 only — Scenes 3, 4, 7 unchecked |
| AC-US4-4 | Scene 5 begins ~5 s after Scene 4 starts | PARTIAL — demo-flow.spec.ts:41; allows 10 s; lower bound not asserted |

**Coverage:** 4 PARTIAL. Journey coverage incomplete — not done.

## Gherkin Scenarios (PRD §5, verbatim)
```gherkin
Feature: Run sequence plays automatically

Scenario: Visual run narrative
  Given I have tapped in (Scene 3 complete)
  When Scene 4 (The Run) begins
  Then I should see a runner silhouette animation
  And I should see a dotted path being drawn
  And I should NOT see any pace or time metrics
  And Scene 5 should begin after 5 seconds
```

## Journey (Definition of Done)
- **J-ID:** J-DEMO-COMPLETE
- **Mapped specs:** see Status column; each VERIFIED/PARTIAL row names file:line

## Simulation Findings (proposed)
Source: docs/specs/runtag-stories-simulation.md
- SIM-11

## Definition of Done
- [ ] Every AC is VERIFIED by an assertion in a mapped Playwright spec
- [ ] Mapped specs pass on chromium and mobile projects
- [ ] `npm run test:contracts` passes
- [ ] Journey gate Tier 1 result posted to this issue
