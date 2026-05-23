import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Lightbulb,
  BookOpen,
  Gamepad2,
  ChevronRight,
  Brain,
  Layers,
} from "lucide-react";
import {
  getSection,
  getTopic,
  nextTopic,
  prevTopic,
} from "@/lib/curriculum";
import { GameRenderer } from "@/components/games/GameRenderer";

interface Props {
  params: { sectionId: string; topicId: string };
}

export default function TopicPage({ params }: Props) {
  const section = getSection(params.sectionId);
  const topic = getTopic(params.topicId);
  if (!section || !topic || topic.sectionId !== section.id) notFound();

  const next = nextTopic(topic.id);
  const prev = prevTopic(topic.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={`/course/${section.id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Section {section.number}
      </Link>

      <header className="space-y-2">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          Section {section.number} · {section.title}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{topic.title}</h1>
        <p className="text-base text-muted-foreground">{topic.tagline}</p>
      </header>

      {/* ELI5 */}
      <section className="rounded-xl border bg-card p-6">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
          <Brain className="h-4 w-4" />
          Explain it simply
        </h2>
        <div className="space-y-3 text-sm leading-relaxed whitespace-pre-line">
          {topic.eli5}
        </div>
      </section>

      {/* Key facts */}
      <section className="rounded-lg border bg-card p-5">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
          <Lightbulb className="h-4 w-4" />
          Remember these
        </h2>
        <ul className="space-y-1.5 text-sm">
          {topic.keyFacts.map((f, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[11px] font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                {i + 1}
              </span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Game */}
      <section className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-amber-50 p-6 dark:from-primary/10 dark:to-amber-950/40">
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
          <Gamepad2 className="h-5 w-5 text-primary" />
          Play it to lock it in
        </h2>
        <GameRenderer game={topic.game} />
      </section>

      {/* Reference + related drill */}
      <section className="grid gap-3 sm:grid-cols-2">
        {topic.reference && (
          <div className="rounded-lg border bg-muted/30 p-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Reference</span>
            </div>
            <p className="mt-1">{topic.reference}</p>
          </div>
        )}
        {topic.relatedConcept && (
          <Link
            href={`/learn/${topic.relatedConcept}`}
            className="group flex items-center justify-between gap-3 rounded-lg border bg-card p-4 text-sm transition-colors hover:bg-accent/40"
          >
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Drill this concept
                </div>
                <div className="font-medium">
                  Open Learn → ECO {topic.relatedConcept}
                </div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
          </Link>
        )}
      </section>

      {/* Prev / Next */}
      <nav className="flex items-center justify-between gap-3 border-t pt-4 text-sm">
        {prev ? (
          <Link
            href={`/course/${prev.sectionId}/${prev.id}`}
            className="inline-flex items-center gap-1 text-muted-foreground hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/course/${next.sectionId}/${next.id}`}
            className="inline-flex items-center gap-1 text-muted-foreground hover:underline"
          >
            {next.title}
            <ArrowLeft className="h-4 w-4 rotate-180" />
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
