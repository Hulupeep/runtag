#!/usr/bin/env bash
# Vercel "Ignored Build Step" (same convention as healthplus #587). Exit 0 skips the deploy, exit 1 builds.
# Conservative: build unless every changed file is documentation or agent notes. Any doubt builds.
set -u
prev="${VERCEL_GIT_PREVIOUS_SHA:-}"
if [ -z "$prev" ] || ! git cat-file -e "$prev^{commit}" 2>/dev/null; then
  echo "No previous deployed commit to compare with: building."; exit 1
fi
changed="$(git diff --name-only "$prev" HEAD 2>/dev/null)" || { echo "Diff failed: building."; exit 1; }
[ -z "$changed" ] && { echo "No file changes: building."; exit 1; }
if echo "$changed" | grep -qvE '^(docs/|PRDs/|\.claude/|\.claude-flow/|\.agents/|\.hive-mind/)|\.md$'; then
  echo "Code or config changed: building."; exit 1
fi
echo "Only documentation or agent notes changed: skipping the deploy."; exit 0
