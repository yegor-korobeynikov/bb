import { useMemo } from "react";
import { matchPath, Navigate, useLocation } from "react-router-dom";
// Route views render icons outside the shell's core set. Importing the
// extended registry here ships it as a static dependency of this route chunk,
// so those icons never flash blank waiting for an on-demand load.
import "@bb/shared-ui/icon-extended";
import {
  APP_ROOT_ROUTE_PATH,
  TENDO_HOME_PLUGIN_ID,
  TENDO_HOME_PANEL_PATH,
  getRootComposeRoutePath,
  LEGACY_PROJECT_COMPOSE_ROUTE_PATH,
  PLUGIN_PANEL_ROUTE_PATH,
} from "@/lib/route-paths";
import type { PaneContent } from "@/lib/split-layout";
import { useRouteState } from "@/hooks/useRouteState";
import { LegacyProjectComposeRedirect } from "./RootComposeView";
import { SplitThreadArea } from "./thread-detail/SplitThreadArea";

const ROOT_COMPOSE_CONTENT = { kind: "new-thread" } as const;

// The nav-panel chrome cache is written by usePluginNavPanelChrome the first
// time plugin frontends boot; its presence is the cheapest truthful signal
// that the Home space panel exists on this client.
function tendoHomePanelKnown(): boolean {
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key?.startsWith("bb.plugin-nav-panels") && key.includes(TENDO_HOME_PLUGIN_ID)) {
        return true;
      }
      if (key?.startsWith("bb.plugin-nav-panels")) {
        const raw = window.localStorage.getItem(key);
        if (raw && raw.includes(TENDO_HOME_PLUGIN_ID)) return true;
      }
    }
  } catch {
    /* storage unavailable -> composer fallback */
  }
  return false;
}

/**
 * Stable route owner for every page that can live in the split workspace.
 *
 * All supported URLs intentionally match the same outer `*` route in App.tsx.
 * Focus-driven URL changes therefore update `routeContent` without replacing
 * this component or remounting the split tree and its plugin/compose panes.
 */
export default function SplitWorkspaceRoute() {
  const location = useLocation();
  const { projectId, threadId, isThreadView } = useRouteState();
  const pluginMatch = matchPath(PLUGIN_PANEL_ROUTE_PATH, location.pathname);
  const legacyProjectMatch = matchPath(
    LEGACY_PROJECT_COMPOSE_ROUTE_PATH,
    location.pathname,
  );
  const pluginId = pluginMatch?.params.pluginId;
  const panelPath = pluginMatch?.params.panelPath;
  const pluginSubPath = pluginMatch?.params["*"] ?? "";

  const routeContent = useMemo<PaneContent | null>(() => {
    if (location.pathname === APP_ROOT_ROUTE_PATH) {
      // Tendo fork: the front door is the Home space panel. bb is the core,
      // not the product face; the composer answers at /compose (and every
      // in-app fallback reaches it through getRootComposeRoutePath()). If the
      // home-space plugin has never registered on this client, fall back to
      // the composer so a fresh install is never a dead screen.
      if (tendoHomePanelKnown()) {
        return {
          kind: "plugin-panel",
          pluginId: TENDO_HOME_PLUGIN_ID,
          panelPath: TENDO_HOME_PANEL_PATH,
          subPath: "",
        };
      }
      return ROOT_COMPOSE_CONTENT;
    }
    if (location.pathname === getRootComposeRoutePath()) {
      return ROOT_COMPOSE_CONTENT;
    }
    if (isThreadView && projectId && threadId) {
      return { kind: "thread", projectId, threadId };
    }
    if (pluginId && panelPath) {
      return {
        kind: "plugin-panel",
        pluginId,
        panelPath,
        subPath: pluginSubPath,
      };
    }
    return null;
  }, [
    isThreadView,
    location.pathname,
    panelPath,
    pluginId,
    pluginSubPath,
    projectId,
    threadId,
  ]);

  const legacyProjectId = legacyProjectMatch?.params.projectId;
  if (legacyProjectId) {
    return <LegacyProjectComposeRedirect projectId={legacyProjectId} />;
  }
  if (routeContent === null) {
    return <Navigate to={APP_ROOT_ROUTE_PATH} replace />;
  }
  return <SplitThreadArea routeContent={routeContent} />;
}
