import Link from "next/link";
import { BookmarkCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { parseFilters, filtersToQuery } from "@/lib/qbank-filters";
import { Filters } from "@/components/qbank/Filters";
import { DOMAIN_LABELS } from "@/lib/questions";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function QuestionBankPage({ searchParams }: PageProps) {
  const filters = parseFilters(searchParams);

  // Build the AND-clause where filter.
  const where = {
    AND: [
      filters.domains.length ? { domain: { in: filters.domains } } : {},
      filters.difficulties.length
        ? { difficulty: { in: filters.difficulties } }
        : {},
      filters.types.length ? { type: { in: filters.types } } : {},
      filters.eco
        ? { ecoTask: { contains: filters.eco } }
        : {},
      filters.q ? { questionText: { contains: filters.q } } : {},
      filters.bookmarked ? { bookmarks: { some: {} } } : {},
      filters.wrong ? { answers: { some: { isCorrect: false } } } : {},
    ],
  };

  const [total, rows] = await Promise.all([
    prisma.question.count({ where }),
    prisma.question.findMany({
      where,
      orderBy: { createdAt: "asc" },
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        type: true,
        domain: true,
        difficulty: true,
        ecoTask: true,
        questionText: true,
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const ids = rows.map((r) => r.id);

  // Per-row aggregates: bookmark presence + answer count + correct count.
  const [bookmarks, answerStats] = await Promise.all([
    ids.length
      ? prisma.bookmark.findMany({
          where: { questionId: { in: ids } },
          select: { questionId: true },
        })
      : Promise.resolve([]),
    ids.length
      ? prisma.answer.groupBy({
          by: ["questionId", "isCorrect"],
          where: { questionId: { in: ids } },
          _count: true,
        })
      : Promise.resolve(
          [] as Array<{
            questionId: string;
            isCorrect: boolean | null;
            _count: number;
          }>
        ),
  ]);

  const bookmarkSet = new Set(bookmarks.map((b) => b.questionId));
  const stats = new Map<string, { total: number; correct: number }>();
  for (const r of answerStats) {
    const cur = stats.get(r.questionId) ?? { total: 0, correct: 0 };
    cur.total += r._count;
    if (r.isCorrect === true) cur.correct += r._count;
    stats.set(r.questionId, cur);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px,minmax(0,1fr)]">
      <div className="lg:sticky lg:top-20 lg:self-start">
        <Filters initial={filters} totalResults={total} />
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Question Bank</h1>
            <p className="text-sm text-muted-foreground">
              Browse all 150 questions. Filter, search, and dive into any one
              outside of timed sessions.
            </p>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-lg border bg-card p-10 text-center text-sm text-muted-foreground">
            No questions match these filters.
          </div>
        ) : (
          <ul className="space-y-2">
            {rows.map((q) => {
              const s = stats.get(q.id);
              const bookmarked = bookmarkSet.has(q.id);
              return (
                <li key={q.id}>
                  <Link
                    href={`/question-bank/${q.id}`}
                    className="block rounded-lg border bg-card p-4 transition-colors hover:bg-accent/40"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge tone="domain">{DOMAIN_LABELS[q.domain as keyof typeof DOMAIN_LABELS]}</Badge>
                      <Badge tone="difficulty" difficulty={q.difficulty}>
                        {q.difficulty}
                      </Badge>
                      <Badge tone="type">{q.type.replace("_", " ")}</Badge>
                      {q.ecoTask && (
                        <span className="text-muted-foreground">
                          ECO {q.ecoTask.split(" ")[0]}
                        </span>
                      )}
                      {bookmarked && (
                        <span className="ml-auto inline-flex items-center gap-1 text-amber-700">
                          <BookmarkCheck className="h-3.5 w-3.5" /> bookmarked
                        </span>
                      )}
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-snug">
                      {q.questionText}
                    </p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {s && s.total > 0
                        ? `Answered ${s.total}× · ${s.correct} correct (${Math.round(
                            (s.correct / s.total) * 100
                          )}%)`
                        : "Not yet answered"}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {totalPages > 1 && (
          <Pagination
            current={filters.page}
            totalPages={totalPages}
            buildHref={(p) => `/question-bank${filtersToQuery(filters, { page: p })}`}
          />
        )}
      </div>
    </div>
  );
}

function Pagination({
  current,
  totalPages,
  buildHref,
}: {
  current: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  const prev = Math.max(1, current - 1);
  const next = Math.min(totalPages, current + 1);
  return (
    <nav className="flex items-center justify-center gap-2">
      <Link
        href={buildHref(prev)}
        aria-disabled={current === 1}
        className={cn(
          "inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm",
          current === 1
            ? "pointer-events-none opacity-40"
            : "hover:bg-accent"
        )}
      >
        <ChevronLeft className="h-4 w-4" /> Prev
      </Link>
      <span className="text-sm text-muted-foreground">
        Page {current} of {totalPages}
      </span>
      <Link
        href={buildHref(next)}
        aria-disabled={current === totalPages}
        className={cn(
          "inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm",
          current === totalPages
            ? "pointer-events-none opacity-40"
            : "hover:bg-accent"
        )}
      >
        Next <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
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
