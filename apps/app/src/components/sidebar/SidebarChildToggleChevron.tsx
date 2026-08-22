import type { CSSProperties } from "react";
import { Icon, type IconName } from "@bb/shared-ui/icon";
import { LIST_HOVER_TRANSITION } from "@bb/shared-ui/motion";
import {
  SIDEBAR_HOVER_ACTIONS_CLASS,
  SIDEBAR_HOVER_ACTIONS_MOBILE_ALWAYS_VALUE,
} from "@/components/ui/sidebar-hover-actions.js";
import { cn } from "@bb/shared-ui/lib/utils";

interface SidebarChildToggleChevronProps {
  isCollapsed: boolean;
  expandLabel: string;
  collapseLabel: string;
  onToggle: () => void;
  revealOnHover?: boolean;
  style?: CSSProperties;
  /**
   * Cursor Repositories pattern (2026-08-22): a resting glyph (a folder,
   * typically) that swaps to the chevron on hover and swaps BACK the
   * instant the cursor leaves, even if the row stayed expanded — the
   * chevron is a hover-only hint of what a click here does, never a
   * standing "expanded" indicator. When set, the button itself is always
   * visible/clickable (no fade); only the glyph inside swaps, via the same
   * bb-sidebar-row-icon-swap pattern the Extensions row's toolbox/tool-case
   * icon already uses. `revealOnHover` is ignored when this is set — there
   * is no rest-invisible state to reveal, the slot always shows SOMETHING.
   */
  restIcon?: IconName;
}

export function SidebarChildToggleChevron({
  isCollapsed,
  expandLabel,
  collapseLabel,
  onToggle,
  revealOnHover = false,
  style,
  restIcon,
}: SidebarChildToggleChevronProps) {
  return (
    <button
      type="button"
      data-sidebar-child-toggle=""
      aria-expanded={!isCollapsed}
      aria-label={isCollapsed ? expandLabel : collapseLabel}
      data-sidebar-hover-actions-mobile={
        revealOnHover && !restIcon
          ? SIDEBAR_HOVER_ACTIONS_MOBILE_ALWAYS_VALUE
          : undefined
      }
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle();
      }}
      style={style}
      className={cn(
        restIcon
          ? "pointer-events-auto"
          : revealOnHover
            ? SIDEBAR_HOVER_ACTIONS_CLASS
            : "pointer-events-auto",
        "relative z-10 inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-md text-subtle-foreground outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2",
        LIST_HOVER_TRANSITION,
      )}
    >
      {restIcon ? (
        <span className="bb-sidebar-row-icon-swap" aria-hidden="true">
          <Icon name={restIcon} className="size-3 bb-sidebar-row-icon-rest" />
          <Icon
            name="ChevronRight"
            className={cn(
              "size-3 bb-sidebar-row-icon-hover transition-transform duration-150",
              !isCollapsed && "rotate-90",
            )}
          />
        </span>
      ) : (
        <Icon
          name="ChevronRight"
          className={cn(
            "size-3 transition-transform duration-150",
            !isCollapsed && "rotate-90",
          )}
          aria-hidden="true"
        />
      )}
    </button>
  );
}
