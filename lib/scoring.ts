import type { ParsedQuestion, UserAnswer } from "@/lib/questions";

/**
 * Returns true iff the userAnswer matches the question's correctAnswer.
 * Empty / null / undefined / wrong-shape answers all return false.
 *
 * Per-type rules:
 *  - SINGLE:     userAnswer is a number, must equal correctAnswer
 *  - MULTI:      userAnswer is a number[]; treated as a set, must equal correctAnswer set
 *  - MATCHING:   userAnswer is a number[]; index-by-index equality with correctAnswer
 *  - HOTSPOT:    userAnswer is a string region id, must equal correctAnswer
 *  - FILL_BLANK: userAnswer is a string; trimmed/case-insensitive match against any
 *                accepted answer in correctAnswer (string[])
 */
export function isCorrect(
  question: ParsedQuestion,
  userAnswer: UserAnswer
): boolean {
  if (userAnswer === null || userAnswer === undefined) return false;

  switch (question.type) {
    case "SINGLE":
      return (
        typeof userAnswer === "number" && userAnswer === question.correctAnswer
      );

    case "MULTI": {
      if (!Array.isArray(userAnswer)) return false;
      const expected = question.correctAnswer as number[];
      if (userAnswer.length !== expected.length) return false;
      const setU = new Set(userAnswer);
      if (setU.size !== userAnswer.length) return false;
      return expected.every((v) => setU.has(v));
    }

    case "MATCHING": {
      if (!Array.isArray(userAnswer)) return false;
      const expected = question.correctAnswer as number[];
      if (userAnswer.length !== expected.length) return false;
      return userAnswer.every((v, i) => v === expected[i]);
    }

    case "HOTSPOT":
      return (
        typeof userAnswer === "string" && userAnswer === question.correctAnswer
      );

    case "FILL_BLANK": {
      if (typeof userAnswer !== "string") return false;
      const accepted = question.correctAnswer as string[];
      const norm = userAnswer.trim().toLowerCase();
      if (norm.length === 0) return false;
      return accepted.some((a) => a.trim().toLowerCase() === norm);
    }

    default:
      return false;
  }
}

/**
 * "Has the user provided some answer?" — distinct from correctness.
 * Used to decide whether to show 'Answered' in the palette.
 */
export function hasAnswer(
  question: ParsedQuestion,
  userAnswer: UserAnswer
): boolean {
  if (userAnswer === null || userAnswer === undefined) return false;
  switch (question.type) {
    case "SINGLE":
      return typeof userAnswer === "number" && userAnswer >= 0;
    case "MULTI":
    case "MATCHING":
      return Array.isArray(userAnswer) && userAnswer.length > 0;
    case "HOTSPOT":
      return typeof userAnswer === "string" && userAnswer.length > 0;
    case "FILL_BLANK":
      return typeof userAnswer === "string" && userAnswer.trim().length > 0;
    default:
      return false;
  }
}
