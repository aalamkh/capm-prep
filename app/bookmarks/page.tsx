import Link from "next/link";
import { BookmarkCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { DOMAIN_LABELS, type Domain } from "@/lib/questions";
import { Button } from "@/components/ui/button";
import { BookmarkButton } from "@/components/BookmarkButton";
import { DrillBookmarksButton } from "@/components/qbank/DrillBookmarksButton";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BookmarksPage() {
  const rows = await prisma.bookmark.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      question: {
        select: {
          id: true,
          domain: true,
          difficulty: true,
          type: true,
          ecoTask: true,
          questionText: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <BookmarkCheck className="h-7 w-7 text-amber-600" />
            Bookmarks
          </h1>
          <p className="text-sm text-muted-foreground">
            {rows.length === 0
              ? "Bookmark a question from the Question Bank or session review and it will land here."
              : `${rows.length} question${rows.length === 1 ? "" : "s"} saved.`}
          </p>
        </div>
        <DrillBookmarksButton count={rows.length} />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border bg-card p-10 text-center text-sm text-muted-foreground">
          <p>No bookmarks yet.</p>
          <p className="mt-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/question-bank">Browse the Question Bank</Link>
            </Button>
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((b) => {
            const q = b.question;
            return (
              <li
                key={b.id}
                className="space-y-3 rounded-lg border bg-card p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <Link
                    href={`/question-bank/${q.id}`}
                    className="flex-1 space-y-2 hover:underline"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge tone="domain">
                        {DOMAIN_LABELS[q.domain as Domain]}
                      </Badge>
                      <Badge tone="difficulty" difficulty={q.difficulty}>
                        {q.difficulty}
                      </Badge>
                      <Badge tone="type">{q.type.replace("_", " ")}</Badge>
                      {q.ecoTask && (
                        <span className="text-muted-foreground">
                          ECO {q.ecoTask.split(" ")[0]}
                        </span>
                      )}
                    </div>
                    <p className="text-sm">{q.questionText}</p>
                  </Link>
                  <div className="shrink-0">
                    <BookmarkButton
                      questionId={q.id}
                      initialBookmarked
                      initialNote={b.note}
                      variant="full"
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Badge({
  children,
  tone,
  difficulty,
}: {
  children: React.ReactNode;
  tone: "domain" | "difficulty" | "type";
  difficulty?: string;
}) {
  let cls = "border-input bg-background";
  if (tone === "difficulty") {
    cls =
      difficulty === "EASY"
        ? "border-green-300 bg-green-50 text-green-800"
        : difficulty === "MEDIUM"
          ? "border-amber-300 bg-amber-50 text-amber-800"
          : "border-red-300 bg-red-50 text-red-800";
  } else if (tone === "type") {
    cls = "border-blue-200 bg-blue-50 text-blue-800";
  } else {
    cls = "border-violet-200 bg-violet-50 text-violet-800";
  }
  return (
    <span className={cn("rounded-md border px-1.5 py-0.5 font-medium", cls)}>
      {children}
    </span>
  );
}
