"use client";

import { useState, useEffect } from "react";
import {
  ChevronRight,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Clock,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Game model ──────────────────────────────────────────────────────────────

type ColumnId = "backlog" | "doing" | "testing" | "done";

interface Card {
  id: number;
  title: string;
  size: number;       // work units required
  remaining: number;  // work units left in current column
  enteredTickByCol: Partial<Record<ColumnId, number>>;
  completedAtTick?: number;
}

interface Column {
  id: ColumnId;
  title: string;
  wipLimit: number | null; // null = unlimited (Backlog & Done)
  /** Tick logic: how much work disappears per tick from each card here */
  workPerTick: number;
}

const COLUMNS: Column[] = [
  { id: "backlog", title: "Backlog",     wipLimit: null, workPerTick: 0 },
  { id: "doing",   title: "Doing",       wipLimit: 3,    workPerTick: 1 },
  { id: "testing", title: "Testing",     wipLimit: 2,    workPerTick: 1 },
  { id: "done",    title: "Done",        wipLimit: null, workPerTick: 0 },
];

const COL_ORDER: ColumnId[] = ["backlog", "doing", "testing", "done"];

const SEED_CARDS: Array<Pick<Card, "title" | "size">> = [
  { title: "Login form",      size: 2 },
  { title: "Search API",      size: 3 },
  { title: "Profile page",    size: 2 },
  { title: "Email notifier",  size: 4 },
  { title: "Dark mode",       size: 1 },
  { title: "Bug: 404 logging",size: 1 },
  { title: "Pricing page",    size: 3 },
  { title: "OAuth integration", size: 4 },
  { title: "Mobile nav",      size: 2 },
  { title: "Analytics events",size: 2 },
];

const MAX_TICKS = 18;

function nextColumnFor(id: ColumnId): ColumnId | null {
  const idx = COL_ORDER.indexOf(id);
  if (idx === -1 || idx === COL_ORDER.length - 1) return null;
  return COL_ORDER[idx + 1];
}

interface GameState {
  tick: number;
  cards: Card[];
}

function initialState(): GameState {
  return {
    tick: 0,
    cards: SEED_CARDS.map((c, i) => ({
      id: i,
      title: c.title,
      size: c.size,
      remaining: c.size,
      // Initial column is implicit — derived from latest entry in enteredTickByCol.
      enteredTickByCol: { backlog: 0 },
    })),
  };
}

function colOf(c: Card): ColumnId {
  // The most recent entry in enteredTickByCol determines where it lives now.
  const keys = Object.keys(c.enteredTickByCol) as ColumnId[];
  return keys.reduce(
    (latest, k) =>
      (c.enteredTickByCol[k] ?? -1) > (c.enteredTickByCol[latest] ?? -1)
        ? k
        : latest,
    "backlog"
  );
}

function cardsInCol(state: GameState, col: ColumnId): Card[] {
  return state.cards.filter((c) => colOf(c) === col);
}

// ── Component ───────────────────────────────────────────────────────────────

export function KanbanFlow() {
  const [state, setState] = useState<GameState>(initialState);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [wipViolations, setWipViolations] = useState(0);

  const reset = () => {
    setState(initialState());
    setLastMessage(null);
    setWipViolations(0);
  };

  // "Advance time": apply work to every active column once.
  const advanceTime = () => {
    setState((prev) => {
      if (prev.tick >= MAX_TICKS) return prev;
      const nextTick = prev.tick + 1;
      const cards = prev.cards.map((c) => {
        const col = colOf(c);
        const work = COLUMNS.find((x) => x.id === col)!.workPerTick;
        if (work === 0) return c;
        return { ...c, remaining: Math.max(0, c.remaining - work) };
      });
      return { tick: nextTick, cards };
    });
    setLastMessage(`Advanced time → tick ${state.tick + 1}/${MAX_TICKS}`);
  };

  const pull = (cardId: number) => {
    setState((prev) => {
      const card = prev.cards.find((c) => c.id === cardId);
      if (!card) return prev;
      const currentCol = colOf(card);
      const next = nextColumnFor(currentCol);
      if (!next) return prev;
      const targetCol = COLUMNS.find((c) => c.id === next)!;

      // Enforce WIP limit on the target column.
      if (targetCol.wipLimit !== null) {
        const inTarget = prev.cards.filter((c) => colOf(c) === next).length;
        if (inTarget >= targetCol.wipLimit) {
          setLastMessage(
            `⛔ ${targetCol.title} is at WIP limit (${targetCol.wipLimit}). Finish something before pulling more.`
          );
          setWipViolations((v) => v + 1);
          return prev;
        }
      }

      // For Doing → Testing, the card must be fully built first (remaining 0).
      if (currentCol === "doing" && card.remaining > 0) {
        setLastMessage(
          `⛔ "${card.title}" still has ${card.remaining} work unit${card.remaining === 1 ? "" : "s"} left. Advance time to build it.`
        );
        return prev;
      }
      if (currentCol === "testing" && card.remaining > 0) {
        setLastMessage(
          `⛔ "${card.title}" still has ${card.remaining} test unit${card.remaining === 1 ? "" : "s"} left.`
        );
        return prev;
      }

      // Reset remaining when entering an "active" column.
      // Each card has a build phase (its size) and a test phase (1).
      let newRemaining = card.remaining;
      if (next === "doing") newRemaining = card.size;
      else if (next === "testing") newRemaining = 1;
      else if (next === "done") newRemaining = 0;

      const newCard: Card = {
        ...card,
        remaining: newRemaining,
        enteredTickByCol: {
          ...card.enteredTickByCol,
          [next]: prev.tick,
        },
        completedAtTick:
          next === "done" ? prev.tick : card.completedAtTick,
      };
      setLastMessage(`✓ Pulled "${card.title}" → ${targetCol.title}`);
      return {
        ...prev,
        cards: prev.cards.map((c) => (c.id === cardId ? newCard : c)),
      };
    });
  };

  const isGameOver = state.tick >= MAX_TICKS;
  const completedCards = state.cards.filter((c) => colOf(c) === "done");
  const cycleTimes = completedCards
    .map((c) => {
      const start = c.enteredTickByCol.doing;
      const end = c.completedAtTick;
      if (start === undefined || end === undefined) return null;
      return end - start;
    })
    .filter((v): v is number => v !== null);
  const avgCycleTime =
    cycleTimes.length === 0
      ? 0
      : cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length;
  const throughput = completedCards.length;

  // Auto-end announcement once
  useEffect(() => {
    if (isGameOver) setLastMessage("⏱️ Time's up — see your stats below.");
  }, [isGameOver]);

  return (
    <div className="space-y-4">
      {/* Top bar: stats + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3">
        <div className="flex flex-wrap gap-3 text-sm">
          <Stat
            label="Tick"
            value={`${state.tick} / ${MAX_TICKS}`}
            icon={<Clock className="h-4 w-4" />}
          />
          <Stat
            label="Done"
            value={`${throughput}`}
            icon={<TrendingUp className="h-4 w-4 text-green-600" />}
          />
          <Stat
            label="Avg cycle"
            value={cycleTimes.length === 0 ? "—" : `${avgCycleTime.toFixed(1)}t`}
            icon={<Layers className="h-4 w-4 text-blue-600" />}
          />
          {wipViolations > 0 && (
            <Stat
              label="WIP blocks"
              value={`${wipViolations}`}
              icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
            />
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={advanceTime}
            disabled={isGameOver}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" /> Advance time
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </div>

      {lastMessage && (
        <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs">
          {lastMessage}
        </div>
      )}

      {/* Board */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {COLUMNS.map((col) => {
          const here = cardsInCol(state, col.id);
          const overLimit =
            col.wipLimit !== null && here.length > col.wipLimit;
          const atLimit =
            col.wipLimit !== null && here.length >= col.wipLimit;
          return (
            <div
              key={col.id}
              className={cn(
                "min-h-[220px] rounded-lg border bg-card p-3",
                overLimit && "border-red-400 bg-red-50/40 dark:bg-red-950/30",
                atLimit && !overLimit && "border-amber-400"
              )}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="font-semibold">{col.title}</div>
                <div className="text-xs text-muted-foreground">
                  {here.length}
                  {col.wipLimit !== null && ` / ${col.wipLimit}`}
                </div>
              </div>
              <ul className="space-y-2">
                {here.map((c) => {
                  const next = nextColumnFor(col.id);
                  const buildable = col.id === "doing" || col.id === "testing";
                  const canPull = next && (col.id === "backlog" || c.remaining === 0);
                  const targetCol = next ? COLUMNS.find((x) => x.id === next)! : null;
                  const targetFull =
                    targetCol &&
                    targetCol.wipLimit !== null &&
                    cardsInCol(state, targetCol.id).length >= targetCol.wipLimit;
                  return (
                    <li
                      key={c.id}
                      className="rounded-md border bg-background p-2 text-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium">{c.title}</div>
                          {buildable && (
                            <div className="text-xs text-muted-foreground">
                              {c.remaining > 0 ? (
                                <>
                                  <span className="font-mono">{c.remaining}</span>{" "}
                                  unit{c.remaining === 1 ? "" : "s"} left
                                </>
                              ) : (
                                <span className="text-green-600">Ready to pull</span>
                              )}
                            </div>
                          )}
                          {col.id === "backlog" && (
                            <div className="text-xs text-muted-foreground">
                              Size <span className="font-mono">{c.size}</span>
                            </div>
                          )}
                          {col.id === "done" && c.completedAtTick !== undefined && (
                            <div className="text-xs text-green-700 dark:text-green-300">
                              Done at tick {c.completedAtTick}
                            </div>
                          )}
                        </div>
                        {next && (
                          <button
                            type="button"
                            onClick={() => pull(c.id)}
                            disabled={!canPull || isGameOver || (targetFull ?? false)}
                            title={
                              !canPull
                                ? "Card not ready yet — finish work first"
                                : targetFull
                                  ? `${targetCol?.title} is full (WIP limit hit)`
                                  : `Pull to ${targetCol?.title}`
                            }
                            className={cn(
                              "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs",
                              canPull && !targetFull && !isGameOver
                                ? "border-primary bg-primary/10 text-primary hover:bg-primary/20"
                                : "border-input bg-muted text-muted-foreground"
                            )}
                          >
                            Pull <ChevronRight className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      {buildable && c.remaining > 0 && (
                        <div className="mt-1 h-1 w-full rounded-full bg-muted">
                          <div
                            className="h-1 rounded-full bg-blue-500"
                            style={{
                              width: `${
                                ((c.size - c.remaining) / c.size) * 100
                              }%`,
                            }}
                          />
                        </div>
                      )}
                    </li>
                  );
                })}
                {here.length === 0 && (
                  <li className="text-xs italic text-muted-foreground">
                    (empty)
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>

      {/* End-of-game summary */}
      {isGameOver && (
        <div className="rounded-lg border border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-5 text-sm dark:from-amber-950/40 dark:to-orange-950/40 dark:border-amber-800">
          <div className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Game over — tick {MAX_TICKS} reached
          </div>
          <ul className="mt-2 space-y-1 text-sm">
            <li>
              <strong>Throughput:</strong> {throughput} cards completed in{" "}
              {MAX_TICKS} ticks.
            </li>
            <li>
              <strong>Avg cycle time:</strong>{" "}
              {cycleTimes.length === 0
                ? "—"
                : `${avgCycleTime.toFixed(1)} ticks per card`}
            </li>
            <li>
              <strong>WIP blocks hit:</strong> {wipViolations}{" "}
              {wipViolations === 0
                ? "(perfect flow discipline!)"
                : "(every block teaches you to finish before starting)"}
            </li>
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            💡 Kanban lesson: throughput goes UP and cycle time goes DOWN when
            you respect WIP limits and finish before starting. Try again to
            beat your throughput!
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-3 inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Play again
          </button>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="font-mono font-bold">{value}</span>
    </div>
  );
}
