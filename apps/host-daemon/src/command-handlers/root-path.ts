import fs from "node:fs/promises";
import path from "node:path";
import { CommandDispatchError } from "../command-dispatch-support.js";

/** The slice of dispatch options a declared-root check needs. */
export interface DataDirOption {
  dataDir: string;
}

interface ResolveDeclaredDirectoryPathArgs {
  /**
   * The daemon's own data directory. Roots bb minted for itself live under it;
   * everything else is a directory the user pointed bb at.
   */
  dataDir: string;
  description: string;
  path: string;
}

/** True when the directory is one bb created and keeps under its own storage. */
function isBbOwnedDirectory(candidatePath: string, dataDir: string): boolean {
  const relativePath = path.relative(path.resolve(dataDir), candidatePath);
  return (
    relativePath === "" ||
    (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))
  );
}

/**
 * Resolve a declared root to the directory it really is, refusing a symlinked
 * root only where bb owns the directory.
 *
 * The refusal is about trust bb placed in its own storage: a durable workspace
 * under the data dir is minted by bb, and swapping it for a link would point
 * every command bounded by that root at someone else's tree while bb still
 * believes it is writing inside itself. A checkout the user chose carries no
 * such promise — its entry point is theirs to arrange, and a symlinked one is
 * an ordinary way to keep a single canonical copy of a directory. Resolving it
 * changes nothing about containment: callers bound their work against the
 * returned real path, so a link inside the tree still cannot lead out of it.
 */
export async function resolveDeclaredDirectoryPath(
  args: ResolveDeclaredDirectoryPathArgs,
): Promise<string> {
  const rootStat = await fs.lstat(args.path);
  if (
    rootStat.isSymbolicLink() &&
    isBbOwnedDirectory(args.path, args.dataDir)
  ) {
    throw new CommandDispatchError(
      "invalid_path",
      `${args.description} "${args.path}" must not be a symlink`,
    );
  }

  const realPath = await fs.realpath(args.path);
  const realStat = rootStat.isSymbolicLink()
    ? await fs.stat(realPath)
    : rootStat;
  if (!realStat.isDirectory()) {
    throw new CommandDispatchError(
      "invalid_path",
      `${args.description} "${args.path}" is not a directory`,
    );
  }

  return realPath;
}
