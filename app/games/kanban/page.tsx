import Link from "next/link";
import { ArrowLeft, LayoutGrid, Sparkles } from "lucide-react";
import { KanbanFlow } from "@/components/games/KanbanFlow";

export default function KanbanGamePage() {
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
          18 ticks to play with
        </div>
        <h1 className="mt-1 flex items-center gap-2 text-3xl font-bold tracking-tight">
          <LayoutGrid className="h-7 w-7 text-emerald-600" />
          Kanban Flow Simulator
        </h1>
        <p className="mt-2 text-sm leading-relaxed">
          You run the board. Cards start in <strong>Backlog</strong>. Click{" "}
          <strong>Pull</strong> to move a card right. <strong>Doing</strong>{" "}
          column has a WIP limit of 3, <strong>Testing</strong> a WIP of 2 —
          you cannot pull into a full column. Click{" "}
          <strong>Advance time</strong> to do one tick of work on every card
          in Doing &amp; Testing. Goal: get as many cards to <strong>Done</strong>{" "}
          as you can. Score = throughput × low cycle time.
        </p>
        <ul className="mt-3 list-disc pl-5 text-xs text-muted-foreground space-y-0.5">
          <li>
            <strong>Throughput</strong> = cards completed.
          </li>
          <li>
            <strong>Cycle time</strong> = ticks from <em>Doing</em> entry →{" "}
            <em>Done</em>.
          </li>
          <li>
            <strong>WIP blocks</strong> = how many times the limit stopped a
            pull (each block is a lesson).
          </li>
          <li>
            The lesson: <em>stop starting, start finishing</em>. Lower WIP →
            lower cycle time → faster delivery.
          </li>
        </ul>
      </header>

      <KanbanFlow />
    </div>
  );
}
