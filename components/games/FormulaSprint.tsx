"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Timer,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Round generation ───────────────────────────────────────────────────────

type Formula = "pert" | "triangular";

interface Round {
  formula: Formula;
  o: number;
  m: number;
  p: number;
  /** The correct answer, rounded to 1 decimal. */
  answer: number;
  /** The "other formula's" answer — the most plausible wrong answer. */
  trap: number;
  /** All four shuffled choices including answer + trap + 2 distractors. */
  choices: number[];
}

const PERT = (o: number, m: number, p: number) => (o + 4 * m + p) / 6;
const TRI = (o: number, m: number, p: number) => (o + m + p) / 3;

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeRound(): Round {
  const formula: Formula = Math.random() < 0.5 ? "pert" : "triangular";
  // Generate O, M, P where O ≤ M ≤ P (realistic estimates).
  const o = randInt(2, 8);
  const m = o + randInt(1, 6);
  const p = m + randInt(2, 10);
  const pertVal = round1(PERT(o, m, p));
  const triVal = round1(TRI(o, m, p));
  const answer = formula === "pert" ? pertVal : triVal;
  const trap = formula === "pert" ? triVal : pertVal;

  // Distractors: ±1 and ±2 from answer, but make sure none collide.
  const usedSet = new Set<number>([answer, trap]);
  const candidates = [answer + 1, answer - 1, answer + 2, answer - 2];
  const distractors: number[] = [];
  for (const c of shuffle(candidates)) {
    if (distractors.length >= 2) break;
    const v = round1(c);
    if (v < 0) continue;
    if (usedSet.has(v)) continue;
    usedSet.add(v);
    distractors.push(v);
  }
  const choices = shuffle([answer, trap, ...distractors]);
  return { formula, o, m, p, answer, trap, choices };
}

// ── Component ──────────────────────────────────────────────────────────────

const ROUNDS_PER_GAME = 10;
const SECONDS_PER_ROUND = 10;

export function FormulaSprint() {
  // SSR-safe: render an empty placeholder on the server; build rounds on the client.
  const [rounds, setRounds] = useState<Round[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_ROUND);
  const [bonus, setBonus] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Build rounds once on mount.
  useEffect(() => {
    setRounds(Array.from({ length: ROUNDS_PER_GAME }, () => makeRound()));
  }, []);

  // Start countdown each new round.
  useEffect(() => {
    if (rounds.length === 0 || idx >= rounds.length || picked !== null) return;
    setTimeLeft(SECONDS_PER_ROUND);
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (tickRef.current) clearInterval(tickRef.current);
          // Time's up: mark as miss with no pick.
          setPicked(-1); // sentinel "timed out"
          setMisses((m) => m + 1);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [idx, rounds.length, picked]);

  const current = rounds[idx];
  const done = rounds.length > 0 && idx >= rounds.length;
  const timedOut = picked === -1;

  const onPick = (n: number) => {
    if (picked !== null || !current) return;
    if (tickRef.current) clearInterval(tickRef.current);
    setPicked(n);
    if (n === current.answer) {
      setScore((s) => s + 1);
      setBonus((b) => b + timeLeft);
    } else {
      setMisses((m) => m + 1);
    }
  };

  const next = () => {
    setIdx((i) => i + 1);
    setPicked(null);
  };

  const reset = () => {
    setRounds(Array.from({ length: ROUNDS_PER_GAME }, () => makeRound()));
    setIdx(0);
    setPicked(null);
    setScore(0);
    setMisses(0);
    setBonus(0);
    setTimeLeft(SECONDS_PER_ROUND);
  };

  if (rounds.length === 0) {
    return (
      <div className="rounded-md border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        Loading rounds…
      </div>
    );
  }

  if (done) {
    const totalPossible = ROUNDS_PER_GAME * SECONDS_PER_ROUND;
    const finalScore = score * 10 + bonus; // 10 pts/correct + 1 pt/sec saved
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-lg border border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-6 dark:from-amber-950/40 dark:to-orange-950/40 dark:border-amber-800">
          <Sparkles className="mx-auto h-7 w-7 text-amber-500" />
          <div className="mt-2 text-3xl font-bold">
            {score} / {ROUNDS_PER_GAME}
          </div>
          <div className="text-sm text-muted-foreground">
            {misses} miss{misses === 1 ? "" : "es"} · Speed bonus +{bonus} sec
          </div>
          <div className="mt-3 text-lg font-bold">
            Final score: <span className="text-amber-600">{finalScore}</span>{" "}
            <span className="text-xs text-muted-foreground">(of max {ROUNDS_PER_GAME * 10 + totalPossible})</span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            💡 The formulas: <strong>PERT = (O + 4M + P) / 6</strong>,{" "}
            <strong>Triangular = (O + M + P) / 3</strong>. Always read the
            prompt for which one — they almost always include the OTHER
            formula&apos;s result as a trap.
          </p>
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

  const tone =
    timeLeft <= 3 ? "text-red-600" : timeLeft <= 5 ? "text-amber-600" : "text-foreground";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Round <strong>{idx + 1}</strong> / {ROUNDS_PER_GAME} · {score} ✓ ·{" "}
          {misses} ✗ · bonus +{bonus}
        </div>
        <div className={cn("flex items-center gap-1 font-mono text-lg tabular-nums", tone)}>
          <Timer className="h-4 w-4" />
          {timeLeft}s
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4 text-center">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          Use {current.formula === "pert" ? "PERT (beta)" : "Triangular"} estimate
        </div>
        <div className="mt-2 font-mono text-2xl">
          O = {current.o} · M = {current.m} · P = {current.p}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {current.formula === "pert"
            ? "PERT = (O + 4M + P) / 6"
            : "Triangular = (O + M + P) / 3"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {current.choices.map((c) => {
          const isPicked = picked === c;
          const isAnswer = picked !== null && c === current.answer;
          const isWrongPick = picked === c && c !== current.answer;
          return (
            <button
              key={c}
              type="button"
              onClick={() => onPick(c)}
              disabled={picked !== null}
              className={cn(
                "rounded-md border p-4 text-center font-mono text-lg transition-colors",
                isAnswer && "border-green-500 bg-green-50 dark:bg-green-950/40",
                isWrongPick && "border-red-500 bg-red-50 dark:bg-red-950/40",
                !picked && "border-input bg-background hover:bg-accent cursor-pointer",
                picked !== null && !isPicked && !isAnswer && "opacity-60"
              )}
            >
              {Number.isInteger(c) ? c : c.toFixed(1)}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div
          className={cn(
            "rounded-md border p-3 text-sm",
            timedOut
              ? "border-red-300 bg-red-50 dark:bg-red-950/40 dark:border-red-800"
              : picked === current.answer
                ? "border-green-300 bg-green-50 dark:bg-green-950/40 dark:border-green-800"
                : "border-red-300 bg-red-50 dark:bg-red-950/40 dark:border-red-800"
          )}
        >
          <div className="flex items-center gap-2 font-semibold">
            {timedOut ? (
              <>
                <XCircle className="h-4 w-4 text-red-600" />
                Time&apos;s up
              </>
            ) : picked === current.answer ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Correct
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-red-600" />
                Not quite
              </>
            )}
          </div>
          <p className="mt-1 text-xs">
            {current.formula === "pert"
              ? `(${current.o} + 4×${current.m} + ${current.p}) / 6 = ${current.answer}`
              : `(${current.o} + ${current.m} + ${current.p}) / 3 = ${current.answer}`}
          </p>
          {picked === current.trap && (
            <p className="mt-1 text-xs text-muted-foreground">
              ⚠ You picked the {current.formula === "pert" ? "Triangular" : "PERT"}{" "}
              answer — the classic trap. Read the prompt carefully.
            </p>
          )}
        </div>
      )}

      {picked !== null && (
        <button
          type="button"
          onClick={next}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          {idx === ROUNDS_PER_GAME - 1 ? "Finish" : "Next round"}{" "}
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
