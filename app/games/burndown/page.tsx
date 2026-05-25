import Link from "next/link";
import { ArrowLeft, LineChart as LineChartIcon, Sparkles } from "lucide-react";
import { BurnDownReader } from "@/components/games/BurnDownReader";
import { GameTeachingPanel } from "@/components/games/GameTeachingPanel";
import { GameCheatSheet } from "@/components/games/GameCheatSheet";
import { getGameTeaching } from "@/lib/game-teaching";

export default function BurnDownGamePage() {
  const teaching = getGameTeaching("burndown");
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/games"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to games
      </Link>

      <header className="rounded-xl border-2 border-sky-300 bg-gradient-to-br from-sky-50 to-blue-50 p-6 dark:from-sky-950/40 dark:to-blue-950/40 dark:border-sky-800">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-sky-700 dark:text-sky-300">
          <Sparkles className="h-3.5 w-3.5" />
          6 chart scenarios
        </div>
        <h1 className="mt-1 flex items-center gap-2 text-3xl font-bold tracking-tight">
          <LineChartIcon className="h-7 w-7 text-sky-600" />
          Burn-Down Chart Reader
        </h1>
        <p className="mt-2 text-sm leading-relaxed">
          Six sprint burn-down charts, each telling a different story. Read
          the SHAPE of the line — not just the end point — and pick what the
          team should do.
        </p>
      </header>

      {teaching && <GameTeachingPanel teaching={teaching} />}

      <section className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-amber-50 p-6 dark:from-primary/10 dark:to-amber-950/40">
        <h2 className="mb-3 text-base font-semibold">Read the charts</h2>
        <BurnDownReader />
      </section>

      {teaching && <GameCheatSheet items={teaching.cheatSheet} />}
    </div>
  );
}
