import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  resolveBridgeWorkerProcessArgs,
  resolveBundledBridgeModulePath,
} from "./bridge-path.js";

describe("resolveBridgeWorkerProcessArgs", () => {
  let bundleDir: string;

  beforeEach(() => {
    bundleDir = mkdtempSync(join(tmpdir(), "bb-bridge-path-test-"));
  });

  afterEach(() => {
    rmSync(bundleDir, { recursive: true, force: true });
  });

  it("uses the bundle when the bridge worker file is present", () => {
    const bundleFile = join(bundleDir, "bb-provider-bridge-worker.mjs");
    writeFileSync(bundleFile, "export {};");

    const args = resolveBridgeWorkerProcessArgs({ bridgeBundleDir: bundleDir });

    expect(args).toEqual([bundleFile]);
  });

  it("falls back to the source entry when bridgeBundleDir is stale (file missing)", () => {
    // bundleDir exists but bb-provider-bridge-worker.mjs was never written into
    // it (or was cleared by an interrupted rebuild) — the boot-time decision
    // to use a bundle dir no longer matches what's on disk.
    const args = resolveBridgeWorkerProcessArgs({ bridgeBundleDir: bundleDir });

    expect(args).not.toEqual([
      join(bundleDir, "bb-provider-bridge-worker.mjs"),
    ]);
    expect(args.some((arg: string) => arg.includes("bridge-worker-entry"))).toBe(
      true,
    );
  });

  it("uses the source entry when no bridgeBundleDir is given", () => {
    const args = resolveBridgeWorkerProcessArgs({});

    expect(args.some((arg: string) => arg.includes("bridge-worker-entry"))).toBe(
      true,
    );
  });
});

describe("resolveBundledBridgeModulePath", () => {
  let bundleDir: string;

  beforeEach(() => {
    bundleDir = mkdtempSync(join(tmpdir(), "bb-bridge-path-test-"));
  });

  afterEach(() => {
    rmSync(bundleDir, { recursive: true, force: true });
  });

  it("uses the bundled module when it exists on disk", () => {
    const bundleFile = join(bundleDir, "bb-some-bridge.mjs");
    writeFileSync(bundleFile, "export {};");

    const path = resolveBundledBridgeModulePath({
      importMetaUrl: import.meta.url,
      bridgeRelativePath: "./does-not-matter.js",
      bridgeBundleDir: bundleDir,
      bundleFileName: "bb-some-bridge.mjs",
    });

    expect(path).toBe(bundleFile);
  });

  it("falls back to source resolution when the bundled file is missing", () => {
    // No file written into bundleDir — mirrors a stale/partial dist/ after an
    // interrupted rebuild. bridgeRelativePath below intentionally points at
    // this test file itself so the source-candidate existsSync check passes.
    const path = resolveBundledBridgeModulePath({
      importMetaUrl: import.meta.url,
      bridgeRelativePath: "./bridge-path.test.ts",
      bridgeBundleDir: bundleDir,
      bundleFileName: "bb-some-bridge.mjs",
    });

    expect(path.endsWith("bridge-path.test.ts")).toBe(true);
  });
});
