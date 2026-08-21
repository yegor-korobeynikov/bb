#!/usr/bin/env node
// Explicit, user-run command to update the live daily-driver checkout
// (~/bb-experiments/bb-source, served by launchd job com.bso.bb-server) to
// the latest reviewed commit on fork/tendo-main.
//
// This is deliberately NOT wired to any automatic trigger. Per the standing
// session rule ("never touch the live app process without spelling out the
// exact consequence"), restarting the live server is something Yegor runs
// himself, on purpose, by typing this command.
//
// Flow: fetch fork -> compare HEAD vs fork/tendo-main -> if behind, refuse
// on a dirty tree or non-fast-forward history -> ff-only pull -> build with
// BB_ALLOW_LIVE_BUILD=1 (the guard's own deliberate override, see
// guard-live-build.mjs) -> restart the launchd job -> smoke-check /health
// with a marker-pid check -> roll back to the pre-sync commit and restart
// again if the smoke check fails.
//
// Usage: node scripts/sync-live.mjs [--dry-run]
//   --dry-run   report drift only, make no changes.

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const dryRun = process.argv.includes("--dry-run");

const LAUNCHD_LABEL = "com.bso.bb-server";
const HEALTH_URL = "http://127.0.0.1:38886/health";
const MARKER_PATH = resolve(
  process.env.BB_DATA_DIR ? resolve(process.env.BB_DATA_DIR) : resolve(homedir(), ".bb"),
  "bb-app-runtime.json",
);
const RESTART_TIMEOUT_MS = 60_000;
const RESTART_POLL_INTERVAL_MS = 1_000;

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: opts.silent ? "pipe" : "inherit",
    ...opts,
  });
  if (result.status !== 0 && !opts.allowFailure) {
    const label = [cmd, ...args].join(" ");
    throw new Error(`command failed (${result.status}): ${label}\n${result.stderr ?? ""}`);
  }
  return result;
}

function capture(cmd, args) {
  return execFileSync(cmd, args, { cwd: repoRoot, encoding: "utf8" }).trim();
}

function readMarker() {
  if (!existsSync(MARKER_PATH)) return null;
  try {
    return JSON.parse(readFileSync(MARKER_PATH, "utf8"));
  } catch {
    return null;
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitFor(predicate, timeoutMs, intervalMs) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = await predicate();
    if (value) return value;
    if (Date.now() > deadline) return null;
    await sleep(intervalMs);
  }
}

async function checkHealth() {
  try {
    const res = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return false;
    const body = await res.json();
    return body?.ok === true;
  } catch {
    return false;
  }
}

function restartServer() {
  const uid = capture("id", ["-u"]);
  console.log(`\n  Restarting launchd job ${LAUNCHD_LABEL}...`);
  run("launchctl", ["kickstart", "-k", `gui/${uid}/${LAUNCHD_LABEL}`]);
}

async function waitForServerUp(precedingPid, restartRequestedAt) {
  console.log("  Waiting for the server to come back up...");
  const ok = await waitFor(
    async () => {
      const marker = readMarker();
      if (!marker) return false;
      if (typeof marker.pid !== "number") return false;
      // A fresh restart writes a new pid, or (rarely, on a fast box) the
      // same pid recycled — cross-check startedAt moved forward too.
      const startedAt = marker.startedAt ? new Date(marker.startedAt).getTime() : 0;
      const freshEnough = startedAt >= restartRequestedAt - 2000;
      if (marker.pid === precedingPid && !freshEnough) return false;
      if (!freshEnough) return false;
      return await checkHealth();
    },
    RESTART_TIMEOUT_MS,
    RESTART_POLL_INTERVAL_MS,
  );
  return Boolean(ok);
}

async function main() {
  console.log(`Checking ${repoRoot} against fork/tendo-main...`);
  run("git", ["fetch", "fork", "tendo-main"], { silent: true });

  const localHead = capture("git", ["rev-parse", "HEAD"]);
  const remoteHead = capture("git", ["rev-parse", "fork/tendo-main"]);
  const branch = capture("git", ["rev-parse", "--abbrev-ref", "HEAD"]);

  if (localHead === remoteHead) {
    console.log(`Up to date (${localHead.slice(0, 12)}). Nothing to do.`);
    return;
  }

  const behindCount = capture("git", ["rev-list", "--count", `${localHead}..${remoteHead}`]);
  const commitLog = capture("git", [
    "log",
    "--oneline",
    `${localHead}..${remoteHead}`,
  ]);
  console.log(
    `\nLive checkout is ${behindCount} commit(s) behind fork/tendo-main:\n${commitLog}\n`,
  );

  if (dryRun) {
    console.log("--dry-run: not syncing.");
    return;
  }

  // The live checkout normally runs detached (launchd starts it at whatever
  // commit was last built, not on a tracking branch) — only refuse when it
  // IS on a named branch and that branch isn't tendo-main, since that would
  // mean someone deliberately checked out something else to test.
  if (branch !== "HEAD" && branch !== "tendo-main") {
    throw new Error(
      `Refusing to sync: live checkout is on branch '${branch}', expected 'tendo-main' ` +
        `(or detached). Resolve manually.`,
    );
  }

  const dirty = capture("git", ["status", "--porcelain"]);
  if (dirty) {
    throw new Error(
      "Refusing to sync: working tree is dirty. Commit, stash, or discard changes first:\n" +
        dirty,
    );
  }

  // fast-forward-only: if the live checkout has diverged (local commits not
  // on fork/tendo-main), this is not a routine sync — stop and let a human
  // look, rather than silently rewriting history in the live checkout.
  const mergeBase = capture("git", ["merge-base", localHead, remoteHead]);
  if (mergeBase !== localHead) {
    throw new Error(
      "Refusing to sync: local HEAD is not an ancestor of fork/tendo-main " +
        "(history has diverged). This needs manual resolution, not an automated sync.",
    );
  }

  const markerBefore = readMarker();
  const precedingPid = markerBefore?.pid ?? null;
  const previousHead = localHead;

  console.log(`Pulling ${localHead.slice(0, 12)} -> ${remoteHead.slice(0, 12)} (fast-forward)...`);
  run("git", ["merge", "--ff-only", "fork/tendo-main"]);

  const lockfileChanged = capture("git", [
    "diff",
    "--name-only",
    previousHead,
    remoteHead,
    "--",
    "pnpm-lock.yaml",
  ]);
  if (lockfileChanged) {
    console.log("\npnpm-lock.yaml changed — running pnpm install...");
    run("pnpm", ["install", "--frozen-lockfile"]);
  }

  console.log("\nBuilding (BB_ALLOW_LIVE_BUILD=1)...");
  const buildResult = run("pnpm", ["run", "build"], {
    allowFailure: true,
    env: { ...process.env, BB_ALLOW_LIVE_BUILD: "1" },
  });

  if (buildResult.status !== 0) {
    console.error("\nBuild failed. Rolling back to previous commit...");
    await rollback(previousHead, precedingPid);
    process.exitCode = 1;
    return;
  }

  const restartRequestedAt = Date.now();
  restartServer();
  const healthy = await waitForServerUp(precedingPid, restartRequestedAt);

  if (!healthy) {
    console.error(
      `\nSmoke check failed: /health did not return {ok:true} from a fresh process ` +
        `within ${RESTART_TIMEOUT_MS / 1000}s. Rolling back to previous commit...`,
    );
    await rollback(previousHead, precedingPid);
    process.exitCode = 1;
    return;
  }

  console.log(
    `\nSynced live checkout to ${remoteHead.slice(0, 12)} and verified /health. Done.`,
  );
}

async function rollback(previousHead, precedingPid) {
  run("git", ["reset", "--hard", previousHead]);
  console.log("Rebuilding previous commit (BB_ALLOW_LIVE_BUILD=1)...");
  const rebuild = run("pnpm", ["run", "build"], {
    allowFailure: true,
    env: { ...process.env, BB_ALLOW_LIVE_BUILD: "1" },
  });
  if (rebuild.status !== 0) {
    console.error(
      "\nROLLBACK BUILD ALSO FAILED. The live checkout is now in a broken build " +
        "state at the previous commit. This needs manual intervention — do not " +
        "leave it unattended.",
    );
    return;
  }
  const restartRequestedAt = Date.now();
  restartServer();
  const healthy = await waitForServerUp(precedingPid, restartRequestedAt);
  if (healthy) {
    console.log(`Rolled back to ${previousHead.slice(0, 12)} and verified /health.`);
  } else {
    console.error(
      "\nROLLBACK RESTART DID NOT PASS THE SMOKE CHECK EITHER. Live instance state " +
        "is uncertain — check manually: curl " +
        HEALTH_URL,
    );
  }
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exitCode = 1;
});
