#!/usr/bin/env node
// Read-only staleness alert: periodically checks whether the live checkout
// (default: wherever this script physically lives, i.e. bb-source once
// installed there) has fallen behind fork/tendo-main, and alerts locally.
//
// This does NOT pull, build, or restart anything — see scripts/sync-live.mjs
// for the explicit, user-run command that actually updates the live
// instance. This script only answers "is there something to sync?" on a
// schedule, the same shape as the idle-hibernation sweep in
// apps/server/src/services/system/periodic-sweeps.ts, but run out-of-process
// via launchd (docs/LIVE-DRIFT-CHECK.md) rather than inside the bb server
// itself — a drift-checker for the deploy pipeline has no business being
// deployed through that same pipeline.
//
// Usage: node scripts/check-live-drift.mjs
// State file: ~/.bb/live-drift-state.json (last alert time, last seen SHAs)
// Alert channel: macOS user notification (osascript) + stderr line, so it
// surfaces whether or not anyone is watching a terminal.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = process.env.CHECK_LIVE_DRIFT_REPO
  ? resolve(process.env.CHECK_LIVE_DRIFT_REPO)
  : resolve(scriptDir, "..");

const STATE_DIR = resolve(homedir(), ".bb");
const STATE_PATH = resolve(STATE_DIR, "live-drift-state.json");
// Re-alert at most once every 4h for the same drifted SHA, so a launchd job
// firing every 15-30min doesn't spam a notification each tick.
const REALERT_INTERVAL_MS = 4 * 60 * 60_000;

function capture(cmd, args) {
  return execFileSync(cmd, args, { cwd: repoRoot, encoding: "utf8" }).trim();
}

function readState() {
  if (!existsSync(STATE_PATH)) return {};
  try {
    return JSON.parse(readFileSync(STATE_PATH, "utf8"));
  } catch {
    return {};
  }
}

function writeState(state) {
  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

function notify(title, message) {
  try {
    execFileSync("osascript", [
      "-e",
      `display notification ${JSON.stringify(message)} with title ${JSON.stringify(title)}`,
    ]);
  } catch {
    // best-effort; the stderr line below is the reliable channel
  }
  console.error(`[${title}] ${message}`);
}

function main() {
  try {
    capture("git", ["fetch", "fork", "tendo-main"]);
  } catch (error) {
    console.error(`live-drift-check: git fetch failed, skipping this run: ${error.message}`);
    return;
  }

  const localHead = capture("git", ["rev-parse", "HEAD"]);
  const remoteHead = capture("git", ["rev-parse", "fork/tendo-main"]);

  if (localHead === remoteHead) {
    writeState({ lastCheckedAt: new Date().toISOString(), drifted: false });
    return;
  }

  const behindCount = capture("git", ["rev-list", "--count", `${localHead}..${remoteHead}`]);
  const state = readState();
  const alreadyAlertedThisSha = state.lastAlertedSha === remoteHead;
  const lastAlertedAt = state.lastAlertedAt ? new Date(state.lastAlertedAt).getTime() : 0;
  const staleAlert = Date.now() - lastAlertedAt > REALERT_INTERVAL_MS;

  if (!alreadyAlertedThisSha || staleAlert) {
    notify(
      "Tendo: live instance behind",
      `bb-source is ${behindCount} commit(s) behind fork/tendo-main. Run: pnpm sync-live`,
    );
    writeState({
      lastCheckedAt: new Date().toISOString(),
      drifted: true,
      lastAlertedSha: remoteHead,
      lastAlertedAt: new Date().toISOString(),
      behindCount: Number(behindCount),
    });
  }
}

main();
