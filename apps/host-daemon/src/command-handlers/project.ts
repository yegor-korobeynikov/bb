import fs from "node:fs/promises";
import path from "node:path";
import { runGit, WorkspaceError } from "@bb/host-workspace";
import { ExpectedCommandDispatchError } from "../command-dispatch-support.js";

const PROJECT_CLONE_TIMEOUT_MS = 20 * 60 * 1000;

function normalizeProjectSlug(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 80)
    .replace(/-+$/u, "");
  return slug || "project";
}

export function resolveProjectCloneDefaultPath(
  dataDir: string,
  projectSlug: string,
): string {
  return path.resolve(dataDir, "checkouts", normalizeProjectSlug(projectSlug));
}

async function requireEmptyOrMissingTarget(targetPath: string): Promise<void> {
  try {
    const stat = await fs.stat(targetPath);
    if (!stat.isDirectory() || (await fs.readdir(targetPath)).length > 0) {
      throw new ExpectedCommandDispatchError(
        "target_not_empty",
        `Clone target is not empty: ${targetPath}`,
      );
    }
  } catch (error) {
    if (error instanceof ExpectedCommandDispatchError) {
      throw error;
    }
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return;
    }
    throw error;
  }
}

/**
 * Canonical on-disk form of a host directory: absolute and symlink-resolved.
 *
 * A directory bb stores as a project source or an unmanaged workspace becomes
 * that workspace's identity: environments are matched by (host, path), and
 * every file command is bounded against the declared root. Both hold only when
 * the stored path is the real one — a symlinked entry point names the same
 * tree a second time, and the daemon refuses a declared root that is itself a
 * symlink, because such a root can be retargeted underneath the trust bb
 * placed in it. Resolving on the way in lets a checkout keep symlinked entry
 * points on disk while bb records the directory they point at.
 *
 * A path that does not exist yet is returned absolute and normalized: what a
 * missing directory means is the caller's decision, not this helper's.
 */
export async function canonicalizeHostDirectoryPath(
  directoryPath: string,
): Promise<string> {
  const resolvedPath = path.resolve(directoryPath);
  try {
    return await fs.realpath(resolvedPath);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return resolvedPath;
    }
    throw error;
  }
}

export async function inspectProjectPath(projectPath: string): Promise<{
  path: string;
  gitRemoteUrl: string | null;
}> {
  const resolvedPath = await canonicalizeHostDirectoryPath(projectPath);
  const result = await runGit(["remote", "get-url", "origin"], {
    cwd: resolvedPath,
    allowFailure: true,
  });
  const gitRemoteUrl = result.exitCode === 0 ? result.stdout.trim() : "";
  return {
    path: resolvedPath,
    gitRemoteUrl: gitRemoteUrl || null,
  };
}

export async function cloneProject(args: {
  dataDir: string;
  projectSlug: string;
  remoteUrl: string;
  targetPath?: string;
}): Promise<{ path: string; gitRemoteUrl: string | null }> {
  const targetPath = path.resolve(
    args.targetPath ??
      resolveProjectCloneDefaultPath(args.dataDir, args.projectSlug),
  );
  await requireEmptyOrMissingTarget(targetPath);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  try {
    await runGit(["clone", args.remoteUrl, targetPath], {
      cwd: path.dirname(targetPath),
      timeoutMs: PROJECT_CLONE_TIMEOUT_MS,
    });
  } catch (error) {
    if (error instanceof WorkspaceError) {
      throw new ExpectedCommandDispatchError(error.code, error.message);
    }
    throw error;
  }
  return inspectProjectPath(targetPath);
}
