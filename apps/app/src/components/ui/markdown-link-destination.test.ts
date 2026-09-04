import { describe, expect, it } from "vitest";
import { resolveLinkDestinationIcon } from "./markdown-link-destination";

const base = {
  isAppRouteHref: false,
  isLocalFileLink: false,
  href: undefined as string | undefined,
};

describe("resolveLinkDestinationIcon", () => {
  it("marks an outward link with the arrow that means it leaves", () => {
    expect(
      resolveLinkDestinationIcon({ ...base, href: "https://notion.so/page" }),
    ).toBe("ExternalLink");
    expect(
      resolveLinkDestinationIcon({ ...base, href: "http://example.com" }),
    ).toBe("ExternalLink");
  });

  it("treats mail and phone links as outward too", () => {
    // They hand the click to another application just as a browser tab does,
    // so the same promise holds.
    expect(
      resolveLinkDestinationIcon({ ...base, href: "mailto:a@example.com" }),
    ).toBe("ExternalLink");
    expect(resolveLinkDestinationIcon({ ...base, href: "tel:+1234" })).toBe(
      "ExternalLink",
    );
  });

  it("is case-insensitive about the scheme", () => {
    expect(
      resolveLinkDestinationIcon({ ...base, href: "HTTPS://example.com" }),
    ).toBe("ExternalLink");
  });

  it("marks a local file with the panel it opens in", () => {
    expect(
      resolveLinkDestinationIcon({
        ...base,
        isLocalFileLink: true,
        href: "/Users/x/notes.md",
      }),
    ).toBe("PanelRight");
  });

  it("prefers the panel over the scheme for a file:// link", () => {
    // The regression this ordering guards: a file:// href has a scheme, but it
    // opens beside the conversation and never leaves the app.
    expect(
      resolveLinkDestinationIcon({
        ...base,
        isLocalFileLink: true,
        href: "file:///Users/x/notes.md",
      }),
    ).toBe("PanelRight");
  });

  it("leaves an in-app route unmarked even when it looks outward", () => {
    // Internal cross-references are frequent; marking them would put a glyph
    // on half the sentences in a conversation.
    expect(
      resolveLinkDestinationIcon({
        ...base,
        isAppRouteHref: true,
        href: "https://localhost:3000/threads/thr_1",
      }),
    ).toBeNull();
  });

  it("leaves anything it cannot name unmarked", () => {
    expect(resolveLinkDestinationIcon({ ...base, href: undefined })).toBeNull();
    expect(resolveLinkDestinationIcon({ ...base, href: "docs/x.md" })).toBeNull();
    expect(
      resolveLinkDestinationIcon({ ...base, href: "javascript:alert(1)" }),
    ).toBeNull();
  });
});
