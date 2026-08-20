#!/usr/bin/env node
// Refuse to build inside the checkout a running Tendo instance is serving from.
//
// The daily driver runs `scripts/start-bb.mjs` from a source checkout and then
// serves `apps/app/dist` as static files at request time. A build in that same
// checkout rewrites the bundle under the live server: the next page load hands
// the user a freshly-built frontend against a server that booted on the old
// one. That is what drops a working session, and it happens with no error.
//
// Two entry points reach a build, and BOTH are guarded:
//   - `pnpm build` — the obvious one.
//   - `pnpm start` / `scripts/start-bb.mjs` — builds runtime artifacts BEFORE
//     it touches the port, so a second start in the live checkout clobbers
//     dist and only then dies on the port collision. This is the path a
//     non-developer is most likely to take ("restart the app").
// `pnpm dev` is deliberately NOT guarded: it runs vite, never writes
// apps/app/dist, and gets its own data dir and ports.
//
// Escape hatch: BB_ALLOW_LIVE_BUILD=1 for the deliberate "rebuild the daily
// driver now, I know it interrupts the app" case.

import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));

/**
 * Is a live Tendo instance serving from `repoRoot`?
 * Returns the marker record when yes, otherwise null. Fails OPEN: anything
 * ambiguous (missing/corrupt marker, unreadable process table) returns null,
 * because wrongly refusing a build is worse than the risk it guards.
 */
export function detectLiveInstanceInCheckout(repoRoot) {
  if (process.env.BB_ALLOW_LIVE_BUILD === "1") return null;

  const dataDir = process.env.BB_DATA_DIR
    ? resolve(process.env.BB_DATA_DIR)
    : resolve(homedir(), ".bb");
  const markerPath = resolve(dataDir, "bb-app-runtime.json");
  if (!existsSync(markerPath)) return null;

  let marker;
  try {
    marker = JSON.parse(readFileSync(markerPath, "utf8"));
  } catch {
    return null;
  }

  const entryPath = typeof marker.entryPath === "string" ? marker.entryPath : "";
  const pid = Number.isInteger(marker.pid) ? marker.pid : null;
  if (!entryPath || pid === null) return null;

  // Is the recorded instance serving from THIS checkout? path.relative
  // normalises symlinks-free logical paths and the /tmp vs /private/tmp case
  // that a string-prefix match would miss.
  const rel = relative(repoRoot, resolve(entryPath));
  if (rel === "" || rel.startsWith("..") || isAbsolute(rel)) return null;

  // Never block on our own process (start-bb re-reads its own marker).
  if (pid === process.pid) return null;

  // Is it still alive? A stale marker must not block anything.
  let alive = false;
  try {
    process.kill(pid, 0);
    alive = true;
  } catch (error) {
    alive = error?.code === "EPERM";
  }
  if (!alive) return null;

  // packages/config/src/app-runtime-file.ts warns that a pid alone does not
  // establish identity — a recycled pid would block every build in this
  // checkout with no discoverable cause. Cross-check the recorded start time
  // against the process's actual start time before believing the marker.
  if (typeof marker.startedAt === "string") {
    try {
      const lstart = execFileSync("ps", ["-o", "lstart=", "-p", String(pid)], {
        encoding: "utf8",
      }).trim();
      if (lstart) {
        const actual = new Date(lstart).getTime();
        const recorded = new Date(marker.startedAt).getTime();
        // The comparison is DIRECTIONAL, not a symmetric window. start-bb
        // builds runtime artifacts before it writes the marker, so `recorded`
        // trails the real process start by however long the build took —
        // measured at ~21s on this machine, and unbounded on a cold cache.
        // A recycled pid shows the opposite sign: the new process started
        // well AFTER the old instance wrote the marker. Only that direction
        // means "not our instance".
        if (
          Number.isFinite(actual) &&
          Number.isFinite(recorded) &&
          actual - recorded > 5000
        ) {
          return null; // recycled pid, not our instance
        }
      }
    } catch {
      // ps unavailable or refused — fall through and trust the pid.
    }
  }

  return { pid, entryPath, startedAt: marker.startedAt };
}

export function formatRefusal(repoRoot, live, invokedAs) {
  const started = live.startedAt ? ` (up since ${live.startedAt})` : "";
  return [
    "",
    `  Refusing to ${invokedAs}: a Tendo instance is running from this checkout.`,
    "",
    `    checkout : ${repoRoot}`,
    `    live pid : ${live.pid}${started}`,
    `    serving  : ${resolve(repoRoot, "apps/app/dist")}`,
    "",
    "  Building here would rewrite the frontend bundle that the running server",
    "  is handing out, so the next page load mixes a new UI with an old server.",
    "  That is what silently drops a working session.",
    "",
    "  Do development in a separate checkout — a git worktree gets its own",
    "  ports and data directory automatically, derived from its path:",
    "",
    "    git worktree add ../tendo-dev tendo-main",
    "    cd ../tendo-dev && pnpm install && pnpm dev",
    "",
    "  To rebuild the daily driver on purpose, knowing it interrupts the app:",
    "",
    "    BB_ALLOW_LIVE_BUILD=1 pnpm build",
    "",
  ].join("\n");
}

// CLI mode: used as a `&&` prefix on the build script.
if (process.argv[1] && resolve(process.argv[1]) === resolve(scriptDir, "guard-live-build.mjs")) {
  const repoRoot = resolve(scriptDir, "..");
  const live = detectLiveInstanceInCheckout(repoRoot);
  if (live) {
    process.stderr.write(formatRefusal(repoRoot, live, "build"));
    process.exit(1);
  }
  process.exit(0);
}
