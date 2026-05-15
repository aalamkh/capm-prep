"use client";

import { cn } from "@/lib/utils";
import { Strikethrough } from "lucide-react";
import type {
  ParsedQuestion,
  SingleAnswer,
  SingleOptions,
} from "@/lib/questions";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

interface Props {
  question: ParsedQuestion;
  value: SingleAnswer | null;
  onChange: (value: SingleAnswer) => void;
  reviewMode?: boolean; // when true, highlight correct/incorrect
  disabled?: boolean;
  /** Indices the user has marked as eliminated (visual strikethrough only). */
  eliminations?: ReadonlySet<number>;
  onToggleEliminate?: (index: number) => void;
}

export function SingleChoice({
  question,
  value,
  onChange,
  reviewMode,
  disabled,
  eliminations,
  onToggleEliminate,
}: Props) {
  const options = question.options as SingleOptions;
  const correct = question.correctAnswer as SingleAnswer;

  return (
    <div className="space-y-2">
      {options.map((opt, i) => {
        const selected = value === i;
        const isCorrectIdx = reviewMode && i === correct;
        const isWrongChoice = reviewMode && selected && i !== correct;
        const eliminated = eliminations?.has(i) ?? false;

        return (
          <label
            key={i}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors",
              selected
                ? "border-primary bg-accent"
                : "border-input hover:bg-accent/50",
              isCorrectIdx && "border-green-600 bg-green-50",
              isWrongChoice && "border-red-600 bg-red-50",
              eliminated && "opacity-50",
              disabled && "cursor-not-allowed opacity-80"
            )}
          >
            <input
              type="radio"
              name={`q-${question.id}`}
              className="mt-1"
              checked={selected}
              disabled={disabled}
              onChange={() => onChange(i)}
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
