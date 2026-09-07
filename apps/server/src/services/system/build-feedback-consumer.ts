import { getThread, listProjects } from "@bb/db";
import type { LoggedPendingInteractionWorkSessionDeps } from "../../types.js";
import {
  deleteBuildFeedback,
  readPendingBuildFeedback,
} from "../../routes/build-feedback.js";
import { createThreadFromRequest } from "../threads/thread-create.js";

type BuildFeedbackConsumerDeps = LoggedPendingInteractionWorkSessionDeps;

/**
 * Which project a report becomes a thread in. A report filed from a visible
 * thread lands in that thread's project — the bug was seen there, the fix
 * belongs there. Otherwise it falls back to the oldest project, the closest
 * thing this single-operator setup has to a default.
 */
function resolveTargetProjectId(
  deps: BuildFeedbackConsumerDeps,
  sourceThreadId: string | null,
): string | null {
  if (sourceThreadId !== null) {
    const sourceThread = getThread(deps.db, sourceThreadId);
    if (sourceThread && sourceThread.deletedAt === null) {
      return sourceThread.projectId;
    }
  }
  const projects = listProjects(deps.db);
  return projects[0]?.id ?? null;
}

/**
 * A thread started from someone else's text, not a live conversation, has no
 * standing to edit code on its first move: it has to earn that by showing the
 * report is real first. Reproduce and diagnose before touching anything.
 */
function formatFirstTurnPrompt(reportBody: string): string {
  return [
    "A report arrived from the public build. Before changing any code: reproduce it if you can, and find the root cause. Only propose or make a fix once you have.",
    "",
    reportBody,
  ].join("\n");
}

/**
 * Turns reports filed from the public build into threads here, running
 * immediately: the point of the channel is that the working build finds out
 * about the bug and starts on it itself, not that it waits for a person to
 * say go. Runs only in the working build: the public build is where reports
 * are filed, never where they land.
 */
export async function runBuildFeedbackConsumerSweep(
  deps: BuildFeedbackConsumerDeps,
): Promise<void> {
  if (deps.config.appMode === "prod") return;
  const items = readPendingBuildFeedback();
  for (const item of items) {
    const projectId = resolveTargetProjectId(deps, item.threadId);
    if (projectId === null) {
      deps.logger.warn(
        { buildFeedbackId: item.id },
        "Build feedback has no project to land in; leaving it queued",
      );
      continue;
    }
    try {
      await createThreadFromRequest(deps, {
        environment: { type: "project-default" },
        input: [
          {
            type: "text",
            text: formatFirstTurnPrompt(item.body),
            mentions: [],
          },
        ],
        origin: "app",
        originKind: null,
        projectId,
        startedOnBehalfOf: null,
        title: item.note.slice(0, 80),
      });
      deleteBuildFeedback(item.id);
    } catch (error) {
      deps.logger.error(
        { err: error, buildFeedbackId: item.id },
        "Failed to turn build feedback into a thread",
      );
    }
  }
}
