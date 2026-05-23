"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Sparkles,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PutInOrderData } from "@/lib/curriculum";

interface Props {
  data: PutInOrderData;
  onComplete?: () => void;
}

function shuffleNonIdentity<T>(arr: T[]): T[] {
  // Shuffle, but reroll if we land on the original order (boring start).
  const original = arr.join("");
  for (let attempt = 0; attempt < 10; attempt++) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    if (a.join("") !== original) return a;
  }
  return arr;
}

export function PutInOrder({ data, onComplete }: Props) {
  // SSR-safe: first paint uses the original order so server/client match.
  // After mount we shuffle to make the puzzle real. Avoids hydration mismatch.
  const [order, setOrder] = useState<string[]>(data.items);
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    setOrder(shuffleNonIdentity(data.items));
  }, [data.items]);

  const reset = () => {
    setOrder(shuffleNonIdentity(data.items));
    setChecked(false);
  };

  const move = (idx: number, direction: -1 | 1) => {
    if (checked) return;
    const next = [...order];
    const target = idx + direction;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setOrder(next);
  };

  const correctIndices = order.map(
    (item, i) => data.items.indexOf(item) === i
  );
  const allCorrect = correctIndices.every(Boolean);
  const correctCount = correctIndices.filter(Boolean).length;

  useEffect(() => {
    if (checked && allCorrect) onComplete?.();
  }, [checked, allCorrect, onComplete]);

  return (
    <div className="space-y-4">
      {data.intro && (
        <p className="text-sm text-muted-foreground">{data.intro}</p>
      )}

      <div className="flex items-center justify-between text-sm">
        <div>
          {checked ? (
            <span>
              <strong>{correctCount}</strong> / {order.length} in correct position
            </span>
          ) : (
            <span className="text-muted-foreground">
              Use the arrows to put the items in the correct order, then check.
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
        >
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      </div>

      <ol className="space-y-2">
        {order.map((item, i) => {
          const correct = checked && correctIndices[i];
          const wrong = checked && !correctIndices[i];
          return (
            <li
              key={item}
              className={cn(
                "flex items-center gap-2 rounded-md border p-3 transition-colors",
                correct &&
                  "border-green-300 bg-green-50 dark:bg-green-950/40 dark:border-green-800",
                wrong &&
                  "border-red-300 bg-red-50 dark:bg-red-950/40 dark:border-red-800",
                !checked && "border-input bg-background"
              )}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold tabular-nums">
                {i + 1}
              </div>
              <span className="flex-1 text-sm">{item}</span>
              {correct && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              {wrong && <XCircle className="h-4 w-4 text-red-600" />}
              {!checked && (
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="Move up"
                    className="rounded-md border border-input bg-background p-1 disabled:opacity-30 hover:bg-accent"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === order.length - 1}
                    aria-label="Move down"
                    className="rounded-md border border-input bg-background p-1 disabled:opacity-30 hover:bg-accent"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {!checked ? (
        <button
          type="button"
          onClick={() => setChecked(true)}
          className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Check order
        </button>
      ) : allCorrect ? (
        <div className="flex items-center gap-2 rounded-md border border-green-300 bg-green-50 p-3 text-sm dark:bg-green-950/40 dark:border-green-800">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span className="font-medium text-green-900 dark:text-green-100">
            Perfect order! You internalized this one.
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={reset}
          className="w-full rounded-md border border-input bg-background py-2 text-sm font-medium hover:bg-accent"
        >
          Try again
        </button>
      )}
    </div>
  );
}
