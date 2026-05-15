"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Flag,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Coffee,
  LayoutGrid,
  X,
  Keyboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ParsedQuestion } from "@/lib/questions";
import type { Mode } from "@/lib/exam";
import { isRevealMode } from "@/lib/exam";
import { useExamSession } from "@/lib/useExamSession";
import { useExamKeyboard } from "@/lib/useExamKeyboard";
import { hasAnswer, isCorrect } from "@/lib/scoring";
import { QuestionRenderer } from "./QuestionRenderer";
import { QuestionPalette } from "./QuestionPalette";
import { Timer } from "./Timer";
import { HighlightableText } from "./HighlightableText";
import { BreakOverlay } from "./BreakOverlay";
import { DOMAIN_LABELS } from "@/lib/questions";

interface Props {
  sessionId: string;
  mode: Mode;
  questions: ParsedQuestion[];
  initialAnswers: Array<{
    questionId: string;
    userAnswer: import("@/lib/questions").UserAnswer;
    flagged: boolean;
  }>;
  startedAtMs: number;
  durationSeconds: number | null;
  initialBreakSecondsTaken?: number;
  initialBreakStartedAtMs?: number | null;
  initialBreaksTaken?: number;
}

const MOCK_BREAK_INDEX_FIRST = 50;
const MOCK_BREAK_INDEX_SECOND = 100;

export function ExamRunner(props: Props) {
  const session = useExamSession(props);
  const reveal = isRevealMode(props.mode);
  const isMock = props.mode === "MOCK";

  // Per-question elimination state (visual only, ephemeral).
  const [eliminations, setEliminations] = useState<Map<string, Set<number>>>(
    () => new Map()
  );
  const toggleEliminate = useCallback(
    (questionId: string, index: number) => {
      setEliminations((prev) => {
        const next = new Map(prev);
        const cur = new Set(next.get(questionId) ?? []);
        if (cur.has(index)) cur.delete(index);
        else cur.add(index);
        next.set(questionId, cur);
        return next;
      });
    },
    []
  );

  // Mobile palette drawer.
  const [paletteOpen, setPaletteOpen] = useState(false);
  // Lightweight keyboard-shortcut help popover.
  const [helpOpen, setHelpOpen] = useState(false);

  // Block accidental tab close once the user has answered something.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (session.answeredCount > 0 && !session.submitting) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [session.answeredCount, session.submitting]);

  const q = session.currentQuestion;
  const isLast = session.currentIndex === session.questions.length - 1;

  // Reveal-mode UX
  const revealed = reveal && session.isRevealed(q.id);
  const answered = hasAnswer(q, session.currentAnswer.userAnswer);
  const correct = revealed
    ? isCorrect(q, session.currentAnswer.userAnswer)
    : false;
  const lockRenderer = reveal && revealed;
  const showRevealCTA = reveal && !revealed;
  const advanceDisabled = reveal && !revealed;

  // Keyboard shortcuts — disabled during a break or when the help popover is
  // open (Esc closes it without binding a global handler).
  useExamKeyboard({
    question: q,
    value: session.currentAnswer.userAnswer,
    setAnswer: session.setAnswer,
    toggleFlag: session.toggleFlag,
    goNext: session.goNext,
    goPrev: session.goPrev,
    isLast,
    onAdvance: () => {
      if (advanceDisabled) return;
      if (isLast) void session.submit();
      else session.goNext();
    },
    disabled: session.onBreak || helpOpen || paletteOpen,
  });

  // MOCK breaks
  const breakAtQ50 =
    isMock &&
    session.currentIndex >= MOCK_BREAK_INDEX_FIRST &&
    session.breaksTaken === 0;
  const breakAtQ100 =
    isMock &&
    session.currentIndex >= MOCK_BREAK_INDEX_SECOND &&
    session.breaksTaken === 1;
  const showBreakBanner = !session.onBreak && (breakAtQ50 || breakAtQ100);
  const breakLabel = breakAtQ100
    ? "Q100 break"
    : breakAtQ50
      ? "Q50 break"
      : "Break";

  return (
    <>
      {session.onBreak && (
        <BreakOverlay
          remainingSeconds={session.breakSecondsRemaining}
          onResume={session.endBreak}
        />
      )}

      {/* Sticky top status bar — most prominent on mobile, also useful on desktop */}
      <div className="sticky top-16 z-30 -mx-4 mb-4 border-y bg-background/95 px-4 py-2 backdrop-blur md:static md:mx-0 md:mb-0 md:border-0 md:p-0 md:bg-transparent">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {session.currentIndex + 1}
            </span>
            <span>/</span>
            <span>{session.questions.length}</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden rounded-md border bg-muted px-2 py-0.5 sm:inline">
              {DOMAIN_LABELS[q.domain]}
            </span>
            <span className="rounded-md border bg-muted px-1.5 py-0.5">
              {q.difficulty}
            </span>
            <span className="rounded-md border bg-muted px-1.5 py-0.5">
              {q.type.replace("_", " ")}
            </span>
            {reveal && (
              <span className="rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-blue-800 dark:border-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                Study
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {session.remainingSeconds !== null && (
              <Timer remainingSeconds={session.remainingSeconds} />
            )}
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="hidden h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:bg-accent md:inline-flex"
              title="Keyboard shortcuts"
              aria-label="Keyboard shortcuts"
            >
              <Keyboard className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground hover:bg-accent lg:hidden"
              aria-label="Open question palette"
            >
              <LayoutGrid className="h-4 w-4" />
              Palette
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),300px]">
        <div className="space-y-4">
          {session.warning && (
            <div className="flex items-center justify-between rounded-md border border-amber-500 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-200">
              <span>⏰ {session.warning}</span>
              <button
                onClick={session.dismissWarning}
                className="text-xs underline"
              >
                dismiss
              </button>
            </div>
          )}

          {showBreakBanner && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-200">
              <span className="inline-flex items-center gap-2">
                <Coffee className="h-4 w-4" />
                Optional 10-minute break available — timer pauses while
                you&apos;re away.
              </span>
              <button
                onClick={session.startBreak}
                className="rounded-md border border-amber-400 bg-amber-100 px-3 py-1 text-xs font-medium hover:bg-amber-200 dark:bg-amber-900/40"
              >
                Take {breakLabel}
              </button>
            </div>
          )}

          <div className="space-y-4 rounded-lg border bg-card p-4 sm:p-6">
            <HighlightableText text={q.questionText} />
            <QuestionRenderer
              question={q}
              value={session.currentAnswer.userAnswer}
              onChange={(v) => session.setAnswer(q.id, v)}
              reviewMode={lockRenderer}
              disabled={lockRenderer}
              eliminations={eliminations.get(q.id)}
              onToggleEliminate={
                lockRenderer ? undefined : (i) => toggleEliminate(q.id, i)
              }
            />
          </div>

          {revealed && (
            <div
              className={cn(
                "rounded-lg border p-4 text-sm",
                correct
                  ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/40"
                  : "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40"
              )}
            >
              <div className="mb-1 flex items-center gap-2 font-semibold">
                {correct ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-700 dark:text-green-400" />
                    <span className="text-green-800 dark:text-green-200">
                      Correct
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-700 dark:text-red-400" />
                    <span className="text-red-800 dark:text-red-200">
                      Not quite
                    </span>
                  </>
                )}
              </div>
              <p className="whitespace-pre-line">{q.explanation}</p>
              {q.reference && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Reference: {q.reference}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              variant="outline"
              onClick={session.goPrev}
              disabled={session.currentIndex === 0}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Previous
            </Button>

            <Button
              variant={session.currentAnswer.flagged ? "default" : "outline"}
              onClick={() => session.toggleFlag(q.id)}
              className={cn(
                session.currentAnswer.flagged &&
                  "bg-amber-500 hover:bg-amber-500/90"
              )}
            >
              <Flag className="mr-1 h-4 w-4" />
              {session.currentAnswer.flagged ? "Flagged" : "Flag"}
            </Button>

            {showRevealCTA && (
              <Button
                variant="secondary"
                disabled={!answered}
                onClick={() => session.revealCurrent(q.id)}
                title={
                  answered ? "See the explanation" : "Pick an answer first"
                }
              >
                Show answer
              </Button>
            )}

            {isLast ? (
              <Button
                onClick={session.submit}
                disabled={session.submitting || advanceDisabled}
                title={
                  advanceDisabled
                    ? "Reveal the answer before finishing"
                    : undefined
                }
              >
                {session.submitting
                  ? "Submitting…"
                  : isMock
                    ? "Submit Exam"
                    : "Finish"}
              </Button>
            ) : (
              <Button
                onClick={session.goNext}
                disabled={advanceDisabled}
                title={
                  advanceDisabled
                    ? "Reveal the answer before moving on"
                    : undefined
                }
              >
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Desktop palette */}
        <div className="hidden space-y-3 lg:block">
          <QuestionPalette
            questions={session.questions}
            answers={session.answers}
            currentIndex={session.currentIndex}
            onJump={(i) => {
              session.jumpTo(i);
            }}
            onSubmit={session.submit}
            submitting={session.submitting}
            answeredCount={session.answeredCount}
            flaggedCount={session.flaggedCount}
          />
          {isMock && (
            <div className="rounded-lg border bg-card p-3 text-xs text-muted-foreground">
              <div className="font-semibold uppercase tracking-wide">Breaks</div>
              <div className="mt-1">
                {session.breaksTaken} / 2 taken
                {session.breakAvailable && (
                  <button
                    type="button"
                    onClick={session.startBreak}
                    className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-2 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-200"
                    disabled={!showBreakBanner}
                    title={
                      showBreakBanner
                        ? "Start your 10-minute break"
                        : "Available at Q51 (and Q101)"
                    }
                  >
                    <Coffee className="h-3.5 w-3.5" /> Take break
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile palette drawer */}
      {paletteOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close palette"
            onClick={() => setPaletteOpen(false)}
            className="absolute inset-0 bg-background/70 backdrop-blur"
          />
          <aside className="absolute right-0 top-0 flex h-full w-[85%] max-w-sm flex-col gap-3 overflow-y-auto border-l bg-background p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Question palette</h2>
              <button
                type="button"
                onClick={() => setPaletteOpen(false)}
                className="rounded-md border border-input bg-background p-1.5 text-muted-foreground hover:bg-accent"
                aria-label="Close palette"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <QuestionPalette
              questions={session.questions}
              answers={session.answers}
              currentIndex={session.currentIndex}
              onJump={(i) => {
                session.jumpTo(i);
                setPaletteOpen(false);
              }}
              onSubmit={session.submit}
              submitting={session.submitting}
              answeredCount={session.answeredCount}
              flaggedCount={session.flaggedCount}
            />
            {isMock && session.breakAvailable && showBreakBanner && (
              <button
                type="button"
                onClick={() => {
                  setPaletteOpen(false);
                  session.startBreak();
                }}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-200"
              >
                <Coffee className="h-4 w-4" /> Take {breakLabel}
              </button>
            )}
          </aside>
        </div>
      )}

      {/* Keyboard help popover */}
      {helpOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur"
          onClick={() => setHelpOpen(false)}
        >
          <div
            className="w-full max-w-md space-y-3 rounded-lg border bg-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Keyboard shortcuts</h2>
            <ul className="space-y-2 text-sm">
              <ShortcutRow keys={["1", "—", "5"]} desc="Pick / toggle option" />
              <ShortcutRow keys={["F"]} desc="Flag for review" />
              <ShortcutRow keys={["←"]} desc="Previous question" />
              <ShortcutRow keys={["→"]} desc="Next question" />
              <ShortcutRow keys={["Enter"]} desc="Next (or Submit on last)" />
            </ul>
            <p className="text-xs text-muted-foreground">
              Shortcuts pause while you&apos;re typing in a text field
              (FILL_BLANK, etc).
            </p>
            <button
              type="button"
              onClick={() => setHelpOpen(false)}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function ShortcutRow({ keys, desc }: { keys: string[]; desc: string }) {
  return (
    <li className="flex items-center justify-between">
      <span className="flex items-center gap-1">
        {keys.map((k, i) => (
          <kbd
            key={i}
            className="rounded-md border border-input bg-muted px-2 py-0.5 font-mono text-xs"
          >
            {k}
          </kbd>
        ))}
      </span>
      <span className="text-muted-foreground">{desc}</span>
    </li>
  );
}
