"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, ArrowRight } from "lucide-react";

interface Props {
  ecoPrefix: string;
  count?: number;
  label?: string;
}

export function StartLearnButton({
  ecoPrefix,
  count = 5,
  label = "Start drill",
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "LEARN", ecoPrefix, count }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const { sessionId } = (await res.json()) as { sessionId: string };
      router.push(`/exam/${sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  };

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={start}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {busy ? (
          <>Starting…</>
        ) : (
          <>
            <Play className="h-4 w-4" />
            {label} <span className="opacity-70">· {count} questions</span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
      {error && <div className="text-xs text-destructive">{error}</div>}
    </div>
  );
}
