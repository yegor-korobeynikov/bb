import { execFileSync } from "node:child_process";

// Resolved once per process (a server restart is required for it to change
// anyway) and cached — this runs on every `/api/system/config` fetch, which
// the client calls on every websocket reconnect (see
// apps/app/src/lib/system-config-atoms.ts), so it must stay cheap.
let cachedBuildId: string | null = null;

/**
 * The running server's git commit, or "unknown" when the process isn't
 * running from a git checkout (e.g. an npm-installed release without a
 * .git directory). Read from `process.cwd()` — start-bb.mjs always `cd`s
 * into the repo root before exec, so no path resolution is needed here.
 */
export function resolveBuildId(): string {
  if (cachedBuildId !== null) return cachedBuildId;
  try {
    cachedBuildId = execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim();
  } catch {
    cachedBuildId = "unknown";
  }
  return cachedBuildId;
}
