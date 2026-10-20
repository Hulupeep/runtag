# RunTag App v1 — release notes

RunTag is a phone web app at **https://runtag.vercel.app/app**. Stick an NFC tag where you start running, tap it to start, tap a tag again when you finish, and watch one number grow: your chain of consecutive days. No account, no metrics, no typing.

## What's in v1
- **Tags** (`/app/tags`): create a tag, copy its link, and write it to an NFC sticker — directly on Android Chrome ("Write to tag"), or with a free NFC writer app on iPhone. A new or rewritten tag starts with a short setup window, so testing it never starts a run.
- **Tap in, tap out** (`/t/<tag id>`): one tap starts a run ("TAGGED"), the next finishes it ("Day N. Chain unbroken."). Undo works for a minute. A second read within a minute changes nothing. A run left open for 6 hours doesn't count.
- **Chain home** (`/app`): the chain number, the last 14 days, "Run today to keep your chain.", and "Ready offline ✓" once the app works without signal.
- **Backups** (`/app/settings`): export a backup file and restore it on a new phone or after a cleared browser; RunTag asks the browser to keep its data and reminds you to back up.
- **Wrong-browser guard**: planting is blocked in an iPhone Home Screen app and needs a second confirmation in in-app browsers (Instagram, Facebook, TikTok, Line).
- **From the demo**: the demo's last scene now has "Start for real", which opens the app.

## Privacy and limits
Vercel request logs record tag ID, IP, user agent and time for online taps (plan retention); no analytics scripts on `/t/*` or `/app*`.
Private browsing is not detected (no reliable signal); the plant screen states 'Private tabs forget your chain.'
Every tap screen shows one primary button (hypothesised WebKit user-interaction signal; confirmed or refuted by the §7 8-day iOS check).

Your tags, runs and settings live only in this phone's browser. Export a backup to keep them safe; a different browser or phone starts empty until you restore it.

## Business
Revenue: none in v1; validation only. Alternative today: calendar/streak app or iOS Shortcuts NFC automation; delta: no install, no typing, metric-free chain.

## Release check
The real-phone checklist is `docs/release/runtag-app-v1-device-checklist.md`; the owner runs and signs it for Gate D.
