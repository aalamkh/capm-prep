"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { EcoBucketStat } from "@/lib/stats";
import { DOMAIN_LABELS, ALL_DOMAINS, type Domain } from "@/lib/questions";

interface Props {
  buckets: EcoBucketStat[];
}

function colorFor(b: EcoBucketStat): string {
  if (b.total === 0) return "bg-muted text-muted-foreground border-border";
  if (b.pct >= 0.75)
    return "bg-green-100 hover:bg-green-200 border-green-300 text-green-900";
  if (b.pct >= 0.6)
    return "bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900";
  return "bg-red-100 hover:bg-red-200 border-red-300 text-red-900";
}

export function EcoHeatmap({ buckets }: Props) {
  const [drilling, setDrilling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const drill = async (bucket: string) => {
    setDrilling(bucket);
    setError(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "ECO_DRILL", ecoPrefix: bucket }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const { sessionId } = (await res.json()) as { sessionId: string };
      router.push(`/exam/${sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setDrilling(null);
    }
  };

  const byDomain: Record<Domain, EcoBucketStat[]> = {
    FUNDAMENTALS: [],
    PREDICTIVE: [],
    AGILE: [],
    BUSINESS_ANALYSIS: [],
  };
  for (const b of buckets) {
    if (b.domain) byDomain[b.domain].push(b);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>Click a cell to drill that ECO task.</span>
        <span className="ml-auto flex items-center gap-2">
          <Legend color="bg-red-100 border-red-300" label="< 60%" />
          <Legend color="bg-amber-100 border-amber-300" label="60-75%" />
          <Legend color="bg-green-100 border-green-300" label="≥ 75%" />
          <Legend color="bg-muted border-border" label="no data" />
        </span>
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {ALL_DOMAINS.map((d) => (
          <div key={d}>
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {DOMAIN_LABELS[d]}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {byDomain[d].map((b) => {
                const isLoading = drilling === b.bucket;
                return (
                  <button
                    key={b.bucket}
                    type="button"
                    onClick={() => drill(b.bucket)}
                    disabled={drilling !== null || b.total === 0}
                    title={
                      b.total === 0
                        ? `${b.label} — no answers yet`
                        : `${b.label} — ${b.correct}/${b.total} (${Math.round(b.pct * 100)}%)`
                    }
                    className={cn(
                      "group rounded-md border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-70",
                      colorFor(b)
                    )}
                  >
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="text-xs font-mono font-bold">
                        {b.bucket}
                      </span>
                      <span className="text-xs tabular-nums">
                        {b.total === 0
                          ? "—"
                          : `${Math.round(b.pct * 100)}%`}
                      </span>
                    </div>
                    <div className="text-xs leading-tight">
                      {isLoading ? "Starting…" : b.label}
                    </div>
                    <div className="mt-1 text-[10px] tabular-nums opacity-70">
                      {b.total === 0 ? "no data" : `${b.correct}/${b.total}`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className={cn("inline-block h-3 w-3 rounded-sm border", color)}
        aria-hidden
      />
      {label}
    </span>
  );
}
