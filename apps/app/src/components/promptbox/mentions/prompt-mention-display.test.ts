import { describe, expect, it } from "vitest";
import { promptMentionIconName } from "./prompt-mention-display";

describe("promptMentionIconName", () => {
  it("uses the track glyph for a thread mention with a parent thread", () => {
    expect(
      promptMentionIconName({
        kind: "thread",
        threadId: "thr_test",
        label: "Test thread",
        isTrack: true,
      }),
    ).toBe("Split");
  });

  it("uses the session glyph for a thread mention without a parent thread", () => {
    expect(
      promptMentionIconName({
        kind: "thread",
        threadId: "thr_test",
        label: "Test thread",
        isTrack: false,
      }),
    ).toBe("MessageSquarePlus");
  });

  it("defaults to the session glyph when track/session is unresolved", () => {
    expect(
      promptMentionIconName({
        kind: "thread",
        threadId: "thr_test",
        label: "Test thread",
      }),
    ).toBe("MessageSquarePlus");
  });

  it("uses distinct icons for projects and sections", () => {
    expect(
      promptMentionIconName({
        kind: "project",
        projectId: "proj_test",
        label: "Test project",
      }),
    ).toBe("Folder");
    expect(
      promptMentionIconName({
        kind: "section",
        sectionId: "sec_test",
        label: "Test section",
      }),
    ).toBe("SectionAdd");
  });
});
