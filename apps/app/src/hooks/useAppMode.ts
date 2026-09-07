import {
  DEFAULT_APP_MODE,
  isSurfaceVisible,
  type AppMode,
  type ProdHiddenSurface,
} from "@bb/domain";
import { useSystemConfig } from "@/hooks/queries/system-queries";

/**
 * Which build this is. Set by the operator at server start (`BB_MODE`), so it
 * cannot change under a demo.
 *
 * While the config is still loading the answer is the WORKING build: guessing
 * "prod" would flash a hidden surface into view and then remove it, which reads
 * worse than showing it steadily.
 */
export function useAppMode(): AppMode {
  const { data } = useSystemConfig();
  return data?.appMode ?? DEFAULT_APP_MODE;
}

/** True in the public build — for copy and affordances, not for gating. */
export function useIsProd(): boolean {
  return useAppMode() === "prod";
}

/**
 * Should this surface render? The public build hides the developer-facing
 * register (see PROD_HIDDEN_SURFACES); the working build shows everything.
 *
 * Hiding, never disabling: the capability is untouched, so nothing downstream
 * has to handle a "missing" feature — only the presentation changes.
 */
export function useSurfaceVisible(surface: ProdHiddenSurface): boolean {
  return isSurfaceVisible(surface, useAppMode());
}
