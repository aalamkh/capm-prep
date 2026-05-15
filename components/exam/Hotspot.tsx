"use client";

import { cn } from "@/lib/utils";
import type {
  ParsedQuestion,
  HotspotAnswer,
  HotspotOptions,
} from "@/lib/questions";

interface Props {
  question: ParsedQuestion;
  value: HotspotAnswer | null;
  onChange: (value: HotspotAnswer) => void;
  reviewMode?: boolean;
  disabled?: boolean;
}

export function Hotspot({
  question,
  value,
  onChange,
  reviewMode,
  disabled,
}: Props) {
  const opts = question.options as HotspotOptions;
  const correct = question.correctAnswer as HotspotAnswer;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Select the region that best matches the question. Image:{" "}
        <code className="rounded bg-muted px-1">{opts.imageUrl}</code> (placeholder)
      </p>
      <div
        className="relative rounded-md border bg-muted/30"
        style={{ aspectRatio: "16 / 9" }}
      >
        {opts.regions.map((r) => {
          const selected = value === r.id;
          const isCorrectReg = reviewMode && r.id === correct;
          const isWrongPick = reviewMode && selected && r.id !== correct;
          return (
            <button
              key={r.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(r.id)}
              className={cn(
                "absolute flex items-center justify-center rounded-md border-2 border-dashed text-xs font-medium transition-colors",
                selected
                  ? "border-primary bg-primary/15"
                  : "border-muted-foreground/40 bg-background/40 hover:border-primary",
                isCorrectReg && "border-green-600 bg-green-100",
                isWrongPick && "border-red-600 bg-red-100",
                disabled && "cursor-not-allowed"
              )}
              style={{
                left: `${r.x}%`,
                top: `${r.y}%`,
                width: `${r.w}%`,
                height: `${r.h}%`,
              }}
            >
              <span className="px-1 text-center leading-tight">{r.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
