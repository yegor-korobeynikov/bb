import { z } from "zod";

/**
 * Which build a person is looking at.
 *
 * - `staging` — the working app. New work lands here first; it may be several
 *   commits ahead, it may be broken, and every developer-facing surface is on.
 * - `prod` — the public build, the one shown to clients and colleagues. It runs
 *   a tested state and hides the surfaces that make a product read as a tool
 *   for developers.
 *
 * Set by the operator at server start (`BB_MODE`), never by a click: a demo
 * must not be one stray toggle away from the developer surface, and the server
 * has to answer consistently for the whole session.
 */
export const appModeSchema = z.enum(["prod", "staging"]);
export type AppMode = z.infer<typeof appModeSchema>;

export const DEFAULT_APP_MODE: AppMode = "staging";

/**
 * Surfaces the public build hides. Each entry names ONE thing a viewer would
 * otherwise see; the id is what the UI checks, so adding a surface is a line
 * here plus one call site.
 *
 * The list is deliberately about PERCEPTION, not capability: nothing here is
 * disabled, only hidden from the public build, and everything stays available
 * in staging.
 */
export const PROD_HIDDEN_SURFACES = [
  /** Repo, worktree and branch chips under the composer. */
  "git-context",
  /** Model and reasoning-effort pickers. */
  "model-picker",
  /** The approval-policy control ("Approve for me"). */
  "approval-policy",
  /** Plugin management: install, reload, marketplace. */
  "extensions",
  /** Experiment toggles in settings. */
  "experiments",
  /** Terminal sessions. */
  "terminal",
  /** Raw agent/runtime errors ("host daemon disconnected", retry affordances). */
  "runtime-errors",
  /** Token and cost counters. */
  "usage-counters",
  /** Environment and machine internals (host ids, data dirs, ports). */
  "environment-internals",
] as const;
export type ProdHiddenSurface = (typeof PROD_HIDDEN_SURFACES)[number];

/**
 * Is a surface visible in this mode? The public build hides the register
 * above; the working build shows everything.
 */
export function isSurfaceVisible(
  surface: ProdHiddenSurface,
  mode: AppMode,
): boolean {
  return mode !== "prod" || !PROD_HIDDEN_SURFACES.includes(surface);
}
