"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";

interface Props {
  count: number;
}

export function DrillBookmarksButton({ count }: Props) {
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
        body: JSON.stringify({ mode: "BOOKMARK_DRILL" }),
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
        disabled={busy || count === 0}
        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Play className="h-4 w-4" />
        {busy
          ? "Starting…"
          : count === 0
            ? "No bookmarks yet"
            : `Drill my bookmarks (${count})`}
      </button>
      {error && <div className="text-xs text-destructive">{error}</div>}
    </div>
  );
}
