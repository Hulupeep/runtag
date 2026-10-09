# US-5: Tap out to finish the run

**Priority:** P0  ·  **Journey criticality:** critical  ·  **Spec depth:** thin (no tier promotion yet)
**Source:** docs/prd.md §5 US-5, §4 invariants, §8 copy  ·  **Goal:** docs/goal.md
**Persona:** Visitor on Scene 5
**Promise:** "Finishing is the same physical ritual as starting."

## Scope
### In Scope
- Behaviour and exact copy defined for US-5 in docs/prd.md
### Not In Scope
- Real mobile app, physical NFC tags, accounts, fulfilment

## Data Contract
N/A — client-side demo state only (hooks/useDemoState.ts).

## Frontend Interface
data-testids: `scene-5`, `nfc-tag`

## Invariants Referenced
- **INV-D2** — docs/prd.md §4 / docs/contracts/feature_demo.yml
- **INV-D5** — docs/prd.md §4 / docs/contracts/feature_demo.yml

## Acceptance Criteria (with verification status)
Statuses are against the working tree at commit 41b6d95 and the captured Playwright run of 2026-09-27 (local dev server, projects: chromium + mobile/WebKit iPhone 13). A passing test case is not full journey coverage; only VERIFIED rows are proven.

| AC | Criterion | Status |
|---|---|---|
| AC-US5-1 | Scene 5 shows "Run complete. Tap out." with a glowing tag | VERIFIED — demo-flow.spec.ts:42; interactions.spec.ts:56 (data-glowing="true") |
| AC-US5-2 | Instruction reads exactly "Tap the tag to finish →" | DEVIATION — COPY.scene5.instruction = "Tap the tag to finish." ; no assertion |
| AC-US5-3 | Scene 5 does not advance without activating the tag | UNVERIFIED — interactions.spec.ts:48-62 taps immediately; no wait-without-tap check |
| AC-US5-4 | Tag activation animates the iPhone to its success state and shows Scene 6 | PARTIAL — interactions.spec.ts:62; Scene 6 visibility asserted; success animation not |

**Coverage:** 1 VERIFIED, 1 DEVIATION, 1 UNVERIFIED, 1 PARTIAL. Journey coverage incomplete — not done.

## Gherkin Scenarios (PRD §5, verbatim)
```gherkin
Feature: User taps NFC tag to end run

Scenario: Successful tap out
  Given I am on Scene 5 (Tap Out)
  And the NFC tag is glowing/pulsing
  When I click on the NFC tag
  Then the iPhone screen should animate to success state
  And I should see "DAY 5" with celebration animation
  And the chain visual should show 5 checkmarks
```

## Journey (Definition of Done)
- **J-ID:** J-DEMO-TAP
- **Mapped specs:** see Status column; each VERIFIED/PARTIAL row names file:line

## Simulation Findings (proposed)
Source: docs/specs/runtag-stories-simulation.md
- SIM-1

## Definition of Done
- [ ] Every AC is VERIFIED by an assertion in a mapped Playwright spec
- [ ] Mapped specs pass on chromium and mobile projects
- [ ] `npm run test:contracts` passes
- [ ] Journey gate Tier 1 result posted to this issue
