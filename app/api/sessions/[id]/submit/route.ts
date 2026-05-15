import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseQuestion, parseUserAnswer } from "@/lib/questions";
import { isCorrect } from "@/lib/scoring";
import {
  applyScheduleUpdate,
  recomputeTodayStreak,
} from "@/lib/review";
import { hasAnswer } from "@/lib/scoring";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const sessionId = params.id;

  const session = await prisma.examSession.findUnique({
    where: { id: sessionId },
    include: { answers: true },
  });
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (session.completedAt) {
    return NextResponse.json({ sessionId, alreadySubmitted: true });
  }

  const questionIds: string[] = JSON.parse(session.questionIds);
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
  });
  const byId = new Map(questions.map((q) => [q.id, parseQuestion(q)]));

  let score = 0;
  const scheduleUpdates: Array<{
    questionId: string;
    isCorrect: boolean;
    difficulty: "EASY" | "MEDIUM" | "HARD";
  }> = [];
  for (const ans of session.answers) {
    const q = byId.get(ans.questionId);
    if (!q) continue;
    const userAnswer = parseUserAnswer(ans.userAnswer);
    const answered = hasAnswer(q, userAnswer);
    const correct = isCorrect(q, userAnswer);
    if (correct) score++;
    if (ans.isCorrect !== correct) {
      await prisma.answer.update({
        where: { id: ans.id },
        data: { isCorrect: correct },
      });
    }
    // Only feed actually-answered questions into SM-2; unanswered (skipped)
    // questions don't have a real outcome.
    if (answered) {
      scheduleUpdates.push({
        questionId: q.id,
        isCorrect: correct,
        difficulty: q.difficulty,
      });
    }
  }

  // Apply schedules sequentially — they upsert by questionId and we want
  // deterministic ordering.
  for (const upd of scheduleUpdates) {
    await applyScheduleUpdate(upd);
  }

  // Always refresh today's streak row from the full day's answers.
  await recomputeTodayStreak();

  const completedAt = new Date();
  const elapsedSeconds = Math.max(
    0,
    Math.floor((completedAt.getTime() - session.startedAt.getTime()) / 1000)
  );

  await prisma.examSession.update({
    where: { id: sessionId },
    data: {
      completedAt,
      score,
      timeSpentSeconds: elapsedSeconds,
    },
  });

  return NextResponse.json({ sessionId, score, total: questionIds.length });
}
