import { useCallback } from "react";
import type { Thread } from "@bb/domain";
import {
  buildTrackThreadRequest,
  resolveTrackIsolateHostId,
  type TrackParentThread,
  type TrackThreadRequestFailure,
} from "@bb/client-core";
import { sdk } from "@/lib/sdk";
import { getThreadDisplayTitle } from "@/lib/thread-title";
import { useSystemConfig } from "@/hooks/queries/system-queries";
import { useCreateThread } from "./thread-runtime-mutations";

/**
 * Native "New track" — the app-side half of
 * decision-tendo-tracks-are-core-not-plugin-v1.
 *
 * Builds the request through `@bb/client-core` (the shared, React-free home
 * of the track concept) and sends it through the same `useCreateThread`
 * pipeline every other thread creation uses, so the sidebar cache picks the
 * new child up exactly like a normally created thread — no bespoke
 * invalidation, no plugin RPC in between.
 *
 * What the caller (the sidebar row) supplies is deliberately small: the
 * parent thread entry it already renders, how many direct children it
 * already shows, and whether the track should share the task's environment
 * or get its own managed worktree.
 */

export interface CreateTrackArgs {
  parentThread: TrackParentThread & Pick<Thread, "title" | "titleFallback">;
  /** Direct children the task already has — drives the "Track N" title. */
  existingChildCount: number;
  /** Own managed worktree (true) or share the task's environment (false). */
  isolate: boolean;
}

export type CreateTrackResult =
  | { ok: true; thread: Awaited<ReturnType<typeof sdk.threads.spawn>> }
  | { ok: false; failure: TrackThreadRequestFailure };

export function useCreateTrack(): {
  createTrack: (args: CreateTrackArgs) => Promise<CreateTrackResult>;
  isPending: boolean;
} {
  const createThread = useCreateThread();
  const systemConfig = useSystemConfig();
  const primaryHostId = systemConfig.data?.primaryHostId ?? null;

  const createTrack = useCallback(
    async (args: CreateTrackArgs): Promise<CreateTrackResult> => {
      let isolateHostId: string | null = null;
      if (args.isolate) {
        // Only isolated tracks need a host; don't pay the project fetch
        // for the common shared-environment case.
        const project = await sdk.projects.get({
          projectId: args.parentThread.projectId,
        });
        isolateHostId = resolveTrackIsolateHostId({
          projectSources: project.sources,
          primaryHostId,
        });
      }

      const built = buildTrackThreadRequest({
        parentThread: args.parentThread,
        taskTitle: getThreadDisplayTitle({
          id: args.parentThread.id,
          title: args.parentThread.title,
          titleFallback: args.parentThread.titleFallback,
        }),
        existingChildCount: args.existingChildCount,
        isolate: args.isolate,
        isolateHostId,
      });
      if (!built.ok) {
        return built;
      }
      const thread = await createThread.mutateAsync(built.request);
      return { ok: true, thread };
    },
    [createThread, primaryHostId],
  );

  return { createTrack, isPending: createThread.isPending };
}
