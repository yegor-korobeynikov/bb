# Tendo rollback runbook

What to do when a release or deploy went wrong. One section per surface,
concrete commands, worst case first. Companion to `docs/TENDO-FORK-OPS.md`
(branch model) and `docs/bb-release-process.md` (the forward path).

Verification status of commands: everything under npm and GitHub Releases is
verified against this repo's own release process doc and workflows; the
Cloudflare section is marked where a command was not exercised from this fork.

## First move, any incident

Identify which train is bad before touching anything:

```bash
npm view bb-app version dist-tags --json           # what npm serves
gh release view desktop-latest -R yegor-korobeynikov/bb --json tagName,assets
curl -fsSL https://github.com/yegor-korobeynikov/bb/releases/download/desktop-latest/desktop-version.json
```

A release is only "done" when npm and the desktop feed report the same
version. If they disagree, the release is half-shipped — finish or roll back
BOTH; never leave the mismatch overnight (auto-update will distribute it).

## npm package

There is no un-publish for a version others may have installed (npm allows
`npm unpublish` only within 72h and it is a trap — installs break). The tool
is `deprecate` plus dist-tag movement:

```bash
# Point `latest` back at the last good version:
npm dist-tag add bb-app@<last-good> latest

# Mark the bad version so installs warn:
npm deprecate bb-app@<bad> "Broken release — use <last-good>"
```

Then ship a fixed version forward. Never re-publish the same version number —
the registry is immutable per version, same as the desktop releases.

## Desktop app

`desktop-v<version>` GitHub releases are immutable by design (the workflow
refuses to re-run onto an existing tag). Rollback = repoint the moving
`desktop-latest` alias that carries the auto-update feeds:

```bash
# See what desktop-latest currently serves:
gh release view desktop-latest -R yegor-korobeynikov/bb --json assets

# Roll the feed back: re-run the desktop workflow from the last good version.
# --ref takes a branch or tag, NOT a bare commit sha — the immutable release
# tag of the good version is exactly the ref to use:
gh workflow run build-desktop.yml -R yegor-korobeynikov/bb \
  --ref desktop-v<last-good> -f publish=true -f release_channel=stable
```

Do NOT delete `desktop-v<bad>` — immutability is the audit trail. Do not
hand-upload binaries to `desktop-latest`; unsigned or feed-inconsistent
assets are worse than a bad-but-coherent release. If macOS binaries are
missing but the feed updated, the signing secrets broke — fix secrets and
re-run rather than editing the release.

Installed apps poll the feed; once `desktop-latest` serves the good version
again, clients converge on next check. There is no forced remote downgrade —
a user who already updated to the bad build recovers on the next feed poll.

## Cloudflare (Connect / Web) — when Tendo runs its own

These surfaces are upstream's today; the fork's deploy workflows are
disabled. When Tendo stands up its own Connect/Web, this section applies.

```bash
# List recent deployments, then roll back to a known-good one:
npx wrangler deployments list          # [not exercised from this fork yet]
npx wrangler rollback                  # interactive pick; or --message "..."
```

Caveat that upstream already hit: D1 migrations are shared state — a worker
rollback does NOT undo a migration. If the bad deploy included a migration,
roll the worker back AND write a compensating migration; never edit D1 by
hand in the dashboard.

## The daily-driver app on this machine

Not a release surface, but the incident that hurts most. The launchd service
(`com.bso.bb-server`) restarts the server stack on kill — as a cold start,
losing in-memory session state, so this is Yegor's call, never an agent's.

Recovery, performed by Yegor:

```bash
# Roll the checkout the service runs from back to a good commit:
cd ~/bb-experiments/bb-source && git checkout <last-good>
launchctl kickstart -k gui/$(id -u)/com.bso.bb-server   # rebuilds on start
```

`~/.bb/` (threads, DB, worktrees — 1.4 GB) is the state that matters more
than any binary: it has no undo. `pnpm reset` deletes it wholesale. Nothing
in any rollback above requires touching it; treat any advice that does as
wrong until proven otherwise.

## After any rollback

1. Note what/why in the release section of `CHANGELOG.md` — rollbacks are
   releases too.
2. If the bad release reached the changelog/marketing site, fix
   `apps/web/src/landing/changelog.ts` alongside.
3. File the root cause before shipping the next version — a rollback without
   a diagnosis just schedules the same incident again.
