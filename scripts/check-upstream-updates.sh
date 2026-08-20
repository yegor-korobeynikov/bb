#!/bin/bash
# Upstream update triage for Yegor's fork.
#
# The fork intentionally diverges from get-bb/bb (per his 2026-08-20
# decision to build a non-engineer-facing product on bb's foundation
# without waiting on upstream review). This script answers "what changed
# upstream since we forked, and does any of it collide with our own
# customizations?" — the missing piece that made "just merge it in" unsafe
# to do blind.
#
# It does NOT merge anything. It produces a triage report:
#   - RISKY: upstream commits touching a file WE have also modified —
#     read these individually, a blind merge will likely conflict or
#     silently override our customization.
#   - SAFE: upstream commits touching only untouched files — mergeable in
#     bulk with much lower risk, still worth skimming the one-line summary.
#
# Usage: bash scripts/check-upstream-updates.sh
# Output: printed to stdout AND saved to /tmp/bb-upstream-triage.md

set -e
cd "$(dirname "$0")/.."

echo "Fetching origin (get-bb/bb upstream)..."
git fetch origin main --quiet

BASE=$(git merge-base tendo-main origin/main)
OURS_FILES=$(git diff --name-only "$BASE"..tendo-main)

OUT=/tmp/bb-upstream-triage.md
{
  echo "# Upstream triage — $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo
  echo "Fork point: $BASE"
  echo "Commits behind origin/main: $(git rev-list --count tendo-main..origin/main)"
  echo "Commits ahead (our own): $(git rev-list --count origin/main..tendo-main)"
  echo
  echo "## Our customized files (since fork point)"
  echo
  echo "$OURS_FILES" | sed 's/^/- /'
  echo
  echo "## RISKY — upstream commits touching a file we customized"
  echo
} > "$OUT"

RISKY_SHAS=()
for commit in $(git rev-list --reverse tendo-main..origin/main); do
  files=$(git show --name-only --format="" "$commit")
  collision=false
  for f in $files; do
    if echo "$OURS_FILES" | grep -qxF "$f"; then
      collision=true
      break
    fi
  done
  if [ "$collision" = true ]; then
    RISKY_SHAS+=("$commit")
    echo "- \`$commit\` $(git log -1 --format=%s "$commit")" >> "$OUT"
    for f in $files; do
      if echo "$OURS_FILES" | grep -qxF "$f"; then
        echo "  - touches our file: \`$f\`" >> "$OUT"
      fi
    done
  fi
done

{
  echo
  echo "## SAFE — upstream commits that touch none of our files"
  echo
  echo "Skim these one-liners. The RISKY commits above are excluded here, so"
  echo "this section really is the safe remainder."
  echo
  git log --reverse --format="%H|- \`%h\` %s" tendo-main..origin/main \
    | grep -v -F -f <(printf '%s\n' "${RISKY_SHAS[@]:-__none__}") \
    | cut -d'|' -f2-
} >> "$OUT"

cat "$OUT"
echo
echo "Full report saved to $OUT"
