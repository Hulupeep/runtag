# US-2: Starting the demo — setup scene

**Priority:** P0  ·  **Journey criticality:** critical  ·  **Spec depth:** thin (no tier promotion yet)
**Source:** docs/prd.md §5 US-2, §4 invariants, §8 copy  ·  **Goal:** docs/goal.md
**Persona:** Visitor who clicked the CTA
**Promise:** "I see where I am, my 4-day chain, and the tag to tap."

## Scope
### In Scope
- Behaviour and exact copy defined for US-2 in docs/prd.md
### Not In Scope
- Real mobile app, physical NFC tags, accounts, fulfilment

## Data Contract
N/A — client-side demo state only (hooks/useDemoState.ts).

## Frontend Interface
data-testids: `scene-2`, `iphone-mockup`, `tree-illustration`, `nfc-tag`, `scene-indicator`

## Invariants Referenced
- **INV-D1** — docs/prd.md §4 / docs/contracts/feature_demo.yml
- **INV-D3** — docs/prd.md §4 / docs/contracts/feature_demo.yml

## Acceptance Criteria (with verification status)
Statuses are against the working tree at commit 41b6d95 and the captured Playwright run of 2026-09-27 (local dev server, projects: chromium + mobile/WebKit iPhone 13). A passing test case is not full journey coverage; only VERIFIED rows are proven.

| AC | Criterion | Status |
|---|---|---|
| AC-US2-1 | Clicking "Try RunTag Demo" shows Scene 2 | PARTIAL — demo-flow.spec.ts:16-19; the transition via start-demo-button passes; the required button wording "Try RunTag Demo →" FAILS (accessibility.spec.ts:33, see AC-US1-3) |
| AC-US2-2 | Narrative "It's 7am. You're at the edge of the woods." is visible | VERIFIED — demo-flow.spec.ts:20 |
| AC-US2-3 | Narrative "Your RunTag is waiting." is visible (PRD §8) | NOT IMPLEMENTED — string absent from source |
| AC-US2-4 | iPhone shows a 4-day chain | PARTIAL — demo-flow.spec.ts:26, invariants.spec.ts:42; assert hidden scene-indicator data-chain-count="4", not the visible iPhone chain |
| AC-US2-5 | Tree with a glowing/pulsing NFC tag is visible | PARTIAL — demo-flow.spec.ts:22; tree asserted; glow on Scene 2 not asserted |
| AC-US2-6 | Instruction reads exactly "Tap the tag to start your run →" (PRD §8) | DEVIATION — lib/constants.ts COPY.scene2.instruction = "Tap the tag to start your run." (period, no arrow); no assertion |

**Coverage:** 3 PARTIAL, 1 VERIFIED, 1 NOT IMPLEMENTED, 1 DEVIATION. Journey coverage incomplete — not done.

## Gherkin Scenarios (PRD §5, verbatim)
```gherkin
Feature: Demo begins with clear setup

Scenario: User enters the demo experience
  Given I am on the landing section
  When I click "Try RunTag Demo"
  Then I should see Scene 2 (The Setup)
  And I should see an iPhone showing "4 day chain"
  And I should see a tree with an NFC tag
  And I should see text "Tap the tag to start your run"
```

## Journey (Definition of Done)
- **J-ID:** J-DEMO-COMPLETE
- **Mapped specs:** see Status column; each VERIFIED/PARTIAL row names file:line

## Simulation Findings (proposed)
Source: docs/specs/runtag-stories-simulation.md
- No additional findings beyond the AC table.

## Definition of Done
- [ ] Every AC is VERIFIED by an assertion in a mapped Playwright spec
- [ ] Mapped specs pass on chromium and mobile projects
- [ ] `npm run test:contracts` passes
- [ ] Journey gate Tier 1 result posted to this issue
