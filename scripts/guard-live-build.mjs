#!/usr/bin/env node
// Refuse to build inside the checkout a running Tendo instance is serving from.
//
// The daily driver runs `scripts/start-bb.mjs` from a source checkout and then
// serves `apps/app/dist` as static files at request time. A `turbo run build`
// in that same checkout rewrites the bundle under the live server: the next
// page load hands the user a freshly-built frontend against a server that
// booted on the old one. That is what drops a working session, and it happens
// with no error anywhere.
//
// start-bb.mjs spawns turbo directly rather than going through the npm script,
// so guarding the npm script here does not affect app startup — only a human
// (or agent) typing `pnpm build` / `pnpm dev` in the wrong directory.
//
// Escape hatch: BB_ALLOW_LIVE_BUILD=1 for the deliberate "rebuild the daily
// driver now" case.

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

if (process.env.BB_ALLOW_LIVE_BUILD === "1") {
  process.exit(0);
}

const dataDir = process.env.BB_DATA_DIR
  ? resolve(process.env.BB_DATA_DIR)
  : resolve(homedir(), ".bb");
const markerPath = resolve(dataDir, "bb-app-runtime.json");

if (!existsSync(markerPath)) {
  process.exit(0);
}

let marker;
try {
  marker = JSON.parse(readFileSync(markerPath, "utf8"));
} catch {
  // An unreadable or half-written marker is not evidence of a live instance.
  process.exit(0);
}

const entryPath = typeof marker.entryPath === "string" ? marker.entryPath : "";
const pid = Number.isInteger(marker.pid) ? marker.pid : null;

if (!entryPath || pid === null) {
  process.exit(0);
}

// Is the running instance serving from THIS checkout?
const rel = relative(repoRoot, resolve(entryPath));
const servesFromHere = rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
if (!servesFromHere) {
  process.exit(0);
}

// Is it actually still alive? A stale marker must not block anything.
let alive = false;
try {
  process.kill(pid, 0);
  alive = true;
} catch (error) {
  alive = error?.code === "EPERM";
}

if (!alive) {
  process.exit(0);
}

const started = marker.startedAt ? ` (up since ${marker.startedAt})` : "";
process.stderr.write(
  [
    "",
    "  Refusing to build here: a Tendo instance is running from this checkout.",
    "",
    `    checkout : ${repoRoot}`,
    `    live pid : ${pid}${started}`,
    `    serving  : ${resolve(repoRoot, "apps/app/dist")}`,
    "",
    "  Building would rewrite the frontend bundle that the running server is",
    "  handing out, so the next page load mixes a new UI with an old server.",
    "  That is what silently drops a working session.",
    "",
    "  Do development in a separate checkout instead — a git worktree gets its",
    "  own ports and data directory automatically, derived from its path:",
    "",
    "    git worktree add ../tendo-dev tendo-main",
    "    cd ../tendo-dev && pnpm install && pnpm dev",
    "",
    "  To rebuild the daily driver on purpose, knowing it interrupts the app:",
    "",
    "    BB_ALLOW_LIVE_BUILD=1 pnpm build",
    "",
  ].join("\n"),
);
process.exit(1);
