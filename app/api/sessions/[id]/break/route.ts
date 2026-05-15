import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const Body = z.object({ action: z.enum(["start", "end"]) });

const MAX_BREAKS = 2;
const BREAK_DURATION_SECONDS = 10 * 60;

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
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
    where: { id: params.id },
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
  if (session.mode !== "MOCK") {
    return NextResponse.json(
      { error: "Breaks are only available in MOCK mode" },
      { status: 400 }
    );
  }

  if (body.action === "start") {
    if (session.breakStartedAt) {
      return NextResponse.json(
        { error: "Break already in progress" },
        { status: 409 }
      );
    }
    if (session.breaksTaken >= MAX_BREAKS) {
      return NextResponse.json(
        { error: "No more breaks available" },
        { status: 409 }
      );
    }
    const updated = await prisma.examSession.update({
      where: { id: session.id },
      data: { breakStartedAt: new Date() },
      select: {
        breakStartedAt: true,
        breakSecondsTaken: true,
        breaksTaken: true,
      },
    });
    return NextResponse.json({
      ok: true,
      breakStartedAtMs: updated.breakStartedAt!.getTime(),
      breakSecondsTaken: updated.breakSecondsTaken,
      breaksTaken: updated.breaksTaken,
      breakDurationSeconds: BREAK_DURATION_SECONDS,
    });
  }

  // action === "end"
  if (!session.breakStartedAt) {
    // Idempotent — return current state.
    return NextResponse.json({
      ok: true,
      breakSecondsTaken: session.breakSecondsTaken,
      breaksTaken: session.breaksTaken,
      breakStartedAtMs: null,
    });
  }

  const elapsed = Math.min(
    BREAK_DURATION_SECONDS,
    Math.max(
      0,
      Math.floor((Date.now() - session.breakStartedAt.getTime()) / 1000)
    )
  );
  const updated = await prisma.examSession.update({
    where: { id: session.id },
    data: {
      breakStartedAt: null,
      breakSecondsTaken: { increment: elapsed },
      breaksTaken: { increment: 1 },
    },
    select: { breakSecondsTaken: true, breaksTaken: true },
  });
  return NextResponse.json({
    ok: true,
    breakStartedAtMs: null,
    breakSecondsTaken: updated.breakSecondsTaken,
    breaksTaken: updated.breaksTaken,
    breakDurationSeconds: BREAK_DURATION_SECONDS,
    elapsedThisBreak: elapsed,
  });
}
