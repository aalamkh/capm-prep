import Link from "next/link";
import { Download, Database } from "lucide-react";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ExportPage() {
  const [sessions, answers, bookmarks, schedules, streaks] = await Promise.all([
    prisma.examSession.count(),
    prisma.answer.count(),
    prisma.bookmark.count(),
    prisma.reviewSchedule.count(),
    prisma.studyStreak.count(),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-2">
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Database className="h-7 w-7" />
          Export your data
        </h1>
        <p className="text-sm text-muted-foreground">
          Download every session, answer, bookmark, schedule, and streak as a
          single JSON file. Stash it as a backup or move to another instance.
        </p>
      </header>

      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold">What&apos;s in the export</h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <Stat label="Exam sessions" value={sessions} />
          <Stat label="Answers" value={answers} />
          <Stat label="Bookmarks" value={bookmarks} />
          <Stat label="Review schedules" value={schedules} />
          <Stat label="Streak days" value={streaks} />
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">
          Static question text isn&apos;t included — those live in
          <code className="mx-1 rounded bg-muted px-1">
            /data/questions-*.json
          </code>
          and are restored by re-running the seed.
        </p>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-6">
        <div>
          <h2 className="text-lg font-semibold">Download</h2>
          <p className="text-sm text-muted-foreground">
            Single JSON file. Filename includes today&apos;s date.
          </p>
        </div>
        <Button asChild size="lg">
          <a href="/api/export" download>
            <Download className="mr-2 h-4 w-4" />
            Download JSON
          </a>
        </Button>
      </section>

      <p className="text-xs text-muted-foreground">
        Need to inspect first? Open{" "}
        <Link href="/api/export" className="underline">
          /api/export
        </Link>{" "}
        in a new tab.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
