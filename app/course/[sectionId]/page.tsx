import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight, Gamepad2 } from "lucide-react";
import { getSection, topicsForSection } from "@/lib/curriculum";
import { cn } from "@/lib/utils";

interface Props {
  params: { sectionId: string };
}

const GAME_LABEL: Record<string, string> = {
  match: "Match pairs",
  order: "Put in order",
  tap: "Quick quiz",
};

const GAME_COLOR: Record<string, string> = {
  match: "border-blue-200 bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-200",
  order: "border-violet-200 bg-violet-50 text-violet-800 dark:bg-violet-950/40 dark:border-violet-800 dark:text-violet-200",
  tap: "border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200",
};

export default function SectionPage({ params }: Props) {
  const section = getSection(params.sectionId);
  if (!section) notFound();

  const topics = topicsForSection(section.id);

  return (
    <div className="space-y-6">
      <Link
        href="/course"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to all sections
      </Link>

      <header className="space-y-2">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          Section {section.number}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{section.title}</h1>
        <p className="text-sm text-muted-foreground">{section.description}</p>
      </header>

      <ol className="space-y-2">
        {topics.map((t, i) => (
          <li key={t.id}>
            <Link
              href={`/course/${section.id}/${t.id}`}
              className="group flex items-center justify-between gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/40"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold tabular-nums">
                  {i + 1}
                </div>
                <div className="space-y-1">
                  <div className="font-medium">{t.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {t.tagline}
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-medium",
                        GAME_COLOR[t.game.type]
                      )}
                    >
                      <Gamepad2 className="h-3 w-3" />
                      {GAME_LABEL[t.game.type] ?? t.game.type}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-foreground" />
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
