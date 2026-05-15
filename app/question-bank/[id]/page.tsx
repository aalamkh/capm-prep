import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { prisma } from "@/lib/db";
import { parseQuestion, parseUserAnswer, DOMAIN_LABELS } from "@/lib/questions";
import { isCorrect } from "@/lib/scoring";
import { ecoBucket, ECO_BUCKET_LABELS } from "@/lib/stats";
import { ReviewQuestion } from "@/components/exam/ReviewQuestion";
import { BookmarkButton } from "@/components/BookmarkButton";
import { DrillSimilarButton } from "@/components/qbank/DrillSimilarButton";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export default async function QuestionDetailPage({ params }: Props) {
  const row = await prisma.question.findUnique({
    where: { id: params.id },
    include: {
      bookmarks: true,
      answers: {
        orderBy: { createdAt: "desc" },
        include: {
          session: { select: { id: true, mode: true, completedAt: true } },
        },
      },
    },
  });
  if (!row) notFound();

  const question = parseQuestion(row);
  const bookmark = row.bookmarks[0] ?? null;

  const answeredCount = row.answers.length;
  const correctCount = row.answers.filter((a) => a.isCorrect === true).length;

  const bucket = ecoBucket(row.ecoTask);
  const bucketLabel = bucket
    ? ECO_BUCKET_LABELS[bucket] ?? row.ecoTask?.slice(0, 80) ?? bucket
    : null;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/question-bank"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Question Bank
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge tone="domain">{DOMAIN_LABELS[question.domain]}</Badge>
          <Badge tone="difficulty" difficulty={question.difficulty}>
            {question.difficulty}
          </Badge>
          <Badge tone="type">{question.type.replace("_", " ")}</Badge>
          {row.ecoTask && (
            <span className="text-muted-foreground">ECO {row.ecoTask}</span>
          )}
        </div>
        <BookmarkButton
          questionId={question.id}
          initialBookmarked={!!bookmark}
          initialNote={bookmark?.note ?? null}
          variant="full"
        />
      </div>

      <section className="rounded-lg border bg-card p-6">
        <p className="mb-6 whitespace-pre-line text-base leading-relaxed">
          {question.questionText}
        </p>
        <ReviewQuestion question={question} userAnswer={null} />
      </section>

      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold">Why</h2>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
          {question.explanation}
        </p>
        {question.reference && (
          <p className="mt-3 text-xs text-muted-foreground">
            <span className="font-medium">Reference:</span> {question.reference}
          </p>
        )}
        {row.ecoTask && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">ECO task:</span> {row.ecoTask}
          </p>
        )}
      </section>

      <section className="rounded-lg border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Your history</h2>
            <p className="text-sm text-muted-foreground">
              {answeredCount === 0
                ? "You haven't answered this question yet."
                : `Answered ${answeredCount}× · ${correctCount} correct (${Math.round(
                    (correctCount / answeredCount) * 100
                  )}%)`}
            </p>
          </div>
          {bucket && bucketLabel && (
            <DrillSimilarButton
              ecoPrefix={bucket}
              ecoLabel={bucketLabel}
            />
          )}
        </div>

        {answeredCount > 0 && (
          <ul className="mt-4 divide-y rounded-md border">
            {row.answers.slice(0, 10).map((a) => {
              const userAnswer = parseUserAnswer(a.userAnswer);
              const correct = isCorrect(question, userAnswer);
              return (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 p-3 text-sm"
                >
                  <div className="flex items-center gap-2">
                    {correct ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span>
                      {a.session.mode}{" "}
                      <span className="text-muted-foreground">
                        · {(a.session.completedAt ?? a.createdAt).toLocaleString()}
                      </span>
                    </span>
                  </div>
                  {a.session.completedAt && (
                    <Link
                      href={`/exam/${a.session.id}/results`}
                      className="text-primary hover:underline"
                    >
                      Review session →
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Badge({
  children,
  tone,
  difficulty,
}: {
  children: React.ReactNode;
  tone: "domain" | "difficulty" | "type";
  difficulty?: string;
}) {
  let cls = "border-input bg-background";
  if (tone === "difficulty") {
    cls =
      difficulty === "EASY"
        ? "border-green-300 bg-green-50 text-green-800"
        : difficulty === "MEDIUM"
          ? "border-amber-300 bg-amber-50 text-amber-800"
          : "border-red-300 bg-red-50 text-red-800";
  } else if (tone === "type") {
    cls = "border-blue-200 bg-blue-50 text-blue-800";
  } else {
    cls = "border-violet-200 bg-violet-50 text-violet-800";
  }
  return (
    <span className={cn("rounded-md border px-1.5 py-0.5 font-medium", cls)}>
      {children}
    </span>
  );
}
