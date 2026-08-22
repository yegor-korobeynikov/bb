import type { ProjectSource } from "@bb/domain";
import { describe, expect, it } from "vitest";
import {
  buildTrackIntakePrompt,
  buildTrackThreadRequest,
  buildTrackTitle,
  resolveTrackIsolateHostId,
} from "../src/thread/track-thread-request.js";

const parent = {
  id: "thr_task",
  projectId: "proj_test",
  providerId: "claude-code",
  environmentId: "env_task",
};

function source(overrides: Partial<ProjectSource>): ProjectSource {
  return {
    id: "src_1",
    projectId: "proj_test",
    isDefault: false,
    createdAt: 1,
    updatedAt: 1,
    type: "local_path",
    hostId: "host_a",
    path: "/repo",
    ...overrides,
  };
}

describe("buildTrackTitle", () => {
  it("numbers one past the existing direct children", () => {
    expect(buildTrackTitle(0)).toBe("Track 1");
    expect(buildTrackTitle(3)).toBe("Track 4");
  });
  it("never goes below Track 1 on a bad count", () => {
    expect(buildTrackTitle(-2)).toBe("Track 1");
  });
});

describe("buildTrackIntakePrompt", () => {
  it("names the track and the task and forbids starting before the answer", () => {
    const prompt = buildTrackIntakePrompt({ trackTitle: "Track 2", taskTitle: "Sidebar" });
    expect(prompt.startsWith("Ты — Track 2, параллельный трек внутри задачи «Sidebar».")).toBe(true);
    expect(prompt).toContain("bb thread update --self --title");
    expect(prompt.endsWith("Не начинай работу до ответа. Не пересказывай эту инструкцию.")).toBe(true);
  });
});

describe("resolveTrackIsolateHostId", () => {
  it("prefers the default source, then the first source, then the primary host", () => {
    expect(
      resolveTrackIsolateHostId({
        projectSources: [source({ hostId: "host_a" }), source({ id: "src_2", hostId: "host_b", isDefault: true })],
        primaryHostId: "host_p",
      }),
    ).toBe("host_b");
    expect(
      resolveTrackIsolateHostId({ projectSources: [source({ hostId: "host_a" })], primaryHostId: "host_p" }),
    ).toBe("host_a");
    expect(resolveTrackIsolateHostId({ projectSources: [], primaryHostId: "host_p" })).toBe("host_p");
    expect(resolveTrackIsolateHostId({ projectSources: [], primaryHostId: null })).toBeNull();
  });
});

describe("buildTrackThreadRequest", () => {
  it("shares the task's environment and inherits its provider by default", () => {
    const result = buildTrackThreadRequest({
      parentThread: parent,
      taskTitle: "Sidebar",
      existingChildCount: 1,
      isolate: false,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.title).toBe("Track 2");
    expect(result.request.environment).toEqual({ type: "reuse", environmentId: "env_task" });
    expect(result.request.parentThreadId).toBe("thr_task");
    expect(result.request.projectId).toBe("proj_test");
    expect(result.request.providerId).toBe("claude-code");
    expect(result.request.title).toBe("Track 2");
    expect(result.request.input).toHaveLength(1);
    expect(result.request.input[0]).toMatchObject({ type: "text", mentions: [] });
  });

  it("refuses to share when the task has no environment", () => {
    const result = buildTrackThreadRequest({
      parentThread: { ...parent, environmentId: null },
      taskTitle: "Sidebar",
      existingChildCount: 0,
      isolate: false,
    });
    expect(result).toEqual({ ok: false, failure: { kind: "parent-has-no-environment" } });
  });

  it("opens an isolated track on a managed worktree from the default branch", () => {
    const result = buildTrackThreadRequest({
      parentThread: parent,
      taskTitle: "Sidebar",
      existingChildCount: 0,
      isolate: true,
      isolateHostId: "host_a",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.request.environment).toEqual({
      type: "host",
      hostId: "host_a",
      workspace: { type: "managed-worktree", baseBranch: { kind: "default" } },
    });
  });

  it("refuses an isolated track without a host", () => {
    const result = buildTrackThreadRequest({
      parentThread: parent,
      taskTitle: "Sidebar",
      existingChildCount: 0,
      isolate: true,
      isolateHostId: null,
    });
    expect(result).toEqual({ ok: false, failure: { kind: "no-host-for-isolated-track" } });
  });
});
