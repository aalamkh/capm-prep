import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(
  _req: Request,
  { params }: { params: { questionId: string } }
) {
  await prisma.bookmark
    .delete({ where: { questionId: params.questionId } })
    .catch(() => {
      // Already absent — idempotent delete.
    });
  return NextResponse.json({ ok: true });
}
