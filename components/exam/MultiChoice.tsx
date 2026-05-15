"use client";

import { cn } from "@/lib/utils";
import { Strikethrough } from "lucide-react";
import type {
  ParsedQuestion,
  MultiAnswer,
  MultiOptions,
} from "@/lib/questions";

const LETTERS = ["A", "B", "C", "D", "E"];

interface Props {
  question: ParsedQuestion;
  value: MultiAnswer | null;
  onChange: (value: MultiAnswer) => void;
  reviewMode?: boolean;
  disabled?: boolean;
  eliminations?: ReadonlySet<number>;
  onToggleEliminate?: (index: number) => void;
}

export function MultiChoice({
  question,
  value,
  onChange,
  reviewMode,
  disabled,
  eliminations,
  onToggleEliminate,
}: Props) {
  const options = question.options as MultiOptions;
  const correct = (question.correctAnswer as MultiAnswer) ?? [];
  const selected = new Set(value ?? []);
  const correctSet = new Set(correct);

  const toggle = (i: number) => {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    onChange(Array.from(next).sort((a, b) => a - b));
  };

  return (
    <div className="space-y-2">
      {options.map((opt, i) => {
        const isSel = selected.has(i);
        const isCorrectChoice = reviewMode && correctSet.has(i);
        const isMissed = reviewMode && correctSet.has(i) && !isSel;
        const isWrongPicked = reviewMode && isSel && !correctSet.has(i);
        const eliminated = eliminations?.has(i) ?? false;

        return (
          <label
            key={i}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors",
              isSel
                ? "border-primary bg-accent"
                : "border-input hover:bg-accent/50",
              isCorrectChoice && "border-green-600 bg-green-50",
              isWrongPicked && "border-red-600 bg-red-50",
              isMissed && "border-amber-600 bg-amber-50",
              eliminated && "opacity-50",
              disabled && "cursor-not-allowed opacity-80"
            )}
          >
            <input
              type="checkbox"
              className="mt-1"
              checked={isSel}
              disabled={disabled}
              onChange={() => toggle(i)}
            />
            <div className={cn("flex-1", eliminated && "line-through")}>
              <span className="mr-2 font-semibold">{LETTERS[i]}.</span>
              <span>{opt}</span>
            </div>
            {onToggleEliminate && !disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onToggleEliminate(i);
                }}
                title={eliminated ? "Restore option" : "Eliminate distractor"}
                className={cn(
                  "ml-1 rounded-md border p-1 text-xs transition-colors",
                  eliminated
                    ? "border-amber-300 bg-amber-100 text-amber-900"
                    : "border-input bg-background text-muted-foreground hover:bg-accent"
                )}
              >
                <Strikethrough className="h-3.5 w-3.5" />
              </button>
            )}
          </label>
        );
      })}
    </div>
  );
}
