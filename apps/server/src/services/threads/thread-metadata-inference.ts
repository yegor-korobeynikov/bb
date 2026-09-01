import { getThread, listThreadSections } from "@bb/db";
import type { PromptInput, ProvisioningTranscriptEntry } from "@bb/domain";
import type { LoggedWorkSessionDeps } from "../../types.js";
import { appendThreadProvisioningEvent } from "./thread-events.js";
import {
  applyGeneratedThreadSection,
  applyGeneratedThreadTitle,
  generateThreadMetadataWithOutcome,
  type ThreadMetadataGenerationOutcome,
  type ThreadSectionOption,
} from "./title-generation.js";
import { runtimeErrorLogFields } from "../lib/error-log-fields.js";
import { INFERENCE_POLICY } from "../ai/inference.js";

interface ThreadMetadataInferenceArgs {
  environmentId: string | null;
  generateBranchName: boolean;
  input: PromptInput[];
  provisioningId: string;
  threadId: string;
  writeTranscript: boolean;
}

interface ThreadMetadataInferenceResult {
  branchSlug: string | null;
  sectionApplied: boolean;
  titleApplied: boolean;
  title: string | null;
}

/**
 * Sections worth offering the model for this thread — none unless it is an
 * unfiled root thread and the sidebar actually has sections. Reading them here
 * rather than inside the generator keeps the prompt-shaping code free of the
 * database and makes the empty case cost nothing: no list, no extra field for
 * the model to answer, no behavior change for anyone who does not use sections.
 */
function resolveSectionOptions(
  deps: LoggedWorkSessionDeps,
  threadId: string,
): ThreadSectionOption[] {
  const thread = getThread(deps.db, threadId);
  if (!thread || thread.parentThreadId !== null || thread.sectionId !== null) {
    return [];
  }
  return listThreadSections(deps.db).map((section) => ({
    id: section.id,
    name: section.name,
  }));
}

interface MetadataTextArgs {
  generateBranchName: boolean;
  outcome: ThreadMetadataGenerationOutcome;
}

interface MetadataRequirements {
  generateBranchName: boolean;
}

interface MetadataCompletedEntryArgs extends MetadataTextArgs {
  startedAt: number;
}

function metadataStartedText(args: MetadataRequirements): string {
  return args.generateBranchName
    ? "Generating title and branch name"
    : "Generating title";
}

function metadataCompletedText(args: MetadataTextArgs): string {
  const hasTitle = Boolean(args.outcome.metadata?.title);
  const hasBranchName =
    args.generateBranchName && Boolean(args.outcome.metadata?.branchSlug);

  if (hasTitle && hasBranchName) {
    return "Generated title and branch name";
  }
  if (hasTitle) {
    return "Generated title";
  }
  if (hasBranchName) {
    return "Generated branch name";
  }
  if (args.generateBranchName) {
    return "Using fallback branch name";
  }
  return "No title generated";
}

function metadataCompletedEntry(
  args: MetadataCompletedEntryArgs,
): ProvisioningTranscriptEntry {
  return {
    type: "step",
    key: "metadata-completed",
    text: metadataCompletedText(args),
    status: "completed",
    startedAt: args.startedAt,
    metadata: {
      durationMs: args.outcome.durationMs,
      branchNameGenerated:
        args.generateBranchName && Boolean(args.outcome.metadata?.branchSlug),
      titleGenerated: Boolean(args.outcome.metadata?.title),
      ...(args.outcome.reason ? { reason: args.outcome.reason } : {}),
    },
  };
}

export async function inferThreadMetadata(
  deps: LoggedWorkSessionDeps,
  args: ThreadMetadataInferenceArgs,
): Promise<ThreadMetadataInferenceResult> {
  const startedAt = Date.now();
  const provisioningId = args.provisioningId;
  const transcriptEnvironmentId = args.writeTranscript
    ? args.environmentId
    : null;
  if (transcriptEnvironmentId) {
    appendThreadProvisioningEvent(deps, {
      threadId: args.threadId,
      environmentId: transcriptEnvironmentId,
      provisioningId,
      status: "active",
      entries: [
        {
          type: "step",
          key: "metadata-started",
          text: metadataStartedText(args),
          status: "started",
          startedAt,
        },
      ],
    });
  }

  const sections = resolveSectionOptions(deps, args.threadId);
  const outcome = await generateThreadMetadataWithOutcome(deps, {
    input: args.input,
    sections,
    threadId: args.threadId,
    timeoutMaxAttempts: INFERENCE_POLICY.threadMetadata.maxAttempts,
    timeoutMs: INFERENCE_POLICY.threadMetadata.timeoutMs,
  });

  if (transcriptEnvironmentId) {
    appendThreadProvisioningEvent(deps, {
      threadId: args.threadId,
      environmentId: transcriptEnvironmentId,
      provisioningId,
      status: "active",
      entries: [
        metadataCompletedEntry({
          generateBranchName: args.generateBranchName,
          outcome,
          startedAt,
        }),
      ],
    });
  }

  let titleApplied = false;
  if (outcome.metadata?.title) {
    try {
      titleApplied = applyGeneratedThreadTitle(deps, {
        threadId: args.threadId,
        title: outcome.metadata.title,
      });
    } catch (error) {
      deps.logger.warn(
        {
          threadId: args.threadId,
          ...runtimeErrorLogFields(deps.config, error),
        },
        "Failed to apply generated thread title",
      );
    }
  }

  let sectionApplied = false;
  if (outcome.metadata?.sectionId) {
    try {
      sectionApplied = applyGeneratedThreadSection(deps, {
        threadId: args.threadId,
        sectionId: outcome.metadata.sectionId,
      });
    } catch (error) {
      deps.logger.warn(
        {
          threadId: args.threadId,
          ...runtimeErrorLogFields(deps.config, error),
        },
        "Failed to apply generated thread section",
      );
    }
  }

  return {
    branchSlug: args.generateBranchName
      ? (outcome.metadata?.branchSlug ?? null)
      : null,
    sectionApplied,
    title: outcome.metadata?.title ?? null,
    titleApplied,
  };
}
