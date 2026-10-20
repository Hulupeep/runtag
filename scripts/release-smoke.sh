#!/bin/bash
# RunTag App v1 release smoke (APP-LINK #35): read-only GETs against production, run by the owner or the build
# agent after the merge deploys — never in CI or npm test. One line per check; exit 0 only if all four pass.
set -euo pipefail

ORIGIN=https://runtag.vercel.app
ALIASES=(https://runtag-floutlabs.vercel.app https://runtag-git-main-floutlabs.vercel.app)
fail=0
get() { curl -sS --max-redirs 0 -o "$2" -D "$3" --max-time 30 "$1" || true; }
status() { awk 'toupper($1) ~ /^HTTP/ {s=$2} END {print s}' "$1"; }
header() { awk -v h="$2" 'BEGIN{IGNORECASE=1} tolower($1)==tolower(h":") {sub(/\r$/,""); $1=""; sub(/^ /,""); v=$0} END {print v}' "$1"; }
report() { printf '%s %s %s %s\n' "$1" "$2" "$3" "$4"; [ "$4" = PASS ] || fail=1; }
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# 4. This release is live (ledger #20): a chunk referenced by the demo page contains the new link. Polls up to 10 min.
live=FAIL
for _ in $(seq 1 "${SMOKE_POLLS:-20}"); do
  get "$ORIGIN/" "$tmp/home.html" "$tmp/home.h"
  if [ "$(status "$tmp/home.h")" = 200 ]; then
    for chunk in $(grep -oE '/_next/static/chunks/[^"]+\.js' "$tmp/home.html" | sort -u); do
      curl -sS --max-time 30 -o "$tmp/chunk.js" "$ORIGIN$chunk" || true
      if grep -q 'start-for-real' "$tmp/chunk.js"; then live=PASS; break; fi
    done
  fi
  [ "$live" = PASS ] && break
  sleep 30
done
report release-live "$(status "$tmp/home.h")" "start-for-real-in-chunk" "$live"

# 1. Shell: a fresh tag URL serves the app shell without credentials, with first-party scripts only (PL-22).
head -c 512 /dev/urandom > "$tmp/rand"
id=$(LC_ALL=C tr -dc 'a-z0-9' < "$tmp/rand" > "$tmp/id"; cut -c1-10 "$tmp/id")
get "$ORIGIN/t/$id" "$tmp/t.html" "$tmp/t.h"
shell=PASS
[ "$(status "$tmp/t.h")" = 200 ] || shell=FAIL
grep -q '<title>RunTag</title>' "$tmp/t.html" || shell=FAIL
grep -q 'data-testid="view"' "$tmp/t.html" || shell=FAIL
grep -oE '<script[^>]+src="[^"]+"' "$tmp/t.html" > "$tmp/scripts" || true
if grep -oE 'src="[^"]+"' "$tmp/scripts" | grep -v '^src="/_next/static/' > "$tmp/foreign"; then shell=FAIL; fi
report shell "$(status "$tmp/t.h")" "/t/$id title+view+first-party-scripts" "$shell"

# 2. Aliases (owner decision 2026-10-20): Vercel login or 308 to the canonical origin; never the app itself.
aok=PASS; seen=""
for alias in "${ALIASES[@]}"; do
  get "$alias/app" "$tmp/a.html" "$tmp/a.h"
  s=$(status "$tmp/a.h"); loc=$(header "$tmp/a.h" location)
  ok=FAIL
  { [ "$s" = 302 ] || [ "$s" = 307 ]; } && [[ "$loc" == https://vercel.com/sso-api* ]] && ok=PASS
  [ "$s" = 308 ] && [ "$loc" = "$ORIGIN/app" ] && ok=PASS
  [ "$ok" = PASS ] || aok=FAIL
  seen="$seen ${alias#https://}:$s->${loc%%\?*}"
done
report aliases "-" "${seen# }" "$aok"

# 3. Service worker: a rendered build id, never the template placeholder.
get "$ORIGIN/sw.js" "$tmp/sw.js" "$tmp/sw.h"
build=$(grep -oE "const BUILD_ID = '[^'_][^']*'" "$tmp/sw.js" | head -1 || true)
cc=$(header "$tmp/sw.h" cache-control)
sw=PASS
[ "$(status "$tmp/sw.h")" = 200 ] || sw=FAIL
[ -n "$build" ] || sw=FAIL
[[ "$cc" == *no-cache* ]] || sw=FAIL
report service-worker "$(status "$tmp/sw.h")" "${build:-no-build-id} cache-control=${cc:-none}" "$sw"

exit "$fail"
