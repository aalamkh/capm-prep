"use client";

import { useState } from "react";
import {
  Lightbulb,
  Target,
  BookOpen,
  Brain,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import type { GameTeaching } from "@/lib/game-teaching";
import { cn } from "@/lib/utils";

interface Props {
  teaching: GameTeaching;
  /** Show expanded by default. Use true on first-time pages, false for "ready to play" recovery. */
  defaultOpen?: boolean;
}

export function GameTeachingPanel({ teaching, defaultOpen = true }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className={cn(
        "rounded-xl border-2 border-blue-300 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30",
        open ? "p-6" : "p-4"
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-blue-700 dark:text-blue-300">
            <Brain className="h-3.5 w-3.5" />
            Learn this first
          </div>
          <h2 className="mt-1 text-xl font-bold tracking-tight">
            {teaching.title}
          </h2>
        </div>
        {open ? (
          <ChevronUp className="h-5 w-5 text-blue-700 dark:text-blue-300" />
        ) : (
          <ChevronDown className="h-5 w-5 text-blue-700 dark:text-blue-300" />
        )}
      </button>

      {open && (
        <div className="mt-4 space-y-5 text-sm leading-relaxed">
          {/* Definition */}
          <div>
            <h3 className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" />
              What it is
            </h3>
            <p>{teaching.definition}</p>
          </div>

          {/* Why it matters */}
          <div>
            <h3 className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
              <Target className="h-3.5 w-3.5" />
              Why it matters on the exam
            </h3>
            <p>{teaching.whyItMatters}</p>
          </div>

          {/* Key points — numbered for memorability */}
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
              <Lightbulb className="h-3.5 w-3.5" />
              The core ideas
            </h3>
            <ul className="space-y-1.5">
              {teaching.keyPoints.map((p, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                    {i + 1}
                  </span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Analogies */}
          {teaching.analogies && teaching.analogies.length > 0 && (
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" />
                Think of it like…
              </h3>
              <ul className="space-y-1.5">
                {teaching.analogies.map((a, i) => (
                  <li key={i} className="rounded-md border bg-background p-2">
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Memory tricks */}
          {teaching.memoryTricks && teaching.memoryTricks.length > 0 && (
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-fuchsia-700 dark:text-fuchsia-300">
                🧠 Memory tricks
              </h3>
              <ul className="space-y-1 text-xs">
                {teaching.memoryTricks.map((m, i) => (
                  <li
                    key={i}
                    className="rounded-md border border-fuchsia-200 bg-fuchsia-50 px-2 py-1.5 dark:bg-fuchsia-950/30 dark:border-fuchsia-800"
                  >
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            👇 When you&apos;re ready, scroll to the game below. The
            cheat-sheet recap is at the bottom.
          </div>
        </div>
      )}
    </section>
  );
}
