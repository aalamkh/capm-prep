import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Domain } from "@/lib/questions";

export interface Concept {
  id: string; // e.g. "1.4"
  domain: Domain;
  title: string;
  summary: string;
  whyItMatters: string;
  keyPoints: string[];
  commonMistakes: string[];
  reference: string;
}

let cache: Concept[] | null = null;

export function loadConcepts(): Concept[] {
  if (cache) return cache;
  const path = join(process.cwd(), "data", "concepts.json");
  const raw = readFileSync(path, "utf8");
  cache = JSON.parse(raw) as Concept[];
  return cache;
}

export function getConcept(id: string): Concept | undefined {
  return loadConcepts().find((c) => c.id === id);
}

export function conceptsByDomain(): Record<Domain, Concept[]> {
  const out: Record<Domain, Concept[]> = {
    FUNDAMENTALS: [],
    PREDICTIVE: [],
    AGILE: [],
    BUSINESS_ANALYSIS: [],
  };
  for (const c of loadConcepts()) {
    out[c.domain].push(c);
  }
  return out;
}

/**
 * Map a full ECO task string (e.g. "1.4.2 Demonstrate an understanding of risk
 * management") to its 2-level concept bucket ("1.4"). Returns null if the
 * input doesn't start with a recognizable digit-dot-digit prefix.
 */
export function ecoBucket(ecoTask: string | null | undefined): string | null {
  if (!ecoTask) return null;
  const m = ecoTask.match(/^(\d+)\.(\d+)/);
  if (!m) return null;
  return `${m[1]}.${m[2]}`;
}
