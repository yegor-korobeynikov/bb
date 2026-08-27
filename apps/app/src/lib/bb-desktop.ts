import type {
  BbDesktopApi,
  BbDesktopBrowserApi,
  BbDesktopWindowState,
} from "@bb/desktop-contract";

// The macOS traffic-light cluster sits in a fixed strip on the left of the
// frameless window. In-flow chrome clears it with left padding; the pinned
// sidebar trigger clears it with a matching left offset (`left: 84px`). These
// are fixed px geometry values because they are paired with Electron/macOS
// window-control coordinates, not app typography.
//
// One shared target: when the main sidebar is collapsed the pinned sidebar
// trigger (84px + a 28px button + an 8px gap = the strip ends at 120px) is the
// last thing on the title-bar row, so a surface that owns the window's
// top-left must land its leading content at x = 120px — just right of the
// trigger, not merely past the lights. Both such surfaces start from the same
// `px-4` (16px) base inset, so one reserve serves both; 16 + 104 = 120. It is
// folded into a single left padding (rather than padding + a spacer element) so
// it can transition in lockstep with the sidebar slide instead of snapping
// on/off while the inset animates. The two surfaces are:
//  - the page header content row.
//  - the secondary panel's top chrome, while the conversation is collapsed and
//    the panel is flush at the window top-left. That happens on both thread
//    surfaces, not just the split-workspace host: collapsing takes the
//    conversation column to zero width and the thread header rides inside it,
//    so inline thread detail hands over the top-left too. Assuming otherwise is
//    what once left its tab strip sitting under the lights. Root compose is
//    genuinely exempt — it keeps the panel to the right of the main content.
export const MACOS_TRAFFIC_LIGHT_RESERVE_OFFSET_CLASS = "left-[84px]";
export const MACOS_COLLAPSED_TOP_LEFT_RESERVE_CLASS = "pl-[104px]";

// Browser-chrome analogs of the macOS reserve above. The web build has no
// traffic lights, so it pins the sidebar toggle flush at the app's top-left with
// a small inset (see AppLayout's SidebarTriggerOverlay), and the collapsed page
// header reserves that footprint as left padding so its content clears the
// pinned toggle — the same trick as macOS, just smaller. Keep the inset and the
// reserve in sync: `padding-left: 32px` on top of the header's own `px-4` (16px) sums to
// 48px, which clears the 12px inset + the 28px trigger + an 8px gap;
// `max-md:pointer-coarse:pl-[40px]` covers the larger 36px touch trigger.
export const BROWSER_SIDEBAR_TRIGGER_INSET_CLASS = "pl-[12px]";
export const BROWSER_COLLAPSED_HEADER_RESERVE_CLASS =
  "pl-[32px] max-md:pointer-coarse:pl-[40px]";
export const MACOS_WINDOW_DRAG_CLASS =
  "select-none [app-region:drag] [-webkit-app-region:drag]";
export const MACOS_APP_REGION_NO_DRAG_CLASS =
  "[app-region:no-drag] [-webkit-app-region:no-drag]";
export const MACOS_WINDOW_NO_DRAG_CLASS = `relative z-50 ${MACOS_APP_REGION_NO_DRAG_CLASS}`;

// Single source of truth for the top chrome row — the titlebar axis shared by
// the macOS traffic lights, the pinned sidebar collapse trigger, and the
// sidebar's route-history arrows. The native traffic-light inset
// (`MACOS_TRAFFIC_LIGHT_DIAGONAL_INSET` in apps/desktop's window factory) is
// tuned to vertically center the lights within this height and to sit on the
// sidebar icon column's left rail. Electron main and the renderer are separate
// bundles, so they cannot share one runtime value — keep this height and that
// inset in sync as a paired geometry contract.
export const CHROME_ROW_HEIGHT_CLASS = "h-[48px]";
// Base layout for an in-flow chrome row: the shared height, laid out as a flex
// row and vertically centered so its contents share the titlebar axis.
export const CHROME_ROW_CLASS = `flex ${CHROME_ROW_HEIGHT_CLASS} items-center`;

// Single adjustment point for macOS titlebar controls that visually align with
// the native traffic lights. Keep the offset as a token instead of sprinkling
// ad hoc translate classes; if Electron/macOS geometry changes, the collapse
// trigger, route-history arrows, and page/thread header content can move
// together from here.
//
// -7.25px, measured (Yegor, 2026-08-26 report; live-verified 2026-08-27):
// native screencapture of the titlebar, Retina 2x, traffic-light and
// sidebar-trigger centers each found by color-diff against the window
// background, in the SAME screenshot coordinate space. Measured gap was
// 9.25pt (trigger sitting below the lights) against the then-current +2px
// nudge, so the corrected value is 2 - 9.25 = -7.25.
//
// This replaces the previous "18px traffic-light inset + 48px chrome row ->
// 2px optical nudge" derivation, which turned out not to explain the real
// gap: CDP getBoundingClientRect + getComputedStyle confirmed the CSS box
// model was exactly as coded (container top:0 height:48px, button centers at
// the predicted 10px + the nudge, transform applying cleanly, no
// specificity conflict) — so the bug isn't in this layout math, it's in
// where the *previous* nudge assumed the native traffic-light cluster sits
// relative to the window/webview origin. TODO: find why the 18px inset
// doesn't predict the traffic lights' actual position (devicePixelRatio? a
// window-frame offset the inset math didn't account for?) — until then this
// value is empirical, not derived, same as the old 2px was but wrong.
export const MACOS_CHROME_CONTROL_AXIS_CLASS =
  "[--bb-macos-chrome-control-y:-7.25px] [transform:translateY(var(--bb-macos-chrome-control-y))]";
export const MACOS_CHROME_CONTROL_NO_DRAG_CLASS = `${MACOS_WINDOW_NO_DRAG_CLASS} ${MACOS_CHROME_CONTROL_AXIS_CLASS}`;
export const MACOS_CHROME_TRAFFIC_LIGHT_AXIS_NUDGE_CLASS =
  MACOS_CHROME_CONTROL_AXIS_CLASS;

type BbDesktopInfoResult = BbDesktopApi | null;
export const DEFAULT_DESKTOP_WINDOW_STATE: BbDesktopWindowState = {
  isFullScreen: false,
};

export function getBbDesktopInfo(): BbDesktopInfoResult {
  if (typeof window === "undefined") {
    return null;
  }
  return window.bbDesktop ?? null;
}

export function shouldUseMacosDesktopChrome(
  desktopInfo: BbDesktopInfoResult,
): boolean {
  return desktopInfo?.platform === "macos";
}

export function shouldReserveMacosTrafficLights({
  desktopInfo,
  windowState,
}: {
  desktopInfo: BbDesktopInfoResult;
  windowState: BbDesktopWindowState;
}): boolean {
  return shouldUseMacosDesktopChrome(desktopInfo) && !windowState.isFullScreen;
}

/**
 * The desktop browser control surface, or `null` on the web build (where
 * `window.bbDesktop` is undefined). Also tolerates a desktop build whose
 * preload predates the browser surface. This is the single gate for the
 * desktop-only browser tab entry and the `WebContentsView` host.
 */
export function getDesktopBrowserApi(): BbDesktopBrowserApi | null {
  return getBbDesktopInfo()?.browser ?? null;
}

export function isDesktopBrowserAvailable(): boolean {
  return getDesktopBrowserApi() !== null;
}
