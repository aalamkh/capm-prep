import { prisma } from "@/lib/db";

/**
 * Returns a single JSON blob of every user-generated record:
 * - sessions (with their answers nested)
 * - bookmarks
 * - review schedules
 * - study streaks
 *
 * Question text isn't included — those are static seed data and would bloat
 * the export. Sessions reference questions by id; pair this dump with the
 * checked-in /data/questions-*.json files to reconstruct everything.
 *
 * The Content-Disposition header makes browsers offer a download instead of
 * rendering JSON inline.
 */
export async function GET() {
  const [sessions, bookmarks, schedules, streaks] = await Promise.all([
    prisma.examSession.findMany({
      orderBy: { startedAt: "asc" },
      include: { answers: true },
    }),
    prisma.bookmark.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.reviewSchedule.findMany({ orderBy: { updatedAt: "asc" } }),
    prisma.studyStreak.findMany({ orderBy: { date: "asc" } }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    sessions,
    bookmarks,
    reviewSchedules: schedules,
    studyStreaks: streaks,
  };

  const date = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="capm-prep-export-${date}.json"`,
    },
  });
}
