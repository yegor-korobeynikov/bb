/**
 * Leading status marker on every sidebar thread row.
 *
 * Ported from the DOM-patch that `bb-plugin-task-tabs` applied from outside
 * the React tree. That patch worked, but it ran after first paint, so the
 * sidebar visibly changed shape on load. The sizes and the vertical
 * correction below were measured during that plugin's life; the states are
 * Yegor's, agreed 2026-08-23 against a prototype.
 *
 * Four states. The dot reports what the AGENT is doing and nothing else —
 * in particular it no longer goes hollow merely because the row is a child.
 * A track and a session in the same state look the same, because to the
 * reader they mean the same thing:
 *
 *   working  Amber Rule  — the agent is working in this session
 *   done     Field Olive — the agent considers the task finished; your turn
 *   blocked  Hot Accent  — it cannot go on without an answer from you
 *   asleep   hollow      — read, nothing pending, and quiet for a while
 *
 * Two rules make the scheme readable rather than decorative:
 *
 * 1. The dot is ALWAYS painted. It used to be hidden outright while the row
 *    ran its own spinner, which is what produced a name with nothing in
 *    front of it that came and went on its own. "Working" is a state, so it
 *    gets a colour like every other state.
 * 2. Only a session that needs nothing from you fades. Anything awaiting
 *    your input or your review keeps its colour indefinitely, however old
 *    it is — fading is for things you are done with, never a way for
 *    something that wants you to quietly disappear.
 *
 * The colours resolve from `--tendo-*` in tendo-tokens.css, drawn from the
 * Ink Plates palette rather than stock red/amber/green.
 */

export type SidebarThreadStatus = "working" | "done" | "blocked" | "asleep";

const STATUS_COLOR: Record<Exclude<SidebarThreadStatus, "asleep">, string> = {
  working: "var(--tendo-status-working)",
  done: "var(--tendo-status-done)",
  blocked: "var(--tendo-status-blocked)",
};

const STATUS_LABEL: Record<SidebarThreadStatus, string> = {
  working: "Working",
  done: "Finished — waiting for you to look",
  blocked: "Needs your input",
  asleep: "Idle",
};

/**
 * How long a session that needs nothing from you stays coloured before it
 * fades to the hollow marker (Yegor, 2026-08-23). Deliberately hours rather
 * than days: a week-old session usually no longer exists, so a multi-day
 * threshold would have meant the hollow state was never reached in practice.
 */
export const SIDEBAR_THREAD_ASLEEP_AFTER_MS = 8 * 60 * 60 * 1000;

export interface SidebarThreadStatusDotProps {
  status: SidebarThreadStatus;
}

export function SidebarThreadStatusDot({
  status,
}: SidebarThreadStatusDotProps) {
  const isOutline = status === "asleep";

  return (
    <span
      data-sidebar-thread-status-dot={status}
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
          ? "1px solid var(--tendo-status-idle-border)"
          : "none",
      }}
    />
  );
}

/**
 * Which marker a row gets.
 *
 * Order matters and encodes the priority these states have for the reader:
 * being asked something outranks the agent being busy, which outranks
 * anything about how long ago the row last moved. Only the last case can
 * fade, which is the point of the ordering — a row that wants something
 * from you can never age out of view.
 */
export function resolveSidebarThreadStatus(args: {
  hasPendingInteraction: boolean;
  isRuntimeBusy: boolean;
  isUnread: boolean;
  lastActivityAtMs: number | null;
  nowMs: number;
}): SidebarThreadStatus {
  if (args.hasPendingInteraction) {
    return "blocked";
  }
  if (args.isRuntimeBusy) {
    return "working";
  }
  // Unread means the agent finished and you have not looked yet, so this is
  // squarely your turn and never fades, however long it sits.
  if (args.isUnread) {
    return "done";
  }
  // Read, quiet, nothing pending: the only state allowed to age out. A row
  // with no timestamp at all is treated as still fresh rather than assumed
  // stale — inventing an age would fade rows for want of data.
  if (
    args.lastActivityAtMs !== null &&
    args.nowMs - args.lastActivityAtMs >= SIDEBAR_THREAD_ASLEEP_AFTER_MS
  ) {
    return "asleep";
  }
  return "done";
}
