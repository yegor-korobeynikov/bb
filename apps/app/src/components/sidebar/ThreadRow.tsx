import {
  memo,
  useCallback,
  useState,
  type CSSProperties,
  type MouseEventHandler,
  type PointerEventHandler,
  type ReactNode,
  useRef,
} from "react";
import { useSetAtom } from "jotai";
import type { ThreadListEntry } from "@bb/domain";
import type { PluginComposerThreadRowStatus } from "@get-bb/plugin-sdk";
import { getThreadConversationCollapsedAtom } from "@/components/secondary-panel/threadSecondaryPanelAtoms";
import { Icon } from "@bb/shared-ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@bb/shared-ui/tooltip";
import { SidebarStickyTier } from "@/components/ui/sidebar.js";
import { NavLink } from "react-router-dom";
import {
  ThreadActionsContextMenu,
  ThreadActionsMenu,
  ThreadArchiveQuickAction,
  ThreadNewTrackQuickAction,
} from "@/components/thread/ThreadActionsMenu";
import { useThreadActions } from "@/components/thread/ThreadActionsProvider";
import { useInlineThreadTitle } from "@/components/thread/InlineThreadTitle";
import {
  COARSE_POINTER_COMPACT_ROW_HEIGHT_CLASS,
  COARSE_POINTER_GLYPH_BOX_CLASS,
  COARSE_POINTER_ICON_SIZE_CLASS,
  COARSE_POINTER_ROW_ACTION_SIZE_CLASS,
  COARSE_POINTER_ROW_HEIGHT_CLASS,
} from "@bb/shared-ui/coarse-pointer-sizing";
import {
  SIDEBAR_HOVER_ACTIONS_CLASS,
  SIDEBAR_HOVER_ACTIONS_FADE_CLASS,
  SIDEBAR_HOVER_ACTIONS_INSET_CLASS,
  SIDEBAR_HOVER_ACTIONS_ROW_CLASS,
} from "@/components/ui/sidebar-hover-actions.js";
import {
  hasActiveBackgroundAgentActivity,
  hasActiveBackgroundCommandActivity,
  hasActiveGoalActivity,
  hasActivePlanModeActivity,
  hasActiveWorkflowActivity,
  isRuntimeBusyThread,
  isUnreadDoneThread,
  getThreadListIndicatorLabel,
  hasThreadListWorkingActivity,
  NO_COLLAPSED_CHILD_ACTIVITY,
  resolveThreadListIndicator,
  type CollapsedChildActivity,
  type ThreadListIndicatorState,
} from "@bb/client-core";
import { getThreadDisplayTitle } from "@/lib/thread-title";
import { getThreadRoutePath } from "@/lib/route-paths";
import { cn } from "@bb/shared-ui/lib/utils";
import { LIST_HOVER_TRANSITION } from "@bb/shared-ui/motion";
import {
  SIDEBAR_ROW_BASE_CLASS,
  SIDEBAR_ROW_GLYPH_SLOT_CLASS,
  SIDEBAR_ROW_INTERACTIVE_STATE_CLASS,
  SIDEBAR_ROW_SELECTED_STATE_CLASS,
  SIDEBAR_MORE_ACTION_TRIGGER_CLASS,
  SIDEBAR_PAIRED_ACTION_LEADING_TARGET_CLASS,
  SIDEBAR_PAIRED_ACTION_MIDDLE_TARGET_CLASS,
  SIDEBAR_PAIRED_ACTION_TRAILING_TARGET_CLASS,
  SIDEBAR_ROW_OPEN_IN_SPLIT_STATE_CLASS,
  SIDEBAR_SUCCESS_STATUS_COLOR_CLASS,
  SIDEBAR_WORKING_STATUS_COLOR_CLASS,
  getTendoSidebarThreadRowPaddingLeft,
} from "./sidebarRowClasses";
import type { ConsumeDragClickSuppression } from "@/components/ui/use-drag-click-suppression";
import type { SidebarSortableDragBindings } from "./sortableMotion";
import { SidebarChildToggleChevron } from "./SidebarChildToggleChevron";
import {
  resolveSidebarThreadStatus,
  SidebarThreadStatusDot,
} from "./SidebarThreadStatusDot";
import { useCoarseClock } from "./useCoarseClock";
import { useSidebarThreadShortcut } from "./sidebarThreadShortcuts";
import { SplitPaneMiniMap } from "./SplitPaneMiniMap";
import { usePaneContentSplitIndicator } from "./paneContentSplitIndicator";
import { useThreadRowSplitDrag } from "./useThreadRowSplitDrag";
import { AppCommandShortcutPill } from "@/components/commands/AppCommandShortcutHint";
import {
  ThreadTitleMentions,
  useSidebarProjectName,
  useThreadTitleDisplayText,
} from "@/components/thread/ThreadTitleMentions";
import { pluginIconName } from "@/components/plugin/PluginIcon";
import { usePluginThreadRowStatus } from "@/lib/plugin-thread-row-status";

const SIDEBAR_TITLE_DOUBLE_CLICK_MS = 400;

let lastSidebarTitleClick: { at: number; threadId: string } | null = null;

function consumeSidebarTitleDoubleClick(threadId: string): boolean {
  const now = Date.now();
  const previous = lastSidebarTitleClick;
  lastSidebarTitleClick = { at: now, threadId };
  return (
    previous !== null &&
    previous.threadId === threadId &&
    now - previous.at < SIDEBAR_TITLE_DOUBLE_CLICK_MS
  );
}

export function resetSidebarTitleDoubleClickForTest(): void {
  lastSidebarTitleClick = null;
}

interface ThreadRowBaseOptions {
  depth: number;
  isCompact: boolean;
  consumeClickSuppression?: ConsumeDragClickSuppression;
  dragBindings?: SidebarSortableDragBindings;
}

export type ThreadRowOptions =
  | (ThreadRowBaseOptions & {
      kind: "default";
    })
  | (ThreadRowBaseOptions & {
      kind: "parent";
      isCollapsed: boolean;
      childCount: number;
      childActivity: CollapsedChildActivity;
      // Depth among pinned parents when this row is sticky; absent = not pinned
      // (deeper than the sticky cap, or not a sticky parent role).
      stickyLevel?: number;
      onToggleCollapsed: (threadId: string) => void;
    });

interface ThreadRowProps {
  projectId: string;
  thread: ThreadListEntry;
  // Set when the thread lives in a different project than the group or parent
  // it renders under; the row then shows a cross-project marker. Null otherwise.
  crossProjectId: string | null;
  isActive: boolean;
  hasComposerDraft: boolean;
  onProjectSelect?: () => void;
  options: ThreadRowOptions;
}

type ThreadRowClickCaptureHandler = MouseEventHandler<HTMLDivElement>;

interface ThreadRowContainerArgs {
  children: ReactNode;
  className: string;
  dragBindings?: SidebarSortableDragBindings;
  onClickCapture?: ThreadRowClickCaptureHandler;
  // Split-drag initiator; engages only when the pointer leaves the sidebar, so
  // it coexists with the dnd-kit reorder listeners in `dragBindings`.
  onSplitDragPointerDown?: PointerEventHandler<HTMLElement>;
  stickyLevel?: number;
  style: CSSProperties;
}

function ThreadDraftIndicator({
  hideIdleLabel = false,
  isWorking,
}: {
  hideIdleLabel?: boolean;
  isWorking: boolean;
}) {
  const label = getThreadListIndicatorLabel(
    isWorking ? "working-draft" : "draft",
  );
  return (
    <Icon
      name="Edit"
      className={cn(
        "pointer-events-none shrink-0",
        COARSE_POINTER_ICON_SIZE_CLASS,
        isWorking
          ? ["animate-shine-icon", SIDEBAR_WORKING_STATUS_COLOR_CLASS]
          : "text-muted-foreground",
      )}
      {...(!isWorking && hideIdleLabel
        ? { "aria-hidden": true }
        : { "aria-label": label ?? undefined })}
    />
  );
}

function PluginThreadRowStatusIndicator({
  status,
}: {
  status: PluginComposerThreadRowStatus;
}) {
  if (status.tone === "running") {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center motion-safe:animate-pulse",
          COARSE_POINTER_ICON_SIZE_CLASS,
          "text-success",
        )}
      >
        <Icon
          name={pluginIconName(status.icon)}
          className={cn(
            "pointer-events-none shrink-0 animate-shine-icon",
            COARSE_POINTER_ICON_SIZE_CLASS,
            "motion-safe:[animation-duration:1.5s]",
          )}
          aria-label={status.label}
        />
      </span>
    );
  }

  return (
    <Icon
      name={pluginIconName(status.icon)}
      className={cn(
        "pointer-events-none shrink-0",
        COARSE_POINTER_ICON_SIZE_CLASS,
        status.tone === "success"
          ? SIDEBAR_SUCCESS_STATUS_COLOR_CLASS
          : status.tone === "error"
            ? "text-destructive"
            : "text-muted-foreground",
      )}
      aria-label={status.label}
    />
  );
}

function getThreadRowStyle(depth: number): CSSProperties {
  return {
    paddingLeft: getTendoSidebarThreadRowPaddingLeft(depth),
  };
}

function renderThreadRowContainer({
  children,
  className,
  dragBindings,
  onClickCapture,
  onSplitDragPointerDown,
  stickyLevel,
  style,
}: ThreadRowContainerArgs) {
  // Never show a grab cursor on thread rows. Section DnD still works after the
  // activation distance; the link still selects on click.
  if (stickyLevel !== undefined) {
    return (
      <SidebarStickyTier
        ref={dragBindings?.setActivatorNodeRef}
        tier="parent"
        level={stickyLevel}
        className={className}
        style={style}
        {...dragBindings?.attributes}
        {...(dragBindings?.listeners ?? {})}
        onClickCapture={onClickCapture}
        onPointerDown={onSplitDragPointerDown}
      >
        {children}
      </SidebarStickyTier>
    );
  }

  return (
    <div
      ref={dragBindings?.setActivatorNodeRef}
      className={className}
      style={style}
      {...dragBindings?.attributes}
      {...(dragBindings?.listeners ?? {})}
      onClickCapture={onClickCapture}
      onPointerDown={onSplitDragPointerDown}
    >
      {children}
    </div>
  );
}

interface ThreadStatusGlyphProps extends ThreadListIndicatorState {
  hideIdleDraftLabel?: boolean;
}

export function ThreadStatusGlyph({
  hasPendingInteraction,
  hasUnsubmittedDraft,
  hasUnreadError,
  hasUnreadSuccess,
  hideIdleDraftLabel = false,
  isBackgroundAgentActive,
  isBackgroundCommandActive,
  isGoalActive,
  isPlanModeActive,
  isRuntimeActive,
  isWorkflowActive,
}: ThreadStatusGlyphProps) {
  const kind = resolveThreadListIndicator({
    hasPendingInteraction,
    hasUnsubmittedDraft,
    hasUnreadError,
    hasUnreadSuccess,
    isBackgroundAgentActive,
    isBackgroundCommandActive,
    isGoalActive,
    isPlanModeActive,
    isRuntimeActive,
    isWorkflowActive,
  });

  switch (kind) {
    case "unread-error":
      return (
        <Icon
          name="CircleX"
          className={cn("text-destructive", COARSE_POINTER_ICON_SIZE_CLASS)}
          aria-label={getThreadListIndicatorLabel(kind) ?? undefined}
        />
      );
    case "waiting-for-input":
      // No trailing glyph (Yegor, 2026-08-21): redundant with the leading
      // SidebarThreadStatusDot, which already renders this exact state as
      // a filled Hot Accent dot with its own accessible label — this was
      // a second signal for the same fact once the dot shipped natively,
      // same species of duplication as "unread-success" below.
      return null;
    case "working-draft":
      return <ThreadDraftIndicator isWorking />;
    case "workflow":
      return (
        <Icon
          name="Workflow"
          className={cn(
            "animate-shine-icon",
            SIDEBAR_WORKING_STATUS_COLOR_CLASS,
            COARSE_POINTER_ICON_SIZE_CLASS,
          )}
          aria-label={getThreadListIndicatorLabel(kind) ?? undefined}
        />
      );
    case "background-agent":
      return (
        <Icon
          name="UserRoundPlus"
          className={cn(
            "animate-shine-icon",
            SIDEBAR_WORKING_STATUS_COLOR_CLASS,
            COARSE_POINTER_ICON_SIZE_CLASS,
          )}
          aria-label={getThreadListIndicatorLabel(kind) ?? undefined}
        />
      );
    case "background-command":
      return (
        <Icon
          name="Terminal"
          className={cn(
            "animate-shine-icon",
            SIDEBAR_WORKING_STATUS_COLOR_CLASS,
            COARSE_POINTER_ICON_SIZE_CLASS,
          )}
          aria-label={getThreadListIndicatorLabel(kind) ?? undefined}
        />
      );
    case "plan-mode":
      return (
        <Icon
          name="ListTodo"
          className={cn(
            "animate-shine-icon",
            SIDEBAR_WORKING_STATUS_COLOR_CLASS,
            COARSE_POINTER_ICON_SIZE_CLASS,
          )}
          aria-label={getThreadListIndicatorLabel(kind) ?? undefined}
        />
      );
    case "goal":
      return (
        <Icon
          name="Target"
          className={cn(
            "animate-shine-icon",
            SIDEBAR_WORKING_STATUS_COLOR_CLASS,
            COARSE_POINTER_ICON_SIZE_CLASS,
          )}
          aria-label={getThreadListIndicatorLabel(kind) ?? undefined}
        />
      );
    case "runtime":
      return (
        <Icon
          name="Loading"
          className={cn(
            "animate-spin",
            SIDEBAR_WORKING_STATUS_COLOR_CLASS,
            COARSE_POINTER_ICON_SIZE_CLASS,
          )}
          aria-label={getThreadListIndicatorLabel(kind) ?? undefined}
        />
      );
    case "draft":
      return (
        <ThreadDraftIndicator
          hideIdleLabel={hideIdleDraftLabel}
          isWorking={false}
        />
      );
    case "unread-success":
      // No trailing glyph (Yegor, 2026-08-21, "уже есть цветная индикация
      // в начале сессий" — a plain grey dot here duplicated the leading
      // dot's Teal Blue "unread" state at the OTHER end of the same row).
      // Kept the leading dot as the one source of truth for this state.
      return null;
    case "none":
      return null;
  }
}

interface CollapsedThreadStatusGlyphProps {
  activity: CollapsedChildActivity;
}

export function CollapsedThreadStatusGlyph({
  activity,
}: CollapsedThreadStatusGlyphProps) {
  return (
    <ThreadStatusGlyph
      hasPendingInteraction={activity.pending}
      hasUnsubmittedDraft={activity.hasUnsubmittedDraft}
      hasUnreadError={activity.unreadError}
      hasUnreadSuccess={activity.unread}
      isBackgroundAgentActive={activity.backgroundAgent}
      isBackgroundCommandActive={activity.backgroundCommand}
      isGoalActive={activity.goal}
      isPlanModeActive={activity.planMode}
      isRuntimeActive={activity.runtimeWorking}
      isWorkflowActive={activity.workflow}
    />
  );
}
type ThreadTrailingIndicatorProps = ThreadStatusGlyphProps & {
  pluginStatus: PluginComposerThreadRowStatus | null;
};

interface ThreadTrailingIndicatorResolution {
  accessibleLabel: string | null;
  indicatorKind: ReturnType<typeof resolveThreadListIndicator>;
  pluginStatusIsVisible: boolean;
}

function resolveThreadTrailingIndicatorStatus(
  statusProps: ThreadStatusGlyphProps,
  pluginStatus: PluginComposerThreadRowStatus | null,
): ThreadTrailingIndicatorResolution {
  const indicatorKind = resolveThreadListIndicator(statusProps);
  const pluginStatusIsVisible =
    pluginStatus !== null &&
    indicatorKind !== "runtime" &&
    indicatorKind !== "unread-error" &&
    indicatorKind !== "waiting-for-input";

  return {
    accessibleLabel: pluginStatusIsVisible
      ? pluginStatus.label
      : getThreadListIndicatorLabel(indicatorKind),
    indicatorKind,
    pluginStatusIsVisible,
  };
}

function ThreadTrailingIndicator({
  pluginStatus,
  ...statusProps
}: ThreadTrailingIndicatorProps) {
  const { indicatorKind, pluginStatusIsVisible } =
    resolveThreadTrailingIndicatorStatus(statusProps, pluginStatus);

  if (indicatorKind === "none" && !pluginStatusIsVisible) {
    return null;
  }

  return (
    <span
      data-sidebar-thread-trailing-indicator=""
      className={cn(
        SIDEBAR_ROW_GLYPH_SLOT_CLASS,
        COARSE_POINTER_GLYPH_BOX_CLASS,
      )}
    >
      {pluginStatusIsVisible && pluginStatus ? (
        <PluginThreadRowStatusIndicator status={pluginStatus} />
      ) : (
        <ThreadStatusGlyph {...statusProps} />
      )}
    </span>
  );
}

function ThreadRowComponent({
  projectId,
  thread,
  crossProjectId,
  isActive,
  hasComposerDraft,
  onProjectSelect,
  options,
}: ThreadRowProps) {
  const [isDropdownActionsOpen, setIsDropdownActionsOpen] = useState(false);
  const [isContextActionsOpen, setIsContextActionsOpen] = useState(false);
  const { renameThread } = useThreadActions();
  const setConversationCollapsed = useSetAtom(
    getThreadConversationCollapsedAtom(thread.id),
  );
  const shortcut = useSidebarThreadShortcut(thread.id);
  const pluginThreadRowStatus = usePluginThreadRowStatus(thread.id);
  const showActive = isActive;
  const hasPendingInteraction = thread.hasPendingInteraction;
  const threadRuntimeBusy = isRuntimeBusyThread(thread);
  // Only the fade-to-asleep threshold needs this; every other state is
  // derived from the thread itself and re-renders when the thread changes.
  const nowMs = useCoarseClock();
  const threadWorkflowActive = hasActiveWorkflowActivity(thread);
  const threadBackgroundAgentActive = hasActiveBackgroundAgentActivity(thread);
  const threadBackgroundCommandActive =
    hasActiveBackgroundCommandActivity(thread);
  const threadPlanModeActive = hasActivePlanModeActivity(thread);
  const threadGoalActive = hasActiveGoalActivity(thread);
  const threadUnreadDone = isUnreadDoneThread(thread);
  const sidebarStatus = resolveSidebarThreadStatus({
    hasPendingInteraction,
    isRuntimeBusy: threadRuntimeBusy,
    isUnread: threadUnreadDone,
    lastActivityAtMs: thread.updatedAt,
    nowMs,
  });
  const threadUnreadError = threadUnreadDone && thread.status === "error";
  const threadUnreadSuccess = threadUnreadDone && !threadUnreadError;
  const threadTitle = getThreadDisplayTitle(thread);
  const labelTitle = useThreadTitleDisplayText(threadTitle);
  const crossProjectName = useSidebarProjectName(crossProjectId);
  const crossProjectLabel =
    crossProjectId === null
      ? null
      : crossProjectName
        ? `In project ${crossProjectName}`
        : "In another project";
  const handleRename = useCallback(
    (nextTitle: string) => {
      renameThread(thread.id, nextTitle);
    },
    [renameThread, thread.id],
  );
  const { editor, isEditing, startEditing } = useInlineThreadTitle({
    onCommit: handleRename,
    resetKey: thread.id,
    title: threadTitle,
  });
  const startTitleEditing = useCallback(
    (event: { preventDefault: () => void; stopPropagation: () => void }) => {
      event.preventDefault();
      event.stopPropagation();
      startEditing();
    },
    [startEditing],
  );
  const splitIndicator = usePaneContentSplitIndicator(
    { kind: "thread", projectId, threadId: thread.id },
    true,
  );
  const { onPointerDown: onSplitDragPointerDown, openInSplit } =
    useThreadRowSplitDrag({
      projectId,
      threadId: thread.id,
      title: labelTitle,
    });
  // Splits are disabled on compact viewports; the drag hook signals that by
  // withholding its pointer handler, so gate the click/menu entry points on it.
  const splitAvailable = onSplitDragPointerDown !== undefined;
  const parentOptions = options.kind === "parent" ? options : null;
  const isParentRow = parentOptions !== null;
  const isParentCollapsed = parentOptions?.isCollapsed ?? false;
  const childCount = parentOptions?.childCount ?? 0;
  const childActivity =
    parentOptions?.childActivity ?? NO_COLLAPSED_CHILD_ACTIVITY;
  const hasChildren = childCount > 0;
  // A track carries parentThreadId; a session (a task's own top-level
  // thread) doesn't — the same isTrack/isSession distinction the plugin
  // used all day, now read straight off the thread record rather than
  // derived from DOM structure.
  const isSessionRow = !thread.parentThreadId;
  // A collapsed parent hides its descendants behind one glyph, so it must
  // surface its own status combined with the rolled-up child activity. Expanded
  // parents and leaves show only their own status.
  const hasHiddenChildren = isParentRow && isParentCollapsed && hasChildren;
  const trailingHasPendingInteraction = hasHiddenChildren
    ? hasPendingInteraction || childActivity.pending
    : hasPendingInteraction;
  const trailingRuntimeBusy = hasHiddenChildren
    ? threadRuntimeBusy || childActivity.runtimeWorking
    : threadRuntimeBusy;
  const trailingIsWorkflowActive = hasHiddenChildren
    ? threadWorkflowActive || childActivity.workflow
    : threadWorkflowActive;
  const trailingBackgroundAgentActive = hasHiddenChildren
    ? threadBackgroundAgentActive || childActivity.backgroundAgent
    : threadBackgroundAgentActive;
  const trailingBackgroundCommandActive = hasHiddenChildren
    ? threadBackgroundCommandActive || childActivity.backgroundCommand
    : threadBackgroundCommandActive;
  const trailingPlanModeActive = hasHiddenChildren
    ? threadPlanModeActive || childActivity.planMode
    : threadPlanModeActive;
  const trailingGoalActive = hasHiddenChildren
    ? threadGoalActive || childActivity.goal
    : threadGoalActive;
  const trailingHasUnreadError = hasHiddenChildren
    ? threadUnreadError || childActivity.unreadError
    : threadUnreadError;
  const trailingHasUnreadSuccess = hasHiddenChildren
    ? threadUnreadSuccess || childActivity.unread
    : threadUnreadSuccess;
  const trailingHasUnsubmittedDraft = hasHiddenChildren
    ? hasComposerDraft || childActivity.hasUnsubmittedDraft
    : hasComposerDraft;
  const trailingIndicatorState: ThreadListIndicatorState = {
    hasPendingInteraction: trailingHasPendingInteraction,
    hasUnsubmittedDraft: trailingHasUnsubmittedDraft,
    hasUnreadError: trailingHasUnreadError,
    hasUnreadSuccess: trailingHasUnreadSuccess,
    isBackgroundAgentActive: trailingBackgroundAgentActive,
    isBackgroundCommandActive: trailingBackgroundCommandActive,
    isGoalActive: trailingGoalActive,
    isPlanModeActive: trailingPlanModeActive,
    isRuntimeActive: trailingRuntimeBusy,
    isWorkflowActive: trailingIsWorkflowActive,
  };
  const trailingIndicatorResolution = resolveThreadTrailingIndicatorStatus(
    trailingIndicatorState,
    pluginThreadRowStatus,
  );
  const trailingIndicatorKind = trailingIndicatorResolution.indicatorKind;
  const splitIndicatorIsWorking = hasThreadListWorkingActivity(
    trailingIndicatorState,
    pluginThreadRowStatus?.tone === "running",
  );
  const splitIndicatorLabel = trailingIndicatorResolution.accessibleLabel
    ? `${labelTitle} — open in split; ${trailingIndicatorResolution.accessibleLabel}`
    : `${labelTitle} — open in split`;
  const linkLabel = hasComposerDraft
    ? `Open ${labelTitle} (unsubmitted draft)`
    : `Open ${labelTitle}`;
  const rowDragBindings = options.dragBindings;
  const rowClassName = cn(
    SIDEBAR_HOVER_ACTIONS_ROW_CLASS,
    "group/thread-row",
    SIDEBAR_ROW_BASE_CLASS,
    LIST_HOVER_TRANSITION,
    parentOptions?.stickyLevel === undefined && "relative",
    options.isCompact
      ? COARSE_POINTER_COMPACT_ROW_HEIGHT_CLASS
      : COARSE_POINTER_ROW_HEIGHT_CLASS,
    showActive
      ? SIDEBAR_ROW_SELECTED_STATE_CLASS
      : SIDEBAR_ROW_INTERACTIVE_STATE_CLASS,
    // Subtle open-in-split tint, weaker than the active-row treatment. The
    // focused pane's thread is already the active row, so this only marks the
    // other open panes; hover still wins over it.
    !showActive &&
      splitIndicator.isOpenInSplit &&
      SIDEBAR_ROW_OPEN_IN_SPLIT_STATE_CLASS,
    !showActive && "has-[[data-state=open]]:bg-sidebar-accent",
    rowDragBindings && !rowDragBindings.disabled && "select-none",
  );
  const rowStyle = getThreadRowStyle(options.depth);
  const isActionsOpen = isDropdownActionsOpen || isContextActionsOpen;
  const handleRowClickCapture = useCallback<ThreadRowClickCaptureHandler>(
    (event) => {
      if (!options.consumeClickSuppression?.()) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    },
    [options],
  );

  const rowLinkRef = useRef<HTMLAnchorElement>(null);
  const rowContent = (
    <>
      <NavLink
        ref={rowLinkRef}
        to={getThreadRoutePath({ projectId, threadId: thread.id })}
        data-sidebar-thread-shortcut-target=""
        data-sidebar-thread-id={thread.id}
        // Read by scripts/tendo-visual-verify.mjs (sidebarIndentDepthOnly):
        // the one DOM signal that lets a check assert "every row at the same
        // depth puts its title at the same x" without guessing depth from
        // computed padding.
        data-sidebar-thread-depth={options.depth}
        onClick={(event) => {
          if (isEditing) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          // Selecting a thread/agent row restores its conversation without
          // disturbing any other thread's collapsed conversation state.
          setConversationCollapsed(false);
          // Cmd/Ctrl-click is the split feature's second entry point: open the
          // thread in the split instead of replacing the focused pane. Match the
          // drag rules (right split / focus if open / replace at the cap).
          if (splitAvailable && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            openInSplit();
            return;
          }
          // A first click may navigate and remount this row. Remember that
          // click so the second click of a double-click can still open the
          // editor after the remount.
          if (consumeSidebarTitleDoubleClick(thread.id)) {
            event.preventDefault();
            event.stopPropagation();
            startEditing();
            return;
          }
          onProjectSelect?.();
        }}
        onDoubleClick={isEditing ? undefined : startTitleEditing}
        aria-label={linkLabel}
        aria-keyshortcuts={shortcut?.ariaKeyshortcuts}
        className="absolute inset-0 rounded-md outline-none ring-sidebar-ring focus-visible:ring-2"
      />
      <span
        className={cn(
          "flex min-w-0 flex-1 items-center gap-1.5",
          // The hover actions overlay grows leftward past the trailing slot;
          // this reserves room so the title never runs under the extra button.
          !shortcut && SIDEBAR_HOVER_ACTIONS_INSET_CLASS,
        )}
      >
        {parentOptions && hasChildren ? (
          <SidebarChildToggleChevron
            isCollapsed={isParentCollapsed}
            expandLabel={`Expand ${labelTitle} threads`}
            collapseLabel={`Collapse ${labelTitle} threads`}
            onToggle={() => parentOptions.onToggleCollapsed(thread.id)}
            revealOnHover
            // The row's flex container spaces every child with a uniform
            // gap-1.5 (6px) — fine between the dot and the title, short of
            // the canon's chevron-to-dot target. This adds the remainder on
            // top of that shared gap rather than replacing it, so a change
            // to gap-1.5 doesn't silently detune this number too.
            style={{
              // The 20px box is hit area; the glyph inside it is 12px. Both
              // margins below exist to make the GLYPH, not the box, sit on
              // the column the tokens describe: pull the box 4px left so its
              // centred glyph lands on the row's padding edge, then take the
              // same 4px plus the row's shared gap-1.5 back out on the right
              // so glyph-left to dot-left is exactly chevron-to-dot. Without
              // this the hit area silently widened the column by its own
              // overhang, and the token no longer meant what it says.
              marginLeft: "-0.25rem",
              marginRight:
                "calc(var(--tendo-sidebar-chevron-to-dot) - 1.25rem + 0.25rem - 0.375rem)",
            }}
          />
        ) : (
          // Every thread row without a real chevron keeps the chevron's exact
          // layout box — unconditionally. The indent contract is "title x is a
          // function of depth only", and that only holds if the row's
          // internal structure (slot, dot, title) is identical at every depth
          // and for every row; the visible indent between depths is then
          // exactly --tendo-sidebar-indent-step, tunable as one token.
          //
          // Measured, not assumed (tendo-visual-verify sidebarIndentDepthOnly,
          // 2026-08-22): before any reservation, sessions without a chevron
          // sat 40px left of siblings with one. A first version reserved the
          // slot only on `parentOptions` rows — and the live re-measure after
          // delivery still showed a childless session at x=67 vs 107: a
          // session with no children is rendered with default options, not
          // parent options, so the gate missed exactly the rows it was for.
          // Same hidden-not-removed rule as the status dot.
          <span
            aria-hidden="true"
            data-sidebar-child-toggle-placeholder=""
            className="inline-flex size-5 shrink-0"
            style={{
              // The 20px box is hit area; the glyph inside it is 12px. Both
              // margins below exist to make the GLYPH, not the box, sit on
              // the column the tokens describe: pull the box 4px left so its
              // centred glyph lands on the row's padding edge, then take the
              // same 4px plus the row's shared gap-1.5 back out on the right
              // so glyph-left to dot-left is exactly chevron-to-dot. Without
              // this the hit area silently widened the column by its own
              // overhang, and the token no longer meant what it says.
              marginLeft: "-0.25rem",
              marginRight:
                "calc(var(--tendo-sidebar-chevron-to-dot) - 1.25rem + 0.25rem - 0.375rem)",
            }}
          />
        )}
        <SidebarThreadStatusDot status={sidebarStatus} />
        {isEditing ? (
          <span className="relative z-10 min-w-0 flex-1 overflow-visible">
            {editor}
          </span>
        ) : (
          <span
            className="min-w-0 truncate"
            title={labelTitle}
            onDoubleClick={startTitleEditing}
          >
            <ThreadTitleMentions title={threadTitle} />
          </span>
        )}
        {crossProjectLabel !== null ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                data-sidebar-thread-cross-project=""
                role="img"
                aria-label={crossProjectLabel}
                // Sits above the row's full-size link so it can take hover;
                // nudged 1px down so the glyph reads centered on the text.
                // A click still opens the thread by forwarding to the link.
                className="relative top-px z-10 flex shrink-0 items-center text-muted-foreground"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  rowLinkRef.current?.click();
                }}
              >
                <Icon name="FolderExport" className="size-3.5" aria-hidden />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">{crossProjectLabel}</TooltipContent>
          </Tooltip>
        ) : null}
      </span>
      <span className="flex shrink-0 items-center gap-0.5">
        {shortcut ? (
          <AppCommandShortcutPill shortcut={shortcut} />
        ) : (
          <span
            className={cn(
              "flex shrink-0 items-center justify-end max-md:pointer-coarse:pointer-events-none",
              COARSE_POINTER_COMPACT_ROW_HEIGHT_CLASS,
            )}
          >
            <span
              className={cn(
                "relative shrink-0",
                COARSE_POINTER_ROW_ACTION_SIZE_CLASS,
              )}
            >
              <span
                data-sidebar-hover-actions-open={
                  isActionsOpen ? "true" : undefined
                }
                className={cn(
                  SIDEBAR_HOVER_ACTIONS_FADE_CLASS,
                  "absolute inset-0 flex items-center justify-center",
                )}
              >
                {splitIndicator.miniMap ? (
                  <span
                    data-sidebar-thread-trailing-indicator=""
                    className={cn(
                      SIDEBAR_ROW_GLYPH_SLOT_CLASS,
                      COARSE_POINTER_GLYPH_BOX_CLASS,
                    )}
                  >
                    <SplitPaneMiniMap
                      slots={splitIndicator.miniMap}
                      label={splitIndicatorLabel}
                      isWorking={splitIndicatorIsWorking}
                    />
                  </span>
                ) : (
                  <ThreadTrailingIndicator
                    {...trailingIndicatorState}
                    hideIdleDraftLabel={
                      !hasHiddenChildren && trailingIndicatorKind === "draft"
                    }
                    pluginStatus={pluginThreadRowStatus}
                  />
                )}
              </span>
              <div
                data-sidebar-hover-actions-open={
                  isActionsOpen ? "true" : undefined
                }
                className={cn(
                  SIDEBAR_HOVER_ACTIONS_CLASS,
                  // Anchored to the right edge only, so a second action can sit
                  // left of the menu without widening the rest slot.
                  "absolute inset-y-0 right-0 z-10 flex items-center justify-end max-md:pointer-coarse:hidden",
                )}
              >
                {isSessionRow ? (
                  // New track (2026-08-22, decision-tendo-tracks-are-core-
                  // not-plugin-v1): a session row — a task's own top-level
                  // thread — not a track itself (tracks carry
                  // parentThreadId, sessions don't; the same isTrack check
                  // the plugin used all day). Now the LEADING glyph in the
                  // cluster; Archive moved from leading to middle to make
                  // room (see sidebarRowClasses.ts).
                  <ThreadNewTrackQuickAction
                    thread={thread}
                    existingChildCount={childCount}
                    className={cn(
                      "text-subtle-foreground hover:bg-transparent hover:text-foreground",
                      SIDEBAR_MORE_ACTION_TRIGGER_CLASS,
                      "-mr-0.5",
                      SIDEBAR_PAIRED_ACTION_LEADING_TARGET_CLASS,
                    )}
                  />
                ) : null}
                <ThreadArchiveQuickAction
                  thread={thread}
                  className={cn(
                    "text-subtle-foreground hover:bg-transparent hover:text-foreground",
                    SIDEBAR_MORE_ACTION_TRIGGER_CLASS,
                    // Tighter than two full margins: a half step between the
                    // two glyphs reads as one control group.
                    "-mr-0.5",
                    isSessionRow
                      ? SIDEBAR_PAIRED_ACTION_MIDDLE_TARGET_CLASS
                      : SIDEBAR_PAIRED_ACTION_LEADING_TARGET_CLASS,
                  )}
                />
                <ThreadActionsMenu
                  thread={thread}
                  triggerClassName={cn(
                    "text-subtle-foreground hover:bg-transparent hover:text-foreground",
                    SIDEBAR_MORE_ACTION_TRIGGER_CLASS,
                    SIDEBAR_PAIRED_ACTION_TRAILING_TARGET_CLASS,
                  )}
                  onOpenInSplit={splitAvailable ? openInSplit : undefined}
                  onOpenChange={setIsDropdownActionsOpen}
                />
              </div>
            </span>
          </span>
        )}
      </span>
    </>
  );

  const row = renderThreadRowContainer({
    children: rowContent,
    className: rowClassName,
    dragBindings: rowDragBindings,
    onClickCapture: options.consumeClickSuppression
      ? handleRowClickCapture
      : undefined,
    onSplitDragPointerDown,
    stickyLevel: parentOptions?.stickyLevel,
    style: rowStyle,
  });

  return (
    <ThreadActionsContextMenu
      thread={thread}
      onOpenInSplit={splitAvailable ? openInSplit : undefined}
      onOpenChange={setIsContextActionsOpen}
    >
      {row}
    </ThreadActionsContextMenu>
  );
}

export const ThreadRow = memo(ThreadRowComponent);
