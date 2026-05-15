"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ExamRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("/exam route error boundary:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
      <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
      <h1 className="text-2xl font-bold tracking-tight">
        Couldn&apos;t load this exam page
      </h1>
      <p className="text-sm text-muted-foreground">
        Your saved progress is intact. Retry, or jump back to your Today list.
      </p>
      {error.digest && (
        <p className="font-mono text-[10px] text-muted-foreground">
          digest {error.digest}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={reset}>
          <RotateCw className="mr-2 h-4 w-4" /> Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/today">
            <Home className="mr-2 h-4 w-4" /> Back to Today
          </Link>
        </Button>
      </div>
    </div>
  );
}
