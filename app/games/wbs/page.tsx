import Link from "next/link";
import { ArrowLeft, Network, Sparkles } from "lucide-react";
import { WBSBuilder } from "@/components/games/WBSBuilder";

export default function WBSGamePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/games"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to games
      </Link>

      <header className="rounded-xl border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 to-purple-50 p-6 dark:from-indigo-950/40 dark:to-purple-950/40 dark:border-indigo-800">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
          <Sparkles className="h-3.5 w-3.5" />
          Project: Build a House
        </div>
        <h1 className="mt-1 flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Network className="h-7 w-7 text-indigo-600" />
          WBS Builder
        </h1>
        <p className="mt-2 text-sm leading-relaxed">
          Decompose the project into the right deliverables under the right
          parents. Two of the items are <strong>traps</strong> — activities
          or vague intentions that don&apos;t belong in a WBS at all. Spot
          them and drop them in the &quot;Not a deliverable&quot; bucket.
        </p>
        <ul className="mt-3 list-disc pl-5 text-xs text-muted-foreground space-y-0.5">
          <li>
            <strong>100% rule:</strong> a WBS captures ALL the work — no
            more, no less.
          </li>
          <li>
            <strong>Deliverables, not activities:</strong> a WBS shows nouns
            (Foundation, Roof). Verbs like &quot;Schedule the crew&quot; live
            in the schedule, not the WBS.
          </li>
          <li>
            <strong>Lowest level</strong> = work package (small enough to
            estimate cost + duration).
          </li>
        </ul>
      </header>

      <section className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-amber-50 p-6 dark:from-primary/10 dark:to-amber-950/40">
        <WBSBuilder />
      </section>
    </div>
  );
}
