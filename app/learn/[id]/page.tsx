import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Lightbulb,
  AlertTriangle,
  BookOpen,
  Target,
  Sparkles,
} from "lucide-react";
import { getConcept, loadConcepts } from "@/lib/concepts";
import { computeAllMastery, MASTERY_UI, masteryFor } from "@/lib/mastery";
import { DOMAIN_LABELS } from "@/lib/questions";
import { StartLearnButton } from "@/components/learn/StartLearnButton";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export default async function ConceptPage({ params }: Props) {
  const concept = getConcept(params.id);
  if (!concept) notFound();

  const masteryMap = await computeAllMastery();
  const m = masteryFor(masteryMap, concept.id);
  const ui = MASTERY_UI[m.level];

  // Find prev / next concept in the same domain for easy navigation.
  const concepts = loadConcepts();
  const sameDomain = concepts.filter((c) => c.domain === concept.domain);
  const idx = sameDomain.findIndex((c) => c.id === concept.id);
  const prev = idx > 0 ? sameDomain[idx - 1] : null;
  const next = idx < sameDomain.length - 1 ? sameDomain[idx + 1] : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/learn"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to concept map
      </Link>

      {/* Header card */}
      <header
        className={cn(
          "rounded-xl border p-6",
          ui.border,
          ui.bg
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 font-medium text-violet-800 dark:bg-violet-950/30 dark:text-violet-200">
                {DOMAIN_LABELS[concept.domain]}
              </span>
              <span className="font-mono text-muted-foreground">
                ECO {concept.id}
              </span>
            </div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              {concept.title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed">{concept.summary}</p>
          </div>
          <div
            className={cn(
              "rounded-md border px-3 py-2 text-right text-xs",
              ui.border,
              "bg-background/50"
            )}
          >
            <div className={cn("font-semibold", ui.fg)}>{ui.label}</div>
            <div className="text-muted-foreground">
              {m.encounters === 0
                ? "Not started"
                : `${m.correct}/${m.encounters} · ${Math.round(m.accuracy * 100)}%`}
            </div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">
              {ui.next}
            </div>
          </div>
        </div>
      </header>

      {/* Why it matters */}
      <section className="rounded-lg border bg-card p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
          <Target className="h-4 w-4" />
          Why this matters on the exam
        </h2>
        <p className="mt-2 text-sm leading-relaxed">{concept.whyItMatters}</p>
      </section>

      {/* Key points */}
      <section className="rounded-lg border bg-card p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
          <Lightbulb className="h-4 w-4" />
          Key points
        </h2>
        <ul className="mt-2 space-y-2 text-sm">
          {concept.keyPoints.map((p, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                {i + 1}
              </span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Common mistakes */}
      <section className="rounded-lg border bg-card p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
          <AlertTriangle className="h-4 w-4" />
          Common mistakes — avoid these
        </h2>
        <ul className="mt-2 space-y-1.5 text-sm">
          {concept.commonMistakes.map((p, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-red-500">✗</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <section className="rounded-xl border bg-gradient-to-br from-primary/5 to-amber-50 dark:from-primary/10 dark:to-amber-950/40 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Drill this concept
            </h2>
            <p className="text-sm text-muted-foreground">
              5 questions from ECO {concept.id}. Pick an answer, see the
              explanation, internalize, move on. No timer.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Earn 10–30 XP per correct answer. Reach <strong>MASTERED</strong>{" "}
              at 80% accuracy across 5+ attempts.
            </p>
          </div>
          <StartLearnButton ecoPrefix={concept.id} count={5} />
        </div>
      </section>

      {/* Reference */}
      <section className="rounded-lg border bg-muted/30 p-4 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          <span className="text-xs uppercase tracking-wide">Reference</span>
        </div>
        <p className="mt-1">{concept.reference}</p>
      </section>

      {/* Prev / next */}
      <nav className="flex items-center justify-between gap-3 border-t pt-4 text-sm">
        {prev ? (
          <Link
            href={`/learn/${prev.id}`}
            className="inline-flex items-center gap-1 text-muted-foreground hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            {prev.id} {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/learn/${next.id}`}
            className="inline-flex items-center gap-1 text-muted-foreground hover:underline"
          >
            {next.id} {next.title}
            <ArrowLeft className="h-4 w-4 rotate-180" />
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
