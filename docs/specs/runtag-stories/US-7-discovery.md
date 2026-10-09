# US-7: Discovery tease

**Priority:** P1  ·  **Journey criticality:** critical  ·  **Spec depth:** thin (no tier promotion yet)
**Source:** docs/prd.md §5 US-7, §4 invariants, §8 copy  ·  **Goal:** docs/goal.md
**Persona:** Visitor after the celebration
**Promise:** "I learn RunTag grows with me — new routes, or my own tags."

## Scope
### In Scope
- Behaviour and exact copy defined for US-7 in docs/prd.md
### Not In Scope
- Real mobile app, physical NFC tags, accounts, fulfilment

## Data Contract
N/A — client-side demo state only (hooks/useDemoState.ts).

## Frontend Interface
data-testids: `scene-7`, `map-view`

## Invariants Referenced
- none specific

## Acceptance Criteria (with verification status)
Statuses are against the working tree at commit 41b6d95 and the captured Playwright run of 2026-09-27 (local dev server, projects: chromium + mobile/WebKit iPhone 13). A passing test case is not full journey coverage; only VERIFIED rows are proven.

| AC | Criterion | Status |
|---|---|---|
| AC-US7-1 | Map with multiple tag locations and faded other-user paths | PARTIAL — demo-flow.spec.ts:58; map visible; tags/paths not asserted |
| AC-US7-2 | Copy "Bored of your usual loop?" | NOT IMPLEMENTED — absent from source |
| AC-US7-3 | Copy "Discover routes others have created." | VERIFIED — demo-flow.spec.ts:57 |
| AC-US7-4 | Copy "Or plant your own tags for others to find." | NOT IMPLEMENTED — absent; Scene 7 shows "Find new tags. Explore new paths." |
| AC-US7-5 | CTA reads exactly "Get RunTag →" and advances to Scene 8 | DEVIATION — Scene7Discovery.tsx:58 "See How It Works" |

**Coverage:** 1 PARTIAL, 2 NOT IMPLEMENTED, 1 VERIFIED, 1 DEVIATION. Journey coverage incomplete — not done.

## Gherkin Scenarios (PRD §5, verbatim)
```gherkin
Feature: Discovery feature is previewed

Scenario: User sees route discovery
  Given I have completed the tap out celebration
  When I click "See what's next"
  Then I should see a map with multiple tag locations
  And I should see text about discovering routes
  And I should see a CTA to continue
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
