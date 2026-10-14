#!/bin/bash
# APP-TAP #27 GATE-SIZE: hand-written app production lines added by this slice (owner amendment 2026-10-13:
# tests and contracts excluded). Baseline = merge-base with main (APP-SHELL #26 merged there).
# Specflow tooling under scripts/ (vendored from Hulupeep/Specflow by the runtime update that carries the #208 fix)
# is not app code and is listed separately, never hidden.
set -euo pipefail
BASE=$(git merge-base main HEAD)
echo "baseline: $BASE ($(git log -1 --format=%s "$BASE"))"
echo "head:     $(git rev-parse HEAD)"
APP='^(app|lib|components|public|scripts/sw)/|^(next\.config\.mjs|package\.json)$'
TOOL='^scripts/(duo-|specflow-|improve-|review-)'
rows=$(git diff --numstat "$BASE" HEAD)
echo "--- app production files (added deleted path)"
awk -F'\t' -v re="$APP" '$3 ~ re' <<<"$rows"
TOTAL=$(awk -F'\t' -v re="$APP" '$3 ~ re {a+=$1} END {print a+0}' <<<"$rows")
echo "app production added total: $TOTAL"
echo "--- excluded: vendored Specflow tooling (added deleted path)"
awk -F'\t' -v re="$TOOL" '$3 ~ re' <<<"$rows"
echo "--- excluded: other categories (files, added lines)"
awk -F'\t' -v app="$APP" -v tool="$TOOL" '$3 !~ app && $3 !~ tool {split($3,p,"/"); c[p[1]]+=$1; n[p[1]]++} END {for (k in c) print k": "n[k]" files, "c[k]" lines"}' <<<"$rows" | sort
UNCLASSIFIED=$(awk -F'\t' -v app="$APP" -v tool="$TOOL" '$3 ~ /^scripts\// && $3 !~ app && $3 !~ tool {print $3}' <<<"$rows")
[ -z "$UNCLASSIFIED" ] || { echo "unclassified scripts: $UNCLASSIFIED"; exit 1; }
[ "$TOTAL" -lt 1000 ] && echo "GATE-SIZE PASS ($TOTAL < 1000)" || { echo "GATE-SIZE FAIL ($TOTAL)"; exit 1; }
