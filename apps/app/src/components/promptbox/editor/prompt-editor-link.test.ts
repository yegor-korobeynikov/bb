import { describe, expect, it } from "vitest";
import { promptEditorPasteLinkHref } from "./prompt-editor-link";

describe("promptEditorPasteLinkHref", () => {
  it("returns the href for a bare URL", () => {
    expect(promptEditorPasteLinkHref("https://example.com/docs")).toBe(
      "https://example.com/docs",
    );
  });

  it("fills in the default protocol for a protocol-less URL", () => {
    expect(promptEditorPasteLinkHref("example.com")).toBe(
      "https://example.com",
    );
  });

  it("returns null when the text is not a URL", () => {
    expect(promptEditorPasteLinkHref("hello world")).toBeNull();
  });

  it("returns null when the URL is only part of the pasted text", () => {
    expect(promptEditorPasteLinkHref("check https://example.com now")).toBeNull();
  });

  it("returns null for empty text", () => {
    expect(promptEditorPasteLinkHref("")).toBeNull();
  });
});
