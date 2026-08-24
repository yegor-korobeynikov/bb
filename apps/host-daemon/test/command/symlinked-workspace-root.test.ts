import fs from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { dispatchOnlineRpcCommand } from "../../src/command-dispatch.js";
import {
  cleanupTempDirs,
  createHarness,
  makeTempDir,
} from "./dispatch-helpers.js";

afterEach(cleanupTempDirs);

/**
 * A declared root that is itself a symlink is refused only where bb owns the
 * directory. The refusal exists so the durable workspace bb mints under its
 * own data dir cannot be swapped for a link pointing somewhere else after bb
 * decided to trust it. A checkout the user pointed bb at carries no such
 * expectation — its entry point is the user's to arrange — so the daemon
 * resolves it and keeps bounding the command against the resolved directory.
 */
describe("a workspace root reached through a symlink", () => {
  it("reads a file through a symlinked project root", async () => {
    const tempDir = await makeTempDir("bb-symlink-root-read-");
    const dataDir = path.join(tempDir, "data");
    const targetRoot = path.join(tempDir, "checkout");
    const symlinkRoot = path.join(tempDir, "checkout-link");
    await fs.mkdir(dataDir);
    await fs.mkdir(targetRoot);
    await fs.writeFile(path.join(targetRoot, "AGENTS.md"), "project rules");
    await fs.symlink(targetRoot, symlinkRoot);

    const harness = createHarness();
    const result = await dispatchOnlineRpcCommand(
      {
        type: "host.read_file",
        path: path.join(symlinkRoot, "AGENTS.md"),
        rootPath: symlinkRoot,
      },
      harness.dispatchOptions({ dataDir }),
    );

    expect(result.content).toBe("project rules");
    // The link is a way in, not a thing bb rewrites.
    expect((await fs.lstat(symlinkRoot)).isSymbolicLink()).toBe(true);
  });

  it("lists files through a symlinked project root", async () => {
    const tempDir = await makeTempDir("bb-symlink-root-list-");
    const dataDir = path.join(tempDir, "data");
    const targetRoot = path.join(tempDir, "checkout");
    const symlinkRoot = path.join(tempDir, "checkout-link");
    await fs.mkdir(dataDir);
    await fs.mkdir(targetRoot);
    await fs.writeFile(path.join(targetRoot, "notes.txt"), "hello");
    await fs.symlink(targetRoot, symlinkRoot);

    const harness = createHarness();
    const result = await dispatchOnlineRpcCommand(
      {
        type: "host.list_files",
        path: symlinkRoot,
        limit: 1000,
      },
      harness.dispatchOptions({ dataDir }),
    );

    expect(result.files.map((file) => file.path)).toContain("notes.txt");
  });

  it("still refuses a symlinked root inside bb's own data dir", async () => {
    const tempDir = await makeTempDir("bb-symlink-root-datadir-");
    const dataDir = path.join(tempDir, "data");
    const outsideRoot = path.join(tempDir, "elsewhere");
    const trustedRoot = path.join(dataDir, "workspace", "thread-1");
    await fs.mkdir(path.join(dataDir, "workspace"), { recursive: true });
    await fs.mkdir(outsideRoot);
    await fs.writeFile(path.join(outsideRoot, "secrets.txt"), "not bb's");
    await fs.symlink(outsideRoot, trustedRoot);

    const harness = createHarness();
    await expect(
      dispatchOnlineRpcCommand(
        {
          type: "host.read_file",
          path: path.join(trustedRoot, "secrets.txt"),
          rootPath: trustedRoot,
        },
        harness.dispatchOptions({ dataDir }),
      ),
    ).rejects.toMatchObject({
      code: "invalid_path",
      message: expect.stringContaining("must not be a symlink"),
    });
  });

  it("keeps containment against the directory the root resolves to", async () => {
    const tempDir = await makeTempDir("bb-symlink-root-escape-");
    const dataDir = path.join(tempDir, "data");
    const targetRoot = path.join(tempDir, "checkout");
    const symlinkRoot = path.join(tempDir, "checkout-link");
    const outsideFile = path.join(tempDir, "outside.txt");
    await fs.mkdir(dataDir);
    await fs.mkdir(targetRoot);
    await fs.writeFile(outsideFile, "outside");
    await fs.symlink(outsideFile, path.join(targetRoot, "escape.txt"));
    await fs.symlink(targetRoot, symlinkRoot);

    const harness = createHarness();
    await expect(
      dispatchOnlineRpcCommand(
        {
          type: "host.read_file",
          path: path.join(symlinkRoot, "escape.txt"),
          rootPath: symlinkRoot,
        },
        harness.dispatchOptions({ dataDir }),
      ),
    ).rejects.toMatchObject({
      code: "invalid_path",
      message: expect.stringContaining("escapes read root"),
    });
  });
});
