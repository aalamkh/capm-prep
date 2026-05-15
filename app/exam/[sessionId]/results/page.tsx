import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, XCircle, Flag } from "lucide-react";
import { prisma } from "@/lib/db";
import {
  parseQuestion,
  parseUserAnswer,
  ALL_DOMAINS,
  DOMAIN_LABELS,
  type Domain,
} from "@/lib/questions";
import { isCorrect } from "@/lib/scoring";
import { Button } from "@/components/ui/button";
import { ReviewQuestion } from "@/components/exam/ReviewQuestion";
import { BookmarkButton } from "@/components/BookmarkButton";
import { bandFor, BAND_UI } from "@/lib/proficiency";
import { History } from "lucide-react";
import { cn } from "@/lib/utils";

const PASS_THRESHOLD = 0.61;

interface Props {
  params: { sessionId: string };
}

export default async function ResultsPage({ params }: Props) {
  const session = await prisma.examSession.findUnique({
    where: { id: params.sessionId },
    include: { answers: true },
  });
  if (!session) notFound();
  if (!session.completedAt) {
    redirect(`/exam/${session.id}`);
  }

  const orderedIds: string[] = JSON.parse(session.questionIds);
  const rows = await prisma.question.findMany({
    where: { id: { in: orderedIds } },
  });
  const byId = new Map(rows.map((r) => [r.id, parseQuestion(r)]));
  const questions = orderedIds
    .map((id) => byId.get(id))
    .filter((q): q is NonNullable<typeof q> => Boolean(q));

  const ansByQ = new Map(session.answers.map((a) => [a.questionId, a]));

  const bookmarks = await prisma.bookmark.findMany({
    where: { questionId: { in: orderedIds } },
    select: { questionId: true, note: true },
  });
  const bookmarkByQ = new Map(bookmarks.map((b) => [b.questionId, b]));

  // Score (recompute defensively)
  let correct = 0;
  for (const q of questions) {
    const a = ansByQ.get(q.id);
    if (a && isCorrect(q, parseUserAnswer(a.userAnswer))) correct++;
  }
  const total = questions.length;
  const pct = total === 0 ? 0 : correct / total;
  const passed = pct >= PASS_THRESHOLD;

  // Per-domain breakdown
  const perDomain: Record<Domain, { correct: number; total: number }> = {
    FUNDAMENTALS: { correct: 0, total: 0 },
    PREDICTIVE: { correct: 0, total: 0 },
    AGILE: { correct: 0, total: 0 },
    BUSINESS_ANALYSIS: { correct: 0, total: 0 },
  };
  for (const q of questions) {
    perDomain[q.domain].total++;
    const a = ansByQ.get(q.id);
    if (a && isCorrect(q, parseUserAnswer(a.userAnswer))) {
      perDomain[q.domain].correct++;
    }
  }

  const elapsed = session.timeSpentSeconds;
  const elapsedHM = `${Math.floor(elapsed / 3600)}h ${Math.floor((elapsed % 3600) / 60)}m`;

  return (
    <div className="space-y-8">
      {/* Score */}
      <section className="rounded-lg border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-sm text-muted-foreground">{session.mode} session</div>
            <h1 className="text-3xl font-bold tracking-tight">
              {correct} / {total} ·{" "}
              <span className={passed ? "text-green-600" : "text-red-600"}>
                {Math.round(pct * 100)}%
              </span>
            </h1>
            <div
              className={`mt-1 inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold ${
                passed
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {passed ? "Pass" : "Below pass threshold"} (≥ 61%)
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              Time spent: {elapsedHM}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {session.mode === "MOCK" && (
              <Button asChild variant="outline">
                <Link href="/mock/history">
                  <History className="mr-2 h-4 w-4" /> Mock history
                </Link>
              </Button>
            )}
            <Button asChild>
              <Link href="/practice/new">New session</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* PMI-style proficiency bands — only meaningful for MOCK */}
      {session.mode === "MOCK" && (
        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold">Proficiency by domain</h2>
          <p className="text-sm text-muted-foreground">
            PMI-style bands (Above Target / Target / Below Target / Needs
            Improvement).
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {ALL_DOMAINS.map((d) => {
              const { correct: c, total: t } = perDomain[d];
              const pctD = t === 0 ? 0 : c / t;
              const band = bandFor(pctD);
              const ui = BAND_UI[band];
              return (
                <div
                  key={d}
                  className={cn("rounded-md border p-3", ui.border, ui.bg)}
                >
                  <div className="flex items-baseline justify-between">
                    <span className="font-medium">{DOMAIN_LABELS[d]}</span>
                    <span className={cn("text-sm font-semibold", ui.fg)}>
                      {ui.label}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {t === 0 ? "—" : `${c}/${t} · ${Math.round(pctD * 100)}%`}
                  </div>
                  <div className={cn("text-xs", ui.fg)}>{ui.hint}</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Per-domain */}
      <section className="rounded-lg border bg-card p-6">
        <h2 className="mb-3 text-lg font-semibold">Per-domain breakdown</h2>
        <div className="space-y-2">
          {ALL_DOMAINS.map((d) => {
            const { correct: c, total: t } = perDomain[d];
            const pctD = t === 0 ? 0 : c / t;
            return (
              <div key={d} className="space-y-1">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium">{DOMAIN_LABELS[d]}</span>
                  <span className="text-muted-foreground">
                    {c} / {t} ({t === 0 ? "—" : `${Math.round(pctD * 100)}%`})
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className={`h-2 rounded-full ${
                      pctD >= PASS_THRESHOLD ? "bg-green-600" : "bg-red-500"
                    }`}
                    style={{ width: `${Math.max(2, pctD * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Per-question review */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Question review</h2>
        {questions.map((q, i) => {
          const a = ansByQ.get(q.id);
          const userAnswer = a ? parseUserAnswer(a.userAnswer) : null;
          const correctAns = isCorrect(q, userAnswer);
          const flagged = a?.flaggedForReview ?? false;

          return (
            <details
              key={q.id}
              className="rounded-lg border bg-card open:bg-card"
            >
              <summary className="flex cursor-pointer items-start gap-3 p-4">
                {correctAns ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                ) : (
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                )}
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">
                    Q{i + 1} · {DOMAIN_LABELS[q.domain]} · {q.difficulty} ·{" "}
                    {q.type.replace("_", " ")}
                    {flagged && (
                      <span className="ml-2 inline-flex items-center gap-1 text-amber-700">
                        <Flag className="h-3 w-3" /> flagged
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-medium">{q.questionText}</div>
                </div>
              </summary>

              <div className="space-y-4 border-t p-4">
                <ReviewQuestion question={q} userAnswer={userAnswer} />
                <div className="rounded-md bg-muted p-3 text-sm">
                  <div className="font-semibold">Why</div>
                  <p className="whitespace-pre-line">{q.explanation}</p>
                  {q.reference && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Reference: {q.reference}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                  <Link
                    href={`/question-bank/${q.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    Open in Question Bank →
                  </Link>
                  <BookmarkButton
                    questionId={q.id}
                    initialBookmarked={!!bookmarkByQ.get(q.id)}
                    initialNote={bookmarkByQ.get(q.id)?.note ?? null}
                    variant="full"
                  />
                </div>
              </div>
            </details>
          );
        })}
      </section>
    </div>
  );
}
