// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import type { SystemProviderState } from "@bb/server-contract";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardingFlow } from "./OnboardingFlow";

const mocks = vi.hoisted(() => ({
  useOnboardingRepos: vi.fn(),
  useSystemProviderStates: vi.fn(),
}));

vi.mock("@/hooks/queries/system-queries", () => ({
  useOnboardingRepos: mocks.useOnboardingRepos,
  useSystemProviderStates: mocks.useSystemProviderStates,
}));
vi.mock("@/hooks/useLocalPathPicker", () => ({
  useLocalPathPicker: () => ({
    hostId: null,
    hostName: null,
    openPathEntry: vi.fn(),
    platform: null,
    projectPathDialog: { target: null, onOpenChange: vi.fn() },
    submitProjectPath: vi.fn(),
  }),
}));
vi.mock("@/components/dialogs/ProjectPathDialog", () => ({
  ProjectPathDialog: () => null,
}));

function providerState(
  providerId: string,
  displayName: string,
  status: SystemProviderState["status"],
  options: {
    canInstall?: boolean;
    loginCommand?: string | null;
  } = {},
): SystemProviderState {
  return {
    providerId,
    displayName,
    status,
    statusMessage: null,
    accountEmail: null,
    planLabel: null,
    installedVersion: null,
    minimumSupportedVersion: null,
    canInstall: options.canInstall ?? false,
    canUpdate: false,
    loginCommand: options.loginCommand ?? null,
  };
}

beforeEach(() => {
  mocks.useOnboardingRepos.mockReturnValue({ data: undefined });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("OnboardingFlow", () => {
  it("keeps actionable install choices visible when Pi is signed out", () => {
    mocks.useSystemProviderStates.mockReturnValue({
      data: {
        providers: [
          providerState("pi", "Pi", "unauthenticated", {
            loginCommand: "pi login",
          }),
          providerState("codex", "Codex", "not_installed", {
            canInstall: true,
          }),
          providerState("claude-code", "Claude Code", "not_installed", {
            canInstall: true,
          }),
        ],
      },
      isError: false,
      isPending: false,
      refetch: vi.fn(),
    });

    render(
      <OnboardingFlow
        actionableProviderIds={new Set(["codex", "claude-code"])}
        installing={new Set()}
        onAddProjects={vi.fn()}
        onClose={vi.fn()}
        onInstallAgent={vi.fn()}
      />,
    );

    expect(screen.getAllByText("Pi").length).toBeGreaterThan(0);
    expect(screen.getByText("Codex")).toBeDefined();
    expect(screen.getByText("Claude Code")).toBeDefined();
    expect(screen.getAllByRole("button", { name: "Install" })).toHaveLength(2);
  });

  it("does not render a bridge install flag without a host action", () => {
    mocks.useSystemProviderStates.mockReturnValue({
      data: {
        providers: [
          providerState("plugin-agent", "Plugin Agent", "not_installed", {
            canInstall: true,
          }),
        ],
      },
      isError: false,
      isPending: false,
      refetch: vi.fn(),
    });

    render(
      <OnboardingFlow
        actionableProviderIds={new Set()}
        installing={new Set()}
        onAddProjects={vi.fn()}
        onClose={vi.fn()}
        onInstallAgent={vi.fn()}
      />,
    );

    expect(screen.queryByText("Plugin Agent")).toBeNull();
    expect(screen.queryByRole("button", { name: "Install" })).toBeNull();
  });
});
