import { describe, expect, it } from "vitest";
import {
  createConnection,
  createEnvironment,
  createProject,
  createThreadSection,
  getThread,
  migrate,
  noopNotifier,
  updateThread,
  upsertHost,
} from "@bb/db";
import { createThreadRecord } from "../../src/services/threads/thread-create-helpers.js";
import {
  applyGeneratedThreadSection,
  resolveGeneratedSectionId,
} from "../../src/services/threads/title-generation.js";

const SECTIONS = [
  { id: "sec_client", name: "Client work" },
  { id: "sec_tendo", name: "Tendo" },
];

describe("resolveGeneratedSectionId", () => {
  it("matches a section name the model copied back, ignoring case and padding", () => {
    expect(resolveGeneratedSectionId("Tendo", SECTIONS)).toBe("sec_tendo");
    expect(resolveGeneratedSectionId("  client work  ", SECTIONS)).toBe(
      "sec_client",
    );
  });

  it("files nothing when the answer is not one of the offered names", () => {
    // The failure this guards is a confident near-miss ("Clients", a section
    // renamed since the prompt was built), not a malformed response.
    expect(resolveGeneratedSectionId("Clients", SECTIONS)).toBeNull();
    expect(resolveGeneratedSectionId("", SECTIONS)).toBeNull();
    expect(resolveGeneratedSectionId(undefined, SECTIONS)).toBeNull();
    expect(resolveGeneratedSectionId("Tendo", [])).toBeNull();
  });
});

interface ThreadFixture {
  db: ReturnType<typeof createConnection>;
  deps: { db: ReturnType<typeof createConnection>; hub: typeof noopNotifier };
  sectionId: string;
  threadId: string;
}

function createThreadFixture(name: string): ThreadFixture {
  const db = createConnection(":memory:");
  migrate(db);
  const deps = { db, hub: noopNotifier };
  const host = upsertHost(db, noopNotifier, {
    name: "Test Host",
    type: "persistent",
  });
  const { project } = createProject(db, noopNotifier, {
    name: "Test Project",
    source: {
      hostId: host.id,
      path: `/tmp/${name}`,
      type: "local_path",
    },
  });
  const environment = createEnvironment(db, noopNotifier, {
    hostId: host.id,
    path: `/tmp/${name}`,
    projectId: project.id,
    status: "ready",
    workspaceProvisionType: "managed-worktree",
  });
  const sectionResult = createThreadSection(db, noopNotifier, {
    name: "Tendo",
  });
  if (sectionResult.status !== "created") {
    throw new Error("Expected section fixture to be created");
  }
  const thread = createThreadRecord(deps, {
    environmentId: environment.id,
    request: {
      environment: { environmentId: environment.id, type: "reuse" },
      input: [],
      origin: "app",
      projectId: project.id,
      providerId: "codex",
      startedOnBehalfOf: null,
      titleFallback: null,
      visibility: "visible",
    },
  });
  return {
    db,
    deps,
    sectionId: sectionResult.section.id,
    threadId: thread.id,
  };
}

describe("applyGeneratedThreadSection", () => {
  it("files an unfiled root thread", () => {
    const fixture = createThreadFixture("apply-section-unfiled");
    try {
      expect(
        applyGeneratedThreadSection(fixture.deps, {
          sectionId: fixture.sectionId,
          threadId: fixture.threadId,
        }),
      ).toBe(true);
      expect(getThread(fixture.db, fixture.threadId)?.sectionId).toBe(
        fixture.sectionId,
      );
    } finally {
      fixture.db.$client.close();
    }
  });

  it("leaves a thread the operator already filed alone", () => {
    // Inference resolves after the thread exists, so it can land while the
    // operator is dragging the row or picking "Move to…". Whoever placed it
    // wins; a blank section is the only thing inference may fill.
    const fixture = createThreadFixture("apply-section-manual");
    try {
      const manual = createThreadSection(fixture.db, noopNotifier, {
        name: "Personal",
      });
      if (manual.status !== "created") {
        throw new Error("Expected section fixture to be created");
      }
      updateThread(fixture.db, noopNotifier, fixture.threadId, {
        sectionId: manual.section.id,
      });

      expect(
        applyGeneratedThreadSection(fixture.deps, {
          sectionId: fixture.sectionId,
          threadId: fixture.threadId,
        }),
      ).toBe(false);
      expect(getThread(fixture.db, fixture.threadId)?.sectionId).toBe(
        manual.section.id,
      );
    } finally {
      fixture.db.$client.close();
    }
  });
});
