APP-SHELL shipped: merged in PR #25 (f67b92c) and live on https://runtag.vercel.app.

- Spec: build-ready after scoped Codex review (27/27); implementation review 27/27 with duo `finish` complete
- CI on the merged head: compliance ✓, e2e ✓ (Chromium + WebKit iPhone 13), Vercel ✓; main requires compliance + e2e
- Local production build: jest 260/260, tsc clean, Playwright 125 passed / 3 skipped (offline journey is Chromium-only by design), seam check OK, provenance gate passed
- Production check (real Chromium against runtag.vercel.app): /app shows "Ready offline ✓"; offline, never-visited /t/prodtest01 rendered its own tag id from the service worker in 49 ms; /app, /t/*, /sw.js, manifest and icons all 200 without login

Defects caught and fixed on the way: premature transaction settle (AC-SHELL-18), Ready-offline latching after cache loss, Vercel ?dpl= asset URLs that would have broken the offline shell, missing scripts/vercel-ignore.sh for the Vercel Ignored Build Step.
Note for APP-LINK: alias hosts (runtag-floutlabs.vercel.app) sit behind Vercel SSO, so they are not publicly reachable at all.
