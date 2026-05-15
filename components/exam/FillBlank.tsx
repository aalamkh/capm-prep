"use client";

import { cn } from "@/lib/utils";
import type { ParsedQuestion, FillBlankAnswer } from "@/lib/questions";

interface Props {
  question: ParsedQuestion;
  value: string | null;
  onChange: (value: string) => void;
  reviewMode?: boolean;
  disabled?: boolean;
}

export function FillBlank({
  question,
  value,
  onChange,
  reviewMode,
  disabled,
}: Props) {
  const accepted = question.correctAnswer as FillBlankAnswer;
  const userText = value ?? "";

  const isMatch =
    reviewMode &&
    accepted.some(
      (a) => a.trim().toLowerCase() === userText.trim().toLowerCase()
    );

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={userText}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          reviewMode && isMatch && "border-green-600 bg-green-50",
          reviewMode && !isMatch && "border-red-600 bg-red-50"
        )}
        placeholder="Type your answer"
      />
      {reviewMode && (
        <p className="text-sm text-muted-foreground">
          Accepted answers: {accepted.map((a) => `"${a}"`).join(", ")}
        </p>
      )}
    </div>
  );
}
