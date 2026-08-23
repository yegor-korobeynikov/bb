// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  resolveSidebarThreadStatus,
  SIDEBAR_THREAD_QUIET_AFTER_MS,
  SidebarThreadStatusDot,
} from "./SidebarThreadStatusDot";

afterEach(() => {
  cleanup();
});

const NOW = 1_700_000_000_000;

const base = {
  hasFailed: false,
  hasPendingInteraction: false,
  isRuntimeBusy: false,
  isUnread: false,
  lastActivityAtMs: NOW,
  nowMs: NOW,
};

const longAgo = NOW - SIDEBAR_THREAD_QUIET_AFTER_MS - 1;

describe("resolveSidebarThreadStatus", () => {
  it("puts a failure above everything else", () => {
    expect(
      resolveSidebarThreadStatus({
        ...base,
        hasFailed: true,
        hasPendingInteraction: true,
        isRuntimeBusy: true,
        isUnread: true,
        lastActivityAtMs: longAgo,
      }),
    ).toBe("failed");
  });

  it("treats a pending interaction as blocked when nothing has broken", () => {
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

  it("marks a running row without giving it a colour of its own", () => {
    expect(resolveSidebarThreadStatus({ ...base, isRuntimeBusy: true })).toBe(
      "working",
    );
  });

  it("keeps a running row out of both 'finished' and 'asleep'", () => {
    // Running used to fall through to whichever of those two the timestamp
    // happened to produce, so a row you were watching work read as finished.
    expect(
      resolveSidebarThreadStatus({
        ...base,
        isRuntimeBusy: true,
        lastActivityAtMs: longAgo,
      }),
    ).toBe("working");
    expect(
      resolveSidebarThreadStatus({ ...base, isRuntimeBusy: true, isUnread: true }),
    ).toBe("working");
  });

  it("still shows a running row's failure and its question", () => {
    // Falling through on "busy" must not swallow the two states that matter.
    expect(
      resolveSidebarThreadStatus({ ...base, isRuntimeBusy: true, hasFailed: true }),
    ).toBe("failed");
    expect(
      resolveSidebarThreadStatus({
        ...base,
        isRuntimeBusy: true,
        hasPendingInteraction: true,
      }),
    ).toBe("blocked");
  });

  it("reads a finished-but-unopened thread as done", () => {
    expect(resolveSidebarThreadStatus({ ...base, isUnread: true })).toBe("done");
  });

  it("fades a read, quiet thread once the threshold has passed", () => {
    expect(
      resolveSidebarThreadStatus({ ...base, lastActivityAtMs: longAgo }),
    ).toBe("quiet");
  });

  it("does NOT fade an old thread that still wants something from you", () => {
    // The point of the ordering: age can retire a thread you are done with,
    // never one that is waiting on you. An unanswered question going quiet is
    // exactly when it must stay visible.
    for (const wanting of [
      { hasFailed: true },
      { hasPendingInteraction: true },
      { isUnread: true },
    ]) {
      expect(
        resolveSidebarThreadStatus({
          ...base,
          ...wanting,
          lastActivityAtMs: longAgo,
        }),
      ).not.toBe("quiet");
    }
  });

  it("holds just short of the threshold", () => {
    expect(
      resolveSidebarThreadStatus({
        ...base,
        lastActivityAtMs: NOW - SIDEBAR_THREAD_QUIET_AFTER_MS + 1,
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
    expect(dot.style.border).not.toContain("var(--tendo-status-quiet-border)");
  });

  it("paints the quiet marker as an outline of the same footprint", () => {
    render(<SidebarThreadStatusDot status="quiet" />);
    const dot = screen.getByRole("img");
    expect(dot.style.background).toBe("transparent");
    expect(dot.style.border).toContain("var(--tendo-status-quiet-border)");
    // border-box is what keeps the outline from growing past the filled size.
    expect(dot.style.boxSizing).toBe("border-box");
  });

  it("is visible in every state", () => {
    // Regression guard for the defect that started this rewrite: while the
    // row ran its own spinner the dot was painted with visibility:hidden, so
    // a name appeared with nothing in front of it and the gap came and went
    // on its own. The slot is always occupied by something you can see.
    for (const status of [
      "failed",
      "blocked",
      "done",
      "working",
      "quiet",
    ] as const) {
      cleanup();
      render(<SidebarThreadStatusDot status={status} />);
      const dot = screen.getByRole("img");
      expect(dot.style.visibility).not.toBe("hidden");
      expect(dot.style.display).toBe("inline-block");
      expect(dot.style.width).toBe("var(--tendo-status-dot-size)");
    }
  });

  it("names its state for a screen reader", () => {
    render(<SidebarThreadStatusDot status="failed" />);
    expect(screen.getByRole("img").getAttribute("aria-label")).toBe("Failed");
  });

  it("separates running from asleep by fill, not only by motion", () => {
    // The animation is a second cue: under prefers-reduced-motion it is
    // switched off in CSS, and the state has to survive that. Filled versus
    // hollow is what carries it.
    render(<SidebarThreadStatusDot status="working" />);
    const working = screen.getByRole("img");
    expect(working.style.background).toBe("var(--tendo-status-working)");
    expect(working.className).toContain("tendo-status-dot-working");
    cleanup();

    render(<SidebarThreadStatusDot status="quiet" />);
    const quiet = screen.getByRole("img");
    expect(quiet.style.background).toBe("transparent");
    expect(quiet.className).not.toContain("tendo-status-dot-working");
  });

  it("draws every size and colour from the canon tokens, never a literal", () => {
    render(<SidebarThreadStatusDot status="done" />);
    const dot = screen.getByRole("img");
    expect(dot.style.width).toBe("var(--tendo-status-dot-size)");
    expect(dot.style.height).toBe("var(--tendo-status-dot-size)");
    expect(dot.style.background).toBe("var(--tendo-status-done)");
  });
});
