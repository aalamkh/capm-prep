import { prisma } from "@/lib/db";
import { loadConcepts, ecoBucket } from "@/lib/concepts";
import {
  computeAllMastery,
  type ConceptMastery,
  type MasteryLevel,
} from "@/lib/mastery";
import type { Difficulty } from "@/lib/questions";

// ────────────────────────────────────────────────────────────────────────────
// XP
// ────────────────────────────────────────────────────────────────────────────

const XP_BASE: Record<Difficulty, number> = {
  EASY: 10,
  MEDIUM: 20,
  HARD: 30,
};

/** XP awarded for one answer. Wrong = 0. */
export function xpForAnswer(difficulty: Difficulty, isCorrect: boolean): number {
  if (!isCorrect) return 0;
  return XP_BASE[difficulty] ?? 10;
}

/** Compute total XP across all answered questions in the DB. */
export async function computeTotalXP(): Promise<number> {
  const rows = await prisma.answer.findMany({
    where: { isCorrect: true },
    select: { question: { select: { difficulty: true } } },
  });
  let total = 0;
  for (const r of rows) {
    total += xpForAnswer(r.question.difficulty as Difficulty, true);
  }
  return total;
}

// ────────────────────────────────────────────────────────────────────────────
// Levels
// ────────────────────────────────────────────────────────────────────────────

export interface Level {
  index: number;       // 1-based
  title: string;
  xpFloor: number;
  xpCeiling: number | null; // null = top tier
}

export const LEVELS: Level[] = [
  { index: 1, title: "Apprentice",        xpFloor: 0,     xpCeiling: 500 },
  { index: 2, title: "Practitioner",      xpFloor: 500,   xpCeiling: 1500 },
  { index: 3, title: "Specialist",        xpFloor: 1500,  xpCeiling: 3500 },
  { index: 4, title: "Senior Practitioner", xpFloor: 3500, xpCeiling: 7000 },
  { index: 5, title: "Master",            xpFloor: 7000,  xpCeiling: 12000 },
  { index: 6, title: "Grand Master",      xpFloor: 12000, xpCeiling: 20000 },
  { index: 7, title: "CAPM Ready",        xpFloor: 20000, xpCeiling: null },
];

export interface LevelProgress {
  level: Level;
  next: Level | null;
  xp: number;
  xpIntoLevel: number;
  xpForNextLevel: number | null;
  pctIntoLevel: number; // 0..1
}

export function levelFor(xp: number): LevelProgress {
  let cur = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.xpFloor) cur = l;
  }
  const next = LEVELS[cur.index] ?? null;
  const xpIntoLevel = xp - cur.xpFloor;
  const xpForNextLevel =
    cur.xpCeiling === null ? null : cur.xpCeiling - cur.xpFloor;
  const pctIntoLevel =
    xpForNextLevel === null ? 1 : Math.min(1, xpIntoLevel / xpForNextLevel);
  return {
    level: cur,
    next,
    xp,
    xpIntoLevel,
    xpForNextLevel,
    pctIntoLevel,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Achievements (derived from existing data — no schema additions)
// ────────────────────────────────────────────────────────────────────────────

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  emoji: string;
}

export interface AchievementState {
  def: AchievementDef;
  unlocked: boolean;
  progress: number; // 0..1 (1 = unlocked)
  detail: string;   // e.g. "7 / 10 mastered"
}

const A: AchievementDef[] = [
  { id: "first_step", title: "First Step", description: "Answer your first question.", emoji: "👣" },
  { id: "sprint_10", title: "Sprint to 10", description: "Answer 10 questions in a single session.", emoji: "🏃" },
  { id: "perfect_practice", title: "Perfect Practice", description: "Score 15/15 on a PRACTICE session.", emoji: "💯" },
  { id: "mock_survivor", title: "Mock Survivor", description: "Complete a full 150-question mock exam.", emoji: "🎓" },
  { id: "mock_pass", title: "Mock Passer", description: "Score 61%+ on a mock exam.", emoji: "✅" },
  { id: "above_target", title: "Above Target", description: "Earn Above Target band on any domain in a mock.", emoji: "🎯" },
  { id: "concept_master", title: "Concept Master", description: "Reach MASTERED on any one concept.", emoji: "🧠" },
  { id: "domain_champ", title: "Domain Champion", description: "MASTERED on every concept in one domain.", emoji: "🏆" },
  { id: "grand_slam", title: "Grand Slam", description: "MASTERED on all 20 concepts.", emoji: "👑" },
  { id: "week_strong", title: "Week Strong", description: "Hit a 7-day study streak.", emoji: "🔥" },
  { id: "comeback", title: "Comeback Kid", description: "Get a question right after a previous lapse on it.", emoji: "💪" },
  { id: "speed_demon", title: "Speed Demon", description: "10 correct in a row within a single session.", emoji: "⚡" },
  { id: "bookworm", title: "Bookworm", description: "Bookmark 10 questions.", emoji: "🔖" },
  { id: "level_5", title: "Master Tier", description: "Reach Level 5 (Master).", emoji: "🥇" },
];

export const ACHIEVEMENT_DEFS = A;

/**
 * Evaluate every achievement against current DB state. Returns one
 * AchievementState per definition. Cheap enough to call from a server page
 * once per render — every query is bounded by user history size.
 */
export async function evaluateAchievements(): Promise<AchievementState[]> {
  const [
    answersAny,
    sessionsCompleted,
    mockSessions,
    bookmarkCount,
    masteryMap,
    totalXp,
  ] = await Promise.all([
    prisma.answer.count(),
    prisma.examSession.findMany({
      where: { completedAt: { not: null } },
      include: { answers: true },
    }),
    prisma.examSession.findMany({
      where: { mode: "MOCK", completedAt: { not: null } },
      include: { answers: true },
    }),
    prisma.bookmark.count(),
    computeAllMastery(),
    computeTotalXP(),
  ]);

  const concepts = loadConcepts();
  const totalConcepts = concepts.length;
  const mastered = concepts.filter((c) => {
    const m = masteryMap.get(c.id);
    return m && (m.level === "MASTERED" || m.level === "EXPERT");
  }).length;

  // Per-domain mastery counts
  const domainMastered: Record<string, { mastered: number; total: number }> = {};
  for (const c of concepts) {
    if (!domainMastered[c.domain]) domainMastered[c.domain] = { mastered: 0, total: 0 };
    domainMastered[c.domain].total += 1;
    const m = masteryMap.get(c.id);
    if (m && (m.level === "MASTERED" || m.level === "EXPERT")) {
      domainMastered[c.domain].mastered += 1;
    }
  }
  const anyDomainChamp = Object.values(domainMastered).some(
    (d) => d.total > 0 && d.mastered === d.total
  );

  // Per-session metrics
  let maxAnswered = 0;
  let perfectPractice = false;
  const mockSurvivor = mockSessions.length > 0;
  let mockPass = false;
  let aboveTargetAnyDomain = false;
  let speedDemon = false;

  for (const s of sessionsCompleted) {
    const answered = s.answers.filter(
      (a) => a.isCorrect === true || a.isCorrect === false
    ).length;
    if (answered > maxAnswered) maxAnswered = answered;

    if (
      s.mode === "PRACTICE" &&
      s.score === s.totalQuestions &&
      s.totalQuestions === 15
    ) {
      perfectPractice = true;
    }

    if (s.mode === "MOCK") {
      const pct = s.totalQuestions === 0 ? 0 : s.score / s.totalQuestions;
      if (pct >= 0.61) mockPass = true;

      // Above Target on any domain requires ≥80% on that domain's portion.
      // Cheaply: group answers by domain via questionIds joined to question.domain.
      // Doing it cheaply with already-loaded answers requires the question domain,
      // so we run a quick targeted query if not yet flagged.
      if (!aboveTargetAnyDomain) {
        // Defer: looked up in the loop below to avoid N+1 if many sessions.
      }
    }

    // Speed demon: 10 correct in a row in *answer creation order*.
    const ordered = [...s.answers].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );
    let streak = 0;
    for (const a of ordered) {
      if (a.isCorrect === true) {
        streak += 1;
        if (streak >= 10) {
          speedDemon = true;
          break;
        }
      } else if (a.isCorrect === false) {
        streak = 0;
      }
    }
  }

  // Above-target eval (only if we actually have a mock and haven't flagged yet).
  if (mockSessions.length > 0 && !aboveTargetAnyDomain) {
    const sessionIds = mockSessions.map((s) => s.id);
    const mockAnswers = await prisma.answer.findMany({
      where: { sessionId: { in: sessionIds }, isCorrect: { not: null } },
      select: {
        sessionId: true,
        isCorrect: true,
        question: { select: { domain: true } },
      },
    });
    const perSessionDomain = new Map<
      string,
      Map<string, { correct: number; total: number }>
    >();
    for (const a of mockAnswers) {
      const sm = perSessionDomain.get(a.sessionId) ?? new Map();
      const dm = sm.get(a.question.domain) ?? { correct: 0, total: 0 };
      dm.total += 1;
      if (a.isCorrect === true) dm.correct += 1;
      sm.set(a.question.domain, dm);
      perSessionDomain.set(a.sessionId, sm);
    }
    for (const sm of perSessionDomain.values()) {
      for (const d of sm.values()) {
        if (d.total > 0 && d.correct / d.total >= 0.8) {
          aboveTargetAnyDomain = true;
          break;
        }
      }
      if (aboveTargetAnyDomain) break;
    }
  }

  // Comeback: a question with ≥1 wrong AND a subsequent right.
  const allAnswers = await prisma.answer.findMany({
    where: { isCorrect: { not: null } },
    orderBy: { createdAt: "asc" },
    select: { questionId: true, isCorrect: true, createdAt: true },
  });
  const everWrong = new Set<string>();
  let comeback = false;
  for (const a of allAnswers) {
    if (a.isCorrect === false) {
      everWrong.add(a.questionId);
    } else if (a.isCorrect === true && everWrong.has(a.questionId)) {
      comeback = true;
      break;
    }
  }

  // Streak — same logic as lib/review.getCurrentStreak.
  const streakRows = await prisma.studyStreak.findMany({
    orderBy: { date: "desc" },
    take: 30,
  });
  let currentStreak = 0;
  if (streakRows.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cursor = new Date(today);
    const startsToday = streakRows[0].date.getTime() === today.getTime();
    if (!startsToday) {
      cursor.setDate(cursor.getDate() - 1);
    }
    for (const r of streakRows) {
      if (
        r.date.getTime() === cursor.getTime() &&
        r.questionsAnswered >= 10 &&
        r.accuracyRate >= 0.6
      ) {
        currentStreak += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else if (r.date.getTime() < cursor.getTime()) {
        break;
      }
    }
  }

  const currentLevel = levelFor(totalXp).level.index;

  const states: AchievementState[] = [
    {
      def: byId("first_step"),
      unlocked: answersAny >= 1,
      progress: answersAny >= 1 ? 1 : 0,
      detail: `${answersAny} answered`,
    },
    {
      def: byId("sprint_10"),
      unlocked: maxAnswered >= 10,
      progress: Math.min(1, maxAnswered / 10),
      detail: `Best session: ${maxAnswered} answered`,
    },
    {
      def: byId("perfect_practice"),
      unlocked: perfectPractice,
      progress: perfectPractice ? 1 : 0,
      detail: perfectPractice ? "15 / 15" : "—",
    },
    {
      def: byId("mock_survivor"),
      unlocked: mockSurvivor,
      progress: mockSurvivor ? 1 : 0,
      detail: `${mockSessions.length} mock${mockSessions.length === 1 ? "" : "s"}`,
    },
    {
      def: byId("mock_pass"),
      unlocked: mockPass,
      progress: mockPass ? 1 : 0,
      detail: mockPass ? "Passed!" : "Not yet",
    },
    {
      def: byId("above_target"),
      unlocked: aboveTargetAnyDomain,
      progress: aboveTargetAnyDomain ? 1 : 0,
      detail: aboveTargetAnyDomain ? "Achieved" : "Not yet",
    },
    {
      def: byId("concept_master"),
      unlocked: mastered >= 1,
      progress: Math.min(1, mastered / 1),
      detail: `${mastered} / ${totalConcepts} mastered`,
    },
    {
      def: byId("domain_champ"),
      unlocked: anyDomainChamp,
      progress: anyDomainChamp ? 1 : 0,
      detail: domainChampDetail(domainMastered),
    },
    {
      def: byId("grand_slam"),
      unlocked: mastered === totalConcepts,
      progress: mastered / totalConcepts,
      detail: `${mastered} / ${totalConcepts}`,
    },
    {
      def: byId("week_strong"),
      unlocked: currentStreak >= 7,
      progress: Math.min(1, currentStreak / 7),
      detail: `${currentStreak} day${currentStreak === 1 ? "" : "s"} streak`,
    },
    {
      def: byId("comeback"),
      unlocked: comeback,
      progress: comeback ? 1 : 0,
      detail: comeback ? "Recovered" : "Not yet",
    },
    {
      def: byId("speed_demon"),
      unlocked: speedDemon,
      progress: speedDemon ? 1 : 0,
      detail: speedDemon ? "10 in a row" : "Not yet",
    },
    {
      def: byId("bookworm"),
      unlocked: bookmarkCount >= 10,
      progress: Math.min(1, bookmarkCount / 10),
      detail: `${bookmarkCount} / 10 bookmarks`,
    },
    {
      def: byId("level_5"),
      unlocked: currentLevel >= 5,
      progress: Math.min(1, currentLevel / 5),
      detail: `Level ${currentLevel}`,
    },
  ];

  return states;
}

function byId(id: string): AchievementDef {
  const def = A.find((x) => x.id === id);
  if (!def) throw new Error(`Unknown achievement: ${id}`);
  return def;
}

function domainChampDetail(
  domainMastered: Record<string, { mastered: number; total: number }>
): string {
  const lines = Object.entries(domainMastered)
    .filter(([, v]) => v.total > 0)
    .map(([d, v]) => `${d.split("_")[0]} ${v.mastered}/${v.total}`)
    .slice(0, 3);
  return lines.join(", ") || "—";
}

// ────────────────────────────────────────────────────────────────────────────
// Convenience: "what to study next?" — the concept with the lowest mastery
// rank that has the lowest accuracy.
// ────────────────────────────────────────────────────────────────────────────

export function nextConceptToFocus(
  masteryMap: Map<string, ConceptMastery>,
  preferredLevel: MasteryLevel = "LEARNING"
) {
  const concepts = loadConcepts();
  // Prefer LEARNING concepts, then PRACTICING, then NEW.
  const ranked = concepts
    .map((c) => {
      const m = masteryMap.get(c.id) ?? {
        conceptId: c.id,
        encounters: 0,
        correct: 0,
        accuracy: 0,
        level: "NEW" as MasteryLevel,
        lastSeenAt: null,
      };
      return { concept: c, mastery: m };
    })
    .sort((a, b) => {
      // Lower rank first; within rank, lower accuracy first.
      const rA = priority(a.mastery.level, preferredLevel);
      const rB = priority(b.mastery.level, preferredLevel);
      if (rA !== rB) return rA - rB;
      return a.mastery.accuracy - b.mastery.accuracy;
    });
  return ranked[0] ?? null;
}

function priority(level: MasteryLevel, preferred: MasteryLevel): number {
  if (level === preferred) return 0;
  if (level === "LEARNING") return 1;
  if (level === "PRACTICING") return 2;
  if (level === "NEW") return 3;
  if (level === "MASTERED") return 4;
  return 5; // EXPERT — no need to focus
}

// Silence unused-import warning when ecoBucket isn't referenced here.
void ecoBucket;
