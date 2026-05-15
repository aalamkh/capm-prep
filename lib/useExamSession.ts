"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ParsedQuestion, UserAnswer } from "@/lib/questions";
import { hasAnswer } from "@/lib/scoring";
import type { Mode } from "@/lib/exam";

export interface AnswerState {
  userAnswer: UserAnswer;
  flagged: boolean;
}

interface InitialAnswer {
  questionId: string;
  userAnswer: UserAnswer;
  flagged: boolean;
}

interface UseExamSessionInput {
  sessionId: string;
  mode: Mode;
  questions: ParsedQuestion[];
  initialAnswers: InitialAnswer[];
  startedAtMs: number; // server-authoritative session start time
  durationSeconds: number | null; // MOCK: 3hr; PRACTICE/DOMAIN: null
  /** Initial break state for MOCK; safe defaults for other modes. */
  initialBreakSecondsTaken?: number;
  initialBreakStartedAtMs?: number | null;
  initialBreaksTaken?: number;
}

export const MAX_MOCK_BREAKS = 2;
export const MOCK_BREAK_DURATION_SECONDS = 10 * 60;

const SAVE_DEBOUNCE_MS = 500;

export function useExamSession(input: UseExamSessionInput) {
  const {
    sessionId,
    mode,
    questions,
    initialAnswers,
    startedAtMs,
    durationSeconds,
    initialBreakSecondsTaken = 0,
    initialBreakStartedAtMs = null,
    initialBreaksTaken = 0,
  } = input;
  const router = useRouter();

  const initialMap = useMemo(() => {
    const m = new Map<string, AnswerState>();
    for (const a of initialAnswers) {
      m.set(a.questionId, { userAnswer: a.userAnswer, flagged: a.flagged });
    }
    return m;
  }, [initialAnswers]);

  const [answers, setAnswers] = useState<Map<string, AnswerState>>(
    () => new Map(initialMap)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  // Per-question "answer revealed" state, used by REVIEW/NEW modes.
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const revealCurrent = useCallback((questionId: string) => {
    setRevealed((prev) => {
      if (prev.has(questionId)) return prev;
      const next = new Set(prev);
      next.add(questionId);
      return next;
    });
  }, []);

  const isRevealed = useCallback(
    (questionId: string) => revealed.has(questionId),
    [revealed]
  );

  // Per-question debounce timers + last-saved snapshot.
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const lastSaved = useRef<Map<string, string>>(
    new Map(
      Array.from(initialMap.entries()).map(([id, s]) => [id, signature(s)])
    )
  );

  // ---- Timer + breaks (MOCK only) ---------------------------------------
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    if (durationSeconds === null) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [durationSeconds]);

  const [breakSecondsTaken, setBreakSecondsTaken] = useState<number>(
    initialBreakSecondsTaken
  );
  const [breakStartedAtMs, setBreakStartedAtMs] = useState<number | null>(
    initialBreakStartedAtMs
  );
  const [breaksTaken, setBreaksTaken] = useState<number>(initialBreaksTaken);

  const onBreak = breakStartedAtMs !== null;
  const currentBreakElapsedSeconds = onBreak
    ? Math.max(0, Math.floor((now - breakStartedAtMs) / 1000))
    : 0;
  const breakSecondsRemaining = onBreak
    ? Math.max(0, MOCK_BREAK_DURATION_SECONDS - currentBreakElapsedSeconds)
    : 0;
  const totalBreakSeconds = breakSecondsTaken + currentBreakElapsedSeconds;

  const elapsedSeconds = Math.max(
    0,
    Math.floor((now - startedAtMs) / 1000) - totalBreakSeconds
  );
  const remainingSeconds =
    durationSeconds === null ? null : Math.max(0, durationSeconds - elapsedSeconds);

  const startBreak = useCallback(async () => {
    if (onBreak || breaksTaken >= MAX_MOCK_BREAKS) return;
    const res = await fetch(`/api/sessions/${sessionId}/break`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start" }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setBreakStartedAtMs(data.breakStartedAtMs);
  }, [onBreak, breaksTaken, sessionId]);

  const endBreak = useCallback(async () => {
    if (!onBreak) return;
    const res = await fetch(`/api/sessions/${sessionId}/break`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "end" }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setBreakSecondsTaken(data.breakSecondsTaken);
    setBreakStartedAtMs(null);
    setBreaksTaken(data.breaksTaken);
  }, [onBreak, sessionId]);

  // Auto-end break at the duration cap.
  useEffect(() => {
    if (!onBreak) return;
    if (breakSecondsRemaining <= 0) void endBreak();
  }, [onBreak, breakSecondsRemaining, endBreak]);

  // Warning thresholds: 30/15/5 minutes remaining (each fires once)
  const warned = useRef({ m30: false, m15: false, m5: false });
  const [warning, setWarning] = useState<string | null>(null);
  useEffect(() => {
    if (remainingSeconds === null) return;
    const min = Math.floor(remainingSeconds / 60);
    if (min <= 30 && !warned.current.m30) {
      warned.current.m30 = true;
      setWarning("30 minutes remaining");
    } else if (min <= 15 && !warned.current.m15) {
      warned.current.m15 = true;
      setWarning("15 minutes remaining");
    } else if (min <= 5 && !warned.current.m5) {
      warned.current.m5 = true;
      setWarning("5 minutes remaining");
    }
  }, [remainingSeconds]);

  // ---- Save to server ---------------------------------------------------
  const submit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    // Flush any pending saves first.
    await flushPending(sessionId, answers, lastSaved.current, timers.current);
    const res = await fetch(`/api/sessions/${sessionId}/submit`, {
      method: "POST",
    });
    if (!res.ok) {
      setSubmitting(false);
      return;
    }
    router.push(`/exam/${sessionId}/results`);
  }, [sessionId, answers, submitting, router]);

  // Auto-submit on timer expiry.
  const autoSubmittedRef = useRef(false);
  useEffect(() => {
    if (
      remainingSeconds !== null &&
      remainingSeconds === 0 &&
      !autoSubmittedRef.current
    ) {
      autoSubmittedRef.current = true;
      void submit();
    }
  }, [remainingSeconds, submit]);

  const scheduleSave = useCallback(
    (questionId: string, state: AnswerState) => {
      const sig = signature(state);
      if (lastSaved.current.get(questionId) === sig) return; // no-op
      const existing = timers.current.get(questionId);
      if (existing) clearTimeout(existing);
      const t = setTimeout(async () => {
        timers.current.delete(questionId);
        try {
          await fetch(`/api/sessions/${sessionId}/answer`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              questionId,
              userAnswer: state.userAnswer ?? null,
              flaggedForReview: state.flagged,
            }),
          });
          lastSaved.current.set(questionId, sig);
        } catch {
          // best-effort; will retry on next change
        }
      }, SAVE_DEBOUNCE_MS);
      timers.current.set(questionId, t);
    },
    [sessionId]
  );

  const setAnswer = useCallback(
    (questionId: string, userAnswer: UserAnswer) => {
      setAnswers((prev) => {
        const next = new Map(prev);
        const cur = next.get(questionId) ?? { userAnswer: null, flagged: false };
        const updated = { ...cur, userAnswer };
        next.set(questionId, updated);
        scheduleSave(questionId, updated);
        return next;
      });
    },
    [scheduleSave]
  );

  const toggleFlag = useCallback(
    (questionId: string) => {
      setAnswers((prev) => {
        const next = new Map(prev);
        const cur = next.get(questionId) ?? { userAnswer: null, flagged: false };
        const updated = { ...cur, flagged: !cur.flagged };
        next.set(questionId, updated);
        scheduleSave(questionId, updated);
        return next;
      });
    },
    [scheduleSave]
  );

  const goNext = useCallback(
    () => setCurrentIndex((i) => Math.min(i + 1, questions.length - 1)),
    [questions.length]
  );
  const goPrev = useCallback(
    () => setCurrentIndex((i) => Math.max(i - 1, 0)),
    []
  );
  const jumpTo = useCallback(
    (i: number) => setCurrentIndex(Math.max(0, Math.min(i, questions.length - 1))),
    [questions.length]
  );

  const currentQuestion = questions[currentIndex];
  const currentAnswer =
    answers.get(currentQuestion?.id ?? "") ?? { userAnswer: null, flagged: false };

  const answeredCount = useMemo(
    () =>
      questions.filter((q) => {
        const a = answers.get(q.id);
        return a ? hasAnswer(q, a.userAnswer) : false;
      }).length,
    [questions, answers]
  );
  const flaggedCount = useMemo(
    () =>
      questions.filter((q) => answers.get(q.id)?.flagged).length,
    [questions, answers]
  );

  return {
    mode,
    questions,
    answers,
    currentIndex,
    currentQuestion,
    currentAnswer,
    setAnswer,
    toggleFlag,
    goNext,
    goPrev,
    jumpTo,
    submit,
    submitting,
    answeredCount,
    flaggedCount,
    remainingSeconds,
    warning,
    dismissWarning: () => setWarning(null),
    revealCurrent,
    isRevealed,
    // Break state
    onBreak,
    breakSecondsRemaining,
    breaksTaken,
    breakAvailable:
      mode === "MOCK" && !onBreak && breaksTaken < MAX_MOCK_BREAKS,
    startBreak,
    endBreak,
  };
}

function signature(s: AnswerState): string {
  return JSON.stringify({ a: s.userAnswer ?? null, f: s.flagged });
}

async function flushPending(
  sessionId: string,
  answers: Map<string, AnswerState>,
  lastSaved: Map<string, string>,
  timers: Map<string, ReturnType<typeof setTimeout>>
) {
  // Cancel timers and immediately save anything pending.
  const pending: Promise<unknown>[] = [];
  for (const [qid, state] of answers.entries()) {
    const sig = signature(state);
    if (lastSaved.get(qid) === sig) continue;
    const t = timers.get(qid);
    if (t) clearTimeout(t);
    timers.delete(qid);
    pending.push(
      fetch(`/api/sessions/${sessionId}/answer`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: qid,
          userAnswer: state.userAnswer ?? null,
          flaggedForReview: state.flagged,
        }),
      }).then(() => lastSaved.set(qid, sig))
    );
  }
  await Promise.all(pending);
}
