"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  mode: "REVIEW" | "NEW";
  count: number;
  label: string;
  emptyLabel: string;
  variant?: "primary" | "secondary";
}

export function StartTodaySession({
  mode,
  count,
  label,
  emptyLabel,
  variant = "primary",
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
        body: JSON.stringify({ mode }),
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
        disabled={busy || count === 0}
        className={cn(
          "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
          variant === "primary"
            ? "bg-primary text-primary-foreground hover:opacity-90"
            : "border border-input bg-background hover:bg-accent"
        )}
      >
        <Play className="h-4 w-4" />
        {busy ? "Starting…" : count === 0 ? emptyLabel : label}
      </button>
      {error && <div className="text-xs text-destructive">{error}</div>}
    </div>
  );
}
