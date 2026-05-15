"use client";

import { Coffee } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  remainingSeconds: number;
  onResume: () => void;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function BreakOverlay({ remainingSeconds, onResume }: Props) {
  const m = Math.floor(remainingSeconds / 60);
  const s = remainingSeconds % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur">
      <div className="w-full max-w-md space-y-4 rounded-lg border bg-card p-8 text-center shadow-lg">
        <Coffee className="mx-auto h-10 w-10 text-amber-500" />
        <h2 className="text-2xl font-bold">Break in progress</h2>
        <p className="text-sm text-muted-foreground">
          The exam timer is paused. Stretch, drink water, look at something
          that isn&apos;t a screen.
        </p>
        <div
          className={cn(
            "mx-auto rounded-md border bg-muted/40 px-4 py-3 font-mono text-3xl tabular-nums",
            remainingSeconds <= 60 && "text-red-600"
          )}
        >
          {pad(m)}:{pad(s)}
        </div>
        <p className="text-xs text-muted-foreground">
          Auto-resumes when time expires.
        </p>
        <button
          type="button"
          onClick={onResume}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Resume now
        </button>
      </div>
    </div>
  );
}
