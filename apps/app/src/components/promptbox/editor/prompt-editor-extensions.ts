import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import type { AnyExtension } from "@tiptap/react";
import {
  PromptDecorationExtension,
  type PromptDecorationExtensionOptions,
} from "./prompt-decoration-extension";
import { PromptMentionExtension } from "./prompt-mention-extension";

/**
 * Pasting a URL over a text selection turns the selection into a link (the
 * extension's own `linkOnPaste` behavior); typing/pasting a bare URL does not
 * auto-link (`autolink: false`) since we have no authoring UI to edit or
 * remove an accidental link short of retyping the text.
 */
const PROMPT_EDITOR_LINK_CLASS = "prompt-editor-link";

/**
 * Matches the inline-code pill rendered messages already use
 * (MarkdownCode in markdown-preview.tsx: "rounded bg-muted px-1.5 py-0.5
 * font-mono text-xs") so a backtick-wrapped word looks the same live in the
 * composer as it will once sent, instead of only turning monospace on send.
 */
const PROMPT_EDITOR_CODE_CLASS = "prompt-editor-code";

interface PromptEditorExtensionsOptions extends PromptDecorationExtensionOptions {
  /**
   * When true, the composer enables Markdown rich-text formatting (headings,
   * lists, bold/italic/inline code) with StarterKit's live input rules. When
   * false (the default user preference), those nodes/marks — and their input
   * rules — are disabled, so the prompt box stays plain text.
   */
  richTextEditing: boolean;
  /** Resolves the current placeholder text at render time. */
  getPlaceholder: () => string;
}

/**
 * Build the TipTap extension set for the prompt box.
 *
 * Markdown formatting is gated behind `richTextEditing`. Each gated node/mark
 * has a Markdown text representation in prompt-editor-serialization.ts so the
 * submitted prompt is plain Markdown regardless of the toggle. StarterKit ships
 * input rules for these (`# `, `- `, `1. `, `**`, `_`, `` ` ``), so when
 * enabled, typing applies formatting live; when disabled, the node/mark and its
 * input rule are removed and the same characters stay literal.
 *
 * `blockquote` is intentionally NOT gated: it predates the Markdown feature and
 * backs the quote-into-prompt flow (appendQuoteToDraftText writes `> ` lines
 * that the serializer parses back into blockquote nodes). It must stay in the
 * schema in both modes, or re-parsing a quoted draft would hit an unknown node
 * type. Code blocks/underline stay disabled: code blocks make multiline prompt
 * editing too sticky; underline isn't Markdown. Link is gated with the rest —
 * paste-a-URL-over-a-selection is the only way to create one (no authoring
 * UI), and `promptEditorSerialization`'s markdownDelimitersForMarks emits it
 * as `[text](href)`; parsing a submitted `[text](href)` back into a rich link
 * on recall is not implemented.
 */
export function promptEditorExtensions({
  richTextEditing,
  getPlaceholder,
  getDecorationSources,
  getDraftObservers,
  draftObserverDebounceMs,
  onRuleError,
}: PromptEditorExtensionsOptions): AnyExtension[] {
  return [
    StarterKit.configure({
      blockquote: {},
      bold: richTextEditing ? {} : false,
      bulletList: richTextEditing ? {} : false,
      code: richTextEditing
        ? { HTMLAttributes: { class: PROMPT_EDITOR_CODE_CLASS } }
        : false,
      codeBlock: false,
      dropcursor: false,
      gapcursor: false,
      heading: richTextEditing ? {} : false,
      horizontalRule: false,
      italic: richTextEditing ? {} : false,
      link: false,
      listItem: richTextEditing ? {} : false,
      orderedList: richTextEditing ? {} : false,
      strike: false,
      underline: false,
    }),
    ...(richTextEditing
      ? [
          Link.configure({
            autolink: false,
            HTMLAttributes: { class: PROMPT_EDITOR_LINK_CLASS },
            linkOnPaste: true,
            openOnClick: false,
          }),
        ]
      : []),
    Placeholder.configure({
      placeholder: () => getPlaceholder(),
    }),
    PromptMentionExtension,
    PromptDecorationExtension.configure({
      ...(getDecorationSources !== undefined ? { getDecorationSources } : {}),
      ...(getDraftObservers !== undefined ? { getDraftObservers } : {}),
      ...(draftObserverDebounceMs !== undefined
        ? { draftObserverDebounceMs }
        : {}),
      ...(onRuleError !== undefined ? { onRuleError } : {}),
    }),
  ];
}
