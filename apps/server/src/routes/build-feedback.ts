import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import {
  BUILD_FEEDBACK_DIR_NAME,
  buildFeedbackSchema,
  formatBuildFeedback,
  type BuildFeedback,
} from "@bb/domain";
import type {
  BuildFeedbackRequest,
  BuildFeedbackResponse,
  PendingBuildFeedbackItem,
} from "@bb/server-contract";

/**
 * The queue both builds share.
 *
 * A directory rather than an API call between the two servers: a report filed
 * while the working build is closed still has to arrive, and a file that is
 * simply sitting there when it next starts is the least machinery that can
 * promise it. It also keeps the public build from needing to know the working
 * build's address, port or credentials.
 */
export function buildFeedbackDir(): string {
  return path.join(homedir(), BUILD_FEEDBACK_DIR_NAME);
}

function feedbackPath(dir: string, id: string): string {
  return path.join(dir, `${id}.json`);
}

export function writeBuildFeedback(args: {
  request: BuildFeedbackRequest;
  fromMode: string;
  appVersion: string;
  buildId: string;
}): BuildFeedbackResponse {
  const dir = buildFeedbackDir();
  mkdirSync(dir, { recursive: true });
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const feedback: BuildFeedback = {
    id,
    createdAt: Date.now(),
    note: args.request.note,
    from: {
      mode: args.fromMode,
      appVersion: args.appVersion,
      buildId: args.buildId,
    },
    where: {
      route: args.request.route,
      threadId: args.request.threadId,
      incognito: args.request.incognito,
    },
    recentErrors: args.request.recentErrors,
  };
  const target = feedbackPath(dir, id);
  writeFileSync(target, JSON.stringify(feedback, null, 2), "utf8");
  return { id, path: target };
}

/**
 * Reports waiting to be picked up. Unreadable or malformed files are skipped
 * rather than thrown: one corrupt file must not hide every other report.
 */
export function readPendingBuildFeedback(): PendingBuildFeedbackItem[] {
  const dir = buildFeedbackDir();
  let names: string[];
  try {
    names = readdirSync(dir).filter((name) => name.endsWith(".json"));
  } catch {
    return [];
  }
  const items: PendingBuildFeedbackItem[] = [];
  for (const name of names) {
    try {
      const raw = JSON.parse(readFileSync(path.join(dir, name), "utf8")) as unknown;
      const parsed = buildFeedbackSchema.safeParse(raw);
      if (!parsed.success) continue;
      const feedback = parsed.data;
      items.push({
        id: feedback.id,
        createdAt: feedback.createdAt,
        note: feedback.note,
        fromMode: feedback.from.mode,
        fromBuildId: feedback.from.buildId,
        route: feedback.where.route,
        body: formatBuildFeedback(feedback),
      });
    } catch {
      continue;
    }
  }
  return items.sort((left, right) => left.createdAt - right.createdAt);
}
