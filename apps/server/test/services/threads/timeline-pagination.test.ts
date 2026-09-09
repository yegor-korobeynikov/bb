import { describe, expect, it } from "vitest";
import type {
  TimelineRow,
  TimelineUserConversationRow,
} from "@bb/server-contract";
import { paginateTimelineRows } from "../../../src/services/threads/timeline-pagination.js";

function userRow(args: {
  id: string;
  seq: number;
  text: string;
}): TimelineUserConversationRow {
  return {
    id: args.id,
    kind: "conversation",
    role: "user",
    threadId: "thread-1",
    turnId: "turn-1",
    sourceSeqStart: args.seq,
    sourceSeqEnd: args.seq,
    startedAt: args.seq,
    createdAt: args.seq,
    text: args.text,
    mentions: [],
    attachments: null,
    initiator: "user",
    senderThreadId: null,
    systemMessageKind: "unlabeled",
    systemMessageSubject: null,
    turnRequest: { isGrouped: false, kind: "message", status: "accepted" },
  };
}

describe("paginateTimelineRows", () => {
  it("keeps grouped user rows from one request in the same segment", () => {
    const rows: TimelineRow[] = [
      userRow({
        id: "thread-1:user-seed:1",
        seq: 1,
        text: "older",
      }),
      userRow({
        id: "thread-1:user-seed:2",
        seq: 2,
        text: "group first",
      }),
      userRow({
        id: "thread-1:user-seed:2-1",
        seq: 2,
        text: "group second",
      }),
      userRow({
        id: "thread-1:user-seed:3",
        seq: 3,
        text: "newer",
      }),
    ];

    const page = paginateTimelineRows({
      sequenceWindowStart: null,
      knownHasOlderSegments: null,
      threadId: "thread-1",
      windowSequenceStart: null,
      page: { kind: "latest", segmentLimit: 2 },
      rows,
    });

    expect(page.rows.map((row) => row.id)).toEqual([
      "thread-1:user-seed:2",
      "thread-1:user-seed:2-1",
      "thread-1:user-seed:3",
    ]);
    expect(page.olderCursor).toEqual({
      anchorId: "thread-1:user-seed:2",
      anchorSeq: 2,
    });
  });
  // Seen on a 8,500-event thread: the page above the last turn came back with
  // no rows at all, said there were older rows, and named no cursor. The feed
  // then showed one answer and nothing else, and scrolling up could not
  // recover — there was nothing left to ask with.
  it("still names where to continue when the window yields no segment", () => {
    const page = paginateTimelineRows({
      sequenceWindowStart: null,
      knownHasOlderSegments: true,
      threadId: "thread-1",
      windowSequenceStart: 4200,
      page: {
        kind: "older",
        segmentLimit: 20,
        beforeCursor: { anchorSeq: 8493, anchorId: "thread-1:user-seed:8493" },
      },
      rows: [],
    });

    expect(page.rows).toEqual([]);
    expect(page.returnedSegmentCount).toBe(0);
    expect(page.hasOlderRows).toBe(true);
    expect(page.olderCursor).not.toBeNull();
    // Strictly older than the cursor that produced it, so paging up advances
    // rather than asking the same question again.
    expect(page.olderCursor?.anchorSeq).toBeLessThan(8493);
  });

  it("names no cursor once there is genuinely nothing older", () => {
    const page = paginateTimelineRows({
      sequenceWindowStart: null,
      knownHasOlderSegments: false,
      threadId: "thread-1",
      windowSequenceStart: 4200,
      page: {
        kind: "older",
        segmentLimit: 20,
        beforeCursor: { anchorSeq: 8493, anchorId: "thread-1:user-seed:8493" },
      },
      rows: [],
    });

    expect(page.hasOlderRows).toBe(false);
    expect(page.olderCursor).toBeNull();
  });
});
