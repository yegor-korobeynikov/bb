import type { ProjectSource, Thread } from "@bb/domain";
import type { CreateThreadRequest } from "@bb/server-contract";
import type { AppCreateThreadRequest } from "../api-types.js";

/**
 * Tracks — the native home (decision-tendo-tracks-are-core-not-plugin-v1).
 *
 * A track is a child thread of a task thread, opened from the sidebar row:
 * it inherits the task's provider, starts with a short intake prompt, and
 * either shares the task's environment or gets its own managed worktree.
 * None of that needs server support beyond the existing `POST /threads`
 * (parentThreadId, providerId, environment, title are all already part of
 * the create contract), so the concept lives here — in the client core,
 * React-free and unit-tested — and every surface (app sidebar, CLI, a
 * future mobile row action) builds the same request through this module.
 *
 * Ported from bb-plugin-task-tabs' `openTrack` RPC + `intakePrompt`, which
 * were built entirely on `bb.sdk.*` primitives and carried no plugin state.
 */

export const TRACK_TITLE_PREFIX = "Track";

/** "Track N" where N is one past the task's existing direct children. */
export function buildTrackTitle(existingChildCount: number): string {
  const next = Math.max(0, Math.floor(existingChildCount)) + 1;
  return `${TRACK_TITLE_PREFIX} ${next}`;
}

/**
 * The first message a freshly opened track receives. Agent-facing, so it
 * stays in the working language of the sessions (Russian) — it is not UI
 * copy. Verbatim from the plugin so behaviour does not shift in the move.
 */
export function buildTrackIntakePrompt(args: {
  trackTitle: string;
  taskTitle: string;
}): string {
  return [
    `Ты — ${args.trackTitle}, параллельный трек внутри задачи «${args.taskTitle}».`,
    "",
    "Пока ты знаешь только, что тебя открыли. Сделай ровно это:",
    "1. Спроси коротко, над чем работаем в этом треке — одним вопросом, без списка.",
    '2. Как только предмет ясен, переименуй себя: `bb thread update --self --title "<3-5 слов>"`.',
    "3. Скажи одной строкой, что ты в своей копии файлов (изменения не заденут соседние треки).",
    "",
    "Не начинай работу до ответа. Не пересказывай эту инструкцию.",
  ].join("\n");
}

/**
 * Which host an isolated track's managed worktree is created on: the
 * project's default source host, else its first local source's host, else
 * the machine's primary host. Null when none of those exist.
 */
export function resolveTrackIsolateHostId(args: {
  projectSources: readonly ProjectSource[];
  primaryHostId: string | null;
}): string | null {
  const defaultSource = args.projectSources.find((source) => source.isDefault);
  if (defaultSource !== undefined) return defaultSource.hostId;
  const firstSource = args.projectSources[0];
  if (firstSource !== undefined) return firstSource.hostId;
  return args.primaryHostId;
}

export type TrackParentThread = Pick<
  Thread,
  "id" | "projectId" | "providerId" | "environmentId"
>;

export type TrackThreadRequestFailure =
  | { kind: "parent-has-no-environment" }
  | { kind: "no-host-for-isolated-track" };

export interface BuildTrackThreadRequestArgs {
  parentThread: TrackParentThread;
  /** Display title of the task, for the intake prompt. */
  taskTitle: string;
  /** Direct children the task already has — drives "Track N". */
  existingChildCount: number;
  /** Own managed worktree (true) or share the task's environment (false). */
  isolate: boolean;
  /** Required only when `isolate` is true; see resolveTrackIsolateHostId. */
  isolateHostId?: string | null;
}

export type BuildTrackThreadRequestResult =
  | { ok: true; request: AppCreateThreadRequest; title: string }
  | { ok: false; failure: TrackThreadRequestFailure };

export function buildTrackThreadRequest(
  args: BuildTrackThreadRequestArgs,
): BuildTrackThreadRequestResult {
  let environment: CreateThreadRequest["environment"];
  if (args.isolate) {
    if (!args.isolateHostId) {
      return { ok: false, failure: { kind: "no-host-for-isolated-track" } };
    }
    environment = {
      type: "host",
      hostId: args.isolateHostId,
      workspace: { type: "managed-worktree", baseBranch: { kind: "default" } },
    };
  } else {
    if (args.parentThread.environmentId === null) {
      return { ok: false, failure: { kind: "parent-has-no-environment" } };
    }
    environment = { type: "reuse", environmentId: args.parentThread.environmentId };
  }

  const title = buildTrackTitle(args.existingChildCount);
  const prompt = buildTrackIntakePrompt({ trackTitle: title, taskTitle: args.taskTitle });

  return {
    ok: true,
    title,
    request: {
      environment,
      input: [{ type: "text", text: prompt, mentions: [] }],
      parentThreadId: args.parentThread.id,
      projectId: args.parentThread.projectId,
      providerId: args.parentThread.providerId,
      title,
    },
  };
}
