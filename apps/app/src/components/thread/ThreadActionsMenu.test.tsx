// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Thread } from "@bb/domain";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThreadActionsContextMenu } from "./ThreadActionsMenu";

const mocks = vi.hoisted(() => ({
  unpinAndMove: vi.fn(),
  updateThread: vi.fn(),
}));

vi.mock("@/components/thread/ThreadActionsProvider", () => ({
  useThreadActions: () => ({
    archiveThreadAndChildren: vi.fn(),
    requestDelete: vi.fn(),
    requestRename: vi.fn(),
    togglePin: vi.fn(),
    toggleRead: vi.fn(),
    unarchiveThread: vi.fn(),
  }),
}));

vi.mock("@/hooks/mutations/thread-state-mutations", () => ({
  useUnpinAndMoveThread: () => ({ mutate: mocks.unpinAndMove }),
  useUpdateThread: () => ({ mutate: mocks.updateThread }),
}));

vi.mock("@/hooks/queries/sidebar-navigation-query", () => ({
  useSidebarNavigationSections: () => [
    { id: "sec_planning", name: "Planning", createdAt: 1, updatedAt: 1 },
    { id: "sec_building", name: "Building", createdAt: 2, updatedAt: 2 },
  ],
}));

function makeThread(overrides: Partial<Thread> = {}): Thread {
  return {
    archivedAt: null,
    createdAt: 1,
    deletedAt: null,
    environmentId: "env_test",
    id: "thr_test",
    lastReadAt: null,
    latestAttentionAt: 1,
    originKind: null,
    originPluginId: null,
    parentThreadId: null,
    pinnedAt: null,
    projectId: "proj_test",
    providerId: "codex",
    sectionId: null,
    sourceThreadId: null,
    status: "idle",
    title: "Test thread",
    titleFallback: null,
    updatedAt: 1,
    visibility: "visible",
    ...overrides,
  };
}

function openMoveMenu(thread: Thread) {
  render(
    <ThreadActionsContextMenu thread={thread}>
      <button type="button">Thread row</button>
    </ThreadActionsContextMenu>,
  );
  fireEvent.contextMenu(screen.getByRole("button", { name: "Thread row" }));
  const moveTo = screen.getByRole("menuitem", { name: "Move to…" });
  moveTo.focus();
  fireEvent.keyDown(moveTo, { key: "ArrowRight" });
}

describe("ThreadActionsContextMenu Move to", () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      addEventListener: vi.fn(),
      matches: false,
      removeEventListener: vi.fn(),
    }));
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("moves a root thread to the selected section", () => {
    openMoveMenu(makeThread());

    fireEvent.click(screen.getByRole("menuitemradio", { name: "Building" }));

    expect(mocks.updateThread).toHaveBeenCalledWith({
      id: "thr_test",
      sectionId: "sec_building",
    });
  });

  it("moves a thread to Unorganized", () => {
    openMoveMenu(makeThread({ sectionId: "sec_planning" }));

    fireEvent.click(screen.getByRole("menuitemradio", { name: "Unorganized" }));

    expect(mocks.updateThread).toHaveBeenCalledWith({
      id: "thr_test",
      sectionId: null,
    });
  });

  it("uses the drag-and-drop unpin-and-move path for pinned threads", () => {
    openMoveMenu(makeThread({ pinnedAt: 1, sectionId: "sec_planning" }));

    fireEvent.click(screen.getByRole("menuitemradio", { name: "Building" }));

    expect(mocks.unpinAndMove).toHaveBeenCalledWith({
      id: "thr_test",
      sectionId: "sec_building",
    });
    expect(mocks.updateThread).not.toHaveBeenCalled();
  });
});
