# APP-TAGS: plant and write tags at `/app/tags`

**Epic:** RunTag App v1 · **Wave:** W3 · **Priority:** P1 · **Spec depth:** thin
**Depends on:** APP-SHELL, APP-TAP (plant flow)
**Promise:** "Make a tag in a minute: name it, write it (Android) or copy the link."
**Covers:** APP-014 (+ tag list/rename)

## Outcome / behaviour acceptance (outline)
- AC-1 Create tag → URL `TAG_ORIGIN + '/t/' + id` shown and copyable (S-7)
- AC-2 `'NDEFReader' in window` → "Write to tag" (NDEF URI); success resets `graceUntil = now + 600 000` before "Tag ready" (S-8)
- AC-3 No Web NFC → step-by-step instructions for a free NFC writer app
- AC-4 Write errors in plain language with copy-link fallback (PL-17)

## Gate A stipulations to fold in at promotion
Verdict §7 APP-TAGS 1–2.

## Journey
J-APP-PLANT (setup parts)
