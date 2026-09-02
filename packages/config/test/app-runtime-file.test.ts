import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  claimBbAppRuntimeFile,
  clearOwnBbAppRuntimeFile,
  readBbAppRuntimeFile,
} from "../src/app-runtime-file.js";
import {
  parseElapsedSeconds,
  stopVerifiedProcess,
  type VerifiedProcessOps,
} from "../src/verified-process-stop.js";

const tempDirs: string[] = [];

async function createDataDir(): Promise<string> {
  const dataDir = await mkdtemp(join(tmpdir(), "bb-runtime-file-"));
  tempDirs.push(dataDir);
  return dataDir;
}

// Kept close to "now" so it lines up with aliveMatchingOps' fixed 60s
// elapsed time — the identity check compares this against `Date.now() -
// elapsedSeconds`, so a fixed historical timestamp would itself look like a
// start-time mismatch.
const RECORDED_STARTED_AT = new Date(Date.now() - 60_000).toISOString();

function recordFor(dataDir: string, pid: number) {
  return {
    dataDir,
    entryPath: "/opt/bb/bb-app.js",
    pid,
    serverUrl: "http://127.0.0.1:38886",
    startedAt: RECORDED_STARTED_AT,
    surface: "web",
    version: "0.34.0",
  };
}

afterEach(async () => {
  while (tempDirs.length > 0) {
    const dataDir = tempDirs.pop();
    if (dataDir !== undefined) {
      await rm(dataDir, { force: true, recursive: true });
    }
  }
});

function aliveMatchingOps(
  overrides: Partial<VerifiedProcessOps> = {},
): VerifiedProcessOps {
  return {
    isRunning: () => true,
    kill: () => undefined,
    readCommand: async () => "node /opt/bb/bb-app.js start",
    readElapsedSeconds: async () => 60,
    waitForExit: async () => true,
    ...overrides,
  };
}

describe("claimBbAppRuntimeFile", () => {
  it("refuses to overwrite a record whose launcher still runs", async () => {
    const dataDir = await createDataDir();
    await claimBbAppRuntimeFile({
      ...recordFor(dataDir, 1_111),
      processOps: aliveMatchingOps(),
    });

    await expect(
      claimBbAppRuntimeFile({
        ...recordFor(dataDir, 2_222),
        processOps: aliveMatchingOps(),
      }),
    ).resolves.toBe(false);
    // The live launcher keeps the record, so `bb-app stop` can still find it.
    await expect(readBbAppRuntimeFile(dataDir)).resolves.toMatchObject({
      pid: 1_111,
    });
  });

  it("replaces a record whose launcher is gone", async () => {
    const dataDir = await createDataDir();
    await claimBbAppRuntimeFile({
      ...recordFor(dataDir, 1_111),
      processOps: aliveMatchingOps(),
    });

    await expect(
      claimBbAppRuntimeFile({
        ...recordFor(dataDir, 2_222),
        processOps: aliveMatchingOps({ isRunning: () => false }),
      }),
    ).resolves.toBe(true);
    await expect(readBbAppRuntimeFile(dataDir)).resolves.toMatchObject({
      pid: 2_222,
    });
  });

  it("replaces a record whose PID answers but was reused by an unrelated process", async () => {
    // Regression for the desktop-app startup incident: a dead launcher's PID
    // gets reused (macOS PID recycling) by something else entirely, so a bare
    // `kill(pid, 0)` liveness check reports "alive" even though the recorded
    // bb launcher is long gone. Without a command-line/start-time check this
    // wrongly blocked reclaim and drove the app into an EADDRINUSE loop.
    const dataDir = await createDataDir();
    await claimBbAppRuntimeFile({
      ...recordFor(dataDir, 1_111),
      processOps: aliveMatchingOps(),
    });

    await expect(
      claimBbAppRuntimeFile({
        ...recordFor(dataDir, 2_222),
        processOps: aliveMatchingOps({
          // isRunning() still says "yes" (PID reused), but the command line
          // is no longer bb-app's.
          readCommand: async () => "/usr/bin/some-unrelated-process",
        }),
      }),
    ).resolves.toBe(true);
    await expect(readBbAppRuntimeFile(dataDir)).resolves.toMatchObject({
      pid: 2_222,
    });
  });

  it("replaces a record whose PID matches by name but not by start time", async () => {
    const dataDir = await createDataDir();
    await claimBbAppRuntimeFile({
      ...recordFor(dataDir, 1_111),
      processOps: aliveMatchingOps(),
    });

    await expect(
      claimBbAppRuntimeFile({
        ...recordFor(dataDir, 2_222),
        // Command name matches (recycled pid could plausibly be another bb),
        // but it started an hour ago — well outside the record's timestamp.
        processOps: aliveMatchingOps({ readElapsedSeconds: async () => 3_600 }),
      }),
    ).resolves.toBe(true);
    await expect(readBbAppRuntimeFile(dataDir)).resolves.toMatchObject({
      pid: 2_222,
    });
  });
});

describe("clearOwnBbAppRuntimeFile", () => {
  it("leaves a record that belongs to another launcher", async () => {
    const dataDir = await createDataDir();
    await claimBbAppRuntimeFile({
      ...recordFor(dataDir, 1_111),
      processOps: aliveMatchingOps(),
    });

    await expect(
      clearOwnBbAppRuntimeFile({ dataDir, pid: 2_222 }),
    ).resolves.toBe(false);
    await expect(readBbAppRuntimeFile(dataDir)).resolves.not.toBeNull();
  });

  it("removes its own record", async () => {
    const dataDir = await createDataDir();
    await claimBbAppRuntimeFile({
      ...recordFor(dataDir, 1_111),
      processOps: aliveMatchingOps(),
    });

    await expect(
      clearOwnBbAppRuntimeFile({ dataDir, pid: 1_111 }),
    ).resolves.toBe(true);
    await expect(readBbAppRuntimeFile(dataDir)).resolves.toBeNull();
  });
});

describe("parseElapsedSeconds", () => {
  it("reads every ps etime shape", () => {
    expect(parseElapsedSeconds("00:05")).toBe(5);
    expect(parseElapsedSeconds("30:00")).toBe(1_800);
    expect(parseElapsedSeconds("2:03:04")).toBe(7_384);
    expect(parseElapsedSeconds("13-16:51:17")).toBe(1_183_877);
    expect(parseElapsedSeconds("  01:00 ")).toBe(60);
    expect(parseElapsedSeconds("nonsense")).toBeNull();
    expect(parseElapsedSeconds("")).toBeNull();
  });
});

describe("stopVerifiedProcess", () => {
  function createOps(
    overrides: Partial<VerifiedProcessOps> = {},
  ): VerifiedProcessOps {
    return {
      isRunning: () => true,
      kill: () => undefined,
      readCommand: async () => "node /opt/bb/bb-app.js start",
      readElapsedSeconds: async () => 60,
      waitForExit: async () => true,
      ...overrides,
    };
  }

  const startedAt = new Date(Date.now() - 60_000).toISOString();

  it("reports still-running when the process survives SIGKILL", async () => {
    await expect(
      stopVerifiedProcess({
        killTimeoutMs: 10,
        pid: 4_242,
        processOps: createOps({ waitForExit: async () => false }),
        signal: "SIGTERM",
        startedAt,
        timeoutMs: 10,
        verifyTokens: ["bb-app.js"],
      }),
    ).resolves.toEqual({ kind: "still-running" });
  });

  it("refuses a process whose start time contradicts the record", async () => {
    const result = await stopVerifiedProcess({
      killTimeoutMs: 10,
      pid: 4_242,
      // A recycled pid: same command name, but it started two days ago.
      processOps: createOps({ readElapsedSeconds: async () => 172_800 }),
      signal: "SIGTERM",
      startedAt,
      timeoutMs: 10,
      verifyTokens: ["bb-app.js"],
    });

    expect(result).toMatchObject({ kind: "unverified", reason: "start-time" });
  });

  it("refuses when the start time cannot be read at all", async () => {
    const result = await stopVerifiedProcess({
      killTimeoutMs: 10,
      pid: 4_242,
      processOps: createOps({ readElapsedSeconds: async () => null }),
      signal: "SIGTERM",
      startedAt,
      timeoutMs: 10,
      verifyTokens: ["bb-app.js"],
    });

    expect(result).toMatchObject({ kind: "unverified", reason: "start-time" });
  });
});
