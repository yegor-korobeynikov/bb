import {
  appModeSchema,
  DEFAULT_APP_MODE,
  type AppMode,
  type FeatureFlags,
} from "@bb/domain";
import {
  readEnvVarWithDefault,
  resolveEnvLoader,
  type EnvLoaderArgs,
} from "./env.js";
import {
  BB_MODE_ENV,
  DEFAULT_BB_MODE,
  BB_FF_PLACEHOLDER_ENV,
  BB_FF_TIMELINE_WINDOW_EVENT_BUDGET_ENV,
  DEFAULT_BB_FF_PLACEHOLDER,
  DEFAULT_BB_FF_TIMELINE_WINDOW_EVENT_BUDGET,
} from "./env-vars.js";

type LoadFeatureFlagsArgs = EnvLoaderArgs;

export function loadFeatureFlags(
  args: LoadFeatureFlagsArgs = {},
): FeatureFlags {
  const loader = resolveEnvLoader(args);
  return {
    placeholder: readEnvVarWithDefault({
      context: loader.context,
      defaultValue: DEFAULT_BB_FF_PLACEHOLDER,
      definition: BB_FF_PLACEHOLDER_ENV,
      env: loader.env,
    }),
    timelineWindowEventBudget: readEnvVarWithDefault({
      context: loader.context,
      defaultValue: DEFAULT_BB_FF_TIMELINE_WINDOW_EVENT_BUDGET,
      definition: BB_FF_TIMELINE_WINDOW_EVENT_BUDGET_ENV,
      env: loader.env,
    }),
  };
}

/**
 * The build's mode, read once at server start. An unrecognised value falls back
 * to the working build rather than to prod: a typo must never silently produce
 * a "public" server that quietly hides surfaces the operator still needs.
 */
export function loadAppMode(args: LoadFeatureFlagsArgs = {}): AppMode {
  const loader = resolveEnvLoader(args);
  const raw = readEnvVarWithDefault({
    context: loader.context,
    defaultValue: DEFAULT_BB_MODE,
    definition: BB_MODE_ENV,
    env: loader.env,
  });
  const parsed = appModeSchema.safeParse(raw);
  return parsed.success ? parsed.data : DEFAULT_APP_MODE;
}
