import Link from "next/link";
import { BookOpen, ChevronRight, GraduationCap } from "lucide-react";
import { loadCurriculum, topicsForSection } from "@/lib/curriculum";

export default function CoursePage() {
  const { sections } = loadCurriculum();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <GraduationCap className="h-7 w-7" />
          Course
        </h1>
        <p className="text-sm text-muted-foreground">
          Concepts explained in plain language, with a game for each topic.
          Read, play, internalize — then drill in{" "}
          <Link href="/learn" className="underline">
            Learn
          </Link>{" "}
          or test yourself in{" "}
          <Link href="/practice/new" className="underline">
            Practice
          </Link>
          .
        </p>
      </header>

      <ol className="space-y-3">
        {sections.map((s) => {
          const topics = topicsForSection(s.id);
          return (
            <li key={s.id}>
              <Link
                href={`/course/${s.id}`}
                className="group flex items-center justify-between gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/40"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-bold text-primary">
                    {s.number}
                  </div>
                  <div className="space-y-1">
                    <div className="font-semibold">{s.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.description}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <BookOpen className="h-3.5 w-3.5" />
                      {topics.length} topic{topics.length === 1 ? "" : "s"}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-foreground" />
              </Link>
            </li>
          );
        })}
      </ol>

      <p className="text-xs text-muted-foreground">
        Tip: each topic ends with a quick game. Aim to clear the game on the
        first try — that&apos;s the signal you&apos;ve internalized it.
      </p>
    </div>
  );
}
