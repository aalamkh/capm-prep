import type { Domain } from "@/lib/questions";

export type Band =
  | "ABOVE_TARGET"
  | "TARGET"
  | "BELOW_TARGET"
  | "NEEDS_IMPROVEMENT";

/**
 * PMI-style proficiency bands. PMI doesn't publish exact thresholds, so we
 * use commonly-cited prep-guide cuts:
 *   • ≥ 80%      → Above Target
 *   • 65 – 80%   → Target
 *   • 50 – 65%   → Below Target
 *   • < 50%      → Needs Improvement
 */
export function bandFor(pct: number): Band {
  if (pct >= 0.8) return "ABOVE_TARGET";
  if (pct >= 0.65) return "TARGET";
  if (pct >= 0.5) return "BELOW_TARGET";
  return "NEEDS_IMPROVEMENT";
}

export interface BandUI {
  label: string;
  bg: string;
  fg: string;
  border: string;
  hint: string;
}

export const BAND_UI: Record<Band, BandUI> = {
  ABOVE_TARGET: {
    label: "Above Target",
    bg: "bg-green-50",
    fg: "text-green-800",
    border: "border-green-300",
    hint: "Strong performance — maintain.",
  },
  TARGET: {
    label: "Target",
    bg: "bg-emerald-50",
    fg: "text-emerald-800",
    border: "border-emerald-300",
    hint: "On track — keep practicing.",
  },
  BELOW_TARGET: {
    label: "Below Target",
    bg: "bg-amber-50",
    fg: "text-amber-800",
    border: "border-amber-300",
    hint: "Needs more reps before exam day.",
  },
  NEEDS_IMPROVEMENT: {
    label: "Needs Improvement",
    bg: "bg-red-50",
    fg: "text-red-800",
    border: "border-red-300",
    hint: "Focus area — drill intensively.",
  },
};

export interface DomainBand {
  domain: Domain;
  total: number;
  correct: number;
  pct: number;
  band: Band;
}
