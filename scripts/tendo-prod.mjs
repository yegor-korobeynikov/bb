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

log(`starting the public build on port ${PORT}, data ${PROD_DIR}`);
const child = spawn("pnpm", ["dev"], {
  cwd: ROOT,
  stdio: "inherit",
  env: {
    ...process.env,
    BB_MODE: "prod",
    BB_DATA_DIR: PROD_DIR,
    BB_SERVER_PORT: PORT,
  },
});
child.on("exit", (code) => process.exit(code ?? 0));
