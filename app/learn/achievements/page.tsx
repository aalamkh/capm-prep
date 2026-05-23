import Link from "next/link";
import { ArrowLeft, Trophy, Lock } from "lucide-react";
import { evaluateAchievements } from "@/lib/gamification";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const achievements = await evaluateAchievements();
  const unlocked = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/learn"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Learn
      </Link>

      <header>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Trophy className="h-7 w-7 text-amber-500" />
          Achievements
        </h1>
        <p className="text-sm text-muted-foreground">
          {unlocked} / {achievements.length} unlocked.
        </p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        {achievements.map((a) => (
          <li
            key={a.def.id}
            className={cn(
              "rounded-lg border p-4 transition-colors",
              a.unlocked
                ? "border-amber-300 bg-amber-50 dark:bg-amber-950/30"
                : "border-input bg-muted/20 opacity-80"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-background text-2xl">
                {a.unlocked ? (
                  a.def.emoji
                ) : (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold">{a.def.title}</span>
                  {a.unlocked && (
                    <span className="text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-300">
                      Unlocked
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {a.def.description}
                </p>
                <p className="text-[11px] text-muted-foreground">{a.detail}</p>
                {!a.unlocked && a.progress > 0 && a.progress < 1 && (
                  <div className="mt-1 h-1.5 w-full rounded-full bg-background">
                    <div
                      className="h-1.5 rounded-full bg-amber-500"
                      style={{ width: `${a.progress * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
