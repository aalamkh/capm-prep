import type { Question as DbQuestion } from "@prisma/client";

export type QuestionType =
  | "SINGLE"
  | "MULTI"
  | "MATCHING"
  | "HOTSPOT"
  | "FILL_BLANK";

export type Domain =
  | "FUNDAMENTALS"
  | "PREDICTIVE"
  | "AGILE"
  | "BUSINESS_ANALYSIS";

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export type SingleOptions = string[];
export type SingleAnswer = number;

export type MultiOptions = string[];
export type MultiAnswer = number[];

export interface MatchingOptions {
  left: string[];
  right: string[];
}
export type MatchingAnswer = number[];

export interface HotspotRegion {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface HotspotOptions {
  imageUrl: string;
  regions: HotspotRegion[];
}
export type HotspotAnswer = string;

export type FillBlankOptions = null;
export type FillBlankAnswer = string[]; // accepted answers

export type QuestionOptions =
  | SingleOptions
  | MultiOptions
  | MatchingOptions
  | HotspotOptions
  | FillBlankOptions;

export type QuestionCorrectAnswer =
  | SingleAnswer
  | MultiAnswer
  | MatchingAnswer
  | HotspotAnswer
  | FillBlankAnswer;

export type UserAnswer =
  | number
  | number[]
  | string
  | null
  | undefined;

export interface ParsedQuestion {
  id: string;
  type: QuestionType;
  domain: Domain;
  difficulty: Difficulty;
  questionText: string;
  options: QuestionOptions;
  correctAnswer: QuestionCorrectAnswer;
  explanation: string;
  reference: string | null;
}

export const DOMAIN_LABELS: Record<Domain, string> = {
  FUNDAMENTALS: "Fundamentals",
  PREDICTIVE: "Predictive",
  AGILE: "Agile",
  BUSINESS_ANALYSIS: "Business Analysis",
};

export const ALL_DOMAINS: Domain[] = [
  "FUNDAMENTALS",
  "PREDICTIVE",
  "AGILE",
  "BUSINESS_ANALYSIS",
];

export function parseQuestion(row: DbQuestion): ParsedQuestion {
  return {
    id: row.id,
    type: row.type as QuestionType,
    domain: row.domain as Domain,
    difficulty: row.difficulty as Difficulty,
    questionText: row.questionText,
    options: JSON.parse(row.options) as QuestionOptions,
    correctAnswer: JSON.parse(row.correctAnswer) as QuestionCorrectAnswer,
    explanation: row.explanation,
    reference: row.reference,
  };
}

export function parseUserAnswer(raw: string | null | undefined): UserAnswer {
  if (raw === null || raw === undefined) return null;
  try {
    return JSON.parse(raw) as UserAnswer;
  } catch {
    return null;
  }
}

export function serializeUserAnswer(value: UserAnswer): string | null {
  if (value === null || value === undefined) return null;
  return JSON.stringify(value);
}
