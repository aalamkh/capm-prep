"use client";

import type { ParsedQuestion, UserAnswer } from "@/lib/questions";
import { SingleChoice } from "./SingleChoice";
import { MultiChoice } from "./MultiChoice";
import { Matching } from "./Matching";
import { Hotspot } from "./Hotspot";
import { FillBlank } from "./FillBlank";

interface Props {
  question: ParsedQuestion;
  value: UserAnswer;
  onChange: (value: UserAnswer) => void;
  reviewMode?: boolean;
  disabled?: boolean;
  /** Eliminations only apply to SINGLE/MULTI; ignored for other types. */
  eliminations?: ReadonlySet<number>;
  onToggleEliminate?: (index: number) => void;
}

export function QuestionRenderer({
  question,
  value,
  onChange,
  reviewMode,
  disabled,
  eliminations,
  onToggleEliminate,
}: Props) {
  switch (question.type) {
    case "SINGLE":
      return (
        <SingleChoice
          question={question}
          value={typeof value === "number" ? value : null}
          onChange={onChange as (v: number) => void}
          reviewMode={reviewMode}
          disabled={disabled}
          eliminations={eliminations}
          onToggleEliminate={onToggleEliminate}
        />
      );
    case "MULTI":
      return (
        <MultiChoice
          question={question}
          value={Array.isArray(value) ? (value as number[]) : null}
          onChange={onChange as (v: number[]) => void}
          reviewMode={reviewMode}
          disabled={disabled}
          eliminations={eliminations}
          onToggleEliminate={onToggleEliminate}
        />
      );
    case "MATCHING":
      return (
        <Matching
          question={question}
          value={Array.isArray(value) ? (value as number[]) : null}
          onChange={onChange as (v: number[]) => void}
          reviewMode={reviewMode}
          disabled={disabled}
        />
      );
    case "HOTSPOT":
      return (
        <Hotspot
          question={question}
          value={typeof value === "string" ? value : null}
          onChange={onChange as (v: string) => void}
          reviewMode={reviewMode}
          disabled={disabled}
        />
      );
    case "FILL_BLANK":
      return (
        <FillBlank
          question={question}
          value={typeof value === "string" ? value : null}
          onChange={onChange as (v: string) => void}
          reviewMode={reviewMode}
          disabled={disabled}
        />
      );
    default:
      return (
        <p className="text-sm text-destructive">
          Unsupported question type: {(question as { type: string }).type}
        </p>
      );
  }
}
