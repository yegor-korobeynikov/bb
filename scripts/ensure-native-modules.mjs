import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const defaultRepoRoot = resolve(fileURLToPath(import.meta.url), "../..");

const nativeModules = [
  { name: "better-sqlite3", resolveFrom: "packages/db/package.json" },
];

/**
 * Refuse to touch native modules under the wrong Node major.
 *
 * The failure this prevents is not hypothetical — it burned an evening
 * (2026-08-21): a shell whose PATH resolved `node` to the system install
 * (v22) ran this script against better-sqlite3 built for the pinned v24.
 * On macOS the mismatched dlopen doesn't even reach the NODE_MODULE_VERSION
 * check — the kernel kills the verify subprocess outright
 * (`SIGKILL (Code Signature Invalid)`, CODESIGNING/"Invalid Page"; four
 * identical crash reports in ~/Library/Logs/DiagnosticReports). The script
 * then dies with an opaque signal and the old server keeps serving stale
 * dist indefinitely. And the failure mode when the kill does NOT happen is
 * worse: the "repair" path would rebuild the module for the wrong ABI,
 * breaking the running daemon that uses the pinned version.
 *
 * So: compare against .nvmrc BEFORE any dlopen and fail with the one line
 * of instruction that would have saved the evening.
 */
function assertPinnedNodeMajor(repoRoot) {
  let pinned;
  try {
    pinned = readFileSync(resolve(repoRoot, ".nvmrc"), "utf8").trim();
  } catch {
    return; // no pin, nothing to enforce
  }
  const pinnedMajor = pinned.split(".")[0];
  const runningMajor = process.versions.node.split(".")[0];
  if (pinnedMajor === runningMajor) return;
  throw new Error(
    `[ensure-native-modules] Node ${process.versions.node} (${process.execPath}) ` +
      `does not match the pinned ${pinned} (.nvmrc). Native modules here are ` +
      `built for the pinned ABI; verifying or rebuilding them under another ` +
      `major either gets SIGKILLed by macOS (Code Signature Invalid) or — ` +
      `worse — rebuilds them for the wrong ABI and breaks the running daemon. ` +
      `Fix: put the pinned Node first in PATH (e.g. ` +
      `export PATH="$HOME/.local/node${pinnedMajor}/bin:$PATH") and re-run.`,
  );
}

function formatThrownValue(err) {
  return err instanceof Error ? err.message : String(err);
}

function formatChildProcessFailure(err) {
  const details = [formatThrownValue(err).split("\n")[0]];
  if (err && typeof err === "object") {
    if ("status" in err && err.status !== null && err.status !== undefined) {
      details.push(`exit status: ${String(err.status)}`);
    }
    if ("signal" in err && err.signal !== null && err.signal !== undefined) {
      details.push(`signal: ${String(err.signal)}`);
    }

    for (const streamName of ["stdout", "stderr"]) {
      const output = err[streamName];
      if (output === undefined || output === null) continue;

      const text = Buffer.isBuffer(output)
        ? output.toString("utf8")
        : String(output);
      const trimmed = text.trim();
      if (trimmed.length > 0) {
        details.push(`${streamName}: ${trimmed}`);
      }
    }
  }

  return details.join("\n");
}

export function verifyNativeModule(name, requireModule) {
  const module = requireModule(name);
  if (name !== "better-sqlite3") {
    return;
  }

  const db = new module(":memory:");
  db.close();
}

function shouldRebuildNativeModule(errorMessage) {
  return (
    /NODE_MODULE_VERSION|Could not locate the bindings file|Module did not self-register/.test(
      errorMessage,
    )
  );
}

function getRepairedNativeModuleError(name, pkgJsonPath) {
  try {
    // A failed dlopen remains cached for the life of the process. Verify a
    // replacement binary in a fresh process so the old handle cannot poison it.
    execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "--eval",
        `import { createRequire } from "node:module";
const requireModule = createRequire(${JSON.stringify(pkgJsonPath)});
const NativeModule = requireModule(${JSON.stringify(name)});
const instance = new NativeModule(":memory:");
instance.close();`,
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    return null;
  } catch (err) {
    const message = formatChildProcessFailure(err);
    if (!shouldRebuildNativeModule(message)) throw err;
    return message;
  }
}

export function ensureNativeModules({
  repoRoot = defaultRepoRoot,
  modules = nativeModules,
  createRequire: createRequireImpl = createRequire,
  execFileSync: execFileSyncImpl = execFileSync,
  verifyRepairedNativeModule: verifyRepairedNativeModuleImpl =
    getRepairedNativeModuleError,
  log = console.log,
} = {}) {
  assertPinnedNodeMajor(repoRoot);
  for (const { name, resolveFrom } of modules) {
    const requireModule = createRequireImpl(resolve(repoRoot, resolveFrom));
    try {
      verifyNativeModule(name, requireModule);
    } catch (err) {
      const message = formatThrownValue(err);
      if (!shouldRebuildNativeModule(message)) throw err;

      const pkgJsonPath = requireModule.resolve(`${name}/package.json`);
      const pkgDir = dirname(pkgJsonPath);
      const pkgRequire = createRequireImpl(pkgJsonPath);
      log(
        `[ensure-native-modules] Installing prebuilt ${name} for Node ${process.versions.node} (ABI ${process.versions.modules})`,
      );
      let prebuildInstalled = false;
      try {
        execFileSyncImpl(
          process.execPath,
          [pkgRequire.resolve("prebuild-install/bin.js")],
          {
            cwd: pkgDir,
            encoding: "utf8",
            env: { ...process.env, npm_config_loglevel: "info" },
            stdio: ["ignore", "pipe", "pipe"],
          },
        );
        prebuildInstalled = true;
      } catch (prebuildErr) {
        const message = formatChildProcessFailure(prebuildErr);
        log(
          `[ensure-native-modules] Prebuilt ${name} unavailable or unusable: ${message}`,
        );
      }

      const prebuildVerifyError = verifyRepairedNativeModuleImpl(
        name,
        pkgJsonPath,
      );
      if (prebuildVerifyError === null) {
        if (!prebuildInstalled) {
          log(
            `[ensure-native-modules] Prebuilt ${name} loaded despite installer failure`,
          );
        }
        continue;
      }

      if (prebuildInstalled) {
        log(
          `[ensure-native-modules] Prebuilt ${name} failed to load: ${prebuildVerifyError}`,
        );
      } else {
        log(
          `[ensure-native-modules] Prebuilt ${name} still failed to load: ${prebuildVerifyError}`,
        );
      }

      log(
        `[ensure-native-modules] Rebuilding ${name} from source for Node ${process.versions.node} (ABI ${process.versions.modules})`,
      );
      execFileSyncImpl(
        process.execPath,
        [
          pkgRequire.resolve("node-gyp/bin/node-gyp.js"),
          "rebuild",
          "--release",
        ],
        {
          cwd: pkgDir,
          stdio: "inherit",
        },
      );

      const rebuildVerifyError = verifyRepairedNativeModuleImpl(
        name,
        pkgJsonPath,
      );
      if (rebuildVerifyError !== null) {
        throw new Error(
          `[ensure-native-modules] ${name} still failed to load after rebuild: ${rebuildVerifyError}`,
        );
      }
    }
  }
}

const isMainModule =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMainModule) {
  ensureNativeModules();
}
