/**
 * Reads as metadata, not status (Yegor's call, 2026-08-23): a neutral text
 * chip, not a color or a dot — a dot risked blending into a row's own status
 * dots. "Current" = this row holds the thread the sidebar's route currently
 * points at, on whichever row is the actual match: the environment's own
 * session under its header, OR (same-day revision) a track nested inside
 * that session with no header of its own to carry the mark instead — the
 * marker lives on the real match, never on an ancestor header standing in
 * for a deeper descendant.
 *
 * `data-sidebar-current-marker` is the stable check hook (backend,
 * 2026-08-23): the visible "current" text is UI copy and can rename or
 * localize; the attribute doesn't.
 */
export function SidebarCurrentEnvironmentChip() {
  return (
    <span
      data-sidebar-current-marker=""
      className="shrink-0 rounded-full border border-border-hairline px-1.5 py-px text-[10px] leading-none text-subtle-foreground/60"
    >
      current
    </span>
  );
}
