# RunTag app — discovery grounding (2026-10-10)

## Intent
Owner wants to **run with RunTag from their own phone**: plant NFC tags at running spots, tap in at the start, tap out at the end, and see the chain grow. Web app preferred (works on iPhone and Android); Android-native only as fallback.

## Real artifacts this must satisfy (oracle sources)
| Fact | Source |
|---|---|
| Product rules: tap in / tap out, chain = consecutive days, **no pace/distance/time/calories/HR** | docs/prd.md §1, §4 INV-D4 |
| Demo already defines chain visuals, NFC ripple, "TAGGED — Run started", "Day N. Chain unbroken." copy | lib/constants.ts, components/{NFCTag,ChainVisual,IPhoneMockup}.tsx |
| Hosting: Vercel project `runtag` (team floutlabs), Git integration deploys `main` to **https://runtag.vercel.app** | Vercel API: project domains + deployments (2026-10-10) |
| Stack: Next.js 16 App Router, React 18, Tailwind, Framer Motion, Playwright (chromium + iPhone 13 WebKit) | package.json, playwright.config.ts |
| Owner storage decision: on-device only for v1, no login/backend | owner answer 2026-10-10 |

## Platform constraints (claims to be falsified at Gate A)
1. **URL-on-tag** (NDEF URI record on NTAG213/215): iPhone XS+ reads in background and opens the URL in Safari; Android opens it in the default browser (Chrome). No app install needed.
2. **Web NFC** (`NDEFReader`) exists only in Chrome on Android → may be used to *write* tags on Android, never required.
3. **iOS storage silos:** a home-screen-installed web app on iOS has storage separate from Safari; tag taps open Safari → data written by taps would not appear in the installed app.
4. **Safari storage eviction:** WebKit may delete script-writable storage (IndexedDB/localStorage) for sites with no user interaction during 7 days of browser use; Android Chrome evicts best-effort storage under pressure unless `navigator.storage.persist()` is granted.
5. Trailheads can have no signal → the tap URL must load **offline** after first visit (service worker; supported in iOS Safari and Android Chrome).
6. NFC readers can fire twice on one physical tap.

## Problem statement
The repo is a scripted demo: the tag is a button, the chain is hard-coded 4→5, nothing persists. A real run needs: a tag identity in a URL, a tap state machine (in/out), durable on-device history, chain computed from real dates, and an offline-capable deployed origin whose URLs never change (they are printed onto stickers).

## Out of scope for v1
Route discovery/map (needs backend + other users), accounts/sync, waitlist/starter-kit commerce, native apps.
