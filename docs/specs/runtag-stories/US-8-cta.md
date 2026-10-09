# US-8: Conversion CTA — waitlist + starter kit

**Priority:** P0  ·  **Journey criticality:** critical  ·  **Spec depth:** thin (no tier promotion yet)
**Source:** docs/prd.md §5 US-8, §4 invariants, §8 copy  ·  **Goal:** docs/goal.md
**Persona:** Convinced visitor
**Promise:** "I can leave my email or buy a £19 starter kit before I lose interest."

## Scope
### In Scope
- Behaviour and exact copy defined for US-8 in docs/prd.md
### Not In Scope
- Real mobile app, physical NFC tags, accounts, fulfilment

## Data Contract
`POST /api/waitlist` body `{ email: string }` → 200 | 400 | 500 (app/api/waitlist/route.ts, Resend).

## Frontend Interface
data-testids: `scene-8`, `restart-button`

## Invariants Referenced
- **SEC-RESEND** — docs/prd.md §4 / docs/contracts/feature_demo.yml

## Acceptance Criteria (with verification status)
Statuses are against the working tree at commit 41b6d95 and the captured Playwright run of 2026-09-27 (local dev server, projects: chromium + mobile/WebKit iPhone 13). A passing test case is not full journey coverage; only VERIFIED rows are proven.

| AC | Criterion | Status |
|---|---|---|
| AC-US8-1 | Headline "Stop optimizing. Start moving." | VERIFIED — demo-flow.spec.ts:65 |
| AC-US8-2 | Email field with an accessible label and a "Join the Waitlist" submit button | PARTIAL — demo-flow.spec.ts:66 (placeholder only); "Join the Waitlist" NOT IMPLEMENTED; label not asserted |
| AC-US8-3 | Separate "Get Starter Kit - £19" action | DEVIATION — Scene8CTA.tsx:83 uses COPY.scene8.cta ("Get Starter Kit – £19") as the waitlist submit label; no separate action or destination |
| AC-US8-4 | Social proof "2,847 chains unbroken this week" visible | UNVERIFIED — rendered at Scene8CTA.tsx:106; no assertion |
| AC-US8-5 | Waitlist success shows confirmation; failure (4xx/5xx, missing RESEND_API_KEY) shows a retryable error and keeps the email | UNVERIFIED — no spec (SIM-9, SIM-10) |
| AC-US8-6 | Owner-notification email HTML-escapes the address; endpoint rate-limited with server-side validation | UNVERIFIED — app/api/waitlist/route.ts interpolates raw email into HTML and only checks includes("@") (SIM-7, SIM-8) |

**Coverage:** 1 VERIFIED, 1 PARTIAL, 1 DEVIATION, 3 UNVERIFIED. Journey coverage incomplete — not done.

## Gherkin Scenarios (PRD §5, verbatim)
```gherkin
Feature: Demo ends with conversion opportunity

Scenario: User reaches final CTA
  Given I am on the final scene
  Then I should see "Stop optimizing. Start moving."
  And I should see a waitlist signup form
  And I should see a "Get Starter Kit" option
```

## Journey (Definition of Done)
- **J-ID:** J-DEMO-COMPLETE
- **Mapped specs:** see Status column; each VERIFIED/PARTIAL row names file:line

## Simulation Findings (proposed)
Source: docs/specs/runtag-stories-simulation.md
- SIM-7
- SIM-8
- SIM-9
- SIM-10
- Open question 1: starter-kit destination
- Open question 2: social-proof claim

## Definition of Done
- [ ] Every AC is VERIFIED by an assertion in a mapped Playwright spec
- [ ] Mapped specs pass on chromium and mobile projects
- [ ] `npm run test:contracts` passes
- [ ] Journey gate Tier 1 result posted to this issue
