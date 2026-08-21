/**
 * Leading status marker on every sidebar thread row.
 *
 * Ported from the DOM-patch that `bb-plugin-task-tabs` applied from outside
 * the React tree. That patch worked, but it ran after first paint, so the
 * sidebar visibly changed shape on load. Everything below — the sizes, the
 * vertical correction, the hidden-not-removed rule, the outline variant —
 * was measured or decided during that plugin's life; this is the same
 * behaviour, drawn by the app that owns the row.
 *
 * Four states, per the Tendo canon (tendo-design-system/DESIGN.md):
 *   blocked  filled, Hot Accent   — a question or approval is waiting on you
 *   unread   filled, Teal Blue    — the agent said something you haven't read
 *   done     filled, Field Olive  — a session with nothing waiting
 *   idle     hollow outline       — a track with nothing waiting
 *
 * The colours come from the Ink Plates palette rather than stock
 * red/green/blue, and resolve from `--tendo-*` in tendo-tokens.css.
 */

export type SidebarThreadStatus = "blocked" | "unread" | "done" | "idle";

const STATUS_COLOR: Record<Exclude<SidebarThreadStatus, "idle">, string> = {
  blocked: "var(--tendo-status-blocked)",
  unread: "var(--tendo-status-unread)",
  done: "var(--tendo-status-done)",
};

const STATUS_LABEL: Record<SidebarThreadStatus, string> = {
  blocked: "Needs your input",
  unread: "New message, not read yet",
  done: "Idle — nothing waiting on you",
  idle: "Idle — nothing waiting on you",
};

export interface SidebarThreadStatusDotProps {
  status: SidebarThreadStatus;
  /**
   * True while the app draws its own runtime spinner for this row. The dot
   * then reserves its box but paints nothing: two "something is happening"
   * signals on one row read as noise, and `display: none` here would move
   * the title every time a thread started or stopped running.
   */
  isReserved: boolean;
}

export function SidebarThreadStatusDot({
  status,
  isReserved,
}: SidebarThreadStatusDotProps) {
  const isOutline = status === "idle";

  return (
    <span
      data-sidebar-thread-status-dot={status}
      // While reserved the element is a pure spacer: visibility:hidden already
      // takes it out of the accessibility tree, so announcing a status here
      // would be a label nobody can reach. The row's own runtime indicator is
      // what says "working" — this just holds the width so the title stays put.
      {...(isReserved
        ? { "aria-hidden": true as const }
        : { role: "img", "aria-label": STATUS_LABEL[status], title: STATUS_LABEL[status] })}
      style={{
        // `top` is a measured correction, not a guess: vertical-align centres
        // on the font's x-height box rather than the row's own box, and a
        // debug pass across seven rows found the same 1.4px low offset every
        // time. border-box keeps the outline variant the same 5px footprint
        // as a filled one instead of growing it by the border width.
        display: "inline-block",
        position: "relative",
        top: "-1.4px",
        width: "var(--tendo-status-dot-size)",
        height: "var(--tendo-status-dot-size)",
        borderRadius: "50%",
        boxSizing: "border-box",
        // No margin: the row's flex container already spaces its children
        // (gap-1.5 = 6px), which is the same gap the plugin hardcoded back
        // when the dot sat inline inside the label instead of beside it.
        flexShrink: 0,
        verticalAlign: "middle",
        visibility: isReserved ? "hidden" : "visible",
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
 * `blocked` outranks everything, including an active runtime: a question
 * waiting on you matters more than "it is thinking". Otherwise a quiet row
 * reads as `idle` (hollow) when it is a track and `done` (filled) when it is
 * a session — a top-level session's quiet state is a real status, a child
 * track's is the absence of one.
 */
export function resolveSidebarThreadStatus(args: {
  hasPendingInteraction: boolean;
  isUnread: boolean;
  isChildThread: boolean;
}): SidebarThreadStatus {
  // The plugin also OR'd in `indicator === "waiting-for-input"` as a safety
  // net against the two disagreeing. Natively they cannot: the indicator is
  // derived from this same flag by resolveThreadListIndicator.
  if (args.hasPendingInteraction) {
    return "blocked";
  }
  if (args.isUnread) {
    return "unread";
  }
  return args.isChildThread ? "idle" : "done";
}
