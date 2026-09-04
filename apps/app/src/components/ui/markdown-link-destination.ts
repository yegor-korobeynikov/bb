import type { IconName } from "@bb/shared-ui/icon";

/**
 * Schemes that hand the click to the operating system — a browser tab, a mail
 * client, a phone dialer. Everything here leaves the app for good, which is
 * what the outward arrow promises.
 */
const OUTWARD_SCHEME = /^(?:https?|mailto|tel):/iu;

export interface LinkDestinationIconArgs {
  /** An in-app SPA route: navigates within the app, opens nothing. */
  isAppRouteHref: boolean;
  /** A path the app can preview in its side panel. */
  isLocalFileLink: boolean;
  /** The href as it will actually be used, after localhost rewriting. */
  href: string | undefined;
}

/**
 * The glyph that names where a markdown link goes, or null when it goes
 * nowhere worth marking.
 *
 * The rule is destination, not link-ness: the underline already says "this is
 * a link". The glyph answers the next question — will this take me out of the
 * app, or open something beside the conversation?
 *
 * Order matters. A local-file link is checked before the scheme, because a
 * `file://` href is both "has a scheme" and "opens in the panel", and the
 * panel is the honest answer for it.
 */
export function resolveLinkDestinationIcon({
  isAppRouteHref,
  isLocalFileLink,
  href,
}: LinkDestinationIconArgs): IconName | null {
  // An in-app route neither leaves nor opens a panel — it just navigates, and
  // a mark would be noise on every internal cross-reference.
  if (isAppRouteHref) {
    return null;
  }
  if (isLocalFileLink) {
    return "PanelRight";
  }
  if (href !== undefined && OUTWARD_SCHEME.test(href)) {
    return "ExternalLink";
  }
  // Anything else — a relative href nothing claimed, an unknown scheme — is
  // left unmarked rather than guessed at: promising a destination the click
  // does not deliver is worse than promising nothing.
  return null;
}
