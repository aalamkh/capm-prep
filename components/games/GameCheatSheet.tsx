"use client";

import { CheckCircle2, BookMarked } from "lucide-react";

interface Props {
  title?: string;
  items: string[];
}

/**
 * A condensed recap shown below each game. Screenshot-worthy — these are the
 * facts a learner should keep in their head before the exam.
 */
export function GameCheatSheet({
  title = "Cheat sheet — keep this in your head",
  items,
}: Props) {
  return (
    <section className="rounded-xl border-2 border-amber-300 bg-amber-50/60 p-5 dark:border-amber-800 dark:bg-amber-950/30">
      <h2 className="flex items-center gap-2 text-base font-semibold text-amber-900 dark:text-amber-200">
        <BookMarked className="h-4 w-4" />
        {title}
      </h2>
      <ul className="mt-3 space-y-1.5 text-sm">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        💡 Screenshot this. Review it daily for a week. Each item maps to a
        question type you&apos;ll see on the exam.
      </p>
    </section>
  );
}
