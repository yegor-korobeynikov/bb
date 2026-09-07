import { z } from "zod";

/**
 * A report sent from the PUBLIC build to the WORKING build.
 *
 * The two builds are deliberately different code — the public one is pinned to
 * a reviewed tag, the working one runs ahead — so a bug found while demoing
 * cannot be fixed where it was found. This carries it across, with enough
 * context that the fix can start without an interview: which build, which
 * commit, which screen, what the person saw.
 *
 * It travels as a file in a shared directory rather than an API call, so a
 * report survives the working build being closed at that moment: it is waiting
 * the next time it starts.
 */
export const buildFeedbackSchema = z.object({
  id: z.string(),
  /** Epoch ms, stamped where the report was written. */
  createdAt: z.number(),
  /** What the person typed. The only required human input. */
  note: z.string().min(1),
  /** Which build the report came FROM. */
  from: z.object({
    mode: z.string(),
    appVersion: z.string(),
    /** The commit the reporting build runs, so the fix knows what it is diffing against. */
    buildId: z.string(),
  }),
  /** Where in the product it happened. */
  where: z.object({
    /** Route path at the moment of the report. */
    route: z.string(),
    /** Visible thread, when the report was filed from one. */
    threadId: z.string().nullable(),
    /** True when demonstration mode was masking names — a detail that changes what a screenshot means. */
    incognito: z.boolean(),
  }),
  /** Console errors seen in this session, newest last. Empty when the surface simply looked wrong. */
  recentErrors: z.array(z.string()),
});
export type BuildFeedback = z.infer<typeof buildFeedbackSchema>;

/** Directory both builds agree on. Under the user's home, not either data dir. */
export const BUILD_FEEDBACK_DIR_NAME = ".tendo-feedback";

/**
 * Renders a report as the body of a thread in the working build. Written for
 * an agent to act on: the ask first, the context under it, no ceremony.
 */
export function formatBuildFeedback(feedback: BuildFeedback): string {
  const lines = [
    feedback.note.trim(),
    "",
    "---",
    `Reported from the ${feedback.from.mode} build (${feedback.from.appVersion}, build ${feedback.from.buildId}).`,
    `Screen: ${feedback.where.route}` +
      (feedback.where.threadId === null ? "" : ` · thread ${feedback.where.threadId}`),
  ];
  if (feedback.where.incognito) {
    lines.push(
      "Demonstration mode was on, so names on that screen were stand-ins.",
    );
  }
  if (feedback.recentErrors.length > 0) {
    lines.push("", "Errors in that session:");
    for (const error of feedback.recentErrors.slice(-5)) lines.push(`- ${error}`);
  }
  return lines.join("\n");
}
