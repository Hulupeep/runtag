#!/bin/bash
# APP-SHELL Gate B DoD (D24-SEAM-FILE-SURFACES): surfaces resolve in a clean tree and declared files exist.
# Clean tree = tracked + non-ignored files only, so .specflow/duo round snapshots cannot produce false matches.
set -u
C=$(mktemp -d); trap 'rm -rf "$C"' EXIT
git ls-files -co --exclude-standard -z | xargs -0 -I{} cp --parents {} "$C"/ 2>/dev/null
echo "== verify-seams on evidence/seams-app-shell.json (clean tree)"
node scripts/verify-seams.cjs evidence/seams-app-shell.json --repo-root "$C" >/dev/null; seams=$?; echo "exit=$seams"
echo "== declared files exist"
node -e 'const fs=require("fs");let miss=0;for(const f of require("./evidence/seams-app-shell.json")[0].files){const ok=fs.existsSync(f);if(!ok)miss++;console.log((ok?"EXISTS ":"MISSING ")+f)}process.exit(miss?1:0)'; files=$?
[ $seams -eq 0 ] && [ $files -eq 0 ] && echo "SEAMS OK" || { echo "SEAMS FAILED"; exit 1; }
