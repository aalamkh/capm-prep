"use client";

import { useEffect } from "react";
import type { ParsedQuestion, UserAnswer } from "@/lib/questions";

interface Args {
  question: ParsedQuestion;
  value: UserAnswer;
  setAnswer: (questionId: string, value: UserAnswer) => void;
  toggleFlag: (questionId: string) => void;
  goNext: () => void;
  goPrev: () => void;
  /** When the runner is on a final question, Enter should trigger submit. */
  isLast: boolean;
  onAdvance: () => void;
  /** Disable the listener (e.g. while a break overlay is showing). */
  disabled?: boolean;
}

/**
 * Exam keyboard shortcuts:
 *   1-5         pick / toggle option (SINGLE selects, MULTI toggles)
 *   F           toggle Flag for review
 *   ← / →       previous / next question
 *   Enter       Next, or Submit if on the last question
 *
 * Bypassed while focus is in a text input (so FILL_BLANK works as expected)
 * and while contenteditable / textareas have focus.
 */
export function useExamKeyboard({
  question,
  value,
  setAnswer,
  toggleFlag,
  goNext,
  goPrev,
  isLast,
  onAdvance,
  disabled,
}: Args) {
  useEffect(() => {
    if (disabled) return;

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        const editable = (target as HTMLElement).isContentEditable;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          editable
        ) {
          return;
        }
      }
      // Ignore when modifier keys are held (avoid clobbering browser shortcuts).
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // Number keys 1-5 → option index 0-4.
      if (/^[1-5]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (question.type === "SINGLE") {
          if (idx >= 0 && idx < 4) {
            e.preventDefault();
            setAnswer(question.id, idx);
          }
        } else if (question.type === "MULTI") {
          if (idx >= 0 && idx < 5) {
            e.preventDefault();
            const cur = Array.isArray(value) ? (value as number[]) : [];
            const set = new Set(cur);
            if (set.has(idx)) set.delete(idx);
            else set.add(idx);
            setAnswer(question.id, Array.from(set).sort((a, b) => a - b));
          }
        }
        return;
      }

      // Flag.
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFlag(question.id);
        return;
      }

      // Navigation.
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
        return;
      }

      // Enter advances (or submits on last).
      if (e.key === "Enter") {
        e.preventDefault();
        if (isLast) onAdvance();
        else goNext();
        return;
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [
    disabled,
    question.id,
    question.type,
    value,
    setAnswer,
    toggleFlag,
    goNext,
    goPrev,
    isLast,
    onAdvance,
  ]);
}
