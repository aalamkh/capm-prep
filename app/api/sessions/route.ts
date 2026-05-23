import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  pickPracticeQuestions,
  pickRealisticMockQuestions,
  pickDomainQuestions,
  pickEcoQuestions,
  pickBookmarkedQuestions,
  pickLearnQuestions,
  LEARN_QUESTION_COUNT,
} from "@/lib/exam";
import {
  getDueQuestionIds,
  getNewQuestionIds,
  NEW_DRILL_DEFAULT_COUNT,
} from "@/lib/review";

const Body = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("PRACTICE") }),
  z.object({ mode: z.literal("MOCK") }),
  z.object({
    mode: z.literal("DOMAIN"),
    domain: z.enum([
      "FUNDAMENTALS",
      "PREDICTIVE",
      "AGILE",
      "BUSINESS_ANALYSIS",
    ]),
    count: z.union([z.literal(10), z.literal(20), z.literal("all")]),
  }),
  z.object({
    mode: z.literal("ECO_DRILL"),
    ecoPrefix: z.string().min(1).max(20),
  }),
  z.object({ mode: z.literal("BOOKMARK_DRILL") }),
  z.object({ mode: z.literal("REVIEW") }),
  z.object({
    mode: z.literal("NEW"),
    count: z.number().int().min(1).max(50).optional(),
  }),
  z.object({
    mode: z.literal("LEARN"),
    ecoPrefix: z.string().min(1).max(20),
    count: z.number().int().min(1).max(20).optional(),
  }),
]);

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request body", details: String(err) },
      { status: 400 }
    );
  }

  let questionIds: string[];
  if (parsed.mode === "PRACTICE") {
    questionIds = await pickPracticeQuestions();
  } else if (parsed.mode === "MOCK") {
    questionIds = await pickRealisticMockQuestions();
  } else if (parsed.mode === "DOMAIN") {
    questionIds = await pickDomainQuestions(parsed.domain, parsed.count);
  } else if (parsed.mode === "ECO_DRILL") {
    questionIds = await pickEcoQuestions(parsed.ecoPrefix);
  } else if (parsed.mode === "BOOKMARK_DRILL") {
    questionIds = await pickBookmarkedQuestions();
  } else if (parsed.mode === "REVIEW") {
    questionIds = await getDueQuestionIds();
  } else if (parsed.mode === "NEW") {
    const { ids } = await getNewQuestionIds(
      parsed.count ?? NEW_DRILL_DEFAULT_COUNT
    );
    questionIds = ids;
  } else {
    questionIds = await pickLearnQuestions(
      parsed.ecoPrefix,
      parsed.count ?? LEARN_QUESTION_COUNT
    );
  }

  if (questionIds.length === 0) {
    return NextResponse.json(
      { error: "No questions available for the selected mode/domain." },
      { status: 400 }
    );
  }

  const session = await prisma.examSession.create({
    data: {
      mode: parsed.mode,
      questionIds: JSON.stringify(questionIds),
      totalQuestions: questionIds.length,
    },
  });

  return NextResponse.json({ sessionId: session.id });
}
