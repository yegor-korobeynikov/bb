#!/usr/bin/env bash
# Pull upstream bb into Tendo without damaging fork work.
#
# Branch model this script assumes (see docs/TENDO-FORK-OPS.md):
#   origin      = get-bb/bb            (upstream, read-only for us)
#   fork        = yegor-korobeynikov/bb (ours)
#   main (fork) = pristine mirror of origin/main — never carries fork commits.
#                 No LOCAL main is used or required: origin/main is the mirror.
#   tendo-main  = the Tendo trunk — all product work lands here
#
# What it does, in order:
#   1. Refuses to run on a dirty tree or in the live daily-driver checkout.
#   2. Fetches upstream and pushes origin/main straight to the fork's `main`
#      (so the fork's sync point stays current) — no local branch involved.
#   3. Runs the RISKY/SAFE triage (check-upstream-updates.sh) so the merge
#      is walked into with open eyes.
#   4. MERGES origin/main into tendo-main (merge, not rebase: tendo-main is
#      published; rebasing it would rewrite shared history).
#   5. On conflicts: stops and leaves the merge in progress for a human (or
#      an agent session) to resolve — it never auto-resolves.
#   6. After a clean merge: typechecks. Only then reports success. Pushing
#      is left to the operator (or the pre-push hook gate).
#
# Usage:
#   scripts/sync-upstream.sh            # full run
#   scripts/sync-upstream.sh --triage   # steps 1–3 only, no merge

set -euo pipefail
cd "$(dirname "$0")/.."

TRIAGE_ONLY=0
[ "${1:-}" = "--triage" ] && TRIAGE_ONLY=1

# -- 1. Safety rails ---------------------------------------------------------

if [ -n "$(git status --porcelain)" ]; then
  echo "sync-upstream: working tree is dirty — commit or stash first." >&2
  exit 1
fi

# The guard already answers "is a live instance serving from this checkout?"
# correctly (path.relative, pid liveness, override). Reuse it rather than
# re-implementing a weaker string-prefix check here.
if [ -f scripts/guard-live-build.mjs ]; then
  if ! node scripts/guard-live-build.mjs >/dev/null 2>&1; then
    echo "sync-upstream: a live Tendo instance runs from this checkout — sync from a worktree instead." >&2
    exit 1
  fi
fi

CURRENT=$(git branch --show-current)
if [ "$CURRENT" != "tendo-main" ]; then
  echo "sync-upstream: run from tendo-main (currently on '$CURRENT')." >&2
  exit 1
fi

# -- 2. Refresh the mirror ---------------------------------------------------

echo "Fetching upstream..."
git fetch origin main --quiet

echo "Updating the fork's mirror branch from upstream..."
# No local `main` is involved: origin/main IS the mirror. Pushing the remote-tracking
# ref straight through avoids both a divergent local branch and the case where `main`
# is checked out in another worktree (git refuses to force-update it there).
git push fork "$(git rev-parse origin/main):refs/heads/main" --quiet \
  || echo "  (mirror push failed — non-fatal, continuing)"

# -- 3. Triage ---------------------------------------------------------------

echo "Running RISKY/SAFE triage..."
bash scripts/check-upstream-updates.sh

if [ "$TRIAGE_ONLY" = 1 ]; then
  echo "Triage done (see /tmp/bb-upstream-triage.md). Merge skipped (--triage)."
  exit 0
fi

# -- 4. Merge ----------------------------------------------------------------

BEHIND=$(git rev-list --count HEAD..origin/main)
if [ "$BEHIND" = 0 ]; then
  echo "Already up to date with upstream."
  exit 0
fi

echo "Merging origin/main ($BEHIND commits) into tendo-main..."
if ! git merge origin/main --no-edit -m "merge: upstream bb $(git rev-parse --short origin/main) into tendo-main"; then
  echo ""
  echo "Merge has conflicts — this is expected on the known hotspots"
  echo "(sidebar rows, composer area, packages/db/src/data/events.ts,"
  echo "pnpm-lock.yaml — regenerate the lockfile rather than hand-merging it):"
  git diff --name-only --diff-filter=U | sed 's/^/  /'
  echo ""
  echo "Resolve, then: git merge --continue && pnpm typecheck"
  exit 2
fi

# -- 5. Verify ---------------------------------------------------------------

echo "Merge clean. Typechecking..."
pnpm typecheck
echo ""
echo "Done. Review, then push: git push fork tendo-main"
