import type { Thread } from "@bb/domain";
import type { ReactNode } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@bb/shared-ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@bb/shared-ui/dropdown-menu";
import { Icon, type IconName } from "@bb/shared-ui/icon";
import { Button } from "@bb/shared-ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@bb/shared-ui/tooltip";
import { COARSE_POINTER_ICON_SIZE_CLASS } from "@bb/shared-ui/coarse-pointer-sizing";
import { useIsCompactViewport } from "@bb/shared-ui/hooks/use-compact-viewport";
import { cn } from "@bb/shared-ui/lib/utils";
import { CompactLongPressMenu } from "@/components/ui/compact-long-press-menu";
import { isThreadRead } from "@bb/client-core";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { getThreadRoutePath } from "@/lib/route-paths";
import { useCreateTrack } from "@/hooks/mutations/thread-track-mutations";
import { useThreadActions } from "./ThreadActionsProvider";

interface ThreadActionsMenuBaseProps {
  thread: Thread;
  /**
   * When provided, adds a leading "Open in split" entry (the split feature's
   * second entry point, alongside cmd-click). Omitted where splits don't apply
   * (e.g. compact viewports), so the item only appears when meaningful.
   */
  onOpenInSplit?: () => void;
}

export interface ThreadActionsMenuResponsiveAction {
  icon: IconName;
  label: string;
  onSelect: () => void | Promise<void>;
}

interface ThreadActionsMenuProps extends ThreadActionsMenuBaseProps {
  onOpenChange?: (open: boolean) => void;
  triggerClassName?: string;
  /**
   * Contextual toolbar actions that move into this menu when a split header is
   * too narrow to show them inline.
   */
  responsiveActions?: readonly ThreadActionsMenuResponsiveAction[];
}

interface ThreadActionsContextMenuProps extends ThreadActionsMenuBaseProps {
  children: ReactNode;
  onOpenChange?: (open: boolean) => void;
}

type ThreadActionsMenuSurface = "context" | "dropdown";

interface ThreadActionsMenuItemsProps extends ThreadActionsMenuBaseProps {
  responsiveActions?: readonly ThreadActionsMenuResponsiveAction[];
  surface: ThreadActionsMenuSurface;
}

interface ThreadActionMenuItemProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "destructive";
  icon: IconName;
  onSelect?: (event: Event) => void;
  surface: ThreadActionsMenuSurface;
}

function ThreadActionMenuItem({
  children,
  className,
  variant,
  icon,
  onSelect,
  surface,
}: ThreadActionMenuItemProps) {
  const content = (
    <>
      <Icon name={icon} aria-hidden="true" />
      {children}
    </>
  );

  if (surface === "context") {
    return (
      <ContextMenuItem
        className={cn(
          className,
          variant === "destructive" &&
            "text-destructive focus:bg-destructive/15 focus:text-destructive data-[last-hovered]:bg-destructive/15 data-[last-hovered]:text-destructive",
        )}
        onSelect={onSelect}
      >
        {content}
      </ContextMenuItem>
    );
  }

  return (
    <DropdownMenuItem
      className={className}
      variant={variant}
      onSelect={onSelect}
    >
      {content}
    </DropdownMenuItem>
  );
}

function ThreadActionMenuSeparator({
  surface,
}: {
  surface: ThreadActionsMenuSurface;
}) {
  return surface === "context" ? (
    <ContextMenuSeparator />
  ) : (
    <DropdownMenuSeparator />
  );
}

function ThreadActionsMenuItems({
  thread,
  onOpenInSplit,
  responsiveActions = [],
  surface,
}: ThreadActionsMenuItemsProps) {
  const {
    archiveThreadAndChildren,
    requestRename,
    requestDelete,
    togglePin,
    toggleRead,
    unarchiveThread,
  } = useThreadActions();
  const isCompactViewport = useIsCompactViewport();
  const isDrawer = surface === "dropdown" && isCompactViewport;
  const showSeparators = !isDrawer;
  const isRead = isThreadRead(thread);
  const isArchived = thread.archivedAt != null;
  const isPinned = thread.pinnedAt !== null;

  return (
    <>
      {responsiveActions.length > 0 ? (
        <>
          {responsiveActions.map((action) => (
            <ThreadActionMenuItem
              key={action.label}
              surface={surface}
              icon={action.icon}
              onSelect={() => {
                void action.onSelect();
              }}
            >
              {action.label}
            </ThreadActionMenuItem>
          ))}
          {showSeparators ? (
            <ThreadActionMenuSeparator surface={surface} />
          ) : null}
        </>
      ) : null}
      {onOpenInSplit ? (
        <>
          <ThreadActionMenuItem
            surface={surface}
            icon="Columns2"
            onSelect={() => {
              onOpenInSplit();
            }}
          >
            Open in split
          </ThreadActionMenuItem>
          {showSeparators ? (
            <ThreadActionMenuSeparator surface={surface} />
          ) : null}
        </>
      ) : null}
      {/* Quick status toggles. */}
      <ThreadActionMenuItem
        surface={surface}
        icon={isRead ? "Mail" : "MailOpen"}
        onSelect={() => {
          toggleRead(thread);
        }}
      >
        {isRead ? "Mark unread" : "Mark read"}
      </ThreadActionMenuItem>
      <ThreadActionMenuItem
        surface={surface}
        icon={isPinned ? "PinOff" : "Pin"}
        onSelect={() => {
          togglePin(thread);
        }}
      >
        {isPinned ? "Unpin" : "Pin"}
      </ThreadActionMenuItem>
      <ThreadActionMenuItem
        surface={surface}
        icon="Edit"
        onSelect={() => {
          window.setTimeout(() => {
            requestRename(thread);
          }, 0);
        }}
      >
        Rename
      </ThreadActionMenuItem>
      {showSeparators ? <ThreadActionMenuSeparator surface={surface} /> : null}
      <ThreadActionMenuItem
        surface={surface}
        icon={isArchived ? "ArchiveRestore" : "Archive"}
        onSelect={() => {
          if (isArchived) {
            unarchiveThread(thread);
            return;
          }
          archiveThreadAndChildren(thread);
        }}
      >
        {isArchived ? "Unarchive" : "Archive"}
      </ThreadActionMenuItem>
      <ThreadActionMenuItem
        surface={surface}
        icon="Trash2"
        variant="destructive"
        onSelect={() => {
          window.setTimeout(() => {
            requestDelete(thread);
          }, 0);
        }}
      >
        Delete
      </ThreadActionMenuItem>
    </>
  );
}

/**
 * One-click archive (or unarchive) button for hover-revealed row actions. It
 * runs the same lifecycle as the menu's Archive entry, so undo, navigation,
 * and child cascade behave identically.
 */
export function ThreadArchiveQuickAction({
  thread,
  className,
}: {
  thread: Thread;
  className?: string;
}) {
  const { archiveThreadAndChildren, unarchiveThread } = useThreadActions();
  const isArchived = thread.archivedAt != null;
  const label = isArchived ? "Unarchive" : "Archive";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("rounded-md p-0", className)}
          aria-label={`${label} thread`}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (isArchived) {
              unarchiveThread(thread);
              return;
            }
            archiveThreadAndChildren(thread);
          }}
        >
          <Icon
            name={isArchived ? "ArchiveRestore" : "Archive"}
            className={COARSE_POINTER_ICON_SIZE_CLASS}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * One-click "New track" button for hover-revealed row actions
 * (decision-tendo-tracks-are-core-not-plugin-v1, 2026-08-22) — same
 * Tooltip component as Archive, same createTrack pipeline every other
 * thread creation uses via useCreateTrack, no plugin RPC in between.
 * Shares the task's environment (isolate: false); an isolated managed
 * worktree stays a menu-only choice, out of this one-click's scope.
 * `existingChildCount` is the caller's own childCount, not recomputed
 * here — ThreadRow already has it for the chevron/collapse state.
 */
export function ThreadNewTrackQuickAction({
  thread,
  existingChildCount,
  className,
}: {
  thread: Thread;
  existingChildCount: number;
  className?: string;
}) {
  const { createTrack, isPending } = useCreateTrack();
  const navigate = useNavigate();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("rounded-md p-0", className)}
          aria-label="New track"
          disabled={isPending}
          onClick={async (event) => {
            event.preventDefault();
            event.stopPropagation();
            const result = await createTrack({
              parentThread: thread,
              existingChildCount,
              isolate: false,
            });
            if (!result.ok) {
              toast.error(
                result.failure.kind === "parent-has-no-environment"
                  ? "This session has no environment to share a track with."
                  : "No host available for an isolated track.",
              );
              return;
            }
            navigate(
              getThreadRoutePath({
                projectId: thread.projectId,
                threadId: result.thread.id,
              }),
            );
          }}
        >
          <Icon name="Plus" className={COARSE_POINTER_ICON_SIZE_CLASS} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">New track</TooltipContent>
    </Tooltip>
  );
}

export function ThreadActionsMenu({
  thread,
  onOpenInSplit,
  responsiveActions,
  onOpenChange,
  triggerClassName,
}: ThreadActionsMenuProps) {
  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "rounded-md p-0",
            triggerClassName,
            "data-[state=open]:bg-state-active data-[state=open]:text-foreground",
          )}
          aria-label="Thread actions"
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          <Icon
            name="MoreHorizontal"
            className={COARSE_POINTER_ICON_SIZE_CLASS}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <ThreadActionsMenuItems
          thread={thread}
          onOpenInSplit={onOpenInSplit}
          responsiveActions={responsiveActions}
          surface="dropdown"
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Row-level actions menu: a right-click context menu on wide viewports, and on
 * compact viewports a touch long-press (or right-click) that opens the same
 * items in the persistent responsive drawer. The compact path deliberately
 * avoids the modal Radix `ContextMenu` (aria-hidden on the app root, scroll
 * lock, document-wide pointer-events flip) on phones.
 */
export function ThreadActionsContextMenu(props: ThreadActionsContextMenuProps) {
  const isCompactViewport = useIsCompactViewport();
  if (isCompactViewport) {
    return <ThreadActionsCompactLongPressMenu {...props} />;
  }
  return <ThreadActionsDesktopContextMenu {...props} />;
}

function ThreadActionsCompactLongPressMenu({
  children,
  thread,
  onOpenInSplit,
  onOpenChange,
}: ThreadActionsContextMenuProps) {
  return (
    <CompactLongPressMenu
      label="Thread actions"
      onOpenChange={onOpenChange}
      items={
        <ThreadActionsMenuItems
          thread={thread}
          onOpenInSplit={onOpenInSplit}
          surface="dropdown"
        />
      }
    >
      {children}
    </CompactLongPressMenu>
  );
}

function ThreadActionsDesktopContextMenu({
  children,
  thread,
  onOpenInSplit,
  onOpenChange,
}: ThreadActionsContextMenuProps) {
  return (
    <ContextMenu onOpenChange={onOpenChange}>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent aria-label="Thread actions">
        <ThreadActionsMenuItems
          thread={thread}
          onOpenInSplit={onOpenInSplit}
          surface="context"
        />
      </ContextMenuContent>
    </ContextMenu>
  );
}
