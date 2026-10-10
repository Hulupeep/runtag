# APP-TAP: tap in / tap out at `/t/{tagId}`

**Epic:** RunTag App v1 (PRDs/runtag-app-prd.md @ f6c230c7…) · **Wave:** W2 · **Priority:** P0 · **Spec depth:** thin (promote to build-ready when selected)
**Depends on:** APP-SHELL (store, shell, TAG_ORIGIN)
**Promise:** "Tap the tag, see TAGGED, go. Tap again, see the chain grow."
**Covers:** APP-002, APP-003, APP-004, APP-005, APP-006, APP-016, APP-017, APP-018, APP-019, APP-020, APP-021, new APP-023

## Outcome / behaviour acceptance (outline)
- AC-1 Unknown tag → Plant screen ("Save and start run" / "Just save" / "Restore from backup"; "Save and tap out here" only if a non-stale run is open)
- AC-2 Tap-in / tap-out per APP-003/004; at most one open run
- AC-3 Decision order APP-023 (verdict S-2): invalid → stale abandon (incl. `startedAt > now`) → unknown → grace (`now < tag.graceUntil`) → double-read guard → tap-out → tap-in, in one APP-020 transaction
- AC-4 One tap per navigation (APP-016, S-4): visible + non-prerendering, ignore `pageshow.persisted`, replaceState to `/app?tapped={runId}` which renders the stored result screen
- AC-5 Undo compare-and-set (S-13); 60 s window derived from stored `lastTapAt`; abandoned stays abandoned
- AC-6 Success only after commit; failure → "This tap wasn't saved" + Retry (APP-019)
- AC-7 No countdowns/durations in copy (M-6)

## Gate A stipulations to fold in at promotion
Verdict §7 APP-TAP 1–5 (S-1 Plant Gherkin rewrite, S-2 APP-023, S-4, S-13, M-6).

## Journey
J-APP-RUN, J-APP-PLANT (tap parts) — hops I/A/L in PRDs/runtag-app-hops.md

## Unknowns
None blocking; real-device banner flow verified in APP-LINK.
