## duo-build: re-filing an inherited invalid deferral produces duplicate scoped IDs ("Review findings require unique stable IDs")

**Observed** (runtime with #208 installed): a linked run inherits a scoped finding that a previous reviewer stored as a deferral with an invalid owner issue (short form `owner/repo#N` instead of `https://github.com/owner/repo/issues/N`). `specflow-reviews` classify() rejects that deferral and reopens it, and the inherited duo finding is open.

The peer prompt then requires two things at once:
1. disposition every open duo finding in `resolutions` (open or closed), and
2. "invalid deferrals require a material native finding or a valid evidenced future-only disposition", i.e. re-file it in `specification_nonblocking` as `deferred`.

If the peer does both (closes it in `resolutions` and re-files it in `specification_nonblocking`), `scripts/duo-build.cjs` builds the scoped finding list with the same ID twice: once from `specification_nonblocking` (`status: 'deferred'`) and once from the closure loop (`{...previous, status: 'resolved'}`). `specflow-reviews` classify() then throws `Review findings require unique stable IDs` and the round is recorded as `protocol_failed`.

If the peer keeps it open in `resolutions` instead, the duo finding stays open and blocks acceptance. So the only valid re-deferral path is a protocol failure.

**Where:** `scripts/duo-build.cjs`, in the scoped reservation block: the `for (const closure of result.resolutions.filter(r => r.status === 'closed'))` loop pushes a `resolved` copy without checking whether `findings` already holds that ID from `specification_nonblocking`.

**Suggested fix:** in the closure loop, skip (or replace) when `findings.some(f => f.id === closure.id)`, so a same-round re-deferral takes precedence over the closure copy. Add a test: an inherited invalid deferral, closed in resolutions and re-deferred with a valid URL in one round, yields one scoped row with `status: 'deferred'` and a passing classification.

**Related:** #206 / #208 (linked runs inherit scoped findings). A second, separate papercut: reviewers often write `owner_issue` in the short form, which the deferral check rejects silently until the next round. Validating the shape at response-schema time (pattern `^https://github\.com/[^/]+/[^/]+/issues/\d+$`) would catch it in the same round.

**Workaround used:** instruct the peer to disposition the ID only in `resolutions` against a builder resolution, and not to list it in `specification_nonblocking`.
