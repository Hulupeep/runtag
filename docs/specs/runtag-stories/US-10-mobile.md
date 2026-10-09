# US-10: Mobile experience

**Priority:** P1  ·  **Journey criticality:** important  ·  **Spec depth:** thin (no tier promotion yet)
**Source:** docs/prd.md §5 US-10, §4 invariants, §8 copy  ·  **Goal:** docs/goal.md
**Persona:** Visitor on a phone (< 768 px)
**Promise:** "The whole story works one-handed on my phone."

## Scope
### In Scope
- Behaviour and exact copy defined for US-10 in docs/prd.md
### Not In Scope
- Real mobile app, physical NFC tags, accounts, fulfilment

## Data Contract
N/A — client-side demo state only (hooks/useDemoState.ts).

## Frontend Interface
data-testids: `iphone-mockup`, `tree-illustration`, `nfc-tag`

## Invariants Referenced
- **INV-D6** — docs/prd.md §4 / docs/contracts/feature_demo.yml

## Acceptance Criteria (with verification status)
Statuses are against the working tree at commit 41b6d95 and the captured Playwright run of 2026-09-27 (local dev server, projects: chromium + mobile/WebKit iPhone 13). A passing test case is not full journey coverage; only VERIFIED rows are proven.

| AC | Criterion | Status |
|---|---|---|
| AC-US10-1 | iPhone mockup stacks above the tree below 768 px | VERIFIED — mobile.spec.ts:41; invariants.spec.ts:143 |
| AC-US10-2 | All tap targets ≥ 48×48 px | PARTIAL — mobile.spec.ts:51, :62-63; start button and NFC tag only; other CTAs unchecked |
| AC-US10-3 | No horizontal overflow at 375 px on any scene | PARTIAL — mobile.spec.ts:67-80; checks main element width on Scene 1 only, at iPhone 13 viewport (390 px), not 375 px or document scroll width |
| AC-US10-4 | Body text ≥ 16 px | UNVERIFIED — no assertion |
| AC-US10-5 | Entire demo completes via touch on iPhone 13 | VERIFIED — mobile.spec.ts:84-108 (mobile project, WebKit) |
| AC-US10-6 | Landscape 667×375: no clipped content, demo completable | UNVERIFIED — no spec (SIM-6) |

**Coverage:** 2 VERIFIED, 2 PARTIAL, 2 UNVERIFIED. Journey coverage incomplete — not done.

## Gherkin Scenarios (PRD §5, verbatim)
```gherkin
Feature: Demo works on mobile devices

Scenario: Mobile layout adaptation
  Given I am viewing on a device with width < 768px
  Then the iPhone and tree should stack vertically
  And all text should be readable
  And all tap targets should be at least 48x48px
```

## Journey (Definition of Done)
- **J-ID:** J-DEMO-MOBILE
- **Mapped specs:** see Status column; each VERIFIED/PARTIAL row names file:line

## Simulation Findings (proposed)
Source: docs/specs/runtag-stories-simulation.md
- SIM-6
- SIM-11

## Definition of Done
- [ ] Every AC is VERIFIED by an assertion in a mapped Playwright spec
- [ ] Mapped specs pass on chromium and mobile projects
- [ ] `npm run test:contracts` passes
- [ ] Journey gate Tier 1 result posted to this issue
