"use client";

import type { ParsedQuestion, UserAnswer } from "@/lib/questions";
import { QuestionRenderer } from "./QuestionRenderer";

interface Props {
  question: ParsedQuestion;
  userAnswer: UserAnswer;
}

/**
 * Display-only wrapper around QuestionRenderer for the results page.
 * Server components can render this without violating the
 * "no event handlers across the server/client boundary" rule.
 */
export function ReviewQuestion({ question, userAnswer }: Props) {
  return (
    <QuestionRenderer
      question={question}
      value={userAnswer}
      onChange={() => {}}
      reviewMode
      disabled
    />
  );
}
