import Link from "next/link";
import { Flame, BookOpen, Sparkles, Sunrise } from "lucide-react";
import { prisma } from "@/lib/db";
import {
  getCurrentStreak,
  getDueCount,
  getDueQuestionIds,
  getNewCountInWeakestDomain,
  getTodayProgress,
  STREAK_MIN_QUESTIONS,
  STREAK_MIN_ACCURACY,
  NEW_DRILL_DEFAULT_COUNT,
} from "@/lib/review";
import { DOMAIN_LABELS } from "@/lib/questions";
import { StartTodaySession } from "@/components/today/StartTodaySession";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const [
    streak,
    dueCount,
    dueIds,
    { count: newCount, domain: weakest },
    todayProgress,
  ] = await Promise.all([
    getCurrentStreak(),
    getDueCount(),
    getDueQuestionIds(8), // small preview list
    getNewCountInWeakestDomain(),
    getTodayProgress(),
  ]);

  const duePreview = dueIds.length
    ? await prisma.question.findMany({
        where: { id: { in: dueIds } },
        select: {
          id: true,
          domain: true,
          difficulty: true,
          questionText: true,
          ecoTask: true,
          schedule: { select: { nextReviewDate: true, lapses: true } },
        },
      })
    : [];

  // Preserve the ordering returned by getDueQuestionIds (oldest first).
  const orderedPreview = dueIds
    .map((id) => duePreview.find((q) => q.id === id))
    .filter((q): q is NonNullable<typeof q> => Boolean(q));

  const remainingForStreak = Math.max(
    0,
    STREAK_MIN_QUESTIONS - todayProgress.questionsAnswered
  );
  const accuracyPct = Math.round(todayProgress.accuracyRate * 100);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Sunrise className="h-7 w-7 text-amber-500" />
            Today
          </h1>
          <p className="text-sm text-muted-foreground">
            Spaced repetition + new questions tuned to your weakest area.
          </p>
        </div>
      </header>

      {/* Top row: streak + today's progress */}
      <section className="grid gap-4 md:grid-cols-2">
        <StreakCard
          streak={streak}
          qualifies={todayProgress.qualifies}
          remaining={remainingForStreak}
          answered={todayProgress.questionsAnswered}
          accuracyPct={accuracyPct}
        />
        <div className="rounded-lg border bg-card p-6">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Today&apos;s study
          </div>
          <div className="mt-1 text-3xl font-bold tabular-nums">
            {todayProgress.questionsAnswered}
            <span className="ml-2 text-base font-normal text-muted-foreground">
              answered
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Streak day qualifies at ≥ {STREAK_MIN_QUESTIONS} questions and ≥{" "}
            {Math.round(STREAK_MIN_ACCURACY * 100)}% accuracy.
          </p>
          {todayProgress.questionsAnswered > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              Today&apos;s accuracy: <span className="font-medium">{accuracyPct}%</span>{" "}
              {todayProgress.qualifies ? "✓ qualifies" : "still needed"}
            </p>
          )}
        </div>
      </section>

      {/* Due for review */}
      <section className="rounded-lg border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <BookOpen className="h-5 w-5" />
              Due for review
            </h2>
            <p className="text-sm text-muted-foreground">
              {dueCount === 0
                ? "Nothing due — your spaced-repetition queue is clear."
                : `${dueCount} question${dueCount === 1 ? "" : "s"} ready, ordered by oldest first.`}
            </p>
          </div>
          <StartTodaySession
            mode="REVIEW"
            count={dueCount}
            label={`Start review session (${dueCount})`}
            emptyLabel="Nothing due"
            variant="primary"
          />
        </div>
        {orderedPreview.length > 0 && (
          <ul className="mt-4 divide-y rounded-md border">
            {orderedPreview.map((q) => {
              const days = q.schedule
                ? Math.ceil(
                    (Date.now() - q.schedule.nextReviewDate.getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                : 0;
              return (
                <li key={q.id} className="flex items-start gap-3 p-3 text-sm">
                  <span
                    className={cn(
                      "rounded-md border px-1.5 py-0.5 text-xs font-medium",
                      days >= 3
                        ? "border-red-300 bg-red-50 text-red-800"
                        : days >= 1
                          ? "border-amber-300 bg-amber-50 text-amber-800"
                          : "border-input bg-muted"
                    )}
                  >
                    {days <= 0
                      ? "today"
                      : `${days}d overdue`}
                  </span>
                  <Link
                    href={`/question-bank/${q.id}`}
                    className="flex-1 hover:underline"
                  >
                    <div className="text-xs text-muted-foreground">
                      {DOMAIN_LABELS[q.domain as keyof typeof DOMAIN_LABELS]} ·{" "}
                      {q.difficulty}
                      {q.schedule && q.schedule.lapses > 0 && (
                        <span className="ml-2 text-red-700">
                          {q.schedule.lapses} lapse
                          {q.schedule.lapses === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                    <div className="line-clamp-2">{q.questionText}</div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {dueCount > orderedPreview.length && (
          <p className="mt-3 text-xs text-muted-foreground">
            Showing the {orderedPreview.length} most overdue · {dueCount - orderedPreview.length} more in the queue.
          </p>
        )}
      </section>

      {/* New questions */}
      <section className="rounded-lg border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Sparkles className="h-5 w-5" />
              New questions
            </h2>
            <p className="text-sm text-muted-foreground">
              Pulled from your weakest domain (
              <span className="font-medium text-foreground">
                {DOMAIN_LABELS[weakest]}
              </span>
              ). Default {NEW_DRILL_DEFAULT_COUNT} per session.
            </p>
            {newCount === 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                You&apos;ve seen every question in {DOMAIN_LABELS[weakest]} —
                pulling from the broader unseen pool if you start.
              </p>
            )}
          </div>
          <StartTodaySession
            mode="NEW"
            count={Math.max(newCount, 1)} // allow drilling cross-domain unseen if weakest is exhausted
            label={`Start new (${Math.min(newCount || NEW_DRILL_DEFAULT_COUNT, NEW_DRILL_DEFAULT_COUNT)})`}
            emptyLabel="Nothing new"
            variant="secondary"
          />
        </div>
      </section>
    </div>
  );
}

function StreakCard({
  streak,
  qualifies,
  remaining,
  answered,
  accuracyPct,
}: {
  streak: number;
  qualifies: boolean;
  remaining: number;
  answered: number;
  accuracyPct: number;
}) {
  const tone = streak >= 7 ? "text-orange-600" : streak >= 1 ? "text-amber-600" : "text-muted-foreground";
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        Streak
      </div>
      <div className={cn("mt-1 flex items-baseline gap-2", tone)}>
        <Flame className="h-7 w-7" />
        <span className="text-4xl font-bold tabular-nums">{streak}</span>
        <span className="text-base font-normal text-muted-foreground">
          day{streak === 1 ? "" : "s"}
        </span>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {qualifies
          ? "Today qualifies — keep it going."
          : answered === 0
            ? `Answer ${STREAK_MIN_QUESTIONS} questions today at ${Math.round(STREAK_MIN_ACCURACY * 100)}%+ to extend.`
            : remaining > 0
              ? `${remaining} more answer${remaining === 1 ? "" : "s"} needed today (currently ${accuracyPct}%).`
              : `Need ${Math.round(STREAK_MIN_ACCURACY * 100)}%+ accuracy today (currently ${accuracyPct}%).`}
      </div>
    </div>
  );
}
