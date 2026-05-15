import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { parseQuestion, parseUserAnswer } from "@/lib/questions";
import { durationSecondsForMode, type Mode } from "@/lib/exam";
import { ExamRunner } from "@/components/exam/ExamRunner";

interface Props {
  params: { sessionId: string };
}

export default async function ExamPage({ params }: Props) {
  const session = await prisma.examSession.findUnique({
    where: { id: params.sessionId },
    include: { answers: true },
  });
  if (!session) notFound();
  if (session.completedAt) {
    redirect(`/exam/${session.id}/results`);
  }

  const orderedIds: string[] = JSON.parse(session.questionIds);
  const rows = await prisma.question.findMany({
    where: { id: { in: orderedIds } },
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  const questions = orderedIds
    .map((id) => byId.get(id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .map(parseQuestion);

  const initialAnswers = session.answers.map((a) => ({
    questionId: a.questionId,
    userAnswer: parseUserAnswer(a.userAnswer),
    flagged: a.flaggedForReview,
  }));

  const mode = session.mode as Mode;

  return (
    <ExamRunner
      sessionId={session.id}
      mode={mode}
      questions={questions}
      initialAnswers={initialAnswers}
      startedAtMs={session.startedAt.getTime()}
      durationSeconds={durationSecondsForMode(mode)}
      initialBreakSecondsTaken={session.breakSecondsTaken}
      initialBreakStartedAtMs={session.breakStartedAt?.getTime() ?? null}
      initialBreaksTaken={session.breaksTaken}
    />
  );
}
