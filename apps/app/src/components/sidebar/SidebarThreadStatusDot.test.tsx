// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  resolveSidebarThreadStatus,
  SidebarThreadStatusDot,
} from "./SidebarThreadStatusDot";

afterEach(() => {
  cleanup();
});

const base = {
  hasPendingInteraction: false,
  isUnread: false,
  isChildThread: false,
};

describe("resolveSidebarThreadStatus", () => {
  it("treats a pending interaction as blocked, whatever else is true", () => {
    expect(
      resolveSidebarThreadStatus({
        ...base,
        hasPendingInteraction: true,
        isUnread: true,
        isChildThread: true,
      }),
    ).toBe("blocked");
  });

  it("reads an unread thread with nothing pending as unread", () => {
    expect(resolveSidebarThreadStatus({ ...base, isUnread: true })).toBe(
      "unread",
    );
  });

  it("gives a quiet SESSION a filled done marker", () => {
    expect(resolveSidebarThreadStatus(base)).toBe("done");
  });

  it("gives a quiet TRACK the hollow idle marker", () => {
    // The distinction the plugin arrived at the hard way: filling a child
    // track olive read as "successfully finished", which is not what most
    // quiet tracks mean. A session's quiet state is a real status; a track's
    // is the absence of one.
    expect(resolveSidebarThreadStatus({ ...base, isChildThread: true })).toBe(
      "idle",
    );
  });
});

describe("SidebarThreadStatusDot", () => {
  it("paints a filled dot for a real state", () => {
    render(<SidebarThreadStatusDot status="blocked" isReserved={false} />);
    const dot = screen.getByRole("img");
    expect(dot.getAttribute("data-sidebar-thread-status-dot")).toBe("blocked");
    expect(dot.style.background).toBe("var(--tendo-status-blocked)");
    // jsdom serialises `border: none` as `border: medium`; the meaningful
    // assertion is that the outline variant's token is not in play.
    expect(dot.style.border).not.toContain("var(--tendo-status-idle-border)");
    expect(dot.style.visibility).toBe("visible");
  });

  it("paints the idle marker as an outline of the same footprint", () => {
    render(<SidebarThreadStatusDot status="idle" isReserved={false} />);
    const dot = screen.getByRole("img");
    expect(dot.style.background).toBe("transparent");
    expect(dot.style.border).toContain("var(--tendo-status-idle-border)");
    // border-box is what keeps the outline from growing past the filled size.
    expect(dot.style.boxSizing).toBe("border-box");
  });

  it("keeps its layout box while the runtime spinner is showing", () => {
    // Regression guard for a measured bug: removing the dot pulled its width
    // out of the row, so every title shifted whenever a thread started or
    // stopped running. Hidden, not gone.
    const { container } = render(
      <SidebarThreadStatusDot status="done" isReserved />,
    );
    const dot = container.querySelector<HTMLElement>(
      "[data-sidebar-thread-status-dot]",
    );
    expect(dot).not.toBeNull();
    if (dot === null) return;
    expect(dot.style.visibility).toBe("hidden");
    expect(dot.style.display).toBe("inline-block");
    expect(dot.style.width).toBe("var(--tendo-status-dot-size)");
  });

  it("says nothing to a screen reader while it is only holding space", () => {
    // visibility:hidden already removes it from the accessibility tree, so a
    // status label here would be unreachable — and a stale one at that.
    const { container } = render(
      <SidebarThreadStatusDot status="done" isReserved />,
    );
    const dot = container.querySelector<HTMLElement>(
      "[data-sidebar-thread-status-dot]",
    );
    expect(dot?.getAttribute("aria-hidden")).toBe("true");
    expect(dot?.getAttribute("aria-label")).toBeNull();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("draws every size from the canon tokens, never a literal", () => {
    render(<SidebarThreadStatusDot status="unread" isReserved={false} />);
    const dot = screen.getByRole("img");
    expect(dot.style.width).toBe("var(--tendo-status-dot-size)");
    expect(dot.style.height).toBe("var(--tendo-status-dot-size)");
    expect(dot.style.background).toBe("var(--tendo-status-unread)");
  });
});
