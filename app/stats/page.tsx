import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  Flame,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DomainBarChart } from "@/components/stats/DomainBarChart";
import { DifficultyBarChart } from "@/components/stats/DifficultyBarChart";
import { EcoHeatmap } from "@/components/stats/EcoHeatmap";
import {
  getStats,
  PASS_THRESHOLD,
  MOCK_TARGET_SECONDS_PER_QUESTION,
  ECO_DOMAIN_WEIGHTS,
} from "@/lib/stats";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const s = await getStats();

  if (!s.hasAnyData) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Stats</h1>
        <p className="text-muted-foreground">
          You haven&apos;t answered any questions yet. Start a session and your
          accuracy, weak areas, and pace will land here.
        </p>
        <Button asChild size="lg">
          <Link href="/practice/new">Start a session</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stats</h1>
          <p className="text-sm text-muted-foreground">
            Performance across {s.recentSessions.length}{" "}
            completed session{s.recentSessions.length === 1 ? "" : "s"}.
          </p>
        </div>
        <Button asChild>
          <Link href="/practice/new">Start a session</Link>
        </Button>
      </div>

      {/* Section 1 + 2 + 7 — top row of summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <ReadinessCard
          pct={s.recentSessionsAvgPct}
          count={s.recentSessionsCount}
        />
        <ProjectionCard pct={s.ecoWeightedProjection} />
        <PaceCard avgSeconds={s.avgSecondsPerQuestionMock} />
      </div>

      {/* Section 2 chart — Domain mastery */}
      <section className="rounded-lg border bg-card p-6">
        <SectionHeader
          icon={<BarChart3 className="h-5 w-5" />}
          title="Domain mastery"
          subtitle={`Accuracy across all answers by ECO domain. Pass mark ≥ ${Math.round(
            PASS_THRESHOLD * 100
          )}%.`}
        />
        <div className="mt-4">
          <DomainBarChart data={s.domainAccuracy} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
          {s.domainAccuracy.map((d) => (
            <div key={d.domain}>
              <span className="font-medium text-foreground">{d.label}</span>:{" "}
              {d.total === 0 ? "no data" : `${d.correct}/${d.total}`}{" "}
              <span className="opacity-70">
                (ECO weight {Math.round(ECO_DOMAIN_WEIGHTS[d.domain] * 100)}%)
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3 — Difficulty */}
      <section className="rounded-lg border bg-card p-6">
        <SectionHeader
          icon={<Flame className="h-5 w-5" />}
          title="Difficulty breakdown"
          subtitle="The real exam leans hard. If your HARD accuracy is below 50%, that's the lever."
        />
        <div className="mt-4 grid items-start gap-6 md:grid-cols-[minmax(0,1fr),260px]">
          <DifficultyBarChart data={s.difficultyAccuracy} />
          <div className="space-y-2 text-sm">
            {s.difficultyAccuracy.map((d) => (
              <div key={d.difficulty} className="flex justify-between border-b pb-1">
                <span className="font-medium">{d.difficulty}</span>
                <span className="tabular-nums text-muted-foreground">
                  {d.total === 0
                    ? "—"
                    : `${d.correct}/${d.total} · ${Math.round(d.pct * 100)}%`}
                </span>
              </div>
            ))}
            {s.hardBelow50 && (
              <div className="mt-2 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  HARD accuracy is below 50%. Drill HARD-tagged questions in
                  the weakest ECO buckets below.
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Section 4 — Type */}
      <section className="rounded-lg border bg-card p-6">
        <SectionHeader
          icon={<Target className="h-5 w-5" />}
          title="Question-type performance"
          subtitle="MULTI and MATCHING typically drag scores. Worth tracking separately."
        />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Answered</th>
                <th className="py-2 pr-4">Correct</th>
                <th className="py-2 pr-4">Accuracy</th>
                <th className="py-2 pr-4">vs pass</th>
              </tr>
            </thead>
            <tbody>
              {s.typeAccuracy.map((t) => {
                const passing = t.pct >= PASS_THRESHOLD;
                return (
                  <tr key={t.type} className="border-b last:border-b-0">
                    <td className="py-2 pr-4 font-medium">
                      {t.type.replace("_", " ")}
                    </td>
                    <td className="py-2 pr-4 tabular-nums">{t.total}</td>
                    <td className="py-2 pr-4 tabular-nums">{t.correct}</td>
                    <td className="py-2 pr-4 tabular-nums">
                      {t.total === 0 ? "—" : `${Math.round(t.pct * 100)}%`}
                    </td>
                    <td className="py-2 pr-4">
                      {t.total === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : passing ? (
                        <span className="inline-flex items-center gap-1 text-green-700">
                          <CheckCircle2 className="h-3.5 w-3.5" /> on track
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700">
                          <AlertTriangle className="h-3.5 w-3.5" /> below
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 5 — Heatmap */}
      <section className="rounded-lg border bg-card p-6">
        <SectionHeader
          icon={<BarChart3 className="h-5 w-5" />}
          title="Weakness heatmap"
          subtitle="Accuracy per ECO task. Click any cell with data to drill that bucket."
        />
        <div className="mt-4">
          <EcoHeatmap buckets={s.ecoBuckets} />
        </div>
      </section>

      {/* Section 6 — Recent sessions */}
      <section className="rounded-lg border bg-card p-6">
        <SectionHeader
          icon={<Clock className="h-5 w-5" />}
          title="Recent sessions"
          subtitle="Up to 10 most recent completed sessions."
        />
        <div className="mt-4 overflow-x-auto">
          {s.recentSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No completed sessions yet.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Mode</th>
                  <th className="py-2 pr-4">Score</th>
                  <th className="py-2 pr-4">%</th>
                  <th className="py-2 pr-4">Time</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {s.recentSessions.map((r) => {
                  const passing = r.pct >= PASS_THRESHOLD;
                  return (
                    <tr key={r.id} className="border-b last:border-b-0">
                      <td className="py-2 pr-4 tabular-nums">
                        {(r.completedAt ?? r.startedAt).toLocaleString()}
                      </td>
                      <td className="py-2 pr-4">{r.mode}</td>
                      <td className="py-2 pr-4 tabular-nums">
                        {r.score}/{r.totalQuestions}
                      </td>
                      <td
                        className={cn(
                          "py-2 pr-4 tabular-nums font-medium",
                          passing ? "text-green-700" : "text-red-700"
                        )}
                      >
                        {Math.round(r.pct * 100)}%
                      </td>
                      <td className="py-2 pr-4 tabular-nums">
                        {formatHMS(r.timeSpentSeconds)}
                      </td>
                      <td className="py-2 pr-4">
                        <Link
                          href={`/exam/${r.id}/results`}
                          className="text-sm text-primary hover:underline"
                        >
                          Review →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        {icon}
        {title}
      </h2>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function ReadinessCard({
  pct,
  count,
}: {
  pct: number | null;
  count: number;
}) {
  const passing = (pct ?? 0) >= PASS_THRESHOLD;
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        Overall readiness
      </div>
      {pct === null ? (
        <>
          <div className="mt-1 text-3xl font-bold text-muted-foreground">—</div>
          <div className="text-xs text-muted-foreground">
            No completed sessions yet
          </div>
        </>
      ) : (
        <>
          <div
            className={cn(
              "mt-1 text-4xl font-bold tabular-nums",
              passing ? "text-green-700" : "text-red-700"
            )}
          >
            {Math.round(pct * 100)}%
          </div>
          <div className="text-xs text-muted-foreground">
            avg of last {count} session{count === 1 ? "" : "s"} · pass ≥{" "}
            {Math.round(PASS_THRESHOLD * 100)}%
          </div>
        </>
      )}
    </div>
  );
}

function ProjectionCard({ pct }: { pct: number | null }) {
  const passing = (pct ?? 0) >= PASS_THRESHOLD;
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        If exam were today
      </div>
      {pct === null ? (
        <>
          <div className="mt-1 text-3xl font-bold text-muted-foreground">—</div>
          <div className="text-xs text-muted-foreground">
            Need answers across all four ECO domains
          </div>
        </>
      ) : (
        <>
          <div
            className={cn(
              "mt-1 text-4xl font-bold tabular-nums",
              passing ? "text-green-700" : "text-amber-700"
            )}
          >
            ~{Math.round(pct * 100)}%
          </div>
          <div className="text-xs text-muted-foreground">
            ECO-weighted projection (36/17/20/27)
          </div>
        </>
      )}
    </div>
  );
}

function PaceCard({ avgSeconds }: { avgSeconds: number | null }) {
  const ahead =
    avgSeconds === null ? null : avgSeconds <= MOCK_TARGET_SECONDS_PER_QUESTION;
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        Mock pace
      </div>
      {avgSeconds === null ? (
        <>
          <div className="mt-1 text-3xl font-bold text-muted-foreground">—</div>
          <div className="text-xs text-muted-foreground">
            Take a MOCK to get a pace reading
          </div>
        </>
      ) : (
        <>
          <div
            className={cn(
              "mt-1 text-4xl font-bold tabular-nums",
              ahead ? "text-green-700" : "text-amber-700"
            )}
          >
            {Math.round(avgSeconds)}s
            <span className="ml-2 text-base font-normal text-muted-foreground">
              / q
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            Target {MOCK_TARGET_SECONDS_PER_QUESTION}s/q (3hr ÷ 150q) ·{" "}
            {ahead ? "on pace" : "running long"}
          </div>
        </>
      )}
    </div>
  );
}

function formatHMS(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
