<!-- portfolio-reviewer:begin -->

## Portfolio Review — 2026-09-14

# runtag

Reviewed with `gpt-5.6-luna` · 2026-09-14T13:28:07.287792+00:00 · Confidence: Medium on what the repository implements; low-to-medium on commercial interpretation. Evidence is bounded to 36 excerpts and limited GitHub results. No external customer, financial, deployment or runtime validation was performed.

## One-sentence description

RunTag is an interactive marketing/demo site for a proposed NFC-based running-accountability product. The concept replaces pace, distance, and calorie tracking with tap-in/tap-out participation and an unbroken chain. The repository groups a polished demo experience with a waitlist endpoint; it does not demonstrate the underlying production app or NFC product.

## Product type

commercial product, experiment

## Problem and intended user

Problem: fitness metrics and watches may undermine simple habit formation, according to the product thesis. Intended users are runners or prospective runners who prefer accountability over performance analytics. Buyer is probably the individual runner purchasing a starter kit, but this is inferred from the £19 CTA rather than validated demand.

## Current state

The apparent deliverable is substantially implemented as an eight-scene Next.js interactive demo: narrative progression, NFC-like interactions, animations, mobile layout, accessibility affordances, chain incrementing, route discovery mockup, CTA and waitlist flow are represented in app/page.tsx, hooks/useDemoState.ts, components/NFCTag.tsx and lib/constants.ts. package.json exposes dev, build, start, lint and Playwright test scripts. Tests and build were not run; runnable state is UNKNOWN. The waitlist route requires Resend configuration and the supplied excerpt redacts credential-related lines. The actual mobile app, physical NFC provisioning, accounts, persistent chains, real route discovery and fulfillment are not evidenced.

## Commercial assessment

The hypothesized value is a low-friction physical accountability ritual for runners who reject quantified-self tracking. Monetisation is only inferable as a £19 starter kit from lib/constants.ts; recurring revenue, margins, fulfilment and pricing validity are UNKNOWN. Demand evidence is limited to a designed waitlist and social-proof copy, not actual signups or customers. Distribution is UNKNOWN; no customer conversations, campaigns, revenue or usage are supplied. Competitors and substitutes are not evidenced and should not be asserted from this sample. The demo can test messaging, but it is not evidence that the physical product works or that buyers will pay.

## Portfolio assessment

Owner context marks RunTag active, but explicitly says not to infer traction. Ownership/upside is plausible because the repository and GitHub repository are owner-associated, but contractual rights and product ownership are not independently demonstrated. The code has reuse value as a landing-page/demo pattern and tested interaction scaffolding, though extracting it is not justified without confirming rights and portfolio need. Strategic fit is plausible with focused execution on an owned product, but the project may compete for time with other active projects. Continuing to polish the demo before validating demand risks opportunity cost and sunk-cost attachment.

## Scores

Cost to revive and opportunity cost: higher means more costly/burdensome; these are not positive scores. No summed score is used.

| Dimension | Score | Evidence or reasoning |
|---|---:|---|
| Problem clarity | 3 | The anti-metric accountability thesis is explicit, but the underlying user problem is asserted rather than evidenced. |
| User/customer clarity | 2 | Runners are identifiable, but the best segment and buyer are not validated. |
| Evidence of demand | 1 | Waitlist mechanics and social-proof copy exist; actual signups, conversations and payments are absent. |
| Commercial potential | 3 | A £19 starter-kit offer is concrete, but pricing, fulfilment and retention are unproven. |
| Distribution advantage | 1 | No acquisition channel, audience, partnership or distribution evidence is supplied. |
| Strategic fit | 3 | Owner context lists RunTag as active and prioritises owned upside, but competing active projects create uncertainty. |
| Ownership/upside | 3 | Owner-associated git and GitHub evidence support plausible ownership; rights and defensibility remain unverified. |
| Current execution state | 4 | The demo implementation and journey tests are extensive, though no build, test or deployment was executed. |
| Cost to revive | 2 | The demo appears close to validation, but physical product and backend work could be substantial; provisional. |
| Differentiation | 3 | NFC tags plus an explicitly anti-metric positioning are distinctive in the supplied material, without competitive verification. |
| Evidence of real-world use | 0 | No verified users, paid usage, deployed usage or physical NFC operation is supplied. |
| Opportunity cost of continuing | 3 | Further polishing could displace other active owned projects; score is provisional because portfolio priorities and time budgets are incomplete. |

## Decision

COMMERCIAL CANDIDATE

## Decision rationale

COMMERCIAL CANDIDATE is appropriate because there is a coherent product thesis, a concrete offer hypothesis and a credible prototype-to-validation path, but no evidence of demand, distribution, paid usage or real-world NFC operation. It did not receive ACTIVE COMMERCIAL PRIORITY because the required strong demand and first-customer evidence are absent. It did not receive BOOST because the main uncertainty is commercial validation, not merely implementation completeness. It does not warrant ARCHIVE because a focused test could cheaply resolve whether the proposition has buyer pull.

## Smallest next action

Run a 2-hour validation sprint: inspect the live waitlist data if available to the owner, recruit or contact five reachable runners from an existing audience, and ask for a £19 refundable preorder or explicit starter-kit commitment using the existing demo. Record segment, objection, commitment and next decision; do not add features.

Timebox: 2 hours.

## Conditions for changing the decision

Upgrade toward BOOST or ACTIVE COMMERCIAL PRIORITY only if a bounded test produces identifiable target users, qualified waitlist demand, conversations showing repeated pain, deposits/preorders or paid starter-kit purchases, and a workable physical NFC fulfilment path. Move to ARCHIVE if the test finds no credible buyer segment or willingness to pay within the timebox. Keep any demo code for reference even if the product premise is rejected.

## Evidence reviewed

- **evidence** — `docs/prd.md`: Defines RunTag as an anti-fitness-tracker using NFC tap-in/tap-out and states the demo's purpose is conversion before download.
- **evidence** — `app/page.tsx`: Implements an eight-scene client-side demo flow using scene components and state.
- **evidence** — `components/NFCTag.tsx`: Implements simulated NFC interaction, keyboard activation, ripple feedback and accessibility labeling.
- **evidence** — `hooks/useDemoState.ts`: Implements local demo state, timed scene progression and chain increment from 4 to 5.
- **evidence** — `lib/constants.ts`: Contains the £19 starter-kit CTA, waitlist-oriented copy and social-proof text.
- **evidence** — `app/api/waitlist/route.ts`: Implements a Resend-backed waitlist endpoint, subject to environment configuration.
- **evidence** — `package.json`: Provides build, dev, lint and Playwright test scripts; dependencies were not installed or executed in the supplied checks.
- **evidence** — `tests/e2e/demo-flow.spec.ts`: Specifies an end-to-end journey through scenes 1–8, including NFC taps and chain increment.
- **evidence** — `git:.`: Shows one initial commit dated 2026-01-22 and a working tree containing the supplied application and tests.
- **evidence** — `github:Hulupeep/runtag`: Repository is available, unarchived, with no sampled issues, pull requests or project boards; results are bounded.
- **evidence** — `owner-context`: RunTag is listed as active, but owner context explicitly prohibits inferring commercial traction from that status.
- **evidence** — `checks`: Only manifest parsing was performed; builds, tests and scripts were not run.

## Unknowns

- Whether the demo is deployed and usable by external visitors.
- Actual waitlist count, conversion rate and source of signups.
- Whether the owner has physical NFC tags, a functioning mobile app, backend, accounts and fulfilment capability.
- Whether £19 covers costs and whether users will pay.
- Exact ownership and commercial rights for all assets and implementation.
- Which runner segment has the strongest pain and reachable distribution.

## Inspection limitations

- Source/tests/deployments are NOT executed; runnable state is not verified.
- Secrets, private chat datasets, databases, binary media, dependencies, build outputs and symlinked files are excluded.
- Evidence is bounded to depth 6, 18000 entries, 36 file excerpts/65000 characters, 80 keyword excerpts, and 12 repositories.
- GitHub results are bounded; inspect API status and pagination limits.
- No external customer or financial validation was performed.

<!-- portfolio-reviewer:end -->
