# US-3: Tap in to start the run

**Priority:** P0  ·  **Journey criticality:** critical  ·  **Spec depth:** thin (no tier promotion yet)
**Source:** docs/prd.md §5 US-3, §4 invariants, §8 copy  ·  **Goal:** docs/goal.md
**Persona:** Visitor on Scene 2 (mouse, touch or keyboard)
**Promise:** "Tapping the tag feels like a real NFC tap and starts my run."

## Scope
### In Scope
- Behaviour and exact copy defined for US-3 in docs/prd.md
### Not In Scope
- Real mobile app, physical NFC tags, accounts, fulfilment

## Data Contract
N/A — client-side demo state only (hooks/useDemoState.ts).

## Frontend Interface
data-testids: `nfc-tag`, `scene-3`

## Invariants Referenced
- **INV-D2** — docs/prd.md §4 / docs/contracts/feature_demo.yml
- **INV-D5** — docs/prd.md §4 / docs/contracts/feature_demo.yml
- **INV-D7** — docs/prd.md §4 / docs/contracts/feature_demo.yml

## Acceptance Criteria (with verification status)
Statuses are against the working tree at commit 41b6d95 and the captured Playwright run of 2026-09-27 (local dev server, projects: chromium + mobile/WebKit iPhone 13). A passing test case is not full journey coverage; only VERIFIED rows are proven.

| AC | Criterion | Status |
|---|---|---|
| AC-US3-1 | Scene 2 does not advance without activating the tag | VERIFIED — invariants.spec.ts:27-28 (still Scene 2 after 2 s) |
| AC-US3-2 | Tag activation shows visual ripple feedback within 100 ms (INV-D5) | UNVERIFIED — interactions.spec.ts:10-18 and invariants.spec.ts:99-115 assert only that Scene 3 appears (≤ 3 s); neither the ripple nor 100 ms is measured |
| AC-US3-3 | iPhone shows "TAGGED" / "Run started" and Scene 3 shows "You're in. Now go." | PARTIAL — demo-flow.spec.ts:33; only "TAGGED" asserted |
| AC-US3-4 | Enter and Space on the focused tag trigger tap-in | VERIFIED — interactions.spec.ts:30-36 (Enter), :39-45 (Space) |
| AC-US3-5 | Scene 4 begins within 3 s of tap-in | UNVERIFIED — demo-flow.spec.ts:36 allows 5 s |
| AC-US3-6 | Rapid double activation advances exactly one scene | UNVERIFIED — no spec (SIM-1) |

**Coverage:** 2 VERIFIED, 3 UNVERIFIED, 1 PARTIAL. Journey coverage incomplete — not done.

## Gherkin Scenarios (PRD §5, verbatim)
```gherkin
Feature: User taps NFC tag to start run

Scenario: Successful tap in
  Given I am on Scene 2 (The Setup)
  When I click on the NFC tag on the tree
  Then I should see an NFC ripple animation
  And the iPhone screen should show "TAGGED - Run started"
  And Scene 3 should display "You're in. Now go."
  And Scene 4 should begin within 3 seconds

Scenario: Tag is keyboard accessible
  Given I am on Scene 2 (The Setup)
  When I focus the NFC tag with Tab key
  And I press Enter
  Then the tap in sequence should trigger
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
