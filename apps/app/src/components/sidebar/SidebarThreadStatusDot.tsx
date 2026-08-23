/**
 * Leading status marker on every sidebar thread row.
 *
 * Ported from the DOM-patch that `bb-plugin-task-tabs` applied from outside
 * the React tree. That patch worked, but it ran after first paint, so the
 * sidebar visibly changed shape on load. The sizes and the vertical
 * correction below were measured during that plugin's life; the states are
 * Yegor's, agreed 2026-08-23 against a prototype.
 *
 * The dot answers one question — **does this row want something from me?** —
 * and the answer is graded by how badly:
 *
 *   failed   Hot Accent  — it broke; nothing will proceed until you look
 *   blocked  Amber Rule  — it is asking you something and is waiting
 *   done     Teal Blue   — it finished; your turn to read and close it out
 *   working  grey, filled, breathing — running; nothing for you yet
 *   quiet    grey, hollow           — nothing for you here
 *
 * Two things follow from framing it that way rather than as "what is the
 * agent doing".
 *
 * A running row takes NO colour of its own. It asks nothing of you, so
 * giving it one of the three action colours would put it in competition with
 * the rows that do. Instead it takes the same neutral as `quiet` and differs
 * only in weight — filled rather than hollow — which is the difference that
 * actually reads in peripheral vision, where a colour hue at 5px does not.
 * The breathing is the second cue, never the only one: with motion switched
 * off the fill still separates a running row from a sleeping one, which is
 * why the state survives `prefers-reduced-motion`.
 *
 * Only `quiet` can be reached by the passage of time. Anything that wants
 * you keeps its colour however old it gets: an unanswered question going
 * quiet is exactly when it must stay visible.
 *
 * The colours resolve from `--tendo-*` in tendo-tokens.css, drawn from the
 * Ink Plates palette rather than stock red/amber/green.
 */

export type SidebarThreadStatus =
  | "failed"
  | "blocked"
  | "done"
  | "working"
  | "quiet";

const STATUS_COLOR: Record<Exclude<SidebarThreadStatus, "quiet">, string> = {
  failed: "var(--tendo-status-failed)",
  blocked: "var(--tendo-status-blocked)",
  done: "var(--tendo-status-done)",
  working: "var(--tendo-status-working)",
};

const STATUS_LABEL: Record<SidebarThreadStatus, string> = {
  failed: "Failed",
  blocked: "Needs your input",
  done: "Finished — waiting for you to look",
  working: "Working",
  quiet: "Nothing waiting on you",
};

/**
 * How long a row that needs nothing from you stays coloured before it goes
 * hollow (Yegor, 2026-08-23). Deliberately hours rather than days: a session
 * untouched for a week has usually been archived already, so a multi-day
 * threshold would have meant the hollow state was never reached.
 */
export const SIDEBAR_THREAD_QUIET_AFTER_MS = 8 * 60 * 60 * 1000;

export interface SidebarThreadStatusDotProps {
  status: SidebarThreadStatus;
}

export function SidebarThreadStatusDot({
  status,
}: SidebarThreadStatusDotProps) {
  const isOutline = status === "quiet";

  return (
    <span
      data-sidebar-thread-status-dot={status}
      // The animation lives in a class because keyframes cannot be expressed
      // inline, and it is switched off under prefers-reduced-motion there.
      className={status === "working" ? "tendo-status-dot-working" : undefined}
      role="img"
      aria-label={STATUS_LABEL[status]}
      title={STATUS_LABEL[status]}
      style={{
        // A decorative marker must never intercept the row's click target: the
        // invisible full-row <a> sits behind it, and every other glyph in this
        // file (working spinner, plugin status, draft icon) is pointer-events-
        // none for the same reason. Missing here, this element's own 5px
        // footprint silently swallowed clicks landing exactly on it.
        pointerEvents: "none",
        // No `top` correction. There used to be one — `position: relative;
        // top: -1.4px` — measured back when the dot sat in an inline flow and
        // `vertical-align: middle` centred it on the font's x-height box
        // instead of the row's. That correction outlived its cause: the dot's
        // only call site (ThreadRow) now puts it in a flex container with
        // `items-center`, where flex centres it on the line box and
        // vertical-align is inert. The nudge was therefore no longer
        // compensating for anything — it was the whole misalignment.
        //
        // Measured on the live app 2026-08-22, all 22 mounted dots: dot centre
        // sat exactly -1.40px above its title's centre, identical on every row;
        // setting top to 0 put every one of them at exactly 0.00. The dot is
        // also within 0.05px of the title's cap-height centre there, so this is
        // optically centred, not merely box-centred.
        //
        // border-box keeps the hollow variant the same 5px footprint as a
        // filled one instead of growing it by the border width.
        display: "inline-block",
        width: "var(--tendo-status-dot-size)",
        height: "var(--tendo-status-dot-size)",
        borderRadius: "50%",
        boxSizing: "border-box",
        // No margin: the row's flex container already spaces its children
        // (gap-1.5 = 6px), which is the same gap the plugin hardcoded back
        // when the dot sat inline inside the label instead of beside it.
        flexShrink: 0,
        verticalAlign: "middle",
        background: isOutline ? "transparent" : STATUS_COLOR[status],
        border: isOutline
          ? "1px solid var(--tendo-status-quiet-border)"
          : "none",
      }}
    />
  );
}

/**
 * Which marker a row gets.
 *
 * The order is the priority these states have for the reader: something
 * broken outranks something asking, which outranks a row that is merely
 * running, which outranks anything about how long ago it last moved.
 */
export function resolveSidebarThreadStatus(args: {
  hasFailed: boolean;
  hasPendingInteraction: boolean;
  isRuntimeBusy: boolean;
  isUnread: boolean;
  lastActivityAtMs: number | null;
  nowMs: number;
}): SidebarThreadStatus {
  if (args.hasFailed) {
    return "failed";
  }
  if (args.hasPendingInteraction) {
    return "blocked";
  }
  // Running. Below the two states that want you, above everything that does
  // not: a row you are already watching work should not also read as
  // "finished" or as "asleep for hours".
  if (args.isRuntimeBusy) {
    return "working";
  }
  // Unread means it finished and you have not looked yet — squarely your
  // turn, and it never fades however long it sits.
  if (args.isUnread) {
    return "done";
  }
  // Read, quiet, nothing pending: the only state that can age out. A row with
  // no timestamp is treated as fresh rather than assumed stale — fading for
  // want of data would retire rows that are merely undated.
  if (
    args.lastActivityAtMs !== null &&
    args.nowMs - args.lastActivityAtMs >= SIDEBAR_THREAD_QUIET_AFTER_MS
  ) {
    return "quiet";
  }
  return "done";
}
