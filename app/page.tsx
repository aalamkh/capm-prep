import Link from "next/link";
import { BookOpen, Timer, BarChart3, Library, Flame, Sunrise, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentStreak, getDueCount } from "@/lib/review";
import { computeAllMastery } from "@/lib/mastery";
import { computeTotalXP, levelFor, nextConceptToFocus } from "@/lib/gamification";
import { loadConcepts } from "@/lib/concepts";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const features = [
  {
    href: "/learn",
    title: "Learn",
    description:
      "Concept map with teaching cards, mastery tracking, XP, and achievements.",
    icon: Sparkles,
  },
  {
    href: "/practice",
    title: "Practice",
    description:
      "Drill questions by domain, with instant feedback and explanations.",
    icon: BookOpen,
  },
  {
    href: "/mock",
    title: "Mock Exam",
    description:
      "Take a timed full-length CAPM mock exam under realistic conditions.",
    icon: Timer,
  },
  {
    href: "/stats",
    title: "Stats",
    description:
      "Track accuracy, study streaks, and weak areas across domains.",
    icon: BarChart3,
  },
  {
    href: "/question-bank",
    title: "Question Bank",
    description:
      "Browse and search every question by domain, type, or difficulty.",
    icon: Library,
  },
];

export default async function Home() {
  const [dueCount, streak, xp, masteryMap] = await Promise.all([
    getDueCount(),
    getCurrentStreak(),
    computeTotalXP(),
    computeAllMastery(),
  ]);
  const progress = levelFor(xp);
  const focus = nextConceptToFocus(masteryMap);
  const totalConcepts = loadConcepts().length;
  const masteredCount = Array.from(masteryMap.values()).filter(
    (m) => m.level === "MASTERED" || m.level === "EXPERT"
  ).length;

  return (
    <div className="space-y-12">
      <section className="space-y-4 py-8">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Prep for the CAPM exam.
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Practice questions across all four CAPM domains, take timed mock
          exams, and track your progress as you go.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild size="lg">
            <Link href="/practice">Start practicing</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/mock">Take a mock exam</Link>
          </Button>
        </div>
      </section>

      {/* Learn widget — XP, level, recommended next concept */}
      <section>
        <Link
          href="/learn"
          className="group block rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 transition-colors hover:brightness-95 dark:from-amber-950/40 dark:to-orange-950/40 dark:border-amber-800"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-amber-500" />
              <div>
                <div className="text-xs uppercase tracking-wide text-amber-700 dark:text-amber-300">
                  Level {progress.level.index} · {progress.level.title}
                </div>
                <div className="font-semibold">
                  {focus
                    ? `Next: ${focus.concept.id} ${focus.concept.title}`
                    : "Open the concept map"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {masteredCount} / {totalConcepts} concepts mastered ·{" "}
                  {xp.toLocaleString()} XP
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="hidden sm:inline">Open Learn</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
          {/* XP bar */}
          <div className="mt-3 h-2 w-full rounded-full bg-background/60">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
              style={{ width: `${Math.max(3, progress.pctIntoLevel * 100)}%` }}
            />
          </div>
        </Link>
      </section>

      {/* Today widget */}
      <section>
        <Link
          href="/today"
          className={cn(
            "group block rounded-lg border bg-card p-5 transition-colors hover:bg-accent/40",
            dueCount > 0 && "border-amber-300 bg-amber-50/40"
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Sunrise className="h-6 w-6 text-amber-500" />
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Today
                </div>
                <div className="font-semibold">
                  {dueCount === 0
                    ? "Queue clear · pick up new questions"
                    : `${dueCount} question${dueCount === 1 ? "" : "s"} due for review`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Flame
                className={cn(
                  "h-5 w-5",
                  streak >= 7
                    ? "text-orange-500"
                    : streak >= 1
                      ? "text-amber-500"
                      : "text-muted-foreground"
                )}
              />
              <span className="font-medium">
                {streak} day{streak === 1 ? "" : "s"}
              </span>
              <span className="text-muted-foreground">streak</span>
              <span className="ml-3 hidden text-muted-foreground sm:inline">
                Open Today →
              </span>
            </div>
          </div>
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {features.map(({ href, title, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-lg border bg-card p-6 transition-colors hover:bg-accent"
          >
            <Icon className="mb-3 h-6 w-6 text-muted-foreground group-hover:text-foreground" />
            <h2 className="mb-1 font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
