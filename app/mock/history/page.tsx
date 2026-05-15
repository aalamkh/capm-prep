import Link from "next/link";
import { ArrowLeft, History as HistoryIcon, TrendingDown, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/db";
import { parseQuestion, parseUserAnswer, ALL_DOMAINS, DOMAIN_LABELS, type Domain } from "@/lib/questions";
import { isCorrect } from "@/lib/scoring";
import { bandFor, BAND_UI } from "@/lib/proficiency";
import { MockTrendChart } from "@/components/mock/MockTrendChart";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PerDomainStat {
  domain: Domain;
  correct: number;
  total: number;
  pct: number;
}

interface AttemptSummary {
  id: string;
  completedAt: Date;
  total: number;
  correct: number;
  pct: number;
  timeSpentSeconds: number;
  perDomain: PerDomainStat[];
}

export default async function MockHistoryPage() {
  const sessions = await prisma.examSession.findMany({
    where: { mode: "MOCK", completedAt: { not: null } },
    orderBy: { completedAt: "asc" },
    include: { answers: true },
  });

  if (sessions.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-12 text-center">
        <h1 className="flex items-center justify-center gap-2 text-3xl font-bold tracking-tight">
          <HistoryIcon className="h-7 w-7" /> Mock history
        </h1>
        <p className="text-muted-foreground">
          No completed mock exams yet. Take one to start tracking your trend.
        </p>
        <Button asChild size="lg">
          <Link href="/mock">Start mock exam</Link>
        </Button>
      </div>
    );
  }

  // Pull every question that appears in any of these sessions, once.
  const allQuestionIds = new Set<string>();
  for (const s of sessions) {
    for (const id of JSON.parse(s.questionIds) as string[]) allQuestionIds.add(id);
  }
  const qRows = await prisma.question.findMany({
    where: { id: { in: Array.from(allQuestionIds) } },
  });
  const qById = new Map(qRows.map((q) => [q.id, parseQuestion(q)]));

  const attempts: AttemptSummary[] = sessions.map((s) => {
    const ids: string[] = JSON.parse(s.questionIds);
    const ansByQ = new Map(s.answers.map((a) => [a.questionId, a]));
    const perDomain: Record<Domain, { correct: number; total: number }> = {
      FUNDAMENTALS: { correct: 0, total: 0 },
      PREDICTIVE: { correct: 0, total: 0 },
      AGILE: { correct: 0, total: 0 },
      BUSINESS_ANALYSIS: { correct: 0, total: 0 },
    };
    let correct = 0;
    for (const id of ids) {
      const q = qById.get(id);
      if (!q) continue;
      perDomain[q.domain].total += 1;
      const a = ansByQ.get(id);
      if (a && isCorrect(q, parseUserAnswer(a.userAnswer))) {
        perDomain[q.domain].correct += 1;
        correct += 1;
      }
    }
    return {
      id: s.id,
      completedAt: s.completedAt!,
      total: ids.length,
      correct,
      pct: ids.length === 0 ? 0 : correct / ids.length,
      timeSpentSeconds: s.timeSpentSeconds,
      perDomain: ALL_DOMAINS.map((d) => {
        const { correct: c, total: t } = perDomain[d];
        return { domain: d, correct: c, total: t, pct: t === 0 ? 0 : c / t };
      }),
    };
  });

  const trendData = attempts.map((a, i) => ({
    index: i + 1,
    date: a.completedAt.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    pct: Math.round(a.pct * 100),
  }));

  const latest = attempts[attempts.length - 1];
  const previous = attempts[attempts.length - 2];
  const delta = previous ? Math.round((latest.pct - previous.pct) * 100) : null;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/mock"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Mock Exam
        </Link>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <HistoryIcon className="h-7 w-7" /> Mock history
          </h1>
          <p className="text-sm text-muted-foreground">
            {attempts.length} completed mock{attempts.length === 1 ? "" : "s"} ·
            most recent {Math.round(latest.pct * 100)}%
            {delta !== null && (
              <span
                className={cn(
                  "ml-2 inline-flex items-center gap-0.5",
                  delta >= 0 ? "text-green-700" : "text-red-700"
                )}
              >
                {delta >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {delta >= 0 ? `+${delta}` : delta} vs previous
              </span>
            )}
          </p>
        </div>
        <Button asChild>
          <Link href="/mock">Take another mock</Link>
        </Button>
      </div>

      {attempts.length >= 2 && (
        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold">Score trend</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Across all completed mocks, oldest to newest.
          </p>
          <MockTrendChart attempts={trendData} />
        </section>
      )}

      <section className="rounded-lg border bg-card p-6">
        <h2 className="mb-3 text-lg font-semibold">All attempts</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2 pr-4">#</th>
                <th className="py-2 pr-4">Completed</th>
                <th className="py-2 pr-4">Score</th>
                <th className="py-2 pr-4">%</th>
                <th className="py-2 pr-4">Time</th>
                {ALL_DOMAINS.map((d) => (
                  <th key={d} className="py-2 pr-4">
                    {DOMAIN_LABELS[d].split(" ")[0]}
                  </th>
                ))}
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {attempts
                .slice()
                .reverse()
                .map((a, idx) => {
                  const passing = a.pct >= 0.61;
                  return (
                    <tr key={a.id} className="border-b last:border-b-0">
                      <td className="py-2 pr-4 tabular-nums">
                        {attempts.length - idx}
                      </td>
                      <td className="py-2 pr-4 tabular-nums">
                        {a.completedAt.toLocaleDateString()}
                      </td>
                      <td className="py-2 pr-4 tabular-nums">
                        {a.correct}/{a.total}
                      </td>
                      <td
                        className={cn(
                          "py-2 pr-4 tabular-nums font-medium",
                          passing ? "text-green-700" : "text-red-700"
                        )}
                      >
                        {Math.round(a.pct * 100)}%
                      </td>
                      <td className="py-2 pr-4 tabular-nums">
                        {Math.floor(a.timeSpentSeconds / 60)}m
                      </td>
                      {a.perDomain.map((p) => {
                        const ui = BAND_UI[bandFor(p.pct)];
                        return (
                          <td key={p.domain} className="py-2 pr-4">
                            <span
                              className={cn(
                                "rounded-md border px-1.5 py-0.5 text-xs font-medium",
                                ui.border,
                                ui.bg,
                                ui.fg
                              )}
                              title={`${p.correct}/${p.total} · ${Math.round(p.pct * 100)}%`}
                            >
                              {ui.label.split(" ")[0]}
                            </span>
                          </td>
                        );
                      })}
                      <td className="py-2 pr-4">
                        <Link
                          href={`/exam/${a.id}/results`}
                          className="text-primary hover:underline"
                        >
                          Review →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
