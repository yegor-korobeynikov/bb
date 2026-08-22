import { readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { BbPluginApi } from "@get-bb/plugin-sdk";

const CLAUDE_CODE_CAPABILITIES = {
  experimental_providerHealth: true,
  experimental_providerUsage: true,
  experimental_providerInstallation: true,
  supportsServiceTier: false,
  supportsNativeUserQuestion: true,
  fork: "checkpoint",
  supportsManualCompaction: true,
  supportsThreadArchive: false,
  supportsThreadRename: false,
  supportsWorkflows: true,
  permissionModes: ["accept-edits", "auto", "full"],
  reasoningLevels: ["low", "medium", "high", "xhigh", "ultracode", "max"],
} as const;

const SECONDARY_PROFILE_DIR_PREFIX = ".claude-";

/**
 * Secondary Claude Code account profiles, zero-config: any `~/.claude-<slug>`
 * directory is a profile, discovered by directory listing rather than a
 * settings UI. The user creates one by logging in once with
 * `CLAUDE_CONFIG_DIR=~/.claude-<slug> claude login`; no directory found means
 * exactly today's single-account behavior. See BSO-1026 (root blocker: a
 * spawned bridge process has no channel to learn its own providerId, so the
 * `configDir` travels as a static per-registration `bridgeOptions` value —
 * one OS process per provider id already exists, this just gives each one a
 * distinct account).
 *
 * `bridgeOptions` is documented as host-invariant "immutable launch
 * metadata", but `configDir` is a local filesystem path — correct only for
 * single-host setups. Multi-host support needs a different delivery
 * (per-host profile resolution), out of scope here.
 */
function discoverSecondaryProfiles(): Array<{ slug: string; configDir: string }> {
  const home = homedir();
  let entries: string[];
  try {
    entries = readdirSync(home, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return [];
  }
  return entries
    .filter((name) => name.startsWith(SECONDARY_PROFILE_DIR_PREFIX))
    .map((name) => ({
      slug: name.slice(SECONDARY_PROFILE_DIR_PREFIX.length),
      configDir: join(home, name),
    }))
    .filter((profile) => profile.slug.length > 0);
}

/**
 * First-party Claude Code provider plugin. The declaration is the only source
 * of this provider: disabling this plugin removes the provider(s).
 */
export default function plugin(bb: BbPluginApi) {
  bb.agents.experimental_registerProvider({
    id: "claude-code",
    displayName: "Claude Code",
    icon: "./icons/claude-code.svg",
    capabilities: CLAUDE_CODE_CAPABILITIES,
    composerActions: ["plan"],
  });

  for (const profile of discoverSecondaryProfiles()) {
    bb.agents.experimental_registerProvider({
      id: `claude-code:${profile.slug}`,
      displayName: `Claude Code (${profile.slug})`,
      icon: "./icons/claude-code.svg",
      experimental_bridgeOptions: { configDir: profile.configDir },
      capabilities: CLAUDE_CODE_CAPABILITIES,
      composerActions: ["plan"],
    });
  }
}
