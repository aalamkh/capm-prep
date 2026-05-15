"use client";

import { cn } from "@/lib/utils";
import type { ParsedQuestion } from "@/lib/questions";
import { hasAnswer } from "@/lib/scoring";
import type { AnswerState } from "@/lib/useExamSession";
import { Flag } from "lucide-react";

interface Props {
  questions: ParsedQuestion[];
  answers: Map<string, AnswerState>;
  currentIndex: number;
  onJump: (i: number) => void;
  onSubmit: () => void;
  submitting: boolean;
  answeredCount: number;
  flaggedCount: number;
}

export function QuestionPalette({
  questions,
  answers,
  currentIndex,
  onJump,
  onSubmit,
  submitting,
  answeredCount,
  flaggedCount,
}: Props) {
  return (
    <aside className="space-y-4 rounded-lg border bg-card p-4">
      <div className="text-sm">
        <div>
          <span className="font-semibold">{answeredCount}</span>
          <span className="text-muted-foreground">
            {" "}/ {questions.length} answered
          </span>
        </div>
        <div>
          <span className="font-semibold">{flaggedCount}</span>
          <span className="text-muted-foreground"> flagged</span>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {questions.map((q, i) => {
          const state = answers.get(q.id);
          const answered = state ? hasAnswer(q, state.userAnswer) : false;
          const flagged = state?.flagged ?? false;
          const isCurrent = i === currentIndex;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onJump(i)}
              className={cn(
                "relative h-9 rounded-md border text-xs font-medium transition-colors",
                isCurrent && "ring-2 ring-primary ring-offset-1",
                answered
                  ? "border-primary bg-primary/10"
                  : "border-input bg-background hover:bg-accent"
              )}
              aria-label={`Question ${i + 1}${answered ? ", answered" : ""}${
                flagged ? ", flagged" : ""
              }`}
            >
              {i + 1}
              {flagged && (
                <Flag
                  className="absolute -right-0.5 -top-0.5 h-3 w-3 fill-amber-500 text-amber-500"
                  strokeWidth={2}
                />
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit Exam"}
      </button>
    </aside>
  );
}
