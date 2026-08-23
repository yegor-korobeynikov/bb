// Tendo's own plugins are checked out outside this repo, and Ladle only globs
// stories under its own root. This file is the in-root entry point: the stories
// themselves live next to the components they show, in the plugin, so they
// cannot drift from it.
//
// Each story is a one-line wrapper rather than a re-export, because Ladle
// discovers stories by parsing this file's AST: neither `export *` nor
// `export const X = imported.X` registers anything. A declared component does.
//
// Resolved through the `@tendo-plugins` alias (see .ladle/vite.config.ts), which
// points at the canonical plugin checkout — override with TENDO_PLUGINS_DIR.
// @ts-expect-error -- resolved by the Ladle-only alias, not by tsconfig
import * as taskTracks from "@tendo-plugins/bb-plugin-task-tabs/ui.stories";

export default {
  title: "Tendo/Task tracks",
};

export function TrackRow() {
  return <taskTracks.TrackRow />;
}

export function StatusDots() {
  return <taskTracks.StatusDots />;
}

export function UpdateDots() {
  return <taskTracks.UpdateDots />;
}

export function Glyphs() {
  return <taskTracks.Glyphs />;
}

export function PaletteDrift() {
  return <taskTracks.PaletteDrift />;
}
