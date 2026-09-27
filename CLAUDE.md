# runtag - Development Guide

## Project Context

<!-- REQUIRED: Fill this in so Claude knows the project -->

**Repository:** [org/repo-name]
**Project Board:** [GitHub Issues | Jira | Linear | Notion | Other]
**Board CLI:** [gh | jira | linear | other] (must be installed and authenticated)
**Tech Stack:** [e.g., React, Node, Python, etc.]

---

## Specflow Rules

### Rule 1: No Ticket = No Code

All work requires a GitHub issue before writing any code.

### Rule 2: Commits Must Reference an Issue

**NEVER run `git commit` without a `#<issue-number>` in the message.**

If you do not know the issue number, **ASK** before committing. Multiple issues are fine.

```bash
# single issue
git commit -m "feat: add signup validation (#375)"

# multiple issues
git commit -m "feat: add auth + profile (#375 #376)"

# no number — journey tests silently skip, nothing verified
git commit -m "feat: add signup validation"
```

### Rule 3: Contracts Are Non-Negotiable

Check `docs/contracts/` before modifying protected files.

```bash
npm test -- contracts    # Must pass
```

Violation = build fails = PR blocked.

### Rule 4: Tests Must Pass Before Closing

```bash
npm test -- contracts    # Contract tests
npm run test:e2e         # E2E journey tests
```

Work is NOT complete if tests fail.

### Rule 5: Contracts Are YAML, Not Markdown

**NEVER write contract content (invariants, forbidden patterns, required patterns) into .md files.**

Contracts MUST be YAML files in `docs/contracts/`:
- Feature contracts: `docs/contracts/feature_*.yml`
- Journey contracts: `docs/contracts/journey_*.yml`
- Default contracts: `docs/contracts/*_defaults.yml`

Wrong: `docs/specflow/my-feature-invariants.md`
Right: `docs/contracts/feature_my_feature.yml`

### Contract Locations

| Type | Location |
|------|----------|
| Feature contracts | `docs/contracts/feature_*.yml` |
| Journey contracts | `docs/contracts/journey_*.yml` |
| Default contracts | `docs/contracts/*_defaults.yml` |
| Contract tests | `tests/contracts/*.test.js` |
| E2E tests | `tests/e2e/*.spec.ts` |

### Active Contracts

| Contract | Protects | Rules |
|----------|----------|-------|
| `security_defaults` | OWASP baseline | SEC-001 through SEC-005 |
| `test_integrity_defaults` | Test quality | TEST-001 through TEST-005 |
| `accessibility_defaults` | WCAG AA baseline | A11Y-001 through A11Y-004 |
| `production_readiness_defaults` | Production hygiene | PROD-001 through PROD-003 |
| `component_library_defaults` | UI composition | COMP-001 through COMP-004 |

### Override Protocol

Only humans can override. User must say:
```
override_contract: <contract_id>
```

