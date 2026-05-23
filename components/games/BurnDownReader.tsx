"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Scenario definitions ────────────────────────────────────────────────────
//
// Each scenario describes a sprint's burn-down chart and a multiple-choice
// question about what the team should do. Charts are 10 days, points start
// at 40 and the "ideal" line decreases linearly.

interface Scenario {
  id: string;
  title: string;
  actual: number[]; // points-remaining per day, length 11 (day 0..10)
  prompt: string;
  choices: string[];
  answer: string;
  hint: string;
}

const TOTAL = 40;
const DAYS = 10;

function ideal(): number[] {
  return Array.from({ length: DAYS + 1 }, (_, d) => TOTAL - (TOTAL / DAYS) * d);
}

const SCENARIOS: Scenario[] = [
  {
    id: "behind",
    title: "Behind the ideal line",
    actual: [40, 38, 36, 35, 33, 32, 30, 28, 25, 22, 18],
    prompt:
      "Today is Day 10 — last day of the sprint. The actual line ended at 18 points remaining, while the ideal hit 0. What does the team do?",
    choices: [
      "Extend the sprint by 3 days",
      "Move the unfinished items back to the product backlog; inspect causes in the retrospective; finish the sprint on time",
      "Pull the unfinished work into next sprint without discussion",
      "Reduce the team's velocity forecast immediately"
    ],
    answer:
      "Move the unfinished items back to the product backlog; inspect causes in the retrospective; finish the sprint on time",
    hint:
      "Sprints are time-boxed. Don't extend. Unfinished work returns to the backlog; root cause goes in the retro."
  },
  {
    id: "ahead",
    title: "Ahead of plan",
    actual: [40, 32, 25, 19, 14, 10, 7, 5, 3, 1, 0],
    prompt:
      "By Day 10 the team is well below the ideal line and finished early. What's the BEST move?",
    choices: [
      "Take the rest of the sprint off",
      "Forecast more aggressively next sprint to 'use the slack'",
      "Pull the next highest-priority backlog item, or invest in tech debt / refinement — and discuss in the retro",
      "Hide the early finish from the PO so expectations stay low"
    ],
    answer:
      "Pull the next highest-priority backlog item, or invest in tech debt / refinement — and discuss in the retro",
    hint:
      "Sustained 'ahead' across multiple sprints = recalibrate forecast. One sprint = pull more value or invest in debt."
  },
  {
    id: "flat-then-cliff",
    title: "Flat early, cliff late",
    actual: [40, 39, 38, 37, 36, 35, 33, 30, 22, 10, 0],
    prompt:
      "Almost no progress until Day 6, then a huge drop in the final days. What does this pattern usually indicate?",
    choices: [
      "Excellent sprint — finished on time",
      "Likely a single big story that nobody could complete until it was 'done done' — split it next time",
      "Team was on vacation early in the sprint",
      "Definition of Done is too strict"
    ],
    answer:
      "Likely a single big story that nobody could complete until it was 'done done' — split it next time",
    hint:
      "Steady, smooth burn = small stories. Big cliff = stories too big or too few in flight."
  },
  {
    id: "cherry-pick",
    title: "Steep early drop then flat",
    actual: [40, 32, 25, 20, 18, 17, 17, 16, 16, 15, 15],
    prompt:
      "Team smashed through the small stories Days 1–3 then stalled. What's the LIKELY cause?",
    choices: [
      "Team got lazy",
      "Team cherry-picked easy items first; the remaining items are bigger and/or have blockers — surface in the retro",
      "Burn-down chart is broken",
      "PO added too much scope"
    ],
    answer:
      "Team cherry-picked easy items first; the remaining items are bigger and/or have blockers — surface in the retro",
    hint:
      "Cherry-picking by size = late discovery that hard items are hard. Pull by VALUE order, not by ease."
  },
  {
    id: "scope-creep",
    title: "Line goes UP mid-sprint",
    actual: [40, 35, 30, 28, 38, 36, 32, 28, 22, 16, 12],
    prompt:
      "The remaining-work line spikes UP on Day 4. The team is now behind. What does the spike mean?",
    choices: [
      "The chart is wrong",
      "Scope was added mid-sprint — burn-down charts can't show whether it was negotiated or just pushed in. Inspect the change and confirm it had a trade-off.",
      "Team gave up",
      "Velocity decreased"
    ],
    answer:
      "Scope was added mid-sprint — burn-down charts can't show whether it was negotiated or just pushed in. Inspect the change and confirm it had a trade-off.",
    hint:
      "Burn-down's blind spot is scope changes. Burn-UP charts make this visible. Either way, mid-sprint additions need an explicit trade-off."
  },
  {
    id: "healthy",
    title: "Smooth steady decline",
    actual: [40, 36, 32, 28, 24, 20, 16, 12, 8, 4, 0],
    prompt:
      "The actual line tracks the ideal almost perfectly all sprint. What does the team do?",
    choices: [
      "Be suspicious — too perfect, must be fake",
      "Celebrate the healthy flow + small stories. In the retro, identify what enabled the smooth burn and protect it.",
      "Force a 10% scope increase next sprint",
      "Skip the retrospective"
    ],
    answer:
      "Celebrate the healthy flow + small stories. In the retro, identify what enabled the smooth burn and protect it.",
    hint:
      "Healthy burn = small stories + steady pull + few blockers. Identify what worked and protect it."
  }
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface RenderedScenario extends Scenario {
  shuffledChoices: string[];
}

export function BurnDownReader() {
  // SSR-safe: first paint uses the original order to match server HTML;
  // shuffle after mount.
  const [scenarios, setScenarios] = useState<RenderedScenario[]>(
    () => SCENARIOS.map((s) => ({ ...s, shuffledChoices: s.choices }))
  );
  useEffect(() => {
    setScenarios(
      shuffle(SCENARIOS).map((s) => ({
        ...s,
        shuffledChoices: shuffle(s.choices),
      }))
    );
  }, []);

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);

  const current = scenarios[idx];
  const done = idx >= scenarios.length;

  const idealData = ideal();
  const chartData = current
    ? Array.from({ length: DAYS + 1 }, (_, d) => ({
        day: d,
        Ideal: idealData[d],
        Actual: current.actual[d],
      }))
    : [];

  const reset = () => {
    setScenarios(
      shuffle(SCENARIOS).map((s) => ({
        ...s,
        shuffledChoices: shuffle(s.choices),
      }))
    );
    setIdx(0);
    setPicked(null);
    setScore(0);
    setMisses(0);
  };

  const onPick = (choice: string) => {
    if (picked !== null || !current) return;
    setPicked(choice);
    if (choice === current.answer) setScore((s) => s + 1);
    else setMisses((m) => m + 1);
  };

  const next = () => {
    setIdx((i) => i + 1);
    setPicked(null);
  };

  if (done) {
    const accuracy = scenarios.length === 0 ? 0 : score / scenarios.length;
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
            {score} / {scenarios.length}
          </div>
          <div className="text-sm text-muted-foreground">
            {Math.round(accuracy * 100)}% — {misses} miss
            {misses === 1 ? "" : "es"}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            💡 Burn-down charts answer two questions: <strong>are we on
            track?</strong> and <strong>what does the SHAPE tell us?</strong>{" "}
            Smooth = healthy. Flat-then-cliff = stories too big. Going UP =
            scope creep.
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

  const wasCorrect = picked === current.answer;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Chart <strong>{idx + 1}</strong> / {scenarios.length}: {current.title}
        </span>
        <span>
          {score} ✓ · {misses} ✗
        </span>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11 }}
                label={{ value: "Day", position: "insideBottom", offset: -3, fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 11 }} domain={[0, TOTAL]} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="linear"
                dataKey="Ideal"
                stroke="#94a3b8"
                strokeDasharray="4 2"
                strokeWidth={1.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Actual"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p className="text-sm">{current.prompt}</p>

      <div className="grid gap-2">
        {current.shuffledChoices.map((choice) => {
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
                !picked && "border-input bg-background hover:bg-accent cursor-pointer",
                picked !== null && !isPicked && !isAnswer && "opacity-60"
              )}
            >
              <span className="flex items-start gap-2">
                {isAnswer && (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                )}
                {isWrongPick && (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                )}
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
            {wasCorrect ? "Correct!" : "Not quite"}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{current.hint}</p>
        </div>
      )}

      {picked !== null && (
        <button
          type="button"
          onClick={next}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          {idx === scenarios.length - 1 ? "Finish" : "Next chart"}{" "}
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
