// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MarkdownPreview } from "@/components/ui/markdown-preview";
import {
  buildContainedFilePreviewLinkRouting,
  buildHostFilePreviewLinkRouting,
} from "./file-preview-link-routing";

afterEach(cleanup);

const HOST_BASE_DIR = "/Users/person/Notes/project";

function renderWithRouting(
  content: string,
  routing: ReturnType<typeof buildHostFilePreviewLinkRouting>,
) {
  render(<MarkdownPreview content={content} linkRouting={routing} />);
}

describe("buildHostFilePreviewLinkRouting", () => {
  it("keeps a host preview outside every root routing its links to the panel", () => {
    const onOpenLocalFileLink = vi.fn(() => true);
    const onOpenLink = vi.fn(() => true);
    const routing = buildHostFilePreviewLinkRouting({
      baseDir: HOST_BASE_DIR,
      onOpenLink,
      onOpenLocalFileLink,
      threadStorageRootPath: "/Users/person/.bb/thread-storage/thr_1",
      workspaceRootPath: "/Users/person/.bb/worktrees/env_1/repo",
    });

    renderWithRouting("See [notes](notes/todo.md).", routing);
    const link = screen.getByRole("link", { name: /notes/ });
    expect(link.getAttribute("href")).toBe(
      `file://${HOST_BASE_DIR}/notes/todo.md`,
    );

    fireEvent.click(link);
    expect(onOpenLocalFileLink).toHaveBeenCalledWith({
      lineRange: null,
      path: `${HOST_BASE_DIR}/notes/todo.md`,
    });
    expect(onOpenLink).not.toHaveBeenCalled();
  });

  it("resolves an encoded relative path and a line suffix", () => {
    const onOpenLocalFileLink = vi.fn(() => true);
    const routing = buildHostFilePreviewLinkRouting({
      baseDir: HOST_BASE_DIR,
      onOpenLink: vi.fn(() => true),
      onOpenLocalFileLink,
      threadStorageRootPath: null,
      workspaceRootPath: null,
    });

    renderWithRouting("See [notes](Home%20space/todo.md#L4).", routing);
    fireEvent.click(screen.getByRole("link", { name: /notes/ }));
    expect(onOpenLocalFileLink).toHaveBeenCalledWith({
      lineRange: { endLineNumber: 4, startLineNumber: 4 },
      path: `${HOST_BASE_DIR}/Home space/todo.md`,
    });
  });

  it("still routes absolute host paths to the panel", () => {
    const onOpenLocalFileLink = vi.fn(() => true);
    const routing = buildHostFilePreviewLinkRouting({
      baseDir: HOST_BASE_DIR,
      onOpenLink: vi.fn(() => true),
      onOpenLocalFileLink,
      threadStorageRootPath: null,
      workspaceRootPath: null,
    });

    renderWithRouting("See [notes](/Users/person/elsewhere/todo.md).", routing);
    fireEvent.click(screen.getByRole("link", { name: /notes/ }));
    expect(onOpenLocalFileLink).toHaveBeenCalledWith({
      lineRange: null,
      path: "/Users/person/elsewhere/todo.md",
    });
  });

  it("leaves external links to the browser", () => {
    const onOpenLocalFileLink = vi.fn(() => true);
    const onOpenLink = vi.fn(() => true);
    const routing = buildHostFilePreviewLinkRouting({
      baseDir: HOST_BASE_DIR,
      onOpenLink,
      onOpenLocalFileLink,
      threadStorageRootPath: null,
      workspaceRootPath: null,
    });

    renderWithRouting("See [docs](https://example.com/todo.md).", routing);
    const link = screen.getByRole("link", { name: /docs/ });
    expect(link.getAttribute("href")).toBe("https://example.com/todo.md");

    fireEvent.click(link);
    expect(onOpenLocalFileLink).not.toHaveBeenCalled();
    expect(onOpenLink).toHaveBeenCalledWith({
      href: "https://example.com/todo.md",
    });
  });

  it("uses contained routing when the previewed file sits in the workspace", () => {
    const onOpenLocalFileLink = vi.fn(() => true);
    const onOpenLink = vi.fn(() => true);
    const routing = buildHostFilePreviewLinkRouting({
      baseDir: "/workspace/docs",
      onOpenLink,
      onOpenLocalFileLink,
      threadStorageRootPath: null,
      workspaceRootPath: "/workspace",
    });
    expect(routing.localFile?.absoluteLinks).toEqual({
      kind: "contained",
      rootPath: "/workspace",
    });

    renderWithRouting(
      "See [inside](todo.md) and [outside](/etc/hosts.md).",
      routing,
    );
    fireEvent.click(screen.getByRole("link", { name: /inside/ }));
    expect(onOpenLocalFileLink).toHaveBeenCalledWith({
      lineRange: null,
      path: "/workspace/docs/todo.md",
    });

    // Escaping the contained root stays an ordinary link.
    onOpenLocalFileLink.mockClear();
    fireEvent.click(screen.getByRole("link", { name: /outside/ }));
    expect(onOpenLocalFileLink).not.toHaveBeenCalled();
    expect(onOpenLink).toHaveBeenCalledWith({ href: "/etc/hosts.md" });
  });
});

describe("buildContainedFilePreviewLinkRouting", () => {
  it("drops local routing without a root path", () => {
    const routing = buildContainedFilePreviewLinkRouting({
      baseDir: "/workspace/docs",
      onOpenLink: vi.fn(() => true),
      onOpenLocalFileLink: vi.fn(() => true),
      rootPath: null,
    });
    expect(routing.localFile).toBeUndefined();
  });

  it("routes relative links against the previewed file's directory", () => {
    const onOpenLocalFileLink = vi.fn(() => true);
    const routing = buildContainedFilePreviewLinkRouting({
      baseDir: "/workspace/docs",
      onOpenLink: vi.fn(() => true),
      onOpenLocalFileLink,
      rootPath: "/workspace",
    });

    renderWithRouting("See [notes](../notes/todo.md).", routing);
    fireEvent.click(screen.getByRole("link", { name: /notes/ }));
    expect(onOpenLocalFileLink).toHaveBeenCalledWith({
      lineRange: null,
      path: "/workspace/notes/todo.md",
    });
  });
});
