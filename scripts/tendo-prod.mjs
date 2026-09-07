#!/usr/bin/env node
/**
 * Start the PUBLIC build of Tendo — the one shown to clients.
 *
 * Two properties make it demo-safe, and both come from being a separate
 * instance rather than a mode of the working one:
 *
 * 1. Its own data. The working app's database is snapshotted into the prod
 *    data dir with SQLite's own `VACUUM INTO`, which is consistent even while
 *    the working app is writing. A client clicking around during a demo cannot
 *    touch real threads, and a broken staging commit cannot corrupt the
 *    material being shown.
 * 2. Its own build and port. It runs whatever is checked out here with
 *    BB_MODE=prod, so developer-facing surfaces are hidden and the eye is
 *    available.
 *
 * Usage:
 *   node scripts/tendo-prod.mjs            # refresh the snapshot, then start
 *   node scripts/tendo-prod.mjs --no-sync  # start on the existing snapshot
 *   node scripts/tendo-prod.mjs --sync     # refresh the snapshot and exit
 */
import { execFileSync, spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HOME = process.env.HOME ?? "";
const SOURCE_DIR = process.env.TENDO_PROD_SOURCE ?? path.join(HOME, ".bb");
const PROD_DIR = process.env.TENDO_PROD_DATA ?? path.join(HOME, ".bb-prod");
const PORT = process.env.TENDO_PROD_PORT ?? "39886";
// Its own host daemon too: the daemon is per-instance infrastructure, and two
// of them on one port is the collision that makes "run both" fail in a way
// that looks like the app being broken rather than double-booked.
const DAEMON_PORT = process.env.TENDO_PROD_DAEMON_PORT ?? "39887";
// And the web app's own port. An instance owns EVERY port it needs: leaving one
// to the shared default is what turns "run both" into a crash that reads like a
// broken app instead of a booked port.
const APP_PORT = process.env.TENDO_PROD_APP_PORT ?? "39888";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Files that carry state the public build should inherit, beyond the database. */
const COPY_PATHS = ["plugins", "theme", "auth.json", "auth-secret", "host-id"];

function log(msg) {
  process.stdout.write(`[tendo-prod] ${msg}\n`);
}

function snapshot() {
  if (!existsSync(SOURCE_DIR)) {
    throw new Error(`no working data at ${SOURCE_DIR}`);
  }
  mkdirSync(PROD_DIR, { recursive: true });

  const sourceDb = path.join(SOURCE_DIR, "bb.db");
  const targetDb = path.join(PROD_DIR, "bb.db");
  // VACUUM INTO takes a consistent copy of a live database — no stopping the
  // working app, and no half-written WAL arriving in the demo copy. Copying
  // bb.db by hand does not have that property.
  for (const stale of [targetDb, `${targetDb}-wal`, `${targetDb}-shm`]) {
    if (existsSync(stale)) rmSync(stale);
  }
  execFileSync("sqlite3", [sourceDb, `VACUUM INTO '${targetDb}'`], {
    stdio: "inherit",
  });
  const size = statSync(targetDb).size;
  log(`database snapshotted (${(size / 1024 / 1024).toFixed(1)} MB)`);

  for (const entry of COPY_PATHS) {
    const from = path.join(SOURCE_DIR, entry);
    if (!existsSync(from)) continue;
    cpSync(from, path.join(PROD_DIR, entry), { recursive: true, force: true });
  }
  log(`carried over: ${COPY_PATHS.filter((e) => existsSync(path.join(SOURCE_DIR, e))).join(", ")}`);
}

const args = new Set(process.argv.slice(2));
if (!args.has("--no-sync")) snapshot();
if (args.has("--sync")) {
  log("snapshot only — not starting");
  process.exit(0);
}

log(`starting the public build — its own port set, data ${PROD_DIR}`);
log(`the URL is printed by the dev launcher below`);
const child = spawn("pnpm", ["dev"], {
  cwd: ROOT,
  stdio: "inherit",
  env: {
    ...process.env,
    BB_MODE: "prod",
    BB_DATA_DIR: PROD_DIR,
    // Names this instance so the dev launcher derives a port set of its own
    // instead of colliding with the working instance from the same checkout.
    BB_DEV_INSTANCE: "prod",
  },
});
child.on("exit", (code) => process.exit(code ?? 0));
