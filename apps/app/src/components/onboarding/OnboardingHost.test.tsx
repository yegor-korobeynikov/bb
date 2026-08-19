// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { defaultAppSettings, defaultExperiments } from "@bb/domain";
import type { SystemProviderState } from "@bb/server-contract";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OnboardingFlowProps } from "./OnboardingFlow";
import { OnboardingHost } from "./OnboardingHost";

const mocks = vi.hoisted(() => ({
  buildProviderCliIssue: vi.fn(),
  hasProviderCliAction: vi.fn(),
  onboardingFlow: vi.fn<(props: OnboardingFlowProps) => void>(),
  useCreateProject: vi.fn(),
  useHostProviderCliStatus: vi.fn(),
  usePrimaryHost: vi.fn(),
  useProviderCliInstallRunner: vi.fn(),
  useSidebarNavigation: vi.fn(),
  useSystemConfig: vi.fn(),
  useUpdateGeneralSettings: vi.fn(),
}));

vi.mock("@/hooks/queries/system-queries", () => ({
  useHostProviderCliStatus: mocks.useHostProviderCliStatus,
  useSystemConfig: mocks.useSystemConfig,
}));
vi.mock("@/hooks/mutations/settings-mutations", () => ({
  useUpdateGeneralSettings: mocks.useUpdateGeneralSettings,
}));
vi.mock("@/hooks/mutations/project-mutations", () => ({
  useCreateProject: mocks.useCreateProject,
}));
vi.mock("@/hooks/queries/host-queries", () => ({
  usePrimaryHost: mocks.usePrimaryHost,
}));
vi.mock("@/hooks/queries/sidebar-navigation-query", () => ({
  useSidebarNavigation: mocks.useSidebarNavigation,
}));
vi.mock("@/components/provider-cli/provider-cli-install", () => ({
  buildProviderCliIssue: mocks.buildProviderCliIssue,
  hasProviderCliAction: mocks.hasProviderCliAction,
  useProviderCliInstallRunner: mocks.useProviderCliInstallRunner,
}));
vi.mock("@/components/provider-cli/provider-cli-install-store", () => ({
  providerCliJobKey: vi.fn(() => "job"),
}));
vi.mock("./OnboardingFlow", () => ({
  OnboardingFlow: (props: OnboardingFlowProps) => {
    mocks.onboardingFlow(props);
    return <div>Onboarding flow</div>;
  },
}));

beforeEach(() => {
  mocks.useCreateProject.mockReturnValue({ mutateAsync: vi.fn() });
  mocks.useHostProviderCliStatus.mockReturnValue({ data: undefined });
  mocks.usePrimaryHost.mockReturnValue({ id: "host-1" });
  mocks.useProviderCliInstallRunner.mockReturnValue({
    failuresByJobKey: new Map(),
    queuedJobKeys: new Set(),
    runningJobKey: null,
    startInstall: vi.fn(),
  });
  mocks.useSidebarNavigation.mockReturnValue({ data: { projects: [] } });
  mocks.useUpdateGeneralSettings.mockReturnValue({ mutate: vi.fn() });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("OnboardingHost", () => {
  it("does not show or run provider checks while the experiment is off", () => {
    mocks.useSystemConfig.mockReturnValue({
      data: {
        experiments: defaultExperiments,
        generalSettings: defaultAppSettings,
      },
    });

    render(<OnboardingHost />);

    expect(screen.queryByText("Onboarding flow")).toBeNull();
    expect(mocks.useHostProviderCliStatus).toHaveBeenCalledWith({
      enabled: false,
      hostId: "host-1",
    });
  });

  it("shows onboarding when the experiment is on and setup is incomplete", () => {
    mocks.useSystemConfig.mockReturnValue({
      data: {
        experiments: { ...defaultExperiments, newOnboarding: true },
        generalSettings: defaultAppSettings,
      },
    });

    render(<OnboardingHost />);

    expect(screen.getByText("Onboarding flow")).toBeTruthy();
    expect(mocks.useHostProviderCliStatus).toHaveBeenCalledWith({
      enabled: true,
      hostId: "host-1",
    });
  });

  it("exposes only host-backed install actions and can install Cursor", () => {
    const startInstall = vi.fn();
    const cursorIssue = {
      provider: "cursor",
      status: {},
      action: { kind: "install" },
      title: "Cursor CLI not installed",
      description: "Install Cursor",
      fingerprint: "cursor:missing:latest",
    };
    mocks.useSystemConfig.mockReturnValue({
      data: {
        experiments: { ...defaultExperiments, newOnboarding: true },
        generalSettings: defaultAppSettings,
      },
    });
    mocks.useHostProviderCliStatus.mockReturnValue({
      data: { codex: {}, claudeCode: {}, cursor: {} },
    });
    mocks.buildProviderCliIssue.mockImplementation(
      (entry: { provider: string }) =>
        entry.provider === "cursor" ? cursorIssue : null,
    );
    mocks.hasProviderCliAction.mockImplementation(
      (issue: { action: unknown }) => issue.action !== null,
    );
    mocks.useProviderCliInstallRunner.mockReturnValue({
      failuresByJobKey: new Map(),
      queuedJobKeys: new Set(),
      runningJobKey: null,
      startInstall,
    });

    render(<OnboardingHost />);

    const props = mocks.onboardingFlow.mock.calls.at(-1)?.[0];
    expect(props).toBeDefined();
    if (props === undefined) throw new Error("Onboarding flow did not render");
    expect([...props.actionableProviderIds]).toEqual(["acp-cursor"]);

    const agent: SystemProviderState = {
      providerId: "plugin-agent",
      displayName: "Plugin Agent",
      status: "not_installed",
      statusMessage: null,
      accountEmail: null,
      planLabel: null,
      installedVersion: null,
      minimumSupportedVersion: null,
      canInstall: true,
      canUpdate: false,
      loginCommand: null,
    };
    props.onInstallAgent(agent);
    expect(startInstall).not.toHaveBeenCalled();
    props.onInstallAgent({ ...agent, providerId: "acp-cursor" });
    expect(startInstall).toHaveBeenCalledWith({
      hostId: "host-1",
      issue: cursorIssue,
    });
  });
});
