import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface GameTeaching {
  title: string;
  definition: string;
  whyItMatters: string;
  keyPoints: string[];
  analogies?: string[];
  memoryTricks?: string[];
  cheatSheet: string[];
}

let cache: Record<string, GameTeaching> | null = null;

export function loadGameTeaching(): Record<string, GameTeaching> {
  if (cache) return cache;
  const path = join(process.cwd(), "data", "game-teaching.json");
  cache = JSON.parse(readFileSync(path, "utf8")) as Record<string, GameTeaching>;
  return cache;
}

export function getGameTeaching(id: string): GameTeaching | null {
  return loadGameTeaching()[id] ?? null;
}
