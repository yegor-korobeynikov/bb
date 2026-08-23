import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import type { Plugin } from "vite";

const VIRTUAL_ID = "virtual:bb-active-theme";
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

/**
 * Resolve the CSS of the palette bb is CURRENTLY running, so the gallery and
 * the app cannot show different colors.
 *
 * `bb theme show --css` is the authoritative answer: bb owns which theme is
 * active (server-side state) and where custom themes live on disk. Shelling out
 * keeps this repo free of a second copy of the palette — the exact duplication
 * that made the plugin and the theme file disagree before they were consolidated
 * (decision-tendo-design-system-deferred-for-feature-velocity-v1).
 *
 * Fallbacks, in order: the CLI, then a single custom theme found on disk (the
 * common case when no bb server is reachable), then the default palette (empty
 * string — base theme.css tokens show through, gallery still works).
 */
export function resolveActiveThemeCss(): { css: string; source: string } {
  try {
    const css = execFileSync("bb", ["theme", "show", "--css"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 10_000,
    });
    if (css.trim()) return { css, source: "bb theme show --css" };
  } catch {
    // bb not on PATH, or no server to ask — fall through to disk.
  }

  const themeDir = path.join(homedir(), ".bb", "theme");
  if (existsSync(themeDir)) {
    const candidates = readdirSync(themeDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(themeDir, entry.name, "theme.css"))
      .filter((file) => existsSync(file));
    // Only unambiguous when exactly one custom theme exists; with several we
    // cannot know which is active without bb, and guessing would be a lie.
    if (candidates.length === 1) {
      return {
        css: readFileSync(candidates[0], "utf8"),
        source: path.relative(homedir(), candidates[0]),
      };
    }
  }

  return { css: "", source: "default palette (no custom theme resolved)" };
}

/**
 * Serves the active palette to the gallery as `virtual:bb-active-theme`.
 * Resolved once at dev-server start; restart Ladle after editing theme.css.
 */
export function activeThemePlugin(): Plugin {
  let cached: { css: string; source: string } | null = null;

  return {
    name: "bb-active-theme",
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },
    load(id) {
      if (id !== RESOLVED_ID) return null;
      cached ??= resolveActiveThemeCss();
      return [
        `export const activeThemeCss = ${JSON.stringify(cached.css)};`,
        `export const activeThemeSource = ${JSON.stringify(cached.source)};`,
      ].join("\n");
    },
    configureServer() {
      cached ??= resolveActiveThemeCss();
      const size = cached.css.length;
      process.stdout.write(
        `[gallery] palette: ${cached.source}${size ? ` (${size} bytes)` : ""}\n`,
      );
    },
  };
}
