import type { DiscoverReposResult } from "@bb/host-daemon-contract";
import type {
  OnboardingTelemetryEvent,
  SystemOnboardingReposQuery,
} from "@bb/server-contract";
import type { AppDeps } from "../../types.js";
import { COMMAND_TIMEOUT_MS } from "../../constants.js";
import { callHostRetryableOnlineRpc } from "../hosts/online-rpc.js";
import {
  assertUsableHostId,
  requirePrimaryHostId,
} from "../hosts/primary-host.js";

export async function getOnboardingRepos(
  deps: AppDeps,
  query: SystemOnboardingReposQuery,
): Promise<DiscoverReposResult> {
  const hostId = query.hostId ?? requirePrimaryHostId(deps);
  assertUsableHostId(deps, { hostId });
  return callHostRetryableOnlineRpc(deps, {
    hostId,
    timeoutMs: COMMAND_TIMEOUT_MS,
    command: {
      type: "workspace.discover_repos",
      maxDepth: 5,
      sinceDays: 30,
      limit: 20,
    },
  });
}

/**
 * Forward one onboarding funnel event to anonymous telemetry. The client sends
 * a typed event; the mapping to PostHog's snake_case property names lives here
 * so the wire contract stays independent of the analytics schema.
 */
export function recordOnboardingEvent(
  deps: AppDeps,
  event: OnboardingTelemetryEvent,
): void {
  switch (event.name) {
    case "onboarding_started":
      deps.telemetry.capture({
        name: "onboarding_started",
        properties: {
          agent_state: event.agentState,
          detected_agent_count: event.detectedAgentCount,
        },
      });
      return;
    case "onboarding_step_completed":
      deps.telemetry.capture({
        name: "onboarding_step_completed",
        properties: { step: event.step },
      });
      return;
    case "onboarding_step_skipped":
      deps.telemetry.capture({
        name: "onboarding_step_skipped",
        properties: { step: event.step },
      });
      return;
    case "onboarding_completed":
      deps.telemetry.capture({
        name: "onboarding_completed",
        properties: {
          agent_state: event.agentState,
          projects_added: event.projectsAdded,
          duration_ms: event.durationMs,
        },
      });
      return;
    case "onboarding_dismissed":
      deps.telemetry.capture({
        name: "onboarding_dismissed",
        properties: { step: event.step },
      });
  }
}
