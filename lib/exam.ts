import { prisma } from "@/lib/db";
import type { Domain, Difficulty } from "@/lib/questions";

export type Mode =
  | "PRACTICE"
  | "MOCK"
  | "DOMAIN"
  | "ECO_DRILL"
  | "BOOKMARK_DRILL"
  | "REVIEW"
  | "NEW"
  | "LEARN";

export const REVEAL_AFTER_ANSWER_MODES: Mode[] = ["REVIEW", "NEW", "LEARN"];

export function isRevealMode(mode: Mode): boolean {
  return REVEAL_AFTER_ANSWER_MODES.includes(mode);
}

export const MOCK_EXAM_DURATION_SECONDS = 3 * 60 * 60; // 3 hours
export const PRACTICE_QUESTION_COUNT = 15;
export const MOCK_QUESTION_COUNT = 150;
export const LEARN_QUESTION_COUNT = 5;

// Per-domain split for the 15-question PRACTICE pool, weighted by ECO domain
// percentages: 36/17/20/27 -> 5/3/3/4 of 15.
const PRACTICE_DOMAIN_QUOTA: Record<Domain, number> = {
  FUNDAMENTALS: 5,
  PREDICTIVE: 3,
  AGILE: 3,
  BUSINESS_ANALYSIS: 4,
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function pickByDomain(domain: Domain, n: number): Promise<string[]> {
  const rows = await prisma.question.findMany({
    where: { domain },
    select: { id: true },
  });
  return shuffle(rows.map((r) => r.id)).slice(0, n);
}

export async function pickPracticeQuestions(): Promise<string[]> {
  const ids: string[] = [];
  for (const [domain, n] of Object.entries(PRACTICE_DOMAIN_QUOTA) as [
    Domain,
    number
  ][]) {
    ids.push(...(await pickByDomain(domain, n)));
  }
  return shuffle(ids);
}

export async function pickMockQuestions(): Promise<string[]> {
  const rows = await prisma.question.findMany({ select: { id: true } });
  return shuffle(rows.map((r) => r.id));
}

/**
 * Realistic MOCK picker.
 *
 * Targets the real CAPM mix:
 *  - Domain weights: 36/17/20/27 (ECO 2024)
 *  - Difficulty mix: 30/50/20 (EASY/MEDIUM/HARD)
 *
 * For each (domain, difficulty) bucket the picker:
 *  1. Counts how many questions to pull (target).
 *  2. Sorts the pool by "least recently used in any of the last 5 MOCK
 *     sessions" (LRU). Never-seen questions sort first.
 *  3. Takes `target` from the front.
 *
 * The full bank (150) currently equals one MOCK, so every MOCK still draws
 * every question — but the per-bucket LRU sort means as the bank grows,
 * the same picker correctly de-prioritizes recent repeats automatically.
 */

const ECO_DOMAIN_WEIGHTS: Record<Domain, number> = {
  FUNDAMENTALS: 0.36,
  PREDICTIVE: 0.17,
  AGILE: 0.2,
  BUSINESS_ANALYSIS: 0.27,
};

const DIFFICULTY_WEIGHTS: Record<Difficulty, number> = {
  EASY: 0.3,
  MEDIUM: 0.5,
  HARD: 0.2,
};

function targetFor(
  domain: Domain,
  difficulty: Difficulty,
  total: number
): number {
  return Math.round(
    total * ECO_DOMAIN_WEIGHTS[domain] * DIFFICULTY_WEIGHTS[difficulty]
  );
}

export async function pickRealisticMockQuestions(
  total = MOCK_QUESTION_COUNT,
  recentSessionLimit = 5
): Promise<string[]> {
  const recentMockSessions = await prisma.examSession.findMany({
    where: { mode: "MOCK", completedAt: { not: null } },
    orderBy: { completedAt: "desc" },
    take: recentSessionLimit,
    select: { id: true, completedAt: true },
  });
  const recentSessionIds = new Set(recentMockSessions.map((s) => s.id));

  // Map each questionId → most-recent timestamp it appeared in those sessions.
  const lastUsed = new Map<string, number>();
  if (recentSessionIds.size > 0) {
    const recentAnswers = await prisma.answer.findMany({
      where: { sessionId: { in: Array.from(recentSessionIds) } },
      select: {
        questionId: true,
        session: { select: { completedAt: true } },
      },
    });
    for (const a of recentAnswers) {
      const ts = a.session.completedAt?.getTime() ?? 0;
      const prev = lastUsed.get(a.questionId) ?? -1;
      if (ts > prev) lastUsed.set(a.questionId, ts);
    }
  }

  const allRows = await prisma.question.findMany({
    select: { id: true, domain: true, difficulty: true },
  });

  const domains: Domain[] = [
    "FUNDAMENTALS",
    "PREDICTIVE",
    "AGILE",
    "BUSINESS_ANALYSIS",
  ];
  const difficulties: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

  const picked: string[] = [];
  for (const d of domains) {
    for (const diff of difficulties) {
      const bucket = allRows.filter(
        (r) => r.domain === d && r.difficulty === diff
      );
      // Sort: never-used first; otherwise oldest-used first; ties random-ish.
      bucket.sort((a, b) => {
        const ta = lastUsed.get(a.id) ?? -1;
        const tb = lastUsed.get(b.id) ?? -1;
        if (ta !== tb) return ta - tb;
        return Math.random() - 0.5;
      });
      const target = Math.min(bucket.length, targetFor(d, diff, total));
      picked.push(...bucket.slice(0, target).map((r) => r.id));
    }
  }

  // If rounding under-fills, top up with any remaining LRU-sorted questions.
  if (picked.length < total) {
    const usedSet = new Set(picked);
    const remaining = allRows
      .filter((r) => !usedSet.has(r.id))
      .sort((a, b) => {
        const ta = lastUsed.get(a.id) ?? -1;
        const tb = lastUsed.get(b.id) ?? -1;
        return ta - tb;
      });
    while (picked.length < total && remaining.length > 0) {
      picked.push(remaining.shift()!.id);
    }
  }

  return shuffle(picked);
}

export async function pickDomainQuestions(
  domain: Domain,
  count: number | "all"
): Promise<string[]> {
  const rows = await prisma.question.findMany({
    where: { domain },
    select: { id: true },
  });
  const shuffled = shuffle(rows.map((r) => r.id));
  if (count === "all") return shuffled;
  return shuffled.slice(0, count);
}

export async function pickBookmarkedQuestions(): Promise<string[]> {
  const rows = await prisma.bookmark.findMany({
    select: { questionId: true },
    orderBy: { createdAt: "desc" },
  });
  return shuffle(rows.map((r) => r.questionId));
}

export async function pickEcoQuestions(prefix: string): Promise<string[]> {
  const rows = await prisma.question.findMany({
    where: {
      OR: [
        { ecoTask: { startsWith: `${prefix}.` } },
        { ecoTask: { startsWith: `${prefix} ` } },
        { ecoTask: { equals: prefix } },
      ],
    },
    select: { id: true },
  });
  return shuffle(rows.map((r) => r.id));
}

/**
 * Pick a small set of questions for LEARN mode — same lookup as ECO_DRILL
 * but capped at `count` and ordered with "least seen" first so we cover
 * unseen ground before re-drilling familiar items.
 */
export async function pickLearnQuestions(
  ecoPrefix: string,
  count = LEARN_QUESTION_COUNT
): Promise<string[]> {
  // Same OR shape as pickEcoQuestions, but join in answer count for sort.
  const rows = await prisma.question.findMany({
    where: {
      OR: [
        { ecoTask: { startsWith: `${ecoPrefix}.` } },
        { ecoTask: { startsWith: `${ecoPrefix} ` } },
        { ecoTask: { equals: ecoPrefix } },
      ],
    },
    select: {
      id: true,
      _count: { select: { answers: true } },
    },
  });

  // Sort ascending by answer count (least seen first), then random within ties.
  rows.sort((a, b) => {
    const ca = a._count.answers;
    const cb = b._count.answers;
    if (ca !== cb) return ca - cb;
    return Math.random() - 0.5;
  });

  return rows.slice(0, count).map((r) => r.id);
}

export function durationSecondsForMode(mode: Mode): number | null {
  return mode === "MOCK" ? MOCK_EXAM_DURATION_SECONDS : null;
}
