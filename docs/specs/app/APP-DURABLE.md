# APP-DURABLE: backups, persistence, storage-silo guard

**Epic:** RunTag App v1 · **Wave:** W3 · **Priority:** P1 · **Spec depth:** thin
**Depends on:** APP-SHELL, APP-TAP (plant screen restore link), APP-CHAIN (backup status slot)
**Promise:** "My chain survives a new phone or a cleared browser."
**Covers:** APP-012, APP-013, APP-022

## Outcome / behaviour acceptance (outline)
- AC-1 `navigator.storage.persist()` on first plant; result stored; warning when false
- AC-2 Export JSON (`ExportFile`); Import validated (M-4) — invalid file → "This isn't a RunTag backup", zero writes
- AC-3 Round trip: tags/runs sorted by id deep-equal; meta excluded; double import idempotent (S-6)
- AC-4 Conflicts: per-conflict "Keep mine / Use backup", default Keep mine, newest open run wins
- AC-5 Silo guard closed list: `navigator.standalone`, UA tokens Instagram/FBAN/FBAV/Line//musical_ly/BytedanceWebview; private mode not detected, plant screen says "Private tabs forget your chain." (S-12)
- AC-6 Backup nudge: persist false, or no export in 7 days (never exported counts) with ≥3 done runs

## Gate A stipulations to fold in at promotion
Verdict §7 APP-DURABLE 1–4.

## Journey
J-APP-BACKUP
