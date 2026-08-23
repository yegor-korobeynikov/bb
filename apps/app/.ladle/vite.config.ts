import path from "path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { resolveCurrentDevInstanceConfig } from "@bb/config/runtime";
import { sharedUiEnvSeam } from "../vite-shared-ui-seam.js";
import { activeThemePlugin } from "./vite-active-theme.js";
import { existsSync, lstatSync, symlinkSync, unlinkSync } from "node:fs";
import { homedir } from "node:os";

const repoRoot = path.resolve(__dirname, "../../..");
const tendoPluginsDir =
  process.env.TENDO_PLUGINS_DIR ??
  path.join(homedir(), "bb-work", "second-brain", "_system", "bb-plugins");

// Tailwind v4 only scans sources inside the project it is compiled in, so a
// relative `@source` reaching out of this checkout silently generates nothing —
// the plugin's idle status dot came out fully transparent, a state the product
// does not have. A gitignored symlink puts the external checkout inside the
// root, where both Tailwind and Vite treat it as ordinary local source.
const tendoPluginsLink = path.resolve(__dirname, "tendo-plugins");
function linkTendoPlugins() {
  try {
    if (lstatSync(tendoPluginsLink, { throwIfNoEntry: false })) {
      unlinkSync(tendoPluginsLink);
    }
    if (existsSync(tendoPluginsDir)) {
      symlinkSync(tendoPluginsDir, tendoPluginsLink, "dir");
    }
  } catch {
    // Best effort: without the link those stories simply do not appear.
  }
}
linkTendoPlugins();
const devInstance = resolveCurrentDevInstanceConfig(repoRoot);
// Plugin RPCs accept only origins belonging to this checkout's app. Ladle is
// the local review proxy for that same app, including when viewed through a
// bb connect share, so present its upstream requests as the dev app origin.
const trustedDevAppHeaders = {
  origin: `http://localhost:${devInstance.ports.appPort}`,
};

// Ladle bundles Vite 6 (rollup) and provides its own React plugin via
// @vitejs/plugin-react-swc. The app's main vite.config.ts uses
// @vitejs/plugin-react@6, which only works inside rolldown-vite — loading it
// here crashes Ladle's transform pipeline with "Missing field `moduleType`".
export default defineConfig({
  plugins: [sharedUiEnvSeam(), tailwindcss(), activeThemePlugin()],
  // Keep app and Ladle dep optimization metadata from clobbering each other.
  cacheDir: "node_modules/.vite/ladle",
  worker: {
    format: "es",
  },
  resolve: {
    conditions: ["source"],
    // Stories can live in linked workspace packages outside apps/app. Always
    // resolve their React imports through Ladle's copy so the renderer and
    // story hooks cannot end up on different module instances after Vite's
    // dependency optimizer refreshes.
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "../src"),
      // Tendo's own plugins are checked out elsewhere; in-repo story files
      // re-export theirs through this alias so Ladle's globs stay in-root.
      "@tendo-plugins": tendoPluginsLink,
    },
  },
  // React 19's prebundled jsx-dev-runtime collapses to the production module
  // (which sets `jsxDEV = void 0`) when esbuild optimizes it as
  // NODE_ENV=production. Force a development define during dep optimization
  // so the dev runtime keeps the real `jsxDEV` export that Ladle's SWC
  // transform emits calls to.
  optimizeDeps: {
    esbuildOptions: {
      define: {
        "process.env.NODE_ENV": '"development"',
      },
    },
  },
  // Live page stories exercise the same queries, plugin bundles, and
  // mutations as the app. Proxy them to this checkout's isolated dev server
  // instead of reconstructing server state with Ladle-only fixtures.
  server: {
    // bb Connect shares use authenticated `<machine>--<port>.getbb.app` hosts.
    allowedHosts: [".getbb.app"],
    // Tendo's own plugins are stories outside this repo's root; Vite refuses to
    // serve files it was not told about.
    fs: {
      allow: [
        path.resolve(__dirname, "../../.."),
        ...(existsSync(tendoPluginsDir) ? [tendoPluginsDir] : []),
      ],
    },
    proxy: {
      "/api": {
        target: devInstance.serverUrl,
        changeOrigin: true,
        headers: trustedDevAppHeaders,
      },
      "/ws": {
        target: devInstance.serverUrl,
        changeOrigin: true,
        ws: true,
        headers: trustedDevAppHeaders,
      },
    },
  },
});
