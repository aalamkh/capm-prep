import Link from "next/link";
import { ArrowLeft, Timer, Sparkles } from "lucide-react";
import { FormulaSprint } from "@/components/games/FormulaSprint";
import { GameTeachingPanel } from "@/components/games/GameTeachingPanel";
import { GameCheatSheet } from "@/components/games/GameCheatSheet";
import { getGameTeaching } from "@/lib/game-teaching";

export default function FormulaSprintGamePage() {
  const teaching = getGameTeaching("formula-sprint");
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/games"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to games
      </Link>

      <header className="rounded-xl border-2 border-rose-300 bg-gradient-to-br from-rose-50 to-orange-50 p-6 dark:from-rose-950/40 dark:to-orange-950/40 dark:border-rose-800">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-rose-700 dark:text-rose-300">
          <Sparkles className="h-3.5 w-3.5" />
          10 rounds · 10 seconds each
        </div>
        <h1 className="mt-1 flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Timer className="h-7 w-7 text-rose-600" />
          PERT &amp; Triangular Speed Round
        </h1>
        <p className="mt-2 text-sm leading-relaxed">
          You get Optimistic / Most Likely / Pessimistic estimates and 10
          seconds per round. Pick the correct PERT or Triangular result. The
          OTHER formula&apos;s answer is always one of the wrong choices —
          read the prompt.
        </p>
      </header>

      {teaching && <GameTeachingPanel teaching={teaching} />}

      <section className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-amber-50 p-6 dark:from-primary/10 dark:to-amber-950/40">
        <h2 className="mb-3 text-base font-semibold">Race the clock</h2>
        <FormulaSprint />
      </section>

      {teaching && <GameCheatSheet items={teaching.cheatSheet} />}
    </div>
  );
}
