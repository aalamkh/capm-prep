import Link from "next/link";
import { Flame, Trophy, Sparkles, ChevronRight, Lock } from "lucide-react";
import { conceptsByDomain, loadConcepts } from "@/lib/concepts";
import { computeAllMastery, MASTERY_UI, masteryFor } from "@/lib/mastery";
import {
  computeTotalXP,
  levelFor,
  evaluateAchievements,
  nextConceptToFocus,
} from "@/lib/gamification";
import { getCurrentStreak } from "@/lib/review";
import { DOMAIN_LABELS, ALL_DOMAINS } from "@/lib/questions";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const [xp, masteryMap, streak, achievements] = await Promise.all([
    computeTotalXP(),
    computeAllMastery(),
    getCurrentStreak(),
    evaluateAchievements(),
  ]);

  const progress = levelFor(xp);
  const focus = nextConceptToFocus(masteryMap);
  const byDomain = conceptsByDomain();
  const concepts = loadConcepts();
  const masteredCount = concepts.filter((c) => {
    const m = masteryFor(masteryMap, c.id);
    return m.level === "MASTERED" || m.level === "EXPERT";
  }).length;
  const unlockedAchievements = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-8">
      {/* XP + Level header */}
      <section className="rounded-xl border bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-amber-700 dark:text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              Level {progress.level.index}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {progress.level.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {xp.toLocaleString()} XP total ·{" "}
              {masteredCount} / {concepts.length} concepts mastered ·{" "}
              {unlockedAchievements} / {achievements.length} achievements
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Flame
              className={cn(
                "h-7 w-7",
                streak >= 7
                  ? "text-orange-500"
                  : streak >= 1
                    ? "text-amber-500"
                    : "text-muted-foreground"
              )}
            />
            <div className="text-right">
              <div className="text-2xl font-bold tabular-nums">{streak}</div>
              <div className="text-xs text-muted-foreground">
                day{streak === 1 ? "" : "s"} streak
              </div>
            </div>
          </div>
        </div>

        {/* XP bar */}
        <div className="mt-4 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              {progress.next
                ? `${progress.xpIntoLevel} / ${progress.xpForNextLevel} XP to ${progress.next.title}`
                : "Maxed — keep stacking XP"}
            </span>
            <span className="text-muted-foreground">
              {Math.round(progress.pctIntoLevel * 100)}%
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-background/60">
            <div
              className="h-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
              style={{ width: `${Math.max(2, progress.pctIntoLevel * 100)}%` }}
            />
          </div>
        </div>

        {focus && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3">
            <div className="text-sm">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Recommended next →
              </span>
              <div className="font-medium">
                {focus.concept.id} {focus.concept.title}
              </div>
              <div className="text-xs text-muted-foreground">
                {MASTERY_UI[focus.mastery.level].label} ·{" "}
                {focus.mastery.encounters > 0
                  ? `${Math.round(focus.mastery.accuracy * 100)}% over ${focus.mastery.encounters}`
                  : "Not started"}
              </div>
            </div>
            <Link
              href={`/learn/${focus.concept.id}`}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Start <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>

      {/* Concept map */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Concept map</h2>
          <Link
            href="/learn/achievements"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <Trophy className="h-4 w-4" /> Achievements
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-4">
          {ALL_DOMAINS.map((domain) => (
            <div key={domain} className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">
                {DOMAIN_LABELS[domain]}
              </h3>
              <ul className="space-y-2">
                {byDomain[domain].map((c) => {
                  const m = masteryFor(masteryMap, c.id);
                  const ui = MASTERY_UI[m.level];
                  return (
                    <li key={c.id}>
                      <Link
                        href={`/learn/${c.id}`}
                        className={cn(
                          "block rounded-lg border p-3 transition-colors hover:brightness-95",
                          ui.border,
                          ui.bg
                        )}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono opacity-70">{c.id}</span>
                          <span className={cn("font-semibold", ui.fg)}>
                            {ui.label}
                          </span>
                        </div>
                        <div className="mt-1 line-clamp-2 text-sm font-medium">
                          {c.title}
                        </div>
                        {m.encounters > 0 && (
                          <div className="mt-2 h-1.5 w-full rounded-full bg-background/60">
                            <div
                              className={cn(
                                "h-1.5 rounded-full",
                                m.level === "MASTERED" || m.level === "EXPERT"
                                  ? "bg-green-500"
                                  : m.level === "PRACTICING"
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                              )}
                              style={{
                                width: `${Math.max(8, m.accuracy * 100)}%`,
                              }}
                            />
                          </div>
                        )}
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          {m.encounters === 0
                            ? "Not started"
                            : `${m.correct} / ${m.encounters} correct`}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Achievements teaser */}
      <section className="rounded-lg border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Trophy className="h-5 w-5 text-amber-500" />
            Achievements
          </h2>
          <Link
            href="/learn/achievements"
            className="text-sm text-primary hover:underline"
          >
            See all →
          </Link>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.slice(0, 6).map((a) => (
            <div
              key={a.def.id}
              className={cn(
                "flex items-start gap-3 rounded-md border p-3",
                a.unlocked
                  ? "border-amber-300 bg-amber-50 dark:bg-amber-950/30"
                  : "border-input bg-muted/30 opacity-70"
              )}
            >
              <div className="text-2xl leading-none">
                {a.unlocked ? a.def.emoji : <Lock className="h-5 w-5 text-muted-foreground" />}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{a.def.title}</div>
                <div className="text-xs text-muted-foreground">{a.def.description}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">{a.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
