"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ALL_DOMAINS, DOMAIN_LABELS, type Domain } from "@/lib/questions";
import { cn } from "@/lib/utils";

type Mode = "PRACTICE" | "MOCK" | "DOMAIN";

export default function PracticeNewPage() {
  const [mode, setMode] = useState<Mode>("PRACTICE");
  const [domain, setDomain] = useState<Domain>("FUNDAMENTALS");
  const [count, setCount] = useState<10 | 20 | "all">(20);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const submit = async () => {
    setError(null);
    const body =
      mode === "DOMAIN"
        ? { mode, domain, count }
        : { mode };
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const { sessionId } = (await res.json()) as { sessionId: string };
      startTransition(() => router.push(`/exam/${sessionId}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Start a session</h1>
        <p className="text-muted-foreground">
          Choose a mode. You can switch modes any time.
        </p>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Mode</legend>
        <ModeCard
          selected={mode === "PRACTICE"}
          onClick={() => setMode("PRACTICE")}
          title="Practice (15 questions, untimed)"
          description="Mixed-domain warm-up, weighted to match the real ECO split."
        />
        <ModeCard
          selected={mode === "MOCK"}
          onClick={() => setMode("MOCK")}
          title="Mock Exam (150 questions, 3 hours)"
          description="Full-length timed exam at real-CAPM cadence and length."
        />
        <ModeCard
          selected={mode === "DOMAIN"}
          onClick={() => setMode("DOMAIN")}
          title="Domain drill"
          description="Focus on one domain. Pick the size below."
        />
      </fieldset>

      {mode === "DOMAIN" && (
        <div className="space-y-4 rounded-lg border bg-card p-4">
          <div>
            <label className="mb-2 block text-sm font-semibold">Domain</label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_DOMAINS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDomain(d)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm transition-colors",
                    domain === d
                      ? "border-primary bg-accent"
                      : "border-input hover:bg-accent/50"
                  )}
                >
                  {DOMAIN_LABELS[d]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold">Count</label>
            <div className="flex gap-2">
              {([10, 20, "all"] as const).map((c) => (
                <button
                  key={String(c)}
                  type="button"
                  onClick={() => setCount(c)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm transition-colors",
                    count === c
                      ? "border-primary bg-accent"
                      : "border-input hover:bg-accent/50"
                  )}
                >
                  {c === "all" ? "All" : c}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button size="lg" onClick={submit} disabled={isPending}>
        {isPending ? "Starting…" : "Start session"}
      </Button>
    </div>
  );
}

function ModeCard({
  selected,
  onClick,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "block w-full rounded-lg border p-4 text-left transition-colors",
        selected
          ? "border-primary bg-accent"
          : "border-input bg-card hover:bg-accent/50"
      )}
    >
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-muted-foreground">{description}</div>
    </button>
  );
}
