"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Building,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Project: Build a House ─────────────────────────────────────────────────
//
// 4 parent deliverables, each with 3 child work packages. Player has to
// assign each work package to the right parent.

interface Parent {
  id: string;
  title: string;
  description: string;
}

interface WorkPackage {
  id: string;
  title: string;
  /** The correct parent id. */
  parentId: string;
}

interface Trap {
  /** A nonsensical item the player must IDENTIFY as not-a-deliverable
   *  (e.g. an activity / verb instead of a deliverable / noun). */
  id: string;
  title: string;
  why: string;
}

const PARENTS: Parent[] = [
  { id: "structure", title: "Structure", description: "Foundation, frame, roof — the bones of the house." },
  { id: "systems",   title: "Systems",   description: "Plumbing, electrical, HVAC — what keeps it alive." },
  { id: "finishes",  title: "Finishes",  description: "Drywall, flooring, paint — what you see and touch." },
  { id: "site",      title: "Site Work", description: "Outside the building — driveway, landscaping, fence." },
];

const WORK_PACKAGES: WorkPackage[] = [
  { id: "foundation",  title: "Foundation",                parentId: "structure" },
  { id: "framing",     title: "Framing & framing inspection", parentId: "structure" },
  { id: "roof",        title: "Roof",                      parentId: "structure" },
  { id: "plumbing",    title: "Plumbing rough-in",         parentId: "systems" },
  { id: "electrical",  title: "Electrical rough-in",       parentId: "systems" },
  { id: "hvac",        title: "HVAC",                      parentId: "systems" },
  { id: "drywall",     title: "Drywall",                   parentId: "finishes" },
  { id: "flooring",    title: "Flooring",                  parentId: "finishes" },
  { id: "paint",       title: "Interior paint",            parentId: "finishes" },
  { id: "driveway",    title: "Driveway",                  parentId: "site" },
  { id: "landscaping", title: "Landscaping",               parentId: "site" },
  { id: "fence",       title: "Perimeter fence",           parentId: "site" },
];

// "Traps" — items that are NOT deliverables. Player should mark them as such.
const TRAPS: Trap[] = [
  {
    id: "schedule-monday",
    title: "Schedule the crew for Monday",
    why: "That's an ACTIVITY (verb), not a deliverable. WBS shows deliverables — schedules live in the schedule, not the WBS.",
  },
  {
    id: "fix-bugs",
    title: "Fix any bugs found in testing",
    why: "Not a deliverable. WBS captures the planned work product, not 'whatever defects emerge.'",
  },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// All items mixed (work packages + traps). Player picks one and assigns
// either to a parent OR marks it as "Not a deliverable."
interface Item {
  id: string;
  title: string;
  /** "trap" = should be marked Not a Deliverable; otherwise parentId. */
  expected: string | "trap";
  trapReason?: string;
}

function buildItems(): Item[] {
  const items: Item[] = [
    ...WORK_PACKAGES.map((w) => ({ id: w.id, title: w.title, expected: w.parentId })),
    ...TRAPS.map((t) => ({ id: t.id, title: t.title, expected: "trap" as const, trapReason: t.why })),
  ];
  return items;
}

export function WBSBuilder() {
  // SSR-safe: order stays stable for first paint; shuffled after mount.
  const [pool, setPool] = useState<Item[]>(() => buildItems());
  useEffect(() => {
    setPool(shuffle(buildItems()));
  }, []);

  // assignments[itemId] = parentId | "trap" | undefined (not yet placed)
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);

  const reset = () => {
    setPool(shuffle(buildItems()));
    setAssignments({});
    setChecked(false);
  };

  const assign = (itemId: string, bucket: string) => {
    if (checked) return;
    setAssignments((prev) => ({ ...prev, [itemId]: bucket }));
  };

  const allAssigned = pool.every((it) => assignments[it.id] !== undefined);

  // Grade
  const results = pool.map((it) => ({
    item: it,
    placed: assignments[it.id],
    correct: assignments[it.id] === it.expected,
  }));
  const correctCount = results.filter((r) => r.correct).length;
  const total = results.length;
  const pct = total === 0 ? 0 : correctCount / total;

  return (
    <div className="space-y-4">
      {/* Project root */}
      <div className="rounded-lg border-2 border-primary/40 bg-primary/5 p-3 text-center">
        <div className="flex items-center justify-center gap-2 text-sm font-bold">
          <Building className="h-4 w-4" />
          Project: Build a House
        </div>
        <div className="text-xs text-muted-foreground">
          Place each work package under the right parent deliverable. Two
          items are TRAPS — they aren&apos;t deliverables at all.
        </div>
      </div>

      {/* Parent buckets */}
      <div className="grid gap-3 sm:grid-cols-2">
        {PARENTS.map((p) => {
          const here = results.filter(
            (r) => assignments[r.item.id] === p.id
          );
          return (
            <div
              key={p.id}
              className="rounded-lg border bg-card p-3"
            >
              <div className="text-sm font-semibold">{p.title}</div>
              <div className="text-xs text-muted-foreground">{p.description}</div>
              <ul className="mt-2 space-y-1 text-xs">
                {here.length === 0 ? (
                  <li className="italic text-muted-foreground">(empty)</li>
                ) : (
                  here.map((r) => (
                    <li
                      key={r.item.id}
                      className={cn(
                        "flex items-center gap-2 rounded-md border bg-background p-1.5",
                        checked && r.correct && "border-green-400 text-green-800 dark:text-green-200",
                        checked && !r.correct && "border-red-400 text-red-800 dark:text-red-200"
                      )}
                    >
                      {checked && r.correct && (
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      )}
                      {checked && !r.correct && (
                        <XCircle className="h-3 w-3 text-red-600" />
                      )}
                      <span>{r.item.title}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Not-a-deliverable bucket */}
      <div className="rounded-lg border border-dashed bg-muted/20 p-3">
        <div className="text-sm font-semibold">⚠ Not a deliverable (trap)</div>
        <div className="text-xs text-muted-foreground">
          Drop here anything that&apos;s an activity (verb) or a vague
          intention — not a planned deliverable.
        </div>
        <ul className="mt-2 space-y-1 text-xs">
          {(() => {
            const here = results.filter((r) => assignments[r.item.id] === "trap");
            if (here.length === 0)
              return <li className="italic text-muted-foreground">(empty)</li>;
            return here.map((r) => (
              <li
                key={r.item.id}
                className={cn(
                  "flex items-center gap-2 rounded-md border bg-background p-1.5",
                  checked && r.correct && "border-green-400 text-green-800 dark:text-green-200",
                  checked && !r.correct && "border-red-400 text-red-800 dark:text-red-200"
                )}
              >
                {checked && r.correct && (
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                )}
                {checked && !r.correct && (
                  <XCircle className="h-3 w-3 text-red-600" />
                )}
                <span>{r.item.title}</span>
              </li>
            ));
          })()}
        </ul>
      </div>

      {/* Unplaced pool */}
      {!checked && (
        <div className="rounded-lg border bg-card p-3">
          <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
            Unplaced ({pool.filter((it) => !assignments[it.id]).length} left)
          </div>
          <ul className="space-y-2 text-sm">
            {pool
              .filter((it) => !assignments[it.id])
              .map((it) => (
                <li
                  key={it.id}
                  className="rounded-md border bg-background p-2"
                >
                  <div className="mb-1.5 font-medium">{it.title}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {PARENTS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => assign(it.id, p.id)}
                        className="rounded-md border border-input bg-background px-2 py-1 text-xs hover:bg-accent"
                      >
                        {p.title}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => assign(it.id, "trap")}
                      className="rounded-md border border-dashed border-amber-400 bg-amber-50/40 px-2 py-1 text-xs text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-200"
                    >
                      ⚠ Not a deliverable
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Action row */}
      {!checked ? (
        <button
          type="button"
          onClick={() => setChecked(true)}
          disabled={!allAssigned}
          className={cn(
            "w-full rounded-md py-2 text-sm font-medium transition-opacity",
            allAssigned
              ? "bg-primary text-primary-foreground hover:opacity-90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          {allAssigned
            ? "Check my WBS"
            : `Place all items first (${
                pool.filter((it) => !assignments[it.id]).length
              } left)`}
        </button>
      ) : (
        <div
          className={cn(
            "rounded-lg border p-4 text-sm",
            pct === 1
              ? "border-green-300 bg-green-50 dark:bg-green-950/40 dark:border-green-800"
              : "border-amber-300 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-800"
          )}
        >
          <div className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4 text-amber-500" />
            {correctCount} / {total} correctly placed ({Math.round(pct * 100)}%)
          </div>

          {/* Per-mistake feedback */}
          {results.filter((r) => !r.correct).length > 0 && (
            <ul className="mt-3 space-y-2 text-xs">
              {results
                .filter((r) => !r.correct)
                .map((r) => {
                  const expectedParent = PARENTS.find(
                    (p) => p.id === r.item.expected
                  );
                  return (
                    <li
                      key={r.item.id}
                      className="rounded-md border bg-background p-2"
                    >
                      <div className="font-semibold">{r.item.title}</div>
                      <div className="text-muted-foreground">
                        You placed it in{" "}
                        <strong>
                          {assignments[r.item.id] === "trap"
                            ? "Not a deliverable"
                            : PARENTS.find((p) => p.id === assignments[r.item.id])?.title ?? "—"}
                        </strong>
                        . Correct: {" "}
                        <strong>
                          {r.item.expected === "trap"
                            ? "Not a deliverable"
                            : expectedParent?.title}
                        </strong>
                        .
                      </div>
                      {r.item.trapReason && (
                        <div className="mt-1 text-muted-foreground">
                          💡 {r.item.trapReason}
                        </div>
                      )}
                    </li>
                  );
                })}
            </ul>
          )}

          <p className="mt-3 text-xs text-muted-foreground">
            💡 WBS rule: every leaf is a <strong>deliverable</strong> (noun),
            not an activity (verb). Scheduling and bug-fixing aren&apos;t
            deliverables — they live elsewhere in the plan.
          </p>

          <button
            type="button"
            onClick={reset}
            className="mt-3 inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Play again
          </button>
        </div>
      )}
    </div>
  );
}
