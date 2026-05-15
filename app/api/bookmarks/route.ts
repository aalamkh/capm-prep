import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const Body = z.object({
  questionId: z.string().min(1),
  note: z.string().max(2000).optional().nullable(),
});

/**
 * Upsert a bookmark by questionId. Used to both create a bookmark and
 * update its note. To remove, DELETE /api/bookmarks/[questionId].
 */
export async function POST(req: Request) {
  let body;
  try {
    body = Body.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request body", details: String(err) },
      { status: 400 }
    );
  }

  const exists = await prisma.question.findUnique({
    where: { id: body.questionId },
    select: { id: true },
  });
  if (!exists) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const bookmark = await prisma.bookmark.upsert({
    where: { questionId: body.questionId },
    create: {
      questionId: body.questionId,
      note: body.note ?? null,
    },
    update: {
      note: body.note ?? null,
    },
  });

  return NextResponse.json({ bookmark });
}
