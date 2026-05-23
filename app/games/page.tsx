import Link from "next/link";
import {
  Gamepad2,
  LayoutGrid,
  Workflow,
  Code2,
  Building2,
  ChevronRight,
  LineChart as LineChartIcon,
  Timer,
  Network,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GameCard {
  href: string;
  title: string;
  tagline: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  border: string;
  accent: string;
}

const GAMES: GameCard[] = [
  {
    href: "/games/kanban",
    title: "Kanban Flow Simulator",
    tagline: "Drag cards. Respect WIP limits. Maximize throughput.",
    detail:
      "Run a real Kanban board for 18 ticks. Watch what happens when you violate WIP. Internalize the 'stop starting, start finishing' rule by doing it.",
    icon: LayoutGrid,
    bg: "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40",
    border: "border-emerald-300 dark:border-emerald-800",
    accent: "text-emerald-700 dark:text-emerald-300",
  },
  {
    href: "/games/scrum",
    title: "Scrum Sprint Simulator",
    tagline: "12 decisions across one sprint. You're the SM.",
    detail:
      "Daily standups, scope changes, sprint reviews, retrospectives — every choice tests a Scrum boundary. Wrong answer? See exactly why.",
    icon: Workflow,
    bg: "bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40",
    border: "border-violet-300 dark:border-violet-800",
    accent: "text-violet-700 dark:text-violet-300",
  },
  {
    href: "/games/xp",
    title: "XP Practices Picker",
    tagline: "Code-smell moments. Pick the eXtreme Programming practice.",
    detail:
      "12 real engineering situations. Which XP practice solves each? Pair programming, TDD, CI, refactoring, simple design, on-site customer — learn by application.",
    icon: Code2,
    bg: "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40",
    border: "border-amber-300 dark:border-amber-800",
    accent: "text-amber-700 dark:text-amber-300",
  },
  {
    href: "/games/predictive",
    title: "Waterfall Phase-Gate Walkthrough",
    tagline: "Pilot a project from Initiating to Closing.",
    detail:
      "12 critical decisions across the predictive lifecycle. Charters, WBS, EVM, change control, conditional acceptance — the moments that decide if your project succeeds.",
    icon: Building2,
    bg: "bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/40 dark:to-sky-950/40",
    border: "border-blue-300 dark:border-blue-800",
    accent: "text-blue-700 dark:text-blue-300",
  },
  {
    href: "/games/scrum-advanced",
    title: "Scaling Scrum & Backlog Mastery",
    tagline: "12 advanced calls: LeSS, SAFe, story splitting, refinement.",
    detail:
      "Backlog refinement cadence, story splitting techniques, spikes, LeSS, SAFe (PI, ART, RTE), Scrum of Scrums, cross-team dependencies. Beyond single-team Scrum.",
    icon: Layers,
    bg: "bg-gradient-to-br from-fuchsia-50 to-violet-50 dark:from-fuchsia-950/40 dark:to-violet-950/40",
    border: "border-fuchsia-300 dark:border-fuchsia-800",
    accent: "text-fuchsia-700 dark:text-fuchsia-300",
  },
  {
    href: "/games/burndown",
    title: "Burn-Down Chart Reader",
    tagline: "6 charts. Read the SHAPE, not just the endpoint.",
    detail:
      "Behind, ahead, scope creep, cherry-pick, late-cliff, healthy — each chart pattern tells a story. Learn to diagnose a sprint in 5 seconds.",
    icon: LineChartIcon,
    bg: "bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/40 dark:to-blue-950/40",
    border: "border-sky-300 dark:border-sky-800",
    accent: "text-sky-700 dark:text-sky-300",
  },
  {
    href: "/games/formula-sprint",
    title: "PERT & Triangular Speed Round",
    tagline: "10 rounds. 10 seconds each. Time bonus for speed.",
    detail:
      "Lock the two estimating formulas into muscle memory. The OTHER formula's result is always a wrong choice — read the prompt fast and pick.",
    icon: Timer,
    bg: "bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-950/40 dark:to-orange-950/40",
    border: "border-rose-300 dark:border-rose-800",
    accent: "text-rose-700 dark:text-rose-300",
  },
  {
    href: "/games/wbs",
    title: "WBS Builder",
    tagline: "Decompose 'Build a House'. Spot the traps.",
    detail:
      "12 work packages, 4 parents, 2 traps (verbs that don't belong). Internalize the 100% rule and deliverables-vs-activities distinction.",
    icon: Network,
    bg: "bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40",
    border: "border-indigo-300 dark:border-indigo-800",
    accent: "text-indigo-700 dark:text-indigo-300",
  },
];

export default function GamesPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Gamepad2 className="h-7 w-7 text-primary" />
          Methodology Games
        </h1>
        <p className="text-sm text-muted-foreground">
          Each methodology is its own game. Play to internalize — concepts
          stick when you DO them, not when you read about them.
        </p>
      </header>

      <ul className="grid gap-4 md:grid-cols-2">
        {GAMES.map((g) => (
          <li key={g.href}>
            <Link
              href={g.href}
              className={cn(
                "group block h-full rounded-xl border-2 p-5 transition-all hover:brightness-95",
                g.bg,
                g.border
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-background/60",
                    g.accent
                  )}
                >
                  <g.icon className="h-6 w-6" />
                </div>
                <div className="flex-1 space-y-1.5">
                  <h2 className="text-lg font-bold">{g.title}</h2>
                  <p className={cn("text-sm font-medium", g.accent)}>
                    {g.tagline}
                  </p>
                  <p className="text-xs text-muted-foreground">{g.detail}</p>
                </div>
                <ChevronRight
                  className={cn(
                    "h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5",
                    g.accent
                  )}
                />
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        💡 <strong>Tip:</strong> Play each game once just to see all the
        scenarios. Replay daily for a week and you&apos;ll know these
        methodologies cold by exam day.
      </div>
    </div>
  );
}
