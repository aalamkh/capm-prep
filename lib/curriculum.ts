import { readFileSync } from "node:fs";
import { join } from "node:path";

export type GameType = "match" | "order" | "tap";

export interface MatchPairsData {
  type: "match";
  /** Pairs the player must match — left↔right. Shuffled at render time. */
  pairs: Array<{ left: string; right: string }>;
  /** Optional intro shown above the board. */
  intro?: string;
}

export interface PutInOrderData {
  type: "order";
  /** Items in their CORRECT order. Shuffled at render time. */
  items: string[];
  /** Optional intro shown above the board. */
  intro?: string;
}

export interface TapTheRightData {
  type: "tap";
  /** Quick rounds — for each, the player picks the choice that matches the prompt. */
  rounds: Array<{
    prompt: string;
    /** All choices; one must equal `answer`. */
    choices: string[];
    answer: string;
    /** Optional 1-line hint shown after answering. */
    hint?: string;
  }>;
}

export type GameData = MatchPairsData | PutInOrderData | TapTheRightData;

export interface Topic {
  id: string;          // slug, unique across the whole course
  sectionId: string;   // links back to Section.id
  title: string;
  /** Short tagline shown in the topic list. */
  tagline: string;
  /** "Explain like I'm 5" — 2–4 paragraphs, plain language, analogy first. */
  eli5: string;
  /** 3–6 bullets a child could memorize. */
  keyFacts: string[];
  /** Optional citation. */
  reference?: string;
  /** Optional link to /learn concept (ECO bucket id, e.g. "1.4"). */
  relatedConcept?: string;
  game: GameData;
}

export interface Section {
  id: string;          // slug
  number: number;      // 1..9
  title: string;
  description: string;
}

export interface Curriculum {
  sections: Section[];
  topics: Topic[];
}

let cache: Curriculum | null = null;

export function loadCurriculum(): Curriculum {
  if (cache) return cache;
  const path = join(process.cwd(), "data", "curriculum.json");
  const raw = readFileSync(path, "utf8");
  cache = JSON.parse(raw) as Curriculum;
  return cache;
}

export function getSection(id: string): Section | undefined {
  return loadCurriculum().sections.find((s) => s.id === id);
}

export function getTopic(id: string): Topic | undefined {
  return loadCurriculum().topics.find((t) => t.id === id);
}

export function topicsForSection(sectionId: string): Topic[] {
  return loadCurriculum().topics.filter((t) => t.sectionId === sectionId);
}

/** Find the next topic (within the same section, or first topic of the next section). */
export function nextTopic(currentId: string): Topic | null {
  const { sections, topics } = loadCurriculum();
  const cur = topics.find((t) => t.id === currentId);
  if (!cur) return null;
  const sameSection = topics.filter((t) => t.sectionId === cur.sectionId);
  const idx = sameSection.findIndex((t) => t.id === currentId);
  if (idx >= 0 && idx < sameSection.length - 1) return sameSection[idx + 1];
  // Jump to first topic of the next section.
  const curSec = sections.find((s) => s.id === cur.sectionId);
  if (!curSec) return null;
  const nextSec = sections.find((s) => s.number === curSec.number + 1);
  if (!nextSec) return null;
  const nextTopics = topics.filter((t) => t.sectionId === nextSec.id);
  return nextTopics[0] ?? null;
}

/** Same but previous. */
export function prevTopic(currentId: string): Topic | null {
  const { sections, topics } = loadCurriculum();
  const cur = topics.find((t) => t.id === currentId);
  if (!cur) return null;
  const sameSection = topics.filter((t) => t.sectionId === cur.sectionId);
  const idx = sameSection.findIndex((t) => t.id === currentId);
  if (idx > 0) return sameSection[idx - 1];
  const curSec = sections.find((s) => s.id === cur.sectionId);
  if (!curSec) return null;
  const prevSec = sections.find((s) => s.number === curSec.number - 1);
  if (!prevSec) return null;
  const prevTopics = topics.filter((t) => t.sectionId === prevSec.id);
  return prevTopics[prevTopics.length - 1] ?? null;
}
