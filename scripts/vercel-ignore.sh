#!/usr/bin/env bash
# META {"type":"build.guard","purpose":"Skip documentation builds; build on uncertain history"}
# exit 0 = skip build, exit 1 = build
REF="$VERCEL_GIT_COMMIT_REF"; PREV="$VERCEL_GIT_PREVIOUS_SHA"
[ "$VERCEL_ENV" = "production" ] && [ -z "$PREV" ] && exit 1
cd "$(git rev-parse --show-toplevel 2>/dev/null)" || exit 1
case "$REF" in docs/*|chore/docs*|review/*|evidence/*|spec/*) exit 0;; esac
[ -z "$PREV" ] && exit 1
cd "$(git rev-parse --show-toplevel 2>/dev/null)" || exit 1
git cat-file -e "$PREV" 2>/dev/null || git fetch --depth=200 origin "$PREV" 2>/dev/null || exit 1
git diff --quiet "$PREV" HEAD -- . ':!docs' ':!**/*.md' ':!.specflow' ':!evidence' ':!.claude' && exit 0
exit 1
