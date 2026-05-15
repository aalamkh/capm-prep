"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ListPlus } from "lucide-react";

interface Props {
  ecoPrefix: string;
  ecoLabel: string;
}

export function DrillSimilarButton({ ecoPrefix, ecoLabel }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const drill = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "ECO_DRILL", ecoPrefix }),
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
        onClick={drill}
        disabled={busy}
        title={`Start a drill on ECO ${ecoPrefix}: ${ecoLabel}`}
        className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm transition-colors hover:bg-accent disabled:opacity-60"
      >
        <ListPlus className="h-4 w-4" />
        {busy ? "Starting…" : `Drill similar (ECO ${ecoPrefix})`}
      </button>
      {error && <div className="text-xs text-destructive">{error}</div>}
    </div>
  );
}
