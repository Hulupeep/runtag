## Summary
A scoped preparation review (build-ready / contracted) can **never pass after a repair**. A repair edits the pinned task, so a new linked duo run is required. In the linked run, the previous round's scoped findings can't be closed by either party, so `classify()` keeps them `open` and the round ends `blocked` even when the peer accepts every criterion. This was observed on RunTag, where two tickets (#16/#21) were lost to it and #27 is stuck now.

## Root cause (at main `640ec9e`)
1. Any change to the pinned task/references forces a new run: `scripts/duo-build.cjs:167-169` ("reconcile scope explicitly in a new linked run").
2. The new run starts with **no open findings** in its duo state (`startLocked` builds a fresh state).
3. The scoped layer only marks a prior finding resolved when the peer returns it as a `closed` resolution: `duo-build.cjs:665` (`result.resolutions.filter(r => r.status === 'closed')` → previous round findings). Otherwise `classify()` (`specflow-reviews.cjs:88`) merges the prior round's findings as still `open`, so the outcome is `blocked`.
4. The duo layer **forbids** exactly those resolutions:
   - `duo-progress.cjs:92` rejects builder resolutions for IDs not open in the current run ("Invalid builder resolution").
   - `duo-progress.cjs:115` rejects peer resolutions that don't match the current run's open findings ("Peer must explicitly disposition every open finding").

`request.specification_review.prior_findings` (`duo-build.cjs:569`, new in #199/#201) shows the peer the obligations. But neither side can close them, so the contradiction remains.

## Repro
1. Preparation run with `specification.targetTier: build-ready`; the peer raises F-1 on an AC.
2. Fix the AC in the ticket (the pinned task). The run blocks on the pinned change. Cease it and start a linked run.
3. Submit with `resolutions: []`. The peer accepts 27/27 with `resolutions: []`. Result: `Scoped specification review remains blocked`, and the scoped round is recorded `blocked`.
4. Submit with builder resolutions for F-1: rejected, "Invalid builder resolution: F-1".

## Suggested fix (any one)
- At `start`, seed a linked preparation run's duo `findings` with the issue/tier's open non-P2 scoped findings from the latest complete round. The builder and peer then close them through the normal resolutions path, and `duo-build.cjs:665` finds them in the prior round.
- Or have `duo-progress.cjs` accept peer and builder resolutions for IDs present in `request.specification_review.prior_findings`.
- Or allow `workKind: preparation` runs to repair their own pinned task in-run, since the task is the artifact under repair.

## Smaller defects found on the same project (FYI)
- **`specflow-specification.cjs:34`:** `volumeBaseline ||=` is captured at the first `import`, before a profile can exist. Linked docs (B.5 reports, sibling tickets) are then pooled into the identifier baseline permanently, which leads to "Conflicting definitions" or "Lost identifier" forever. Workaround: write the record's profile *before* import.
- **ID collisions:** plain `AC-n` IDs collide across linked docs. The duo task scanner extracts `AC-1` from `S-AC-1`, while the anchor rule rejects IDs preceded by `-`, so `S-AC-n` IDs can never be indexed. Lowercase sub-IDs (`AC-1b`) fail `validId`. Recommend documenting per-ticket namespacing (`AC-TAP-n`).
- **`verify-seams.cjs`:** it resolves only code-text substrings, so file-path surfaces never resolve. Its `SKIP` list (line 78) omits `.specflow`/`Specflow`, so duo round snapshots produce false resolutions. Also, `/t/`-style surfaces resolve vacuously, because the leading `/` is stripped.
- **`templates/ci/specflow-compliance.yml:64`:** `grep -c … || echo "0"` yields `0\n0` on zero violations and breaks the following `sed`. Use `|| true`.
- **`accessibility_defaults.yml` A11Y-003:** the `<input(?![^>]*aria-label…)` regex stops at the first `>`, so a JSX `onChange={(e) => …}` before `aria-label` gives a false positive.
- **Codex CLI 0.157.1** returned empty `aggregated_output` for some `cat --` reads, which made the receipt checker reject valid reviews. Fixed in 0.160.0; worth a version note.
