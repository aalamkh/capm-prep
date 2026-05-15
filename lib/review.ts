import { prisma } from "@/lib/db";
import { nextSchedule, nextReviewDateFrom, type ScheduleState } from "@/lib/sm2";
import {
  ALL_DOMAINS,
  type Domain,
  type Difficulty,
} from "@/lib/questions";

export const STREAK_MIN_QUESTIONS = 10;
export const STREAK_MIN_ACCURACY = 0.6;
export const NEW_DRILL_DEFAULT_COUNT = 10;

// ------------------------------------------------------------------
// Date helpers (local-time day boundaries)
// ------------------------------------------------------------------

export function startOfLocalDay(d: Date = new Date()): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

export function endOfLocalDay(d: Date = new Date()): Date {
  const out = new Date(d);
  out.setHours(23, 59, 59, 999);
  return out;
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

// ------------------------------------------------------------------
// Schedule update — called from /api/sessions/[id]/submit
// ------------------------------------------------------------------

interface AnswerInput {
  questionId: string;
  isCorrect: boolean;
  difficulty: Difficulty;
}

/**
 * Apply SM-2 to one answer outcome and upsert the schedule row.
 * Idempotent given the same prior state + outcome.
 */
export async function applyScheduleUpdate(answer: AnswerInput): Promise<void> {
  const prior = await prisma.reviewSchedule.findUnique({
    where: { questionId: answer.questionId },
  });
  const priorState: ScheduleState | null = prior
    ? {
        interval: prior.interval,
        easeFactor: prior.easeFactor,
        lapses: prior.lapses,
      }
    : null;

  const next = nextSchedule({
    prior: priorState,
    isCorrect: answer.isCorrect,
    isEasy: answer.difficulty === "EASY",
  });

  const today = startOfLocalDay();
  const nextDate = nextReviewDateFrom(today, next.interval);

  await prisma.reviewSchedule.upsert({
    where: { questionId: answer.questionId },
    create: {
      questionId: answer.questionId,
      nextReviewDate: nextDate,
      interval: next.interval,
      easeFactor: next.easeFactor,
      lapses: next.lapses,
    },
    update: {
      nextReviewDate: nextDate,
      interval: next.interval,
      easeFactor: next.easeFactor,
      lapses: next.lapses,
    },
  });
}

// ------------------------------------------------------------------
// Streak — recompute today's StudyStreak row from all answers today
// ------------------------------------------------------------------

export async function recomputeTodayStreak(): Promise<void> {
  const today = startOfLocalDay();
  const tomorrow = addDays(today, 1);

  const answersToday = await prisma.answer.findMany({
    where: {
      isCorrect: { not: null },
      createdAt: { gte: today, lt: tomorrow },
    },
    select: { isCorrect: true },
  });
  const total = answersToday.length;
  const correct = answersToday.filter((a) => a.isCorrect === true).length;
  const accuracy = total === 0 ? 0 : correct / total;

  await prisma.studyStreak.upsert({
    where: { date: today },
    create: {
      date: today,
      questionsAnswered: total,
      accuracyRate: accuracy,
    },
    update: {
      questionsAnswered: total,
      accuracyRate: accuracy,
    },
  });
}

function dayQualifies(row: {
  questionsAnswered: number;
  accuracyRate: number;
} | null): boolean {
  if (!row) return false;
  return (
    row.questionsAnswered >= STREAK_MIN_QUESTIONS &&
    row.accuracyRate >= STREAK_MIN_ACCURACY
  );
}

/**
 * Walk back from today (inclusive if today qualifies, else from yesterday)
 * counting consecutive qualifying StudyStreak rows.
 */
export async function getCurrentStreak(): Promise<number> {
  const today = startOfLocalDay();
  const todayRow = await prisma.studyStreak.findUnique({
    where: { date: today },
  });

  let cursor = dayQualifies(todayRow) ? today : addDays(today, -1);
  let streak = 0;

  for (let safety = 0; safety < 365; safety++) {
    const row = await prisma.studyStreak.findUnique({ where: { date: cursor } });
    if (!dayQualifies(row)) break;
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export async function getTodayProgress(): Promise<{
  questionsAnswered: number;
  accuracyRate: number;
  qualifies: boolean;
}> {
  const today = startOfLocalDay();
  const row = await prisma.studyStreak.findUnique({ where: { date: today } });
  return {
    questionsAnswered: row?.questionsAnswered ?? 0,
    accuracyRate: row?.accuracyRate ?? 0,
    qualifies: dayQualifies(row ?? null),
  };
}

// ------------------------------------------------------------------
// Due / new question pickers
// ------------------------------------------------------------------

export async function getDueCount(): Promise<number> {
  const today = endOfLocalDay();
  return prisma.reviewSchedule.count({
    where: { nextReviewDate: { lte: today } },
  });
}

export async function getDueQuestionIds(limit?: number): Promise<string[]> {
  const today = endOfLocalDay();
  const rows = await prisma.reviewSchedule.findMany({
    where: { nextReviewDate: { lte: today } },
    orderBy: { nextReviewDate: "asc" }, // most overdue first
    take: limit,
    select: { questionId: true },
  });
  return rows.map((r) => r.questionId);
}

/**
 * Pick the user's weakest domain — lowest accuracy across all answers.
 * Returns the highest-weight domain (FUNDAMENTALS) if there's no data yet,
 * since that maximizes ECO-weighted impact for a brand-new user.
 */
export async function getWeakestDomain(): Promise<Domain> {
  const rows = await prisma.answer.findMany({
    where: { isCorrect: { not: null } },
    select: { isCorrect: true, question: { select: { domain: true } } },
  });
  if (rows.length === 0) return "FUNDAMENTALS";

  const stats: Record<Domain, { c: number; t: number }> = {
    FUNDAMENTALS: { c: 0, t: 0 },
    PREDICTIVE: { c: 0, t: 0 },
    AGILE: { c: 0, t: 0 },
    BUSINESS_ANALYSIS: { c: 0, t: 0 },
  };
  for (const r of rows) {
    const d = r.question.domain as Domain;
    stats[d].t += 1;
    if (r.isCorrect === true) stats[d].c += 1;
  }

  let weakest: Domain = "FUNDAMENTALS";
  let weakestPct = Infinity;
  for (const d of ALL_DOMAINS) {
    if (stats[d].t === 0) continue; // domains without data don't count as "weak"
    const pct = stats[d].c / stats[d].t;
    if (pct < weakestPct) {
      weakestPct = pct;
      weakest = d;
    }
  }
  return weakest;
}

/**
 * Pick `count` questions in the weakest domain that the user has not yet
 * seen (no ReviewSchedule row). If fewer than `count` unseen exist there,
 * top up from other domains' unseen pool to maintain the daily target.
 */
export async function getNewQuestionIds(
  count = NEW_DRILL_DEFAULT_COUNT
): Promise<{ ids: string[]; domain: Domain }> {
  const weakest = await getWeakestDomain();

  const inDomain = await prisma.question.findMany({
    where: { domain: weakest, schedule: null },
    select: { id: true },
    take: count,
  });
  const ids = inDomain.map((q) => q.id);

  if (ids.length < count) {
    const more = await prisma.question.findMany({
      where: {
        schedule: null,
        domain: { not: weakest },
        id: { notIn: ids },
      },
      select: { id: true },
      take: count - ids.length,
    });
    ids.push(...more.map((q) => q.id));
  }

  return { ids, domain: weakest };
}

export async function getNewCountInWeakestDomain(): Promise<{
  count: number;
  domain: Domain;
}> {
  const weakest = await getWeakestDomain();
  const count = await prisma.question.count({
    where: { domain: weakest, schedule: null },
  });
  return { count, domain: weakest };
}
