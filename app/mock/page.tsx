"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Timer as TimerIcon,
  Coffee,
  ChevronRight,
  ChevronLeft,
  Highlighter,
  Strikethrough,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Step = "overview" | "types" | "tools" | "agreement";

export default function MockPage() {
  const [step, setStep] = useState<Step>("overview");
  const [agreed, setAgreed] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const start = async () => {
    setError(null);
    setStarting(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "MOCK" }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const { sessionId } = (await res.json()) as { sessionId: string };
      router.push(`/exam/${sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStarting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mock Exam</h1>
          <p className="text-sm text-muted-foreground">
            150 questions · 3-hour timer · two optional 10-minute breaks. Built
            to feel like the Pearson VUE CAPM interface.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/mock/history">
            <History className="mr-2 h-4 w-4" /> History
          </Link>
        </Button>
      </div>

      {/* Stepper */}
      <ol className="flex items-center justify-between gap-2 rounded-md border bg-card p-3 text-xs">
        <StepDot label="Overview" active={step === "overview"} done={["types", "tools", "agreement"].includes(step)} />
        <Sep />
        <StepDot label="Question types" active={step === "types"} done={["tools", "agreement"].includes(step)} />
        <Sep />
        <StepDot label="On-screen tools" active={step === "tools"} done={step === "agreement"} />
        <Sep />
        <StepDot label="Confirm" active={step === "agreement"} done={false} />
      </ol>

      <div className="rounded-lg border bg-card p-6">
        {step === "overview" && (
          <section className="space-y-4 text-sm">
            <h2 className="text-lg font-semibold">Real-exam conditions</h2>
            <FactRow icon={<TimerIcon className="h-5 w-5 text-amber-600" />}>
              <strong>3:00:00 timer.</strong> Warnings at 30, 15, and 5 minutes
              remaining. Auto-submits at zero.
            </FactRow>
            <FactRow icon={<Coffee className="h-5 w-5 text-amber-600" />}>
              <strong>Two optional 10-minute breaks</strong> — available after
              question 50 and after question 100. The exam timer pauses while
              you&apos;re away.
            </FactRow>
            <FactRow icon={<ChevronRight className="h-5 w-5 text-amber-600" />}>
              <strong>One question per screen.</strong> A palette in the
              sidebar lets you jump around, mark questions for review, and see
              what&apos;s answered.
            </FactRow>
            <FactRow icon={<History className="h-5 w-5 text-amber-600" />}>
              <strong>Realistic question selection</strong> — weighted by ECO
              domain (36/17/20/27) and difficulty (30/50/20). Recently-seen
              questions are de-prioritized across mocks.
            </FactRow>
          </section>
        )}

        {step === "types" && (
          <section className="space-y-4 text-sm">
            <h2 className="text-lg font-semibold">Question types you&apos;ll see</h2>
            <p className="text-muted-foreground">
              CAPM mixes five formats. Read the prompt carefully — type tags
              are visible at the top of each question.
            </p>
            <Type
              tag="SINGLE"
              what="Pick one of four options."
              tip="The most common format. Distractors look plausible — eliminate the obviously-wrong ones first."
            />
            <Type
              tag="MULTI (Select N)"
              what="Choose exactly N from five options."
              tip="The prompt always tells you how many to select. Half-credit isn't given — match the full set."
            />
            <Type
              tag="MATCHING"
              what="Pair each item on the left with the right answer on the right."
              tip="Use the dropdown next to each row. All rows must be assigned to score."
            />
            <Type
              tag="HOTSPOT"
              what="Click the region of an image that answers the question."
              tip="Read the question first, then look at the image. Hover the regions to see labels."
            />
            <Type
              tag="FILL_BLANK"
              what="Type the missing term."
              tip="Spelling and capitalization are forgiving. Common synonyms are usually accepted."
            />
          </section>
        )}

        {step === "tools" && (
          <section className="space-y-4 text-sm">
            <h2 className="text-lg font-semibold">On-screen tools</h2>
            <FactRow icon={<Highlighter className="h-5 w-5 text-yellow-600" />}>
              <strong>Highlighter.</strong> Toggle on, drag-select any portion
              of the question text, and it stays highlighted while you read
              the options. Click <em>Clear highlights</em> to reset.
            </FactRow>
            <FactRow icon={<Strikethrough className="h-5 w-5 text-amber-600" />}>
              <strong>Eliminate distractors.</strong> Each option (SINGLE and
              MULTI) has a small strikethrough button. Cross out options
              you&apos;ve ruled out — visual only, doesn&apos;t score them.
            </FactRow>
            <FactRow icon={<ChevronLeft className="h-5 w-5 text-muted-foreground" />}>
              <strong>Flag for review.</strong> The flag button leaves a
              marker in the palette so you can revisit before submitting.
              Flagging never affects scoring.
            </FactRow>
            <FactRow icon={<Coffee className="h-5 w-5 text-amber-600" />}>
              <strong>Break.</strong> When a break is available, a banner
              appears above the question and a button shows in the sidebar.
              Click it to pause the timer for 10 minutes (or click Resume to
              come back early).
            </FactRow>
          </section>
        )}

        {step === "agreement" && (
          <section className="space-y-4 text-sm">
            <h2 className="text-lg font-semibold">Before you start</h2>
            <p className="text-muted-foreground">
              Once the timer starts, leaving the tab does <strong>not</strong>{" "}
              pause it. Use the in-app break instead. Your answers auto-save
              as you go — refreshing won&apos;t lose progress.
            </p>
            <label className="flex items-start gap-3 rounded-md border bg-muted/30 p-3">
              <input
                type="checkbox"
                className="mt-1"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span>
                I&apos;ve read the tutorial above and I&apos;m ready to start
                a 3-hour timed mock exam under realistic conditions.
              </span>
            </label>
            {error && (
              <div className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}
          </section>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(prevStep(step))}
          disabled={step === "overview"}
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Back
        </Button>

        {step === "agreement" ? (
          <Button onClick={start} disabled={!agreed || starting} size="lg">
            {starting ? "Starting…" : "Start mock exam"}
          </Button>
        ) : (
          <Button onClick={() => setStep(nextStep(step))}>
            Next <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function StepDot({
  label,
  active,
  done,
}: {
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <span
      className={cn(
        "flex flex-1 items-center gap-2 rounded-md px-2 py-1.5",
        active && "bg-primary text-primary-foreground",
        done && !active && "text-muted-foreground"
      )}
    >
      <span
        className={cn(
          "inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px]",
          active
            ? "border-primary-foreground bg-primary-foreground/20 text-primary-foreground"
            : done
              ? "border-green-300 bg-green-50 text-green-800"
              : "border-input bg-background"
        )}
      >
        {done ? "✓" : ""}
      </span>
      <span className="truncate">{label}</span>
    </span>
  );
}

function Sep() {
  return <span className="text-muted-foreground">›</span>;
}

function FactRow({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border bg-muted/20 p-3">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function Type({
  tag,
  what,
  tip,
}: {
  tag: string;
  what: string;
  tip: string;
}) {
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="mb-1 inline-flex rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-xs font-semibold text-blue-800">
        {tag}
      </div>
      <div className="text-sm">{what}</div>
      <div className="text-xs text-muted-foreground">{tip}</div>
    </div>
  );
}

function nextStep(s: Step): Step {
  return s === "overview"
    ? "types"
    : s === "types"
      ? "tools"
      : s === "tools"
        ? "agreement"
        : "agreement";
}
function prevStep(s: Step): Step {
  return s === "agreement"
    ? "tools"
    : s === "tools"
      ? "types"
      : s === "types"
        ? "overview"
        : "overview";
}
