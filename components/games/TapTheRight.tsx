"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, RotateCcw, Sparkles, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TapTheRightData } from "@/lib/curriculum";

interface Props {
  data: TapTheRightData;
  onComplete?: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function TapTheRight({ data, onComplete }: Props) {
  // First paint uses the original order so the server-rendered HTML matches
  // the client's first render — Math.random() at render time creates a
  // hydration mismatch. After mount we shuffle for variety.
  const [rounds, setRounds] = useState(
    () => data.rounds.map((r) => ({ ...r, choices: r.choices }))
  );
  useEffect(() => {
    setRounds(
      shuffle(data.rounds).map((r) => ({ ...r, choices: shuffle(r.choices) }))
    );
  }, [data.rounds]);

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);

  const current = rounds[idx];
  const done = idx >= rounds.length;

  useEffect(() => {
    if (done) onComplete?.();
  }, [done, onComplete]);

  const reset = () => {
    setIdx(0);
    setPicked(null);
    setScore(0);
    setMisses(0);
  };

  const onPick = (choice: string) => {
    if (picked !== null) return;
    setPicked(choice);
    if (choice === current.answer) setScore((s) => s + 1);
    else setMisses((m) => m + 1);
  };

  const next = () => {
    setIdx((i) => i + 1);
    setPicked(null);
  };

  if (done) {
    const accuracy = score / rounds.length;
    return (
      <div className="space-y-4 text-center">
        <div
          className={cn(
            "rounded-lg border p-6",
            accuracy >= 0.8
              ? "border-green-300 bg-green-50 dark:bg-green-950/40 dark:border-green-800"
              : "border-amber-300 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-800"
          )}
        >
          <Sparkles className="mx-auto h-7 w-7 text-amber-500" />
          <div className="mt-2 text-3xl font-bold">
            {score} / {rounds.length}
          </div>
          <div className="text-sm text-muted-foreground">
            {Math.round(accuracy * 100)}% — {misses} miss
            {misses === 1 ? "" : "es"}
          </div>
        </div>
        <button
          type="button"
          onClick={reset}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-input bg-background py-2 text-sm hover:bg-accent"
        >
          <RotateCcw className="h-4 w-4" /> Play again
        </button>
      </div>
    );
  }

  const wasCorrect = picked === current.answer;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Round <strong>{idx + 1}</strong> / {rounds.length}
        </span>
        <span>
          {score} ✓ · {misses} ✗
        </span>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm">{current.prompt}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {current.choices.map((choice) => {
          const isPicked = picked === choice;
          const isAnswer = picked !== null && choice === current.answer;
          const isWrongPick = picked === choice && choice !== current.answer;
          return (
            <button
              key={choice}
              type="button"
              onClick={() => onPick(choice)}
              disabled={picked !== null}
              className={cn(
                "rounded-md border p-3 text-left text-sm transition-colors",
                isAnswer && "border-green-500 bg-green-50 dark:bg-green-950/40",
                isWrongPick && "border-red-500 bg-red-50 dark:bg-red-950/40",
                !picked &&
                  "border-input bg-background hover:bg-accent cursor-pointer",
                picked !== null && !isPicked && !isAnswer && "opacity-60"
              )}
            >
              <span className="flex items-start gap-2">
                {isAnswer && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />}
                {isWrongPick && <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />}
                <span>{choice}</span>
              </span>
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div
          className={cn(
            "rounded-md border p-3 text-sm",
            wasCorrect
              ? "border-green-300 bg-green-50 dark:bg-green-950/40 dark:border-green-800"
              : "border-red-300 bg-red-50 dark:bg-red-950/40 dark:border-red-800"
          )}
        >
          <div className="font-semibold">
            {wasCorrect ? "Correct!" : `Correct answer: ${current.answer}`}
          </div>
          {current.hint && (
            <p className="mt-1 text-xs text-muted-foreground">{current.hint}</p>
          )}
        </div>
      )}

      {picked !== null && (
        <button
          type="button"
          onClick={next}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          {idx === rounds.length - 1 ? "Finish" : "Next round"}{" "}
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
