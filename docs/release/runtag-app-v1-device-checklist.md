# RunTag App v1 — real-device checklist (owner, Gate D)

Run on real phones with real stickers, then sign in Gate D (`gate-d/runtag-app/`). Put every evidence file under `gate-d/runtag-app/evidence/` with the exact name given. Screenshots support a result; values are read from the `.txt` / `.json` files. The release smoke output is copied to `gate-d/runtag-app/evidence/release-smoke.txt`.

### 1. Stickers
Hop: —
Expected: NTAG213/215 stickers bought; the purchase date is recorded here before the walk (M-10).
Evidence: `stickers-purchase.png`
Result: 
Date: 
Phone / OS / browser: 

### 2. iPhone tap (latency)
Hop: I16
Expected: Setup on the iPhone, all in the same Safari (not a Private tab): create the tag at `https://runtag.vercel.app/app/tags` and note the time, copy its link, write that link with the iOS writer app; the read-back is exactly `https://runtag.vercel.app/t/<id>`; open `/app` and confirm no "Run in progress" banner. Wait until at least 11 minutes after the last Create or Copy link (never copy again). Tap-in: NFC banner → "Open in Safari" → TAGGED; screen recording < 2 s from the banner tap to the first TAGGED frame on 4G; export (run `open`). Wait at least 61 seconds and less than 6 hours, then tap out → "Day N. Chain unbroken." or "Run saved."; export (run `done`). A "Tag works ✓" or "You're in. Now go." + "Finish run" screen is a timing deviation, not a product failure: note it and repeat after waiting.
Evidence: `I16-timeline.txt`, `I16-export-after-in.json`, `I16-export-after-out.json`, `I16-latency.txt`, `I16-first-tagged-frame.png` (keep the recording; it is not Gate D evidence)
Result: 
Date: 
Phone / OS / browser: 

### 3. iPhone default browser
Hop: —
Expected: Which browser opens the NFC URL when the default is not Safari, and whether it can land in a Private tab (S-12).
Evidence: `iOS-default-browser.txt` (browser name and version, Private yes/no)
Result: 
Date: 
Phone / OS / browser: 

### 4. iPhone retention
Hop: I17
Expected: I17 (iPhone Safari, ≥ 8 days, NFC-launched visits only): Export daily from `https://runtag.vercel.app/app/settings`; the file `runtag-backup-YYYY-MM-DD.json` lands in Files; each day's export run-id set ⊇ the previous day's; chain = the tally in a dated note written before opening `/app`. Import that file on a cleared Safari (Settings → Import) → the chain matches. Record `meta.persistResult` from the export. Home Screen app: `/app/tags` shows 'Plant tags in Safari' on load. Instagram in-app browser: the warning and 'Plant here anyway'.
APP-021 hypothesis: confirmed (no data lost over ≥ 8 days of NFC-launched visits) / refuted (loss observed: date and what was lost) — 
Evidence: `I17-export-<YYYY-MM-DD>.json` (one per day), `I17-tally.txt`, `I17-silo.png`
Result: 
Date: 
Phone / OS / browser: 

### 5. Android writing
Hop: A11
Expected: Android Chrome: Write to tag on `https://runtag.vercel.app/app/tags`; NFC Tools read-back = `https://runtag.vercel.app/t/<id>`; export `graceUntil` ≥ write time + 600000; the auto-read straight after writing creates no run; NFC switched off shows the NotReadableError message.
Expected copy: "NFC is switched off. Turn on NFC in your phone's settings, then try again, or copy the link instead."
Evidence: `A11-export.json`, `A11-nfctools-readback.png`, `A11-nfc-off.png`
Result: 
Date: 
Phone / OS / browser: 

### 6. Alias domain
Hop: A12
Expected: (owner amendment 2026-10-20) (a) on an Android browser not signed in to Vercel, `https://runtag-floutlabs.vercel.app/app` shows the Vercel login, never RunTag; (b) in a browser signed in to Vercel, the same URL lands on `https://runtag.vercel.app/app` (address bar re-read).
Evidence: `A12-anonymous.txt` (URL opened, final address bar URL, page title), `A12-signed-in.txt` (URL opened, final address bar URL), `A12-anonymous.png`, `A12-signed-in.png`
Result: 
Date: 
Phone / OS / browser: 

### 7. Unauthenticated tag URL
Hop: —
Expected: `https://runtag.vercel.app/t/<id>` on mobile data opens the app, no Vercel login (ledger #21).
Evidence: `unauth-t.txt` (URL opened, final address bar URL, first heading shown), `unauth-t.png`
Result: 
Date: 
Phone / OS / browser: 

### 8. Primary metric
Hop: —
Expected: ≥ 5 real runs in 7 days with physical tags; each day the chain equals a manual tally written in a dated note before opening `/app` (T12).
Evidence: `primary-metric.txt` (dated tally rows and the chain value per day)
Result: 
Date: 
Phone / OS / browser: 

### 9. Demo link
Hop: G2
Expected: On a phone, finish the demo at `https://runtag.vercel.app/`; scene 8 still shows "Get Starter Kit – £19" and the email field; "Start for real" lands on `/app`.
Evidence: `demo-link.txt` (start URL, final address bar URL, whether the £19 button and the email field were visible), `demo-link.png`
Result: 
Date: 
Phone / OS / browser: 

### 10. Day change
Hop: —
Expected: `/app` open in iPhone Safari before local midnight, switch to another app, return after midnight without reloading → today's history day and its state show the new day (APP-CHAIN rule "Day change").
Evidence: `day-change.txt` (time left, time returned, the last history day shown before and after), `day-change.png`
Result: 
Date: 
Phone / OS / browser: 
