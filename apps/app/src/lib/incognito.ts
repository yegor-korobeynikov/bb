import { atom, useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

/**
 * Demonstration mode — the "eye".
 *
 * The product is shown on REAL data (a demo on invented data persuades nobody),
 * with the parts that identify a client, a person, or a sum replaced by stable
 * stand-ins. Names stay consistent for the whole session so a walkthrough can
 * refer to "Client A" twice and mean the same client.
 *
 * A presentation state, not a security boundary: the data is untouched, and
 * anything the viewer can reach through the network tab is unchanged. It exists
 * so a screen can be pointed at a room, not so a secret can be kept from an
 * attacker.
 */
export const incognitoAtom = atomWithStorage<boolean>(
  "tendo.incognito",
  false,
  undefined,
  { getOnInit: true },
);

/** Read-only view for surfaces that only render. */
export const incognitoReadAtom = atom((get) => get(incognitoAtom));

export function useIncognito(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useAtom(incognitoAtom);
  return [on, setOn];
}

/**
 * Stable letters for ids: the same project is "Client A" every time it appears,
 * including across a reload, because the mapping is derived from the id rather
 * than from the order things happened to render in.
 */
function letterFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  // One letter, the way a person would say it out loud in a demo — "Client A".
  // Two letters read as a code and make the stand-in look like data.
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return alphabet[hash % 26];
}

function numberFor(id: string, span: number): number {
  let hash = 7;
  for (let i = 0; i < id.length; i++) hash = (hash * 17 + id.charCodeAt(i)) >>> 0;
  return (hash % span) + 1;
}

export function maskProjectName(id: string, name: string, on: boolean): string {
  return on ? `Client ${letterFor(id)}` : name;
}

export function maskSectionName(id: string, name: string, on: boolean): string {
  // Sections are the user's own vocabulary for their work ("Operations",
  // "Infra&Tools") — they carry no client identity, so they survive as they are.
  void id;
  void on;
  return name;
}

/**
 * A thread title can hold anything — a client, a person, a sum, a deal term —
 * so in demonstration mode it is replaced wholesale rather than filtered. The
 * shape of the work (which project, how many threads, what is nested where)
 * survives, which is what a walkthrough is actually showing.
 */
export function maskThreadTitle(
  args: { id: string; projectId: string; title: string | null; on: boolean },
): string | null {
  if (!args.on) return args.title;
  return `Client ${letterFor(args.projectId)} · Thread ${numberFor(args.id, 9)}`;
}

/** Money and commercial terms, wherever they are rendered as text. */
export function maskAmount(value: string, on: boolean): string {
  return on ? "•••" : value;
}
