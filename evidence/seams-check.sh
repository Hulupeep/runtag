#!/bin/bash
# Clean-tree seam check: tracked + non-ignored files only (excludes .specflow/duo snapshots).
C=$(mktemp -d); git ls-files -co --exclude-standard -z | xargs -0 -I{} cp --parents {} "$C"/ 2>/dev/null
echo "== verify-seams, full APP-SHELL declarations (ticket DoD command, clean tree)"
node scripts/verify-seams.cjs evidence/seams-app-shell.json --repo-root "$C" >/dev/null; echo "exit=$?"
node -e 'const t=require("./evidence/seams-app-shell.json")[0];const r=s=>s.startsWith("/");require("fs").writeFileSync(process.argv[1],JSON.stringify([{id:t.id,writes:t.writes.filter(r),reads:t.reads.filter(r)}]))' "$C/routes.json"
echo "== verify-seams, route surfaces only"; node scripts/verify-seams.cjs "$C/routes.json" --repo-root "$C" >/dev/null; echo "exit=$?"
echo "== file-path declarations exist on disk"
node -e 'const fs=require("fs"),t=require("./evidence/seams-app-shell.json")[0];for(const s of [...t.writes,...t.reads].filter(s=>!s.startsWith("/")))console.log((fs.existsSync(s)?"EXISTS ":"MISSING ")+s)'
rm -rf "$C"
