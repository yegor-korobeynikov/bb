// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  resolveSidebarThreadStatus,
  SIDEBAR_THREAD_ASLEEP_AFTER_MS,
  SidebarThreadStatusDot,
} from "./SidebarThreadStatusDot";

afterEach(() => {
  cleanup();
});

const NOW = 1_700_000_000_000;

const base = {
  hasPendingInteraction: false,
  isRuntimeBusy: false,
  isUnread: false,
  lastActivityAtMs: NOW,
  nowMs: NOW,
};

const longAgo = NOW - SIDEBAR_THREAD_ASLEEP_AFTER_MS - 1;

describe("resolveSidebarThreadStatus", () => {
  it("treats a pending interaction as blocked, whatever else is true", () => {
    expect(
      resolveSidebarThreadStatus({
        ...base,
        hasPendingInteraction: true,
        isRuntimeBusy: true,
        isUnread: true,
        lastActivityAtMs: longAgo,
      }),
    ).toBe("blocked");
  });

  it("reads a busy runtime as working", () => {
    expect(resolveSidebarThreadStatus({ ...base, isRuntimeBusy: true })).toBe(
      "working",
    );
  });

  it("reads a finished-but-unopened thread as done", () => {
    expect(resolveSidebarThreadStatus({ ...base, isUnread: true })).toBe("done");
  });

  it("fades a read, quiet thread once the threshold has passed", () => {
    expect(
      resolveSidebarThreadStatus({ ...base, lastActivityAtMs: longAgo }),
    ).toBe("asleep");
  });

  it("does NOT fade an old thread that still wants something from you", () => {
    // The point of the ordering: age can retire a thread you are done with,
    // never one that is waiting on you. An unanswered question going quiet is
    // exactly when it must stay visible.
    for (const wanting of [
      { hasPendingInteraction: true },
      { isUnread: true },
      { isRuntimeBusy: true },
    ]) {
      expect(
        resolveSidebarThreadStatus({
          ...base,
          ...wanting,
          lastActivityAtMs: longAgo,
        }),
      ).not.toBe("asleep");
    }
  });

  it("holds just short of the threshold", () => {
    expect(
      resolveSidebarThreadStatus({
        ...base,
        lastActivityAtMs: NOW - SIDEBAR_THREAD_ASLEEP_AFTER_MS + 1,
      }),
    ).toBe("done");
  });

  it("treats a thread with no timestamp as fresh rather than stale", () => {
    // Fading for want of data would retire rows that are merely undated.
    expect(resolveSidebarThreadStatus({ ...base, lastActivityAtMs: null })).toBe(
      "done",
    );
  });
});

describe("SidebarThreadStatusDot", () => {
  it("paints a filled dot for a real state", () => {
    render(<SidebarThreadStatusDot status="blocked" />);
    const dot = screen.getByRole("img");
    expect(dot.getAttribute("data-sidebar-thread-status-dot")).toBe("blocked");
    expect(dot.style.background).toBe("var(--tendo-status-blocked)");
    // jsdom serialises `border: none` as `border: medium`; the meaningful
    // assertion is that the outline variant's token is not in play.
    expect(dot.style.border).not.toContain("var(--tendo-status-idle-border)");
  });

  it("paints the asleep marker as an outline of the same footprint", () => {
    render(<SidebarThreadStatusDot status="asleep" />);
    const dot = screen.getByRole("img");
    expect(dot.style.background).toBe("transparent");
    expect(dot.style.border).toContain("var(--tendo-status-idle-border)");
    // border-box is what keeps the outline from growing past the filled size.
    expect(dot.style.boxSizing).toBe("border-box");
  });

  it("is visible in every state, working included", () => {
    // Regression guard for the defect that started this rewrite: while the
    // row ran its own spinner the dot was painted with visibility:hidden, so
    // a name appeared with nothing in front of it and the gap came and went
    // on its own. Working is a state; it gets a colour.
    for (const status of ["working", "done", "blocked", "asleep"] as const) {
      cleanup();
      render(<SidebarThreadStatusDot status={status} />);
      const dot = screen.getByRole("img");
      expect(dot.style.visibility).not.toBe("hidden");
      expect(dot.style.display).toBe("inline-block");
      expect(dot.style.width).toBe("var(--tendo-status-dot-size)");
    }
  });

  it("names its state for a screen reader", () => {
    render(<SidebarThreadStatusDot status="working" />);
    expect(screen.getByRole("img").getAttribute("aria-label")).toBe("Working");
  });

  it("draws every size and colour from the canon tokens, never a literal", () => {
    render(<SidebarThreadStatusDot status="done" />);
    const dot = screen.getByRole("img");
    expect(dot.style.width).toBe("var(--tendo-status-dot-size)");
    expect(dot.style.height).toBe("var(--tendo-status-dot-size)");
    expect(dot.style.background).toBe("var(--tendo-status-done)");
  });
});
