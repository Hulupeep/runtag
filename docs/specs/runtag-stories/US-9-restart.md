# US-9: Restart the demo

**Priority:** P1  ·  **Journey criticality:** critical  ·  **Spec depth:** thin (no tier promotion yet)
**Source:** docs/prd.md §5 US-9, §4 invariants, §8 copy  ·  **Goal:** docs/goal.md
**Persona:** Visitor replaying or presenting
**Promise:** "I can start over at any time with a clean state."

## Scope
### In Scope
- Behaviour and exact copy defined for US-9 in docs/prd.md
### Not In Scope
- Real mobile app, physical NFC tags, accounts, fulfilment

## Data Contract
N/A — client-side demo state only (hooks/useDemoState.ts).

## Frontend Interface
data-testids: `restart-button`

## Invariants Referenced
- **INV-D1** — docs/prd.md §4 / docs/contracts/feature_demo.yml
- **INV-D3** — docs/prd.md §4 / docs/contracts/feature_demo.yml

## Acceptance Criteria (with verification status)
Statuses are against the working tree at commit 41b6d95 and the captured Playwright run of 2026-09-27 (local dev server, projects: chromium + mobile/WebKit iPhone 13). A passing test case is not full journey coverage; only VERIFIED rows are proven.

| AC | Criterion | Status |
|---|---|---|
| AC-US9-1 | "Restart Demo" is available on every scene after Scene 1 | NOT IMPLEMENTED — restart-button exists only in Scene8CTA.tsx:117 |
| AC-US9-2 | Restart returns to Scene 1 | VERIFIED — demo-flow.spec.ts:86-88 (from Scene 8 only) |
| AC-US9-3 | All state resets (chain = 4, hasTappedIn/hasTappedOut/isAnimating false) | PARTIAL — demo-flow.spec.ts:89 (from Scene 8 only); only chain count asserted |
| AC-US9-4 | Restart during Scenes 3/4/6 cancels pending auto-advance timers | UNVERIFIED — no spec; depends on AC-1 (SIM-4) |

**Coverage:** 1 NOT IMPLEMENTED, 1 VERIFIED, 1 PARTIAL, 1 UNVERIFIED. Journey coverage incomplete — not done.

## Gherkin Scenarios (PRD §5, verbatim)
```gherkin
Feature: User can restart demo

Scenario: Restart from any point
  Given I am on any scene after Scene 1
  When I click the "Restart Demo" button
  Then I should return to Scene 1
  And all state should be reset
```

## Journey (Definition of Done)
- **J-ID:** J-DEMO-COMPLETE
- **Mapped specs:** see Status column; each VERIFIED/PARTIAL row names file:line

## Simulation Findings (proposed)
Source: docs/specs/runtag-stories-simulation.md
- SIM-3
- SIM-4

## Definition of Done
- [ ] Every AC is VERIFIED by an assertion in a mapped Playwright spec
- [ ] Mapped specs pass on chromium and mobile projects
- [ ] `npm run test:contracts` passes
- [ ] Journey gate Tier 1 result posted to this issue
