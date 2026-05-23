import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface ScenarioRound {
  prompt: string;
  choices: string[];
  answer: string;
  hint?: string;
}

export interface ScenarioGame {
  id: string;
  title: string;
  tagline: string;
  eli5: string;
  color: "violet" | "amber" | "blue" | "emerald";
  rounds: ScenarioRound[];
}

export interface GamesData {
  scrum: ScenarioGame;
  scrumAdvanced: ScenarioGame;
  xp: ScenarioGame;
  predictive: ScenarioGame;
}

let cache: GamesData | null = null;

export function loadGames(): GamesData {
  if (cache) return cache;
  const path = join(process.cwd(), "data", "games.json");
  const raw = readFileSync(path, "utf8");
  cache = JSON.parse(raw) as GamesData;
  return cache;
}

export function getGame(id: keyof GamesData): ScenarioGame {
  return loadGames()[id];
}
