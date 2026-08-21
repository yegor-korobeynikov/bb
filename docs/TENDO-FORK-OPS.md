# Tendo fork operations

How this fork stays a product without losing the ability to take upstream bb
updates. Read this before touching branches, syncing upstream, or releasing.

## What Tendo is, in git terms

Tendo is a product built on a fork of [get-bb/bb](https://github.com/get-bb/bb).
Upstream moves fast (~130 commits ahead was reached within days); the fork
carries product-identity changes (branding, appId, update feeds), product
decisions upstream would not take, and tooling of its own. The whole point of
the branch model below is that these two streams stay mergeable indefinitely.

## Remotes and branches

| Name | Meaning | Rule |
|---|---|---|
| `origin` | get-bb/bb (upstream) | Read-only. Pushing or PRing here always needs Yegor's explicit yes. |
| `fork` | yegor-korobeynikov/bb | Ours. Push freely once a commit is ready. |
| `main` | Pristine mirror of `origin/main` | Never commit to it. It exists only as the sync point. |
| `tendo-main` | The Tendo trunk (fork default branch) | All product work lands here. Feature branches fork from and merge to it. |
| `design-system/*`, `feature/*` | Working branches | Short-lived; merge into `tendo-main`. |

Upstream-bound contributions are the one exception: branch them off
**`main`** (the clean mirror), not `tendo-main`, so the PR carries only the
commits upstream is being asked to take. The PR #1954 pollution incident —
fork branding riding an upstream PR because the branch was cut from mixed
history — is exactly what this rule prevents.

## Taking upstream updates

```
scripts/sync-upstream.sh --triage   # look first: RISKY/SAFE split
scripts/sync-upstream.sh            # full sync: mirror refresh + merge + typecheck
```

The script refuses to run on a dirty tree, in the live daily-driver checkout,
or on any branch other than `tendo-main`. It **merges** `origin/main` into
`tendo-main` — never rebases, because `tendo-main` is published history.
Conflicts stop the script; nothing auto-resolves.

Known conflict hotspots (upstream rewrites these areas actively):

- `apps/app/src/components/sidebar/*` — ThreadRow, ProjectRow, row classes
- `apps/app/src/views/thread-detail/ThreadDetailPromptArea.tsx` (composer)
- `packages/db/src/data/events.ts` and its test
- `pnpm-lock.yaml` — never hand-merge; take upstream's version and re-apply
  our importer entries, or regenerate with `pnpm install --lockfile-only`
- `packages/templates/src/generated/plugin-sdk-dts.generated.ts` — generated;
  regenerate instead of merging

## The live-instance rule

The daily-driver app serves `apps/app/dist` as static files **at request
time** from the checkout it was started in. Any build in that checkout swaps
the frontend under the running server and drops the user's session.

- `pnpm build` / `pnpm dev` are guarded by `scripts/guard-live-build.mjs`:
  they refuse to run in a checkout a live instance is serving from.
  `BB_ALLOW_LIVE_BUILD=1` overrides deliberately.
- Development happens in a separate worktree. Ports and the data directory
  derive from a hash of the checkout path (`packages/config/src/runtime.ts`),
  so a worktree is isolated automatically:

  ```
  git worktree add ../tendo-dev tendo-main
  cd ../tendo-dev && pnpm install && pnpm dev
  ```

- The native module (`better-sqlite3`) is per-checkout, not shared — a
  rebuild in one worktree cannot break another. Node version is pinned in
  `.nvmrc` (24.19.0) and must match the ABI the daily driver runs on.
- The **turbo cache is shared across worktrees**, so a task marked cached in
  a fresh worktree may be replaying another worktree's result. When a run's
  outcome actually matters, force it: `turbo run test --force`.
- Running two full `turbo run test` passes over the same checkout at once
  produces timeout flakes in different packages each time. Run one at a time.
- The launchd wrapper script the daily-driver `.plist`'s `ProgramArguments`
  points at (host-local, not tracked in this repo — e.g.
  `~/.local/bin/bb-server.sh`) must wait for port 38886 to actually free
  before binding, not just launch the server immediately after a kill.
  `launchctl kickstart -k` sends SIGKILL and `KeepAlive` respawns
  immediately; the OS doesn't always release the port in that gap, so the
  new process fails to bind, `KeepAlive` respawns again, and this repeats
  for 1-2s. Any thread with an open connection to the daemon during that
  window sees "host daemon disconnected" — confirmed live 2026-08-21 by
  correlating `~/.bb/logs/launchd-stderr.log`'s `EADDRINUSE` bursts against
  error-state threads' timestamps. `scripts/sync-live.mjs`'s own
  `waitForServerUp` already tolerates this (60s timeout, 1s poll, treats a
  failed `/health` fetch as "not up yet" rather than an error) — this note
  is for anyone hand-rolling their own restart wrapper outside that script.

## CI and workflows on the fork

- `ci.yml` runs on pushes to `main` and `tendo-main`, and on PRs.
- `deploy-connect.yml` / `deploy-web.yml` target **upstream's** Cloudflare
  infrastructure. They are push-triggered on `main` — on this fork they must
  stay disabled (Actions → workflow → Disable) until Tendo has its own
  Connect/Web infra with its own secrets.
- `publish-bb-app.yml` (npm + nightly) and `build-desktop.yml` are
  dispatch/cron driven; scheduled runs are disabled on forks by GitHub
  default. Releasing from this fork is **not set up yet**: the repo has no
  `npm-release` environment and none of the macOS signing secrets, and
  `bb-app` is upstream's npm name. Until that is decided, treat Tendo as
  build-and-run-locally. Recovery side: `docs/TENDO-ROLLBACK.md`.
- Desktop auto-update feeds point at this fork's releases
  (`apps/desktop/scripts/desktop-release-channel.mjs`); `TENDO_UPDATE_REPO`
  overrides for testing.

## The one sentence to remember

Upstream flows in through `main` by merge; Tendo flows out through
`tendo-main`; the two never mix except inside a reviewed merge commit.
