#!/bin/bash
# Gate B slice DoD: a slice's surfaces resolve in a clean tree and its declared files exist.
# Usage: bash evidence/seams-check.sh [seams-file]   (default evidence/seams-app-shell.json)
# Clean tree = tracked + non-ignored files only, so .specflow/duo round snapshots cannot produce false matches.
set -u
F="${1:-evidence/seams-app-shell.json}"
C=$(mktemp -d); trap 'rm -rf "$C"' EXIT
git ls-files -co --exclude-standard -z | xargs -0 -I{} cp --parents {} "$C"/ 2>/dev/null
echo "== verify-seams on $F (clean tree)"
node scripts/verify-seams.cjs "$F" --repo-root "$C" >/dev/null; seams=$?; echo "exit=$seams"
echo "== declared files exist"
node -e 'const fs=require("fs");let miss=0;for(const f of require("./"+process.argv[1])[0].files){const ok=fs.existsSync(f);if(!ok)miss++;console.log((ok?"EXISTS ":"MISSING ")+f)}process.exit(miss?1:0)' "$F"; files=$?
[ $seams -eq 0 ] && [ $files -eq 0 ] && echo "SEAMS OK" || { echo "SEAMS FAILED"; exit 1; }
