// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { TooltipProvider } from "@bb/shared-ui/tooltip";
import { describe, expect, it, vi } from "vitest";
import { ThreadEnvironmentSummary } from "./ThreadEnvironmentSummary";

// The strip asks the system config which build this is; these tests render
// without a QueryClient, so answer as the working build (which shows the
// git-context strip).
vi.mock("@/hooks/useAppMode", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/useAppMode")>()),
  useAppMode: () => "staging",
  useIsProd: () => false,
  useSurfaceVisible: () => true,
}));

describe("ThreadEnvironmentSummary", () => {
  it("uses a host-free environment label in compact prompt boxes", () => {
    render(
      <ThreadEnvironmentSummary
        environmentLabel="Mac Studio · New worktree"
        environmentCompactLabel="Worktree"
      />,
    );

    expect(
      document.querySelector('[data-promptbox-full-label=""]')?.textContent,
    ).toBe("Mac Studio · New worktree");
    expect(
      document.querySelector('[data-promptbox-compact-label=""]')?.textContent,
    ).toBe("Worktree");
  });

  it("explains the create-thread action in a tooltip", async () => {
    render(
      <TooltipProvider delayDuration={0}>
        <ThreadEnvironmentSummary
          environmentLabel="Worktree"
          onCreateNewThreadInWorktree={vi.fn()}
        />
      </TooltipProvider>,
    );

    fireEvent.focus(
      screen.getByRole("button", {
        name: "Create new thread in this worktree",
      }),
    );

    expect((await screen.findByRole("tooltip")).textContent).toBe(
      "Create new thread in this worktree",
    );
  });
});
