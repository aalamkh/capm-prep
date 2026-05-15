import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { parseQuestion, serializeUserAnswer } from "@/lib/questions";
import { isCorrect } from "@/lib/scoring";

const Body = z.object({
  questionId: z.string().min(1),
  // userAnswer can be number, number[], string, or null when only flagging.
  userAnswer: z.union([z.number(), z.array(z.number()), z.string(), z.null()]),
  flaggedForReview: z.boolean().optional(),
  timeSpentSeconds: z.number().int().min(0).optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const sessionId = params.id;

  let body;
  try {
    body = Body.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request body", details: String(err) },
      { status: 400 }
    );
  }

  const session = await prisma.examSession.findUnique({
    where: { id: sessionId },
    select: { id: true, completedAt: true, questionIds: true },
  });
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (session.completedAt) {
    return NextResponse.json(
      { error: "Session already submitted" },
      { status: 409 }
    );
  }

  const allowedIds: string[] = JSON.parse(session.questionIds);
  if (!allowedIds.includes(body.questionId)) {
    return NextResponse.json(
      { error: "Question not part of this session" },
      { status: 400 }
    );
  }

  const questionRow = await prisma.question.findUnique({
    where: { id: body.questionId },
  });
  if (!questionRow) {
    return NextResponse.json({ error: "Question missing" }, { status: 404 });
  }
  const question = parseQuestion(questionRow);

  const userAnswerSerialized = serializeUserAnswer(body.userAnswer);
  const correct =
    body.userAnswer === null ? null : isCorrect(question, body.userAnswer);

  const data = {
    userAnswer: userAnswerSerialized,
    isCorrect: correct,
    ...(body.flaggedForReview !== undefined
      ? { flaggedForReview: body.flaggedForReview }
      : {}),
    ...(body.timeSpentSeconds !== undefined
      ? { timeSpentSeconds: body.timeSpentSeconds }
      : {}),
  };

  await prisma.answer.upsert({
    where: {
      sessionId_questionId: {
        sessionId,
        questionId: body.questionId,
      },
    },
    create: {
      sessionId,
      questionId: body.questionId,
      ...data,
    },
    update: data,
  });

  return NextResponse.json({ ok: true, isCorrect: correct });
}
