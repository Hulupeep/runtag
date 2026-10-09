# US-6: Chain celebration (4 → 5)

**Priority:** P0  ·  **Journey criticality:** critical  ·  **Spec depth:** thin (no tier promotion yet)
**Source:** docs/prd.md §5 US-6, §4 invariants, §8 copy  ·  **Goal:** docs/goal.md
**Persona:** Visitor who just tapped out
**Promise:** "I see the one metric that matters grow."

## Scope
### In Scope
- Behaviour and exact copy defined for US-6 in docs/prd.md
### Not In Scope
- Real mobile app, physical NFC tags, accounts, fulfilment

## Data Contract
N/A — client-side demo state only (hooks/useDemoState.ts).

## Frontend Interface
data-testids: `scene-6`, `big-checkmark`, `chain-visual`

## Invariants Referenced
- **INV-D3** — docs/prd.md §4 / docs/contracts/feature_demo.yml

## Acceptance Criteria (with verification status)
Statuses are against the working tree at commit 41b6d95 and the captured Playwright run of 2026-09-27 (local dev server, projects: chromium + mobile/WebKit iPhone 13). A passing test case is not full journey coverage; only VERIFIED rows are proven.

| AC | Criterion | Status |
|---|---|---|
| AC-US6-1 | Day counter animates from 4 to 5 | PARTIAL — demo-flow.spec.ts:53; final value 5 asserted; animation not |
| AC-US6-2 | Exactly 5 checkmarks, appearing sequentially | PARTIAL — invariants.spec.ts:55 (data-count="5"); sequence not asserted |
| AC-US6-3 | Copy "Day 5. Chain unbroken." and "That's it. That's all that matters." visible | PARTIAL — demo-flow.spec.ts:49; second line NOT IMPLEMENTED (COPY.scene6.celebration = "Keep it going.") |
| AC-US6-4 | CTA reads exactly "See what's next →" and the user clicks it to continue | DEVIATION — Scene6Chain.tsx:67 "Continue"; auto-advances after 3 s (Scene6Chain.tsx:16) |

**Coverage:** 3 PARTIAL, 1 DEVIATION. Journey coverage incomplete — not done.

## Gherkin Scenarios (PRD §5, verbatim)
```gherkin
Feature: Chain growth is celebrated

Scenario: Day counter increments
  Given I have just tapped out
  When the success animation plays
  Then the day counter should animate from 4 to 5
  And each chain checkmark should appear sequentially
  And I should see text "Day 5. Chain unbroken."
```

## Journey (Definition of Done)
- **J-ID:** J-DEMO-COMPLETE
- **Mapped specs:** see Status column; each VERIFIED/PARTIAL row names file:line

## Simulation Findings (proposed)
Source: docs/specs/runtag-stories-simulation.md
- SIM-2
- SIM-5 (open question 3)

## Definition of Done
- [ ] Every AC is VERIFIED by an assertion in a mapped Playwright spec
- [ ] Mapped specs pass on chromium and mobile projects
- [ ] `npm run test:contracts` passes
- [ ] Journey gate Tier 1 result posted to this issue
