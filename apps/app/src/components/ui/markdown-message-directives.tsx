import {
  createContext,
  useContext,
  type ComponentType,
  type ReactNode,
} from "react";
import type { Nodes, Parent, PhrasingContent, RootContent } from "mdast";
// Side-effect import: augments mdast's `Data` with `hName`/`hProperties`.
import type {} from "mdast-util-to-hast";
import type {
  BbNavigate,
  PluginMessageDirectiveProps,
} from "@get-bb/plugin-sdk";
import { visit } from "unist-util-visit";
import { PluginSlotMount } from "@/components/plugin/PluginSlotMount.js";
import { PluginThreadPanelNavigationProvider } from "@/components/plugin/plugin-thread-panel-navigation.js";
import {
  resolveMessageDirectiveRegistry,
  type ResolvedMessageDirective,
} from "@/lib/plugin-slot-resolvers.js";
import type { PluginMessageDirectiveSlot } from "@/lib/plugin-slots.js";

/**
 * Assistant-message plugin directives (`::inline-vis{file="demo.html"}`).
 *
 * Parsing is owned by the unified/remark-directive ecosystem — not plugin
 * regex callbacks. Only the assistant conversation path activates this
 * pipeline (via {@link MarkdownMessageDirectives}); user messages and generic
 * Markdown previews leave directives as ordinary text.
 *
 * Recognized mounts use an indexed custom HAST element (same pattern as prompt
 * mentions) so attributes stay in a host-owned table rather than DOM attrs.
 */

/** Max plugin directive components mounted per message body. */
export const MESSAGE_DIRECTIVE_MOUNT_LIMIT = 32;

/**
 * Longest run of text a claimed pattern is applied to. Runs above it are
 * skipped, unscanned.
 *
 * A pattern arrives from a plugin, and the parse is checked — but a
 * well-formed regular expression can still backtrack catastrophically on a
 * long enough input, which no try/catch can see and which hangs the renderer
 * on the main thread. Analysing the pattern for that is a research problem;
 * bounding what it runs on is four lines. This does not solve ReDoS and does
 * not claim to. It removes the hang by making the worst case finite.
 *
 * 10,000 characters is far past any real paragraph and far short of anything
 * that takes measurable time even on a pathological pattern.
 */
export const CLAIMED_PATTERN_MAX_TEXT_RUN = 10_000;

const MESSAGE_DIRECTIVE_HAST_NAME = "bb-message-directive";
// hast property key — `mdast-util-to-hast` lowercases it into
// `data-directive-index` for the component to read back.
const MESSAGE_DIRECTIVE_INDEX_PROPERTY = "dataDirectiveIndex";

type MessageDirectiveRegistryEntry = ResolvedMessageDirective;

/** Directive name → unique registration, or an explicit cross-plugin collision. */
export type MessageDirectiveRegistry = ReadonlyMap<
  string,
  MessageDirectiveRegistryEntry
>;

export interface MountedMessageDirective {
  attributes: Readonly<Record<string, string>>;
  index: number;
  slot: PluginMessageDirectiveSlot;
  source: string;
  /** True when the directive was written inside a sentence (`:name`) rather
   *  than on its own line (`::name`). Decides the sentinel's node type and the
   *  slot wrapper's element, never what the plugin may render. */
  inline: boolean;
}

export interface MarkdownMessageDirectives {
  /** Pre-built registry from the timeline-level plugin-slot subscription. */
  registry: MessageDirectiveRegistry;
  message: PluginMessageDirectiveProps["message"];
  openWorkspaceFile: PluginMessageDirectiveProps["openWorkspaceFile"];
  openThreadPanel: MarkdownMessageDirectiveOpenThreadPanel | null;
}

export type MarkdownMessageDirectiveOpenThreadPanel = (
  options: Parameters<BbNavigate["openThreadPanel"]>[0] & {
    pluginId: string;
  },
) => boolean;

/**
 * `remark-directive` emits three node kinds from a single `:` grammar. Only the
 * leaf form (`::name`) mounts a plugin component; the text form is handled
 * solely to rewrite it back to literal prose. Container directives (`:::name`)
 * are deliberately left alone — `:::` at the start of a line is not incidental
 * prose the way an inline `:` is, and rewriting the block to literal text would
 * both stop a nested `::name` from mounting and collapse the block's line
 * structure.
 */
type DirectiveNodeType = "textDirective" | "leafDirective";

interface DirectiveNode {
  type: DirectiveNodeType;
  name?: string;
  attributes?: Record<string, string | null | undefined> | null;
  children?: unknown[];
  position?: {
    start?: { offset?: number | undefined };
    end?: { offset?: number | undefined };
  };
}

/** Source marker for each directive kind (used to reconstruct literal text). */
const DIRECTIVE_MARKERS: Record<DirectiveNodeType, string> = {
  textDirective: ":",
  leafDirective: "::",
};

interface RemarkMessageDirectiveFile {
  value: unknown;
}

interface MessageDirectiveElementProps {
  "data-directive-index"?: string;
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "bb-message-directive": MessageDirectiveElementProps;
    }
  }
}

/**
 * Build a deterministic registry from flattened slot rows. When two or more
 * plugins claim the same directive id, neither wins — the entry is a collision
 * and a single console warning is issued (not per message).
 */
export function buildMessageDirectiveRegistry(
  slots: readonly PluginMessageDirectiveSlot[],
  options?: { warn?: (message: string) => void },
): MessageDirectiveRegistry {
  const warn = options?.warn ?? defaultCollisionWarn;
  const registry = resolveMessageDirectiveRegistry(slots);
  for (const [id, directive] of registry) {
    if (directive.status === "collision") {
      warn(
        `[plugin] message directive "${id}" claimed by multiple plugins (${directive.pluginIds.join(", ")}); rendering as literal text`,
      );
    }
  }
  return registry;
}

function defaultCollisionWarn(message: string): void {
  console.warn(message);
}

/**
 * Normalize directive attributes to untrusted string values. Non-string
 * attribute values from the parser are dropped.
 */
export function normalizeDirectiveAttributes(
  attributes: Record<string, string | null | undefined> | null | undefined,
): Record<string, string> {
  if (attributes === null || attributes === undefined) {
    return {};
  }
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(attributes)) {
    if (typeof value === "string") {
      normalized[key] = value;
    }
  }
  return normalized;
}

/**
 * Reconstruct `::name{k="v"}` source when AST position offsets are unavailable.
 */
export function reconstructDirectiveSource(
  name: string,
  attributes: Readonly<Record<string, string>>,
  marker = "::",
): string {
  const keys = Object.keys(attributes);
  if (keys.length === 0) {
    return `${marker}${name}`;
  }
  const body = keys
    .map((key) => `${key}=${JSON.stringify(attributes[key] ?? "")}`)
    .join(" ");
  return `${marker}${name}{${body}}`;
}

function directiveSourceFromNode(
  node: DirectiveNode,
  markdownSource: string,
  name: string,
  attributes: Readonly<Record<string, string>>,
  marker: string,
): string {
  const start = node.position?.start?.offset;
  const end = node.position?.end?.offset;
  if (
    typeof start === "number" &&
    typeof end === "number" &&
    start >= 0 &&
    end >= start &&
    end <= markdownSource.length
  ) {
    return markdownSource.slice(start, end);
  }
  return reconstructDirectiveSource(name, attributes, marker);
}

function messageDirectiveMountNode(index: number, inline: boolean): RootContent {
  const data = {
    hName: MESSAGE_DIRECTIVE_HAST_NAME,
    hProperties: { [MESSAGE_DIRECTIVE_INDEX_PROPERTY]: index },
  };
  // A text directive lives in phrasing content, so its stand-in must too: an
  // empty `text` node carrying `hName`, exactly as `markdown-thread-mentions`
  // builds its inline mention. A paragraph here would nest a block inside a
  // paragraph and split the sentence around it — the very thing the inline
  // form exists to avoid.
  if (inline) {
    return {
      type: "text",
      value: "",
      data,
    };
  }
  // Block-level stand-in: empty paragraph rewritten to the custom element via
  // `data.hName`, matching the prompt-mention indexed-sentinel pattern.
  return {
    type: "paragraph",
    children: [],
    data,
  };
}

/**
 * Replace the directive at `index` with its literal source and return the index
 * traversal should resume from.
 *
 * A text directive lives inside phrasing content (e.g. mid-paragraph), so it is
 * rewritten inline — not as a block paragraph, which would split the
 * surrounding text onto its own line — and merged into an adjacent `text`
 * sibling so the rewritten prose stays a single text node, indistinguishable
 * from text that was never parsed as a directive. A leaf directive is
 * block-level, so a paragraph is the correct literal stand-in.
 */
function spliceLiteralDirective(
  parent: Parent,
  index: number,
  type: DirectiveNodeType,
  source: string,
): number {
  if (type !== "textDirective") {
    parent.children.splice(index, 1, {
      type: "paragraph",
      children: [{ type: "text", value: source }],
    });
    return index;
  }

  // A merged node no longer spans its recorded source range, and nothing
  // downstream reads text positions, so drop the stale span rather than leave a
  // wrong one — the same as the freshly built nodes below, which have none.
  const previous = parent.children[index - 1];
  const next = parent.children[index + 1];
  if (previous?.type === "text") {
    previous.value += source;
    previous.position = undefined;
    if (next?.type === "text") {
      previous.value += next.value;
      parent.children.splice(index, 2);
    } else {
      parent.children.splice(index, 1);
    }
    return index;
  }
  if (next?.type === "text") {
    next.value = `${source}${next.value}`;
    next.position = undefined;
    parent.children.splice(index, 1);
    return index;
  }
  parent.children.splice(index, 1, { type: "text", value: source });
  return index;
}

function asDirectiveNode(node: unknown): DirectiveNode | null {
  if (typeof node !== "object" || node === null) {
    return null;
  }
  const type = (node as { type?: unknown }).type;
  if (type === "textDirective" || type === "leafDirective") {
    return node as DirectiveNode;
  }
  return null;
}

/**
 * Remark transformer: rewrite directives a plugin registered into indexed
 * custom elements, and leave everything else as literal source text. Both
 * forms mount — `::name` on its own line as a block, `:name` inside a sentence
 * in place — and which one is allowed is decided by the registry, never by the
 * shape: incidental prose colons (`13:30`, `key:value`, `:D`) name nothing any
 * plugin claimed, so they render verbatim. Container directives are not
 * touched. Must run after `remark-directive` has produced the directive nodes.
 *
 * A plugin may also claim a text `pattern`, which is applied to prose after
 * the directives are resolved. That is what reaches text nobody wrote as a
 * directive — a notation a workspace already uses, in messages already sent.
 *
 * Mutates `mounts` in document order so indices stay stable when later text
 * streams in after an already-complete directive.
 */
export function remarkMessageDirectives(args: {
  mounts: MountedMessageDirective[];
  registry: MessageDirectiveRegistry;
}) {
  const { mounts, registry } = args;
  return (tree: Nodes, file: RemarkMessageDirectiveFile): void => {
    const markdownSource =
      typeof file.value === "string" ? file.value : String(file.value ?? "");
    // Each parse owns the mount table: clear so a re-transform with the same
    // array reference does not accumulate duplicate indices.
    mounts.length = 0;
    visit(tree, (node, index, parent: Parent | undefined) => {
      const directive = asDirectiveNode(node);
      if (directive === null || parent === undefined || index === undefined) {
        return;
      }
      const marker = DIRECTIVE_MARKERS[directive.type];
      const name = typeof directive.name === "string" ? directive.name : "";
      const attributes = normalizeDirectiveAttributes(directive.attributes);
      const source = directiveSourceFromNode(
        directive,
        markdownSource,
        name,
        attributes,
        marker,
      );

      // A text directive (`:name`) is almost always an incidental parse of
      // ordinary prose — a time like `13:30`, a `key:value` pair, an emoticon
      // like `:D`. Left in the tree it reaches `mdast-util-to-hast`, which
      // renders an unknown directive as an empty block `<div>`; nested inside
      // a paragraph that both drops the directive's text and injects a stray
      // line break.
      //
      // The guard against that is the registry, not the directive's shape.
      // `30`, `b` and `D` are not names any plugin registers, so they fall
      // through to the literal rewrite below exactly as before — while a name
      // a plugin did register mounts where the author wrote it, which is the
      // only way a reference can sit inside a sentence rather than beside it.
      // Everything past this point treats both forms identically: same
      // registry, same collision handling, same per-message mount budget.
      if (name.length === 0) {
        return spliceLiteralDirective(parent, index, directive.type, source);
      }

      const entry = registry.get(name);
      if (entry === undefined || entry.status === "collision") {
        return spliceLiteralDirective(parent, index, directive.type, source);
      }

      if (mounts.length >= MESSAGE_DIRECTIVE_MOUNT_LIMIT) {
        return spliceLiteralDirective(parent, index, directive.type, source);
      }

      const inline = directive.type === "textDirective";
      const mountIndex = mounts.length;
      mounts.push({
        attributes,
        index: mountIndex,
        slot: entry.slot,
        source,
        inline,
      });
      parent.children.splice(
        index,
        1,
        messageDirectiveMountNode(mountIndex, inline),
      );
      return index;
    });

    applyClaimedPatterns(tree, registry, mounts);
    applyClaimedHrefs(tree, registry, mounts);
  };
}

/** Longest URL a claimed href pattern is matched against. Same reasoning as
 *  {@link CLAIMED_PATTERN_MAX_TEXT_RUN}, one layer down: a URL is short in
 *  practice, and a bound is cheaper than trusting that. */
const CLAIMED_HREF_MAX_LENGTH = 2048;

/** Compile the patterns a registry claims, dropping the claim rather than the
 *  message when one does not parse. Shared by both claim kinds so they cannot
 *  disagree about what an unusable pattern costs. */
function compileClaims(
  registry: MessageDirectiveRegistry,
  read: (slot: PluginMessageDirectiveSlot) => string | undefined,
  what: string,
): Array<{ slot: PluginMessageDirectiveSlot; re: RegExp }> {
  const compiled: Array<{ slot: PluginMessageDirectiveSlot; re: RegExp }> = [];
  for (const entry of registry.values()) {
    if (entry.status === "collision") continue;
    const source = read(entry.slot);
    if (typeof source !== "string" || source.length === 0) continue;
    try {
      compiled.push({ slot: entry.slot, re: new RegExp(source, "gu") });
    } catch {
      try {
        compiled.push({ slot: entry.slot, re: new RegExp(source, "g") });
      } catch {
        console.warn(
          `[plugin] message directive "${entry.slot.id}" claimed an unparseable ${what}; ignoring it`,
        );
      }
    }
  }
  return compiled;
}

/**
 * Apply the link targets plugins claimed.
 *
 * A text pattern cannot reach these: by the time a link is parsed, its target
 * is no longer prose. The whole link is replaced, so the plugin's component
 * stands where the link stood, and the link's own text travels as `label` so a
 * label the author chose is not thrown away.
 */
function applyClaimedHrefs(
  tree: Nodes,
  registry: MessageDirectiveRegistry,
  mounts: MountedMessageDirective[],
): void {
  const compiled = compileClaims(registry, (slot) => slot.hrefPattern, "href pattern");
  if (compiled.length === 0) return;

  visit(tree, "link", (node, index, parent: Parent | undefined) => {
    if (parent === undefined || index === undefined) return;
    if (mounts.length >= MESSAGE_DIRECTIVE_MOUNT_LIMIT) return;
    const url = typeof node.url === "string" ? node.url : "";
    if (url.length === 0 || url.length > CLAIMED_HREF_MAX_LENGTH) return;

    let best: { slot: PluginMessageDirectiveSlot; m: RegExpExecArray } | null = null;
    for (const { slot, re } of compiled) {
      re.lastIndex = 0;
      const m = re.exec(url);
      if (m === null) continue;
      // First claim wins, deterministically: the registry is ordered by plugin
      // id, so two plugins claiming the same target always resolve the same way.
      best = { slot, m };
      break;
    }
    if (best === null) return;

    const label = linkText(node);
    const attributes: Record<string, string> = { raw: url };
    if (label.length > 0) attributes.label = label;
    for (const [key, groupValue] of Object.entries(best.m.groups ?? {})) {
      if (typeof groupValue === "string") attributes[key] = groupValue;
    }

    const mountIndex = mounts.length;
    mounts.push({
      attributes,
      index: mountIndex,
      slot: best.slot,
      source: url,
      inline: true,
    });
    parent.children.splice(index, 1, messageDirectiveMountNode(mountIndex, true));
    return index;
  });
}

/** The visible text of a link, so a label the author wrote survives the swap. */
function linkText(node: Nodes): string {
  let out = "";
  visit(node, "text", (text) => {
    out += text.value;
  });
  return out;
}

/**
 * Apply the text patterns plugins claimed.
 *
 * Only `text` nodes are visited, so a pattern can never reach inside inline
 * code or a fenced block — those are their own node types, and prose about a
 * notation has to stay prose. Everything a match produces goes through exactly
 * the same mount path as a directive: same registry, same crash isolation,
 * same per-message budget, which `mounts` carries because it is shared.
 */
function applyClaimedPatterns(
  tree: Nodes,
  registry: MessageDirectiveRegistry,
  mounts: MountedMessageDirective[],
): void {
  const compiled = compileClaims(registry, (slot) => slot.pattern, "pattern");
  if (compiled.length === 0) return;

  visit(tree, "text", (node, index, parent: Parent | undefined) => {
    if (parent === undefined || index === undefined) return;
    if (mounts.length >= MESSAGE_DIRECTIVE_MOUNT_LIMIT) return;
    // The bound, not an analysis of the pattern. See
    // CLAIMED_PATTERN_MAX_TEXT_RUN for why this is the whole defence.
    if (node.value.length > CLAIMED_PATTERN_MAX_TEXT_RUN) return;

    const replacement: RootContent[] = [];
    let cursor = 0;
    const value = node.value;

    while (cursor < value.length && mounts.length < MESSAGE_DIRECTIVE_MOUNT_LIMIT) {
      // Earliest match wins, and the longest of the earliest, so two plugins
      // claiming overlapping text produce one deterministic answer rather than
      // one that depends on registration order.
      let best: { slot: PluginMessageDirectiveSlot; m: RegExpExecArray } | null = null;
      for (const { slot, re } of compiled) {
        re.lastIndex = cursor;
        const m = re.exec(value);
        if (m === null || m[0].length === 0) continue;
        if (
          best === null ||
          m.index < best.m.index ||
          (m.index === best.m.index && m[0].length > best.m[0].length)
        ) {
          best = { slot, m };
        }
      }
      if (best === null) break;

      if (best.m.index > cursor) {
        replacement.push({ type: "text", value: value.slice(cursor, best.m.index) });
      }

      const attributes: Record<string, string> = { raw: best.m[0] };
      for (const [key, groupValue] of Object.entries(best.m.groups ?? {})) {
        if (typeof groupValue === "string") attributes[key] = groupValue;
      }

      const mountIndex = mounts.length;
      mounts.push({
        attributes,
        index: mountIndex,
        slot: best.slot,
        source: best.m[0],
        inline: true,
      });
      replacement.push(messageDirectiveMountNode(mountIndex, true));
      cursor = best.m.index + best.m[0].length;
    }

    if (replacement.length === 0) return;
    if (cursor < value.length) {
      replacement.push({ type: "text", value: value.slice(cursor) });
    }
    parent.children.splice(index, 1, ...(replacement as PhrasingContent[]));
    return index + replacement.length;
  });
}

interface BuildMessageDirectiveComponentArgs {
  mounts: readonly MountedMessageDirective[];
  message: PluginMessageDirectiveProps["message"];
  openWorkspaceFile: PluginMessageDirectiveProps["openWorkspaceFile"];
  openThreadPanel: MarkdownMessageDirectiveOpenThreadPanel | null;
}

/**
 * `components` renderer for the custom hast element. Looks the mount up by
 * sentinel index and wraps the plugin component in {@link PluginSlotMount}
 * so plugin context, scoped CSS, and crash isolation apply. Crash fallback is
 * the original directive source (not the generic crash chip).
 */
export function buildMessageDirectiveComponent({
  mounts,
  message,
  openWorkspaceFile,
  openThreadPanel,
}: BuildMessageDirectiveComponentArgs): ComponentType<MessageDirectiveElementProps> {
  function MessageDirectiveElement(props: MessageDirectiveElementProps) {
    const rawIndex = props["data-directive-index"];
    if (rawIndex === undefined) {
      return null;
    }
    const mount = mounts[Number(rawIndex)];
    if (mount === undefined) {
      return null;
    }
    const { slot, attributes, source, inline } = mount;
    const Component = slot.component;
    return (
      <PluginSlotMount
        key={`${slot.pluginId}/${slot.id}/${slot.generation}`}
        pluginId={slot.pluginId}
        slotKind="messageDirective"
        slotId={slot.id}
        crashFallback={source}
        {...(inline ? ({ rootAs: "span" } as const) : {})}
      >
        {openThreadPanel === null ? (
          <Component
            attributes={attributes}
            source={source}
            message={message}
            openWorkspaceFile={openWorkspaceFile}
          />
        ) : (
          <PluginThreadPanelNavigationProvider
            openThreadPanel={openThreadPanel}
          >
            <Component
              attributes={attributes}
              source={source}
              message={message}
              openWorkspaceFile={openWorkspaceFile}
            />
          </PluginThreadPanelNavigationProvider>
        )}
      </PluginSlotMount>
    );
  }

  return MessageDirectiveElement;
}

/**
 * Timeline-level registry context: subscribe once via {@link usePluginSlots},
 * build the registry, and provide it here so individual messages do not each
 * open a store subscription.
 */
const MessageDirectiveRegistryContext =
  createContext<MessageDirectiveRegistry | null>(null);

export function MessageDirectiveRegistryProvider({
  registry,
  children,
}: {
  registry: MessageDirectiveRegistry;
  children: ReactNode;
}) {
  return (
    <MessageDirectiveRegistryContext.Provider value={registry}>
      {children}
    </MessageDirectiveRegistryContext.Provider>
  );
}

export function useMessageDirectiveRegistry(): MessageDirectiveRegistry | null {
  return useContext(MessageDirectiveRegistryContext);
}
