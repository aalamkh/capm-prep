/**
 * Simplified SM-2 scheduler.
 *
 * Rules (from spec):
 *   • Correct + easy:  interval × easeFactor, capped at 30 days
 *   • Correct (normal): interval × 1.5, capped at 30 days
 *   • Wrong:           reset interval to 1 day, decrement easeFactor (min 1.3),
 *                       increment lapses
 *
 * "New" (never-answered) questions seed at interval=1, easeFactor=2.5, lapses=0.
 *
 * "Easy" interpretation: since the runner doesn't ask the user to rate
 * difficulty, we treat "easy" as "the question is tagged EASY in the bank
 * AND the user got it right". This gives EASY recall questions a faster
 * graduation curve, matching the SM-2 spirit without UI cost.
 */

export const MAX_INTERVAL_DAYS = 30;
export const MIN_EASE_FACTOR = 1.3;
export const NEW_INTERVAL = 1;
export const NEW_EASE_FACTOR = 2.5;
export const EASE_DECREMENT = 0.2;

export interface ScheduleState {
  interval: number;
  easeFactor: number;
  lapses: number;
}

export function freshSchedule(): ScheduleState {
  return { interval: NEW_INTERVAL, easeFactor: NEW_EASE_FACTOR, lapses: 0 };
}

export interface NextScheduleArgs {
  prior: ScheduleState | null;
  isCorrect: boolean;
  /** True when the question is tagged EASY in the bank. */
  isEasy: boolean;
}

export function nextSchedule({
  prior,
  isCorrect,
  isEasy,
}: NextScheduleArgs): ScheduleState {
  const cur = prior ?? freshSchedule();

  if (!isCorrect) {
    return {
      interval: 1,
      easeFactor: Math.max(MIN_EASE_FACTOR, cur.easeFactor - EASE_DECREMENT),
      lapses: cur.lapses + 1,
    };
  }

  const factor = isEasy ? cur.easeFactor : 1.5;
  const raw = cur.interval * factor;
  const capped = Math.min(MAX_INTERVAL_DAYS, raw);
  return {
    interval: Math.max(1, Math.round(capped)),
    easeFactor: cur.easeFactor,
    lapses: cur.lapses,
  };
}

/** Convert a schedule's interval into a concrete next-review date. */
export function nextReviewDateFrom(
  baseline: Date,
  intervalDays: number
): Date {
  const out = new Date(baseline);
  out.setDate(out.getDate() + intervalDays);
  return out;
}
