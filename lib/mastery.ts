import { prisma } from "@/lib/db";
import { ecoBucket } from "@/lib/concepts";

export type MasteryLevel =
  | "NEW"          // 0 encounters
  | "LEARNING"     // <50% accuracy or <3 encounters
  | "PRACTICING"   // 50–79% accuracy with ≥3 encounters
  | "MASTERED"     // ≥80% accuracy with ≥5 encounters
  | "EXPERT";      // ≥95% accuracy with ≥10 encounters

export interface ConceptMastery {
  conceptId: string;       // 2-level ECO bucket
  encounters: number;      // distinct answer rows
  correct: number;
  accuracy: number;        // 0..1
  level: MasteryLevel;
  lastSeenAt: Date | null;
}

export interface MasteryUI {
  label: string;
  bg: string;       // tailwind class
  fg: string;
  border: string;
  rank: number;     // sort order, higher = more mastered
  next: string;     // hint for what gets you to the next tier
}

export const MASTERY_UI: Record<MasteryLevel, MasteryUI> = {
  NEW: {
    label: "New",
    bg: "bg-muted/40",
    fg: "text-muted-foreground",
    border: "border-input",
    rank: 0,
    next: "Answer 1+ to begin",
  },
  LEARNING: {
    label: "Learning",
    bg: "bg-red-50 dark:bg-red-950/40",
    fg: "text-red-800 dark:text-red-200",
    border: "border-red-300 dark:border-red-800",
    rank: 1,
    next: "Reach 50% with 3+ attempts",
  },
  PRACTICING: {
    label: "Practicing",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    fg: "text-amber-800 dark:text-amber-200",
    border: "border-amber-300 dark:border-amber-800",
    rank: 2,
    next: "Reach 80% with 5+ attempts",
  },
  MASTERED: {
    label: "Mastered",
    bg: "bg-green-50 dark:bg-green-950/40",
    fg: "text-green-800 dark:text-green-200",
    border: "border-green-300 dark:border-green-800",
    rank: 3,
    next: "Reach 95% with 10+ attempts",
  },
  EXPERT: {
    label: "Expert",
    bg: "bg-yellow-50 dark:bg-yellow-950/40",
    fg: "text-yellow-800 dark:text-yellow-200",
    border: "border-yellow-400 dark:border-yellow-600",
    rank: 4,
    next: "Already at the top — keep it sharp",
  },
};

function levelFor(encounters: number, accuracy: number): MasteryLevel {
  if (encounters === 0) return "NEW";
  if (encounters >= 10 && accuracy >= 0.95) return "EXPERT";
  if (encounters >= 5 && accuracy >= 0.8) return "MASTERED";
  if (encounters >= 3 && accuracy >= 0.5) return "PRACTICING";
  return "LEARNING";
}

/**
 * Compute mastery for every concept bucket by aggregating Answer rows.
 * Only counts answers that have a definitive isCorrect (true or false) —
 * unanswered / null answers are ignored.
 */
export async function computeAllMastery(): Promise<Map<string, ConceptMastery>> {
  const answers = await prisma.answer.findMany({
    where: { isCorrect: { not: null } },
    select: {
      isCorrect: true,
      createdAt: true,
      question: { select: { ecoTask: true } },
    },
  });

  const acc = new Map<
    string,
    { encounters: number; correct: number; lastSeenAt: Date }
  >();

  for (const a of answers) {
    const bucket = ecoBucket(a.question.ecoTask);
    if (!bucket) continue;
    const cur = acc.get(bucket) ?? {
      encounters: 0,
      correct: 0,
      lastSeenAt: a.createdAt,
    };
    cur.encounters += 1;
    if (a.isCorrect === true) cur.correct += 1;
    if (a.createdAt > cur.lastSeenAt) cur.lastSeenAt = a.createdAt;
    acc.set(bucket, cur);
  }

  const out = new Map<string, ConceptMastery>();
  for (const [conceptId, v] of acc.entries()) {
    const accuracy = v.encounters === 0 ? 0 : v.correct / v.encounters;
    out.set(conceptId, {
      conceptId,
      encounters: v.encounters,
      correct: v.correct,
      accuracy,
      level: levelFor(v.encounters, accuracy),
      lastSeenAt: v.lastSeenAt,
    });
  }
  return out;
}

export function masteryFor(
  map: Map<string, ConceptMastery>,
  conceptId: string
): ConceptMastery {
  return (
    map.get(conceptId) ?? {
      conceptId,
      encounters: 0,
      correct: 0,
      accuracy: 0,
      level: "NEW",
      lastSeenAt: null,
    }
  );
}
