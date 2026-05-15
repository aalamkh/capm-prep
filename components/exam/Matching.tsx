"use client";

import { cn } from "@/lib/utils";
import type {
  ParsedQuestion,
  MatchingAnswer,
  MatchingOptions,
} from "@/lib/questions";

interface Props {
  question: ParsedQuestion;
  value: MatchingAnswer | null;
  onChange: (value: MatchingAnswer) => void;
  reviewMode?: boolean;
  disabled?: boolean;
}

export function Matching({
  question,
  value,
  onChange,
  reviewMode,
  disabled,
}: Props) {
  const opts = question.options as MatchingOptions;
  const correct = question.correctAnswer as MatchingAnswer;
  const current = value ?? new Array(opts.left.length).fill(-1);

  const setRow = (rowIdx: number, rightIdx: number) => {
    const next = [...current];
    next[rowIdx] = rightIdx;
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {opts.left.map((leftLabel, i) => {
        const picked = current[i];
        const isRight = reviewMode && picked === correct[i];
        const isWrong = reviewMode && picked !== -1 && picked !== correct[i];

        return (
          <div
            key={i}
            className={cn(
              "grid grid-cols-[1fr,auto,1fr] items-center gap-3 rounded-md border p-3",
              isRight && "border-green-600 bg-green-50",
              isWrong && "border-red-600 bg-red-50"
            )}
          >
            <div className="font-medium">{leftLabel}</div>
            <div className="text-muted-foreground">→</div>
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={picked === -1 ? "" : String(picked)}
              disabled={disabled}
              onChange={(e) =>
                setRow(i, e.target.value === "" ? -1 : Number(e.target.value))
              }
            >
              <option value="">— Select —</option>
              {opts.right.map((rightLabel, j) => (
                <option key={j} value={j}>
                  {rightLabel}
                </option>
              ))}
            </select>
            {reviewMode && picked !== correct[i] && (
              <div className="col-span-3 text-sm text-muted-foreground">
                Correct: {opts.right[correct[i]]}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
