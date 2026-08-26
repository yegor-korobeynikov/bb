import { type ReactNode } from "react";
import { FilePreview } from "./FilePreview";
import { StoryCard, StoryRow } from "../../../.ladle/story-card";
import carrierMessage from "./__wrap-fix-fixtures__/carrier-message.txt?raw";
import promptPassA from "./__wrap-fix-fixtures__/prompt-passA-gp.txt?raw";

export default {
  title: "right-panel/File preview wrap fix",
};

function PreviewStage({
  children,
  width,
}: {
  children: ReactNode;
  width: number;
}) {
  return (
    <div
      className="flex min-w-0 flex-col overflow-hidden bg-background px-4 pb-3 pt-1"
      style={{ width, height: 420 }}
    >
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </div>
  );
}

const CODE_SAMPLE = `export function veryLongFunctionNameThatWouldOverflowAPanel(argumentOne: string, argumentTwo: number, argumentThree: boolean): void {
  console.log(argumentOne, argumentTwo, argumentThree);
}
`;

// Repro fixtures are the exact two files from the bug report (copied
// verbatim from context/deep-research-private-capital/research/runs/).
export function Overview() {
  return (
    <StoryCard>
      <StoryRow
        label="carrier-message.txt — normal panel width (420px)"
        hint='Before the fix: one truncated sentence, rest clipped off-panel. Toggle "Wrap lines" if it ever shows unwrapped — it should already default to wrapped.'
      >
        <PreviewStage width={420}>
          <FilePreview
            path="carrier-message.txt"
            state={{
              kind: "ready",
              lineRange: null,
              textPreviewKind: null,
              file: { name: "carrier-message.txt", contents: carrierMessage },
            }}
          />
        </PreviewStage>
      </StoryRow>
      <StoryRow
        label="carrier-message.txt — narrow panel width (260px)"
        hint="Same file, narrower panel: text re-wraps to the new width, no horizontal clipping"
      >
        <PreviewStage width={260}>
          <FilePreview
            path="carrier-message.txt"
            state={{
              kind: "ready",
              lineRange: null,
              textPreviewKind: null,
              file: { name: "carrier-message.txt", contents: carrierMessage },
            }}
          />
        </PreviewStage>
      </StoryRow>
      <StoryRow
        label="prompt-passA-gp.txt — normal panel width (420px)"
        hint="Before the fix: long lines cut mid-sentence at the right border (repro lines 5, 9, 13, 17, 21, 25-31)"
      >
        <PreviewStage width={420}>
          <FilePreview
            path="prompt-passA-gp.txt"
            state={{
              kind: "ready",
              lineRange: null,
              textPreviewKind: null,
              file: { name: "prompt-passA-gp.txt", contents: promptPassA },
            }}
          />
        </PreviewStage>
      </StoryRow>
      <StoryRow
        label="prompt-passA-gp.txt — narrow panel width (260px)"
        hint="Same file, narrower panel"
      >
        <PreviewStage width={260}>
          <FilePreview
            path="prompt-passA-gp.txt"
            state={{
              kind: "ready",
              lineRange: null,
              textPreviewKind: null,
              file: { name: "prompt-passA-gp.txt", contents: promptPassA },
            }}
          />
        </PreviewStage>
      </StoryRow>
      <StoryRow
        label="control: real source code stays unwrapped"
        hint="A .ts file must keep the scroll (unwrapped) default — wrapping code breaks horizontal scanning of indentation"
      >
        <PreviewStage width={420}>
          <FilePreview
            path="example.ts"
            state={{
              kind: "ready",
              lineRange: null,
              textPreviewKind: null,
              file: { name: "example.ts", contents: CODE_SAMPLE },
            }}
          />
        </PreviewStage>
      </StoryRow>
    </StoryCard>
  );
}
