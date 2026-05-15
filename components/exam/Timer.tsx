"use client";

import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface Props {
  remainingSeconds: number;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function Timer({ remainingSeconds }: Props) {
  const h = Math.floor(remainingSeconds / 3600);
  const m = Math.floor((remainingSeconds % 3600) / 60);
  const s = remainingSeconds % 60;
  const display = `${pad(h)}:${pad(m)}:${pad(s)}`;

  const totalMin = Math.floor(remainingSeconds / 60);
  const tone =
    totalMin <= 5
      ? "text-red-600"
      : totalMin <= 15
        ? "text-orange-600"
        : totalMin <= 30
          ? "text-amber-600"
          : "text-foreground";

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border bg-card px-3 py-2 font-mono text-sm tabular-nums",
        tone
      )}
      aria-label="Time remaining"
    >
      <Clock className="h-4 w-4" />
      {display}
    </div>
  );
}
