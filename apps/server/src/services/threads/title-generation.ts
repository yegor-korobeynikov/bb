import { renderTemplate } from "@bb/templates";
import { getThread, updateThread, type DbNotifier } from "@bb/db";
import type { PromptInput } from "@bb/domain";
import type { AppDeps, LoggedWorkSessionDeps } from "../../types.js";
import { Type } from "@earendil-works/pi-ai";
import {
  INFERENCE_POLICY,
  InferenceTimeoutError,
  inferenceCompleteWithFallback,
} from "../ai/inference.js";

const MIN_TITLE_GENERATION_WORDS = 5;
/**
 * Cap on section names sent to the model. A sidebar that grows past this is
 * past the point where a name list reads as a filing scheme anyway, and the
 * prompt should not scale with it.
 */
const MAX_SECTION_OPTIONS = 50;
const MAX_GENERATED_TITLE_WORDS = 5;
const MAX_BRANCH_SLUG_LENGTH = 48;

interface ApplyGeneratedThreadTitleArgs {
  threadId: string;
  title: string;
}

interface ApplyGeneratedThreadSectionArgs {
  sectionId: string;
  threadId: string;
}

export interface ThreadSectionOption {
  id: string;
  name: string;
}

interface ThreadMetadataGenerationArgs {
  input: PromptInput[];
  /**
   * Sections the thread may be filed into. Empty disables classification
   * entirely: no section lines in the prompt, no section field in the schema.
   */
  sections?: readonly ThreadSectionOption[];
  threadId: string;
  timeoutMaxAttempts?: number;
  timeoutMs?: number;
}

interface GeneratedThreadMetadata {
  branchSlug?: string;
  sectionId?: string;
  title?: string;
}

type ThreadMetadataGenerationOutcomeReason =
  | "empty-input"
  | "failed"
  | "inference-unavailable"
  | "too-short"
  | "timeout";

export interface ThreadMetadataGenerationOutcome {
  durationMs: number;
  metadata: GeneratedThreadMetadata | null;
  reason?: ThreadMetadataGenerationOutcomeReason;
}

interface RawGeneratedThreadMetadata {
  section?: string;
  title: string;
}

function cleanPromptText(input: PromptInput[]): string {
  return input
    .filter((part) => part.type === "text")
    .map((part) => part.text.trim())
    .join(" ")
    .replace(/\s+/gu, " ")
    .trim();
}

export function deriveTitleFallback(input: PromptInput[]): string | null {
  const text = cleanPromptText(input);
  if (text.length === 0) {
    return null;
  }
  return text.length <= 80 ? text : `${text.slice(0, 77)}...`;
}

export function shouldGenerateThreadTitle(input: PromptInput[]): boolean {
  const text = cleanPromptText(input);
  if (text.length === 0) {
    return false;
  }

  return text.split(/\s+/u).length >= MIN_TITLE_GENERATION_WORDS;
}

export function sanitizeGeneratedTitle(value: string): string | null {
  const words = value
    .trim()
    .replace(/\s+/gu, " ")
    .split(" ")
    .filter((word) => word.length > 0);

  const title = words.slice(0, MAX_GENERATED_TITLE_WORDS).join(" ");
  return title.length > 0 ? title : null;
}

export function sanitizeGeneratedBranchSlug(value: string): string | null {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/-{2,}/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, MAX_BRANCH_SLUG_LENGTH)
    .replace(/-+$/u, "");

  return slug.length > 0 ? slug : null;
}

const threadMetadataSchema = Type.Object({
  title: Type.String(),
});

const threadMetadataWithSectionSchema = Type.Object({
  section: Type.String(),
  title: Type.String(),
});

/**
 * Map the model's answer back to a real section id. The model is asked for a
 * name rather than an id because an opaque `sec_…` is nothing for it to reason
 * about, and a name it half-remembers is caught here: only an exact
 * case-insensitive match against the closed set counts, so a hallucinated or
 * stale name files nothing instead of filing wrongly.
 */
export function resolveGeneratedSectionId(
  value: string | undefined,
  sections: readonly ThreadSectionOption[],
): string | null {
  const name = value?.trim().toLowerCase();
  if (!name) {
    return null;
  }
  const match = sections.find(
    (section) => section.name.trim().toLowerCase() === name,
  );
  return match?.id ?? null;
}

function normalizeGeneratedThreadMetadata(
  parsed: RawGeneratedThreadMetadata | null,
  sections: readonly ThreadSectionOption[],
): GeneratedThreadMetadata | null {
  if (!parsed) {
    return null;
  }

  const title = parsed.title ? sanitizeGeneratedTitle(parsed.title) : null;
  const branchSlug = title ? sanitizeGeneratedBranchSlug(title) : null;
  const sectionId = resolveGeneratedSectionId(parsed.section, sections);
  if (!title && !branchSlug && !sectionId) {
    return null;
  }

  return {
    ...(branchSlug ? { branchSlug } : {}),
    ...(sectionId ? { sectionId } : {}),
    ...(title ? { title } : {}),
  };
}

export async function generateThreadMetadataWithOutcome(
  deps: LoggedWorkSessionDeps,
  args: ThreadMetadataGenerationArgs,
): Promise<ThreadMetadataGenerationOutcome> {
  const startedAt = Date.now();
  const fallback = deriveTitleFallback(args.input);
  const complete = (
    metadata: GeneratedThreadMetadata | null,
    reason?: ThreadMetadataGenerationOutcomeReason,
  ): ThreadMetadataGenerationOutcome => ({
    durationMs: Date.now() - startedAt,
    metadata,
    ...(reason ? { reason } : {}),
  });

  if (!fallback) {
    return complete(null, "empty-input");
  }
  if (!shouldGenerateThreadTitle(args.input)) {
    return complete(null, "too-short");
  }

  const sections = (args.sections ?? []).slice(0, MAX_SECTION_OPTIONS);
  const prompt = renderTemplate("generateThreadMetadata", {
    cleanedPrompt: fallback,
    sectionNames: sections.map((section) => `- ${section.name}`).join("\n"),
  });
  const maxAttempts = Math.max(1, args.timeoutMaxAttempts ?? 1);

  try {
    const inference = await inferenceCompleteWithFallback(deps, {
      label: "Thread metadata inference",
      logContext: { threadId: args.threadId },
      maxAttempts,
      prompt,
      retryDelayMs: INFERENCE_POLICY.threadMetadata.retryDelayMs,
      schema:
        sections.length > 0
          ? threadMetadataWithSectionSchema
          : threadMetadataSchema,
      timeoutMs: args.timeoutMs ?? INFERENCE_POLICY.threadMetadata.timeoutMs,
    });
    const metadata = normalizeGeneratedThreadMetadata(inference, sections);
    return complete(metadata, metadata ? undefined : "inference-unavailable");
  } catch (error) {
    return complete(
      null,
      error instanceof InferenceTimeoutError ? "timeout" : "failed",
    );
  }
}

export function applyGeneratedThreadTitle(
  deps: Pick<AppDeps, "db" | "hub">,
  args: ApplyGeneratedThreadTitleArgs,
): boolean {
  const title = args.title.trim();
  if (title.length === 0) {
    return false;
  }

  const currentThread = getThread(deps.db, args.threadId);
  if (!currentThread || currentThread.title) {
    return false;
  }

  updateThread(deps.db, deps.hub, args.threadId, {
    title,
  });

  return true;
}

/**
 * File a thread under an inferred section. Like the generated title, this only
 * ever fills a blank: a thread that already carries a section was placed by the
 * operator (or created inside one), and inference does not get to overrule that.
 * Child threads are skipped because sections group roots only.
 */
export function applyGeneratedThreadSection(
  // Only the write path is needed here, so the notifier is typed as the
  // narrow `DbNotifier` the update takes rather than the whole hub.
  deps: Pick<AppDeps, "db"> & { hub: DbNotifier },
  args: ApplyGeneratedThreadSectionArgs,
): boolean {
  const currentThread = getThread(deps.db, args.threadId);
  if (
    !currentThread ||
    currentThread.parentThreadId !== null ||
    currentThread.sectionId !== null
  ) {
    return false;
  }

  updateThread(deps.db, deps.hub, args.threadId, {
    sectionId: args.sectionId,
  });

  return true;
}
