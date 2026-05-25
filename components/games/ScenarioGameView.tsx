"use client";

import { TapTheRight } from "./TapTheRight";
import { GameTeachingPanel } from "./GameTeachingPanel";
import { GameCheatSheet } from "./GameCheatSheet";
import type { ScenarioGame } from "@/lib/games-data";
import type { GameTeaching } from "@/lib/game-teaching";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

const ACCENT: Record<ScenarioGame["color"], { bg: string; border: string; fg: string }> = {
  violet:  { bg: "bg-violet-50  dark:bg-violet-950/40",  border: "border-violet-300  dark:border-violet-800",  fg: "text-violet-700  dark:text-violet-300" },
  amber:   { bg: "bg-amber-50   dark:bg-amber-950/40",   border: "border-amber-300   dark:border-amber-800",   fg: "text-amber-700   dark:text-amber-300" },
  blue:    { bg: "bg-blue-50    dark:bg-blue-950/40",    border: "border-blue-300    dark:border-blue-800",    fg: "text-blue-700    dark:text-blue-300" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-300 dark:border-emerald-800", fg: "text-emerald-700 dark:text-emerald-300" },
};

interface Props {
  game: ScenarioGame;
  teaching?: GameTeaching | null;
}

export function ScenarioGameView({ game, teaching }: Props) {
  const ui = ACCENT[game.color];
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className={cn("rounded-xl border-2 p-6", ui.border, ui.bg)}>
        <div className={cn("flex items-center gap-2 text-xs uppercase tracking-wide", ui.fg)}>
          <Sparkles className="h-3.5 w-3.5" />
          {game.rounds.length} rounds
        </div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{game.title}</h1>
        <p className={cn("mt-1 text-sm font-medium", ui.fg)}>{game.tagline}</p>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">
          {game.eli5}
        </p>
      </header>

      {teaching && <GameTeachingPanel teaching={teaching} />}

      <section className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-amber-50 p-6 dark:from-primary/10 dark:to-amber-950/40">
        <h2 className="mb-3 text-base font-semibold">
          Play the scenarios
        </h2>
        <TapTheRight data={{ type: "tap", rounds: game.rounds }} />
      </section>

      {teaching && (
        <GameCheatSheet items={teaching.cheatSheet} />
      )}
    </div>
  );
}
