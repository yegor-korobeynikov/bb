import { COARSE_POINTER_DOT_SIZE_CLASS } from "@bb/shared-ui/coarse-pointer-sizing";
import { CONTEXT_SELECTION_SURFACE_CLASS } from "@/components/ui/context-selection";

export const SIDEBAR_ROW_BASE_CLASS =
  "flex w-full items-center gap-2 rounded-md pr-0 text-sm transition-colors";

/**
 * Leading-glyph slot shared by sidebar rows (manager icon/chevron, worktree
 * header icon, app-row icon): centers the glyph and paints it in the subtle
 * foreground used for non-status row affordances. Call sites add the glyph box
 * sizing and any positioning they need.
 */
export const SIDEBAR_ROW_GLYPH_SLOT_CLASS =
  "inline-flex shrink-0 items-center justify-center text-subtle-foreground";

/**
 * The unread dot shared by a leaf thread row and a collapsed worktree header.
 * Inner styling only — call sites own wrapper, positioning, fade, and the
 * aria-label.
 */
export const SIDEBAR_UNREAD_DOT_CLASS = `rounded-full bg-foreground ${COARSE_POINTER_DOT_SIZE_CLASS}`;

export const SIDEBAR_WORKING_STATUS_COLOR_CLASS = "text-muted-foreground/50";

export const SIDEBAR_SUCCESS_STATUS_COLOR_CLASS = "text-success-foreground";

// Identity-glyph slot: the section / worktree icon box on a disclosure header.
export const SIDEBAR_LEADING_GLYPH_SLOT_CLASS =
  "inline-flex w-4 shrink-0 items-center justify-center";

const SIDEBAR_THREAD_ROW_BASE_PADDING_PX = 8;
const SIDEBAR_THREAD_ROW_DEPTH_STEP_PX = 24;
const SIDEBAR_THREAD_ROW_GLYPH_CENTER_OFFSET_PX = 8;

export const SIDEBAR_STANDARD_ROW_PADDING_CLASS = "pl-2";

export function getSidebarThreadRowPaddingLeft(depth: number): number {
  return (
    SIDEBAR_THREAD_ROW_BASE_PADDING_PX +
    depth * SIDEBAR_THREAD_ROW_DEPTH_STEP_PX
  );
}

/**
 * Tendo-canon padding-left for every sidebar row that carries depth —
 * ThreadRow, ProjectRow's header/drag rows, and SidebarSectionRow all resolve
 * through this one function now. The older `getSidebarThreadRowPaddingLeft`
 * below was left in place for those call sites for one pass (ProjectRow's
 * worktree/environment header rows "weren't part of this pass"); that gap
 * between the two formulas — 8+24×depth vs this function's 40+16×depth —
 * is what produced visibly inconsistent indentation across row types
 * (2026-08-22: measured live, not guessed — see
 * decision-tendo-sidebar-indent-formula-unification-v1).
 *
 * Ported from the same bb-plugin-task-tabs DOM patch the status dot was
 * ported from (2026-08-20 session) — ONE difference from that port: the
 * patch reached its 40px/16px targets by MEASURING live rendered positions
 * and correcting after the fact (`getBoundingClientRect` deltas against a
 * parent row), which is exactly the "changes shape after first paint" defect
 * the whole native-port effort exists to remove. A pure CSS formula can't
 * measure — it has to be told the same relationship the patch discovered
 * empirically: `--tendo-sidebar-edge-to-dot` is the padding a row's OWN
 * depth-0 position resolves to when nothing precedes the dot; a visible
 * chevron consumes some of that budget itself (accounted for by
 * `--tendo-sidebar-chevron-to-dot`, applied as the chevron's own
 * margin-right in ThreadRow.tsx, not here); each additional nesting level
 * beyond the row's own base adds one `--tendo-sidebar-indent-step`.
 *
 * UNVERIFIED against the live app as written — this session has no
 * `--remote-debugging-port` access to confirm the composition holds pixel
 * for pixel the way the status dot's port was confirmed by
 * `tendo-visual-verify.mjs`. Treat the exact numbers as the best available
 * reconstruction, not measured ground truth, until that check runs.
 */
export function getTendoSidebarThreadRowPaddingLeft(depth: number): string {
  return depth <= 0
    ? "var(--tendo-sidebar-edge-to-dot)"
    : `calc(var(--tendo-sidebar-edge-to-dot) + var(--tendo-sidebar-indent-step) * ${depth})`;
}

export function getSidebarThreadGroupLineLeft(depth: number): number {
  return (
    getSidebarThreadRowPaddingLeft(depth) +
    SIDEBAR_THREAD_ROW_GLYPH_CENTER_OFFSET_PX
  );
}

export const SIDEBAR_ROW_INTERACTIVE_STATE_CLASS =
  "cursor-pointer text-sidebar-foreground/85 dark:text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

// Header rows whose caret (not the row body) is the click target: project and
// section rows. Text color only — no row-level hover highlight.
export const SIDEBAR_ROW_STATIC_STATE_CLASS =
  "text-sidebar-foreground/85 dark:text-sidebar-foreground";

export const SIDEBAR_ROW_SELECTED_STATE_CLASS = `${CONTEXT_SELECTION_SURFACE_CLASS} bb-sidebar-selected-row text-sidebar-foreground`;

/**
 * A quieter marker for a thread that is open in an unfocused split pane.
 * theme.css resolves this tint against the sidebar to keep sticky parent rows
 * opaque while their descendants scroll underneath them.
 */
export const SIDEBAR_ROW_OPEN_IN_SPLIT_STATE_CLASS =
  "bb-sidebar-open-in-split-row";

export const SIDEBAR_MORE_ACTION_TRIGGER_CLASS =
  "relative m-1 h-5 w-5 after:absolute after:left-1/2 after:top-1/2 after:h-7 after:w-7 after:-translate-x-1/2 after:-translate-y-1/2 after:content-[''] max-md:pointer-coarse:m-0 max-md:pointer-coarse:h-9 max-md:pointer-coarse:w-9 max-md:pointer-coarse:after:hidden";

/**
 * When two `SIDEBAR_MORE_ACTION_TRIGGER_CLASS` buttons sit side by side, their
 * centered 28px pseudo-targets would overlap and the later sibling would win
 * clicks aimed at the earlier one. These variants re-anchor each target to
 * stretch 4px outward but stop 1px short of the shared edge (the midpoint of
 * a 2px gap), so every point between the glyphs belongs to exactly one button.
 */
export const SIDEBAR_PAIRED_ACTION_LEADING_TARGET_CLASS =
  "after:-left-1 after:-right-px after:w-auto after:translate-x-0";

export const SIDEBAR_PAIRED_ACTION_TRAILING_TARGET_CLASS =
  "after:-left-px after:-right-1 after:w-auto after:translate-x-0";

/**
 * Hairline that runs through an expanded project's thread list, sitting
 * under the center of the project chevron/section icon. The coarse-pointer
 * variant nudges the line a few px right to follow the larger icon.
 *
 * Z-index sits between the parent tiers (z-40 and below) and the project
 * tier (z-50) so the line paints over parent rows and ordinary thread rows
 * (showing through their hover/active backgrounds) but a stuck project row
 * covers it cleanly.
 */
export const SIDEBAR_PROJECT_GROUP_LINE_CLASS =
  "before:pointer-events-none before:absolute before:bottom-0 before:left-4 before:top-0 before:z-[45] before:w-px before:bg-border-hairline before:opacity-70 before:content-[''] max-md:pointer-coarse:before:left-5";
