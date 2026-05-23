"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MatchPairsData } from "@/lib/curriculum";

interface Props {
  data: MatchPairsData;
  onComplete?: () => void;
}

interface Card {
  id: string;        // unique per render
  pairId: number;    // which pair this belongs to
  text: string;
  side: "L" | "R";
  matched: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function MatchPairs({ data, onComplete }: Props) {
  // SSR-safe: first paint uses the cards in their natural order. After mount
  // we shuffle for variety. Avoids Math.random() hydration mismatch.
  const orderedDeck = useMemo<Card[]>(() => {
    const cards: Card[] = [];
    data.pairs.forEach((p, i) => {
      cards.push({ id: `L-${i}`, pairId: i, text: p.left, side: "L", matched: false });
      cards.push({ id: `R-${i}`, pairId: i, text: p.right, side: "R", matched: false });
    });
    return cards;
  }, [data.pairs]);
  const buildDeck = () => shuffle(orderedDeck);

  const [deck, setDeck] = useState<Card[]>(orderedDeck);
  useEffect(() => {
    setDeck(buildDeck());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderedDeck]);
  const [selected, setSelected] = useState<string[]>([]); // card ids in current pick
  const [mistakes, setMistakes] = useState(0);
  const [matches, setMatches] = useState(0);
  const [shake, setShake] = useState<string[]>([]);

  const allMatched = matches === data.pairs.length;

  useEffect(() => {
    if (allMatched) onComplete?.();
  }, [allMatched, onComplete]);

  const reset = () => {
    setDeck(buildDeck());
    setSelected([]);
    setMistakes(0);
    setMatches(0);
    setShake([]);
  };

  const onPick = (cardId: string) => {
    if (allMatched) return;
    const card = deck.find((c) => c.id === cardId);
    if (!card || card.matched || selected.includes(cardId)) return;
    // Disallow picking two from the same side.
    if (selected.length === 1) {
      const first = deck.find((c) => c.id === selected[0])!;
      if (first.side === card.side) {
        // Replace the selection with the new card.
        setSelected([cardId]);
        return;
      }
    }
    const next = [...selected, cardId];
    setSelected(next);
    if (next.length === 2) {
      const [a, b] = next.map((id) => deck.find((c) => c.id === id)!);
      if (a.pairId === b.pairId) {
        // Hit
        setDeck((d) =>
          d.map((c) => (c.pairId === a.pairId ? { ...c, matched: true } : c))
        );
        setMatches((m) => m + 1);
        setSelected([]);
      } else {
        // Miss — flash red briefly then unselect
        setMistakes((m) => m + 1);
        setShake(next);
        setTimeout(() => {
          setSelected([]);
          setShake([]);
        }, 600);
      }
    }
  };

  const total = data.pairs.length;
  const accuracy =
    matches + mistakes === 0 ? 1 : matches / (matches + mistakes);

  return (
    <div className="space-y-4">
      {data.intro && (
        <p className="text-sm text-muted-foreground">{data.intro}</p>
      )}

      {/* Score row */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <span>
            <strong>{matches}</strong> / {total} matched
          </span>
          {mistakes > 0 && (
            <span className="text-muted-foreground">
              {mistakes} miss{mistakes === 1 ? "" : "es"} ·{" "}
              {Math.round(accuracy * 100)}%
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

      {/* Board: two columns (left items / right items) */}
      <div className="grid gap-3 sm:grid-cols-2">
        {(["L", "R"] as const).map((side) => (
          <div key={side} className="space-y-2">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {side === "L" ? "Terms" : "Definitions"}
            </div>
            {deck
              .filter((c) => c.side === side)
              .map((c) => {
                const isSel = selected.includes(c.id);
                const isShake = shake.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onPick(c.id)}
                    disabled={c.matched}
                    className={cn(
                      "block w-full rounded-md border p-3 text-left text-sm transition-all",
                      c.matched
                        ? "border-green-300 bg-green-50 text-green-900 dark:bg-green-950/40 dark:text-green-100 dark:border-green-800"
                        : isSel
                          ? "border-primary bg-accent ring-2 ring-primary/30"
                          : "border-input bg-background hover:bg-accent",
                      isShake && "border-red-500 bg-red-100 dark:bg-red-950/40"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {c.matched && (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      )}
                      <span>{c.text}</span>
                    </div>
                  </button>
                );
              })}
          </div>
        ))}
      </div>

      {allMatched && (
        <div className="flex items-center gap-2 rounded-md border border-green-300 bg-green-50 p-3 text-sm dark:bg-green-950/40 dark:border-green-800">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span className="font-medium text-green-900 dark:text-green-100">
            All matched! {mistakes === 0 ? "Perfect run." : `${mistakes} miss${mistakes === 1 ? "" : "es"}.`}
          </span>
        </div>
      )}
    </div>
  );
}
