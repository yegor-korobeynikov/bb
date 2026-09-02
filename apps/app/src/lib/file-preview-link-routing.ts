import type {
  MarkdownLinkRouting,
  MarkdownLocalFileLinkRouting,
} from "@/components/ui/markdown-link-routing";
import type { MarkdownPreviewLinkHandler } from "@/components/ui/markdown-link";
import type { MarkdownPreviewLocalFileLinkHandler } from "@/components/ui/markdown-local-file-link";
import { isAbsoluteFilePathWithinRoot } from "./absolute-file-path";

interface FilePreviewLinkRoutingHandlers {
  onOpenLink: MarkdownPreviewLinkHandler;
  onOpenLocalFileLink: MarkdownPreviewLocalFileLinkHandler;
}

interface ContainedFilePreviewLinkRoutingArgs extends FilePreviewLinkRoutingHandlers {
  /** Absolute directory of the previewed file; relative links resolve here. */
  baseDir: string | undefined;
  rootPath: string | null | undefined;
}

interface HostFilePreviewLinkRoutingArgs extends FilePreviewLinkRoutingHandlers {
  baseDir: string | undefined;
  threadStorageRootPath: string | null;
  workspaceRootPath: string | null;
}

/**
 * Routing for previews whose files are known to live under one root
 * (workspace, thread storage). Links that escape the root stay ordinary
 * markdown links.
 */
export function buildContainedFilePreviewLinkRouting({
  baseDir,
  onOpenLink,
  onOpenLocalFileLink,
  rootPath,
}: ContainedFilePreviewLinkRoutingArgs): MarkdownLinkRouting {
  if (rootPath === null || rootPath === undefined) {
    return {
      onOpenLink,
    };
  }

  const localFile: MarkdownLocalFileLinkRouting = {
    absoluteLinks: {
      kind: "contained",
      rootPath,
    },
    onOpenLink: onOpenLocalFileLink,
  };
  if (baseDir !== undefined) {
    localFile.relativeLinks = {
      baseDir,
      rootPath,
    };
  }

  return {
    localFile,
    onOpenLink,
  };
}

/**
 * Routing for the host file preview, which already renders an arbitrary path
 * on the host. When the previewed file sits inside the workspace or thread
 * storage the tighter contained routing applies; otherwise links resolve
 * against the file's own directory under trusted-host rules — the same trust
 * the timeline grants host paths. Dropping local routing here was what sent
 * links inside such a preview to the browser instead of the panel.
 */
export function buildHostFilePreviewLinkRouting({
  baseDir,
  onOpenLink,
  onOpenLocalFileLink,
  threadStorageRootPath,
  workspaceRootPath,
}: HostFilePreviewLinkRoutingArgs): MarkdownLinkRouting {
  const containedRootPath = resolveContainedRootPath({
    baseDir,
    threadStorageRootPath,
    workspaceRootPath,
  });
  if (containedRootPath !== null) {
    return buildContainedFilePreviewLinkRouting({
      baseDir,
      onOpenLink,
      onOpenLocalFileLink,
      rootPath: containedRootPath,
    });
  }

  const localFile: MarkdownLocalFileLinkRouting = {
    absoluteLinks: {
      kind: "trusted-host",
    },
    onOpenLink: onOpenLocalFileLink,
  };
  if (baseDir !== undefined) {
    localFile.relativeLinks = {
      baseDir,
      // The host filesystem is the containing root: the preview reached this
      // file by absolute host path, so its siblings are equally reachable.
      rootPath: "/",
    };
  }

  return {
    localFile,
    onOpenLink,
  };
}

function resolveContainedRootPath({
  baseDir,
  threadStorageRootPath,
  workspaceRootPath,
}: Omit<HostFilePreviewLinkRoutingArgs, keyof FilePreviewLinkRoutingHandlers>):
  | string
  | null {
  if (baseDir === undefined) {
    return null;
  }

  if (
    workspaceRootPath !== null &&
    isAbsoluteFilePathWithinRoot({
      candidatePath: baseDir,
      rootPath: workspaceRootPath,
    })
  ) {
    return workspaceRootPath;
  }

  if (
    threadStorageRootPath !== null &&
    isAbsoluteFilePathWithinRoot({
      candidatePath: baseDir,
      rootPath: threadStorageRootPath,
    })
  ) {
    return threadStorageRootPath;
  }

  return null;
}
