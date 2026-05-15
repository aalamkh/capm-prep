import { prisma } from "@/lib/db";
import {
  ALL_DOMAINS,
  DOMAIN_LABELS,
  type Domain,
  type Difficulty,
  type QuestionType,
} from "@/lib/questions";

// 2024 ECO domain weighting — used for "if exam were today" projection.
export const ECO_DOMAIN_WEIGHTS: Record<Domain, number> = {
  FUNDAMENTALS: 0.36,
  PREDICTIVE: 0.17,
  AGILE: 0.2,
  BUSINESS_ANALYSIS: 0.27,
};

export const PASS_THRESHOLD = 0.61;
export const MOCK_TARGET_SECONDS_PER_QUESTION = 72; // 3hr / 150q

/** Two-level ECO bucket (e.g. "1.4.2" → "1.4", "2.3" → "2.3"). */
export function ecoBucket(ecoTask: string | null | undefined): string | null {
  if (!ecoTask) return null;
  const code = ecoTask.split(/\s+/)[0]; // strip the description tail
  const parts = code.split(".");
  if (parts.length < 2) return parts[0] || null;
  return `${parts[0]}.${parts[1]}`;
}

// Friendly labels for each ECO 2-level bucket. Unknown buckets fall back to the code.
export const ECO_BUCKET_LABELS: Record<string, string> = {
  "1.1": "Life cycles & processes",
  "1.2": "Planning fundamentals",
  "1.3": "Roles & responsibilities",
  "1.4": "Communication, risk, leadership",
  "1.5": "Problem-solving tools",
  "2.1": "When to use predictive",
  "2.2": "Schedule management",
  "2.3": "Project controls",
  "3.1": "When to use adaptive",
  "3.2": "Agile understanding",
  "3.3": "Iteration planning",
  "3.4": "Adaptive controls",
  "3.5": "Adaptive plan components",
  "3.6": "Task management",
  "4.1": "BA roles",
  "4.2": "Stakeholder communication",
  "4.3": "Gather requirements",
  "4.4": "Product roadmaps",
  "4.5": "Methodology influence",
  "4.6": "Validate requirements",
};

const BUCKET_TO_DOMAIN: Record<string, Domain> = {
  "1": "FUNDAMENTALS",
  "2": "PREDICTIVE",
  "3": "AGILE",
  "4": "BUSINESS_ANALYSIS",
};

export function bucketDomain(bucket: string): Domain | null {
  const top = bucket.split(".")[0];
  return BUCKET_TO_DOMAIN[top] ?? null;
}

// ------------------------------------------------------------------
// Data shapes returned to the page
// ------------------------------------------------------------------

export interface DomainAccuracy {
  domain: Domain;
  label: string;
  correct: number;
  total: number;
  pct: number; // 0..1, NaN-safe (0 when total === 0)
}

export interface DifficultyAccuracy {
  difficulty: Difficulty;
  correct: number;
  total: number;
  pct: number;
}

export interface TypeAccuracy {
  type: QuestionType;
  correct: number;
  total: number;
  pct: number;
}

export interface EcoBucketStat {
  bucket: string;
  label: string;
  domain: Domain | null;
  correct: number;
  total: number;
  pct: number;
}

export interface SessionRow {
  id: string;
  mode: string;
  startedAt: Date;
  completedAt: Date | null;
  totalQuestions: number;
  score: number;
  pct: number;
  timeSpentSeconds: number;
}

export interface StatsBundle {
  hasAnyData: boolean;
  hasAnyCompletedSession: boolean;
  // Section 1
  recentSessionsAvgPct: number | null;
  recentSessionsCount: number;
  // Section 2
  domainAccuracy: DomainAccuracy[];
  ecoWeightedProjection: number | null;
  // Section 3
  difficultyAccuracy: DifficultyAccuracy[];
  hardBelow50: boolean;
  // Section 4
  typeAccuracy: TypeAccuracy[];
  // Section 5
  ecoBuckets: EcoBucketStat[];
  // Section 6
  recentSessions: SessionRow[];
  // Section 7
  avgSecondsPerQuestionMock: number | null;
}

// ------------------------------------------------------------------
// Aggregation
// ------------------------------------------------------------------

export async function getStats(): Promise<StatsBundle> {
  // Pull every scored answer once, with the question fields we need to bucket.
  const answers = await prisma.answer.findMany({
    where: { isCorrect: { not: null } },
    select: {
      isCorrect: true,
      question: {
        select: {
          domain: true,
          difficulty: true,
          type: true,
          ecoTask: true,
        },
      },
    },
  });

  const completedSessions = await prisma.examSession.findMany({
    where: { completedAt: { not: null } },
    orderBy: { completedAt: "desc" },
  });

  const hasAnyData = answers.length > 0;
  const hasAnyCompletedSession = completedSessions.length > 0;

  // ---- Section 1: composite from last 5 completed sessions ------------
  const last5 = completedSessions.slice(0, 5);
  const recentSessionsAvgPct =
    last5.length === 0
      ? null
      : last5.reduce(
          (s, x) => s + (x.totalQuestions === 0 ? 0 : x.score / x.totalQuestions),
          0
        ) / last5.length;

  // ---- Section 2: per-domain accuracy + ECO-weighted projection ------
  const domainAccuracy: DomainAccuracy[] = ALL_DOMAINS.map((d) => {
    const rows = answers.filter((a) => a.question.domain === d);
    const total = rows.length;
    const correct = rows.filter((a) => a.isCorrect === true).length;
    return {
      domain: d,
      label: DOMAIN_LABELS[d],
      correct,
      total,
      pct: total === 0 ? 0 : correct / total,
    };
  });

  const ecoWeightedProjection = (() => {
    if (domainAccuracy.every((d) => d.total === 0)) return null;
    let weighted = 0;
    let totalWeight = 0;
    for (const d of domainAccuracy) {
      if (d.total === 0) continue;
      const w = ECO_DOMAIN_WEIGHTS[d.domain];
      weighted += w * d.pct;
      totalWeight += w;
    }
    return totalWeight === 0 ? null : weighted / totalWeight;
  })();

  // ---- Section 3: difficulty -----------------------------------------
  const difficulties: Difficulty[] = ["EASY", "MEDIUM", "HARD"];
  const difficultyAccuracy: DifficultyAccuracy[] = difficulties.map((diff) => {
    const rows = answers.filter((a) => a.question.difficulty === diff);
    const total = rows.length;
    const correct = rows.filter((a) => a.isCorrect === true).length;
    return {
      difficulty: diff,
      correct,
      total,
      pct: total === 0 ? 0 : correct / total,
    };
  });
  const hardRow = difficultyAccuracy.find((x) => x.difficulty === "HARD");
  const hardBelow50 = !!(hardRow && hardRow.total > 0 && hardRow.pct < 0.5);

  // ---- Section 4: type -----------------------------------------------
  const types: QuestionType[] = [
    "SINGLE",
    "MULTI",
    "MATCHING",
    "HOTSPOT",
    "FILL_BLANK",
  ];
  const typeAccuracy: TypeAccuracy[] = types.map((t) => {
    const rows = answers.filter((a) => a.question.type === t);
    const total = rows.length;
    const correct = rows.filter((a) => a.isCorrect === true).length;
    return {
      type: t,
      correct,
      total,
      pct: total === 0 ? 0 : correct / total,
    };
  });

  // ---- Section 5: ECO heatmap ----------------------------------------
  const bucketCounts = new Map<string, { c: number; t: number }>();
  for (const a of answers) {
    const b = ecoBucket(a.question.ecoTask);
    if (!b) continue;
    const cur = bucketCounts.get(b) ?? { c: 0, t: 0 };
    cur.t += 1;
    if (a.isCorrect === true) cur.c += 1;
    bucketCounts.set(b, cur);
  }

  // Show every known bucket, even if there's no data yet, so the heatmap is stable.
  const allBuckets = new Set<string>([
    ...Object.keys(ECO_BUCKET_LABELS),
    ...bucketCounts.keys(),
  ]);
  const ecoBuckets: EcoBucketStat[] = Array.from(allBuckets)
    .sort()
    .map((bucket) => {
      const { c, t } = bucketCounts.get(bucket) ?? { c: 0, t: 0 };
      return {
        bucket,
        label: ECO_BUCKET_LABELS[bucket] ?? bucket,
        domain: bucketDomain(bucket),
        correct: c,
        total: t,
        pct: t === 0 ? 0 : c / t,
      };
    });

  // ---- Section 6: recent sessions ------------------------------------
  const recentSessions: SessionRow[] = completedSessions
    .slice(0, 10)
    .map((s) => ({
      id: s.id,
      mode: s.mode,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
      totalQuestions: s.totalQuestions,
      score: s.score,
      pct: s.totalQuestions === 0 ? 0 : s.score / s.totalQuestions,
      timeSpentSeconds: s.timeSpentSeconds,
    }));

  // ---- Section 7: pace on MOCK sessions ------------------------------
  const mockSessions = completedSessions.filter(
    (s) => s.mode === "MOCK" && s.totalQuestions > 0
  );
  const avgSecondsPerQuestionMock =
    mockSessions.length === 0
      ? null
      : mockSessions.reduce(
          (sum, s) => sum + s.timeSpentSeconds / s.totalQuestions,
          0
        ) / mockSessions.length;

  return {
    hasAnyData,
    hasAnyCompletedSession,
    recentSessionsAvgPct,
    recentSessionsCount: last5.length,
    domainAccuracy,
    ecoWeightedProjection,
    difficultyAccuracy,
    hardBelow50,
    typeAccuracy,
    ecoBuckets,
    recentSessions,
    avgSecondsPerQuestionMock,
  };
}
