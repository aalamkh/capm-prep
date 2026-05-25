import Link from "next/link";
import { ArrowLeft, LayoutGrid, Sparkles } from "lucide-react";
import { KanbanFlow } from "@/components/games/KanbanFlow";
import { GameTeachingPanel } from "@/components/games/GameTeachingPanel";
import { GameCheatSheet } from "@/components/games/GameCheatSheet";
import { getGameTeaching } from "@/lib/game-teaching";

export default function KanbanGamePage() {
  const teaching = getGameTeaching("kanban");
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/games"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to games
      </Link>

      <header className="rounded-xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 dark:from-emerald-950/40 dark:to-teal-950/40 dark:border-emerald-800">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
          <Sparkles className="h-3.5 w-3.5" />
          18 ticks · interactive board
        </div>
        <h1 className="mt-1 flex items-center gap-2 text-3xl font-bold tracking-tight">
          <LayoutGrid className="h-7 w-7 text-emerald-600" />
          Kanban Flow Simulator
        </h1>
        <p className="mt-2 text-sm leading-relaxed">
          You run the board. Cards start in <strong>Backlog</strong>. Click{" "}
          <strong>Pull</strong> to move a card right. <strong>Doing</strong>{" "}
          has WIP 3, <strong>Testing</strong> has WIP 2 — you cannot pull
          into a full column. Click <strong>Advance time</strong> to do 1
          unit of work on every active card. Goal: maximize throughput.
        </p>
      </header>

      {teaching && <GameTeachingPanel teaching={teaching} />}

      <section className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-amber-50 p-6 dark:from-primary/10 dark:to-amber-950/40">
        <h2 className="mb-3 text-base font-semibold">Play the board</h2>
        <KanbanFlow />
      </section>

      {teaching && <GameCheatSheet items={teaching.cheatSheet} />}
    </div>
  );
}
