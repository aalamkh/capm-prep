import {
  ALL_DOMAINS,
  type Domain,
  type Difficulty,
  type QuestionType,
} from "@/lib/questions";

export const ALL_DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"];
export const ALL_TYPES: QuestionType[] = [
  "SINGLE",
  "MULTI",
  "MATCHING",
  "HOTSPOT",
  "FILL_BLANK",
];

export interface QbankFilters {
  domains: Domain[];
  difficulties: Difficulty[];
  types: QuestionType[];
  eco: string;
  q: string;
  bookmarked: boolean;
  wrong: boolean;
  page: number;
}

function intersect<T extends string>(
  values: string[],
  allowed: readonly T[]
): T[] {
  const set = new Set<string>(allowed);
  return values.filter((v): v is T => set.has(v));
}

function csv(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const raw = Array.isArray(value) ? value.join(",") : value;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseFilters(
  searchParams: Record<string, string | string[] | undefined>
): QbankFilters {
  const page = Math.max(
    1,
    parseInt(
      Array.isArray(searchParams.page)
        ? searchParams.page[0] ?? "1"
        : searchParams.page ?? "1",
      10
    ) || 1
  );
  return {
    domains: intersect(csv(searchParams.domain), ALL_DOMAINS),
    difficulties: intersect(csv(searchParams.difficulty), ALL_DIFFICULTIES),
    types: intersect(csv(searchParams.type), ALL_TYPES),
    eco: (Array.isArray(searchParams.eco)
      ? searchParams.eco[0]
      : searchParams.eco) ?? "",
    q: (Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q) ?? "",
    bookmarked: searchParams.bookmarked === "1",
    wrong: searchParams.wrong === "1",
    page,
  };
}

/**
 * Serialize a filter into a URL query string. Optional `overrides` lets a
 * caller flip individual filter keys (e.g. toggle a domain or change page)
 * without rebuilding the whole object.
 */
export function filtersToQuery(
  filters: QbankFilters,
  overrides: Partial<QbankFilters> = {}
): string {
  const merged: QbankFilters = { ...filters, ...overrides };
  const params = new URLSearchParams();
  if (merged.domains.length) params.set("domain", merged.domains.join(","));
  if (merged.difficulties.length)
    params.set("difficulty", merged.difficulties.join(","));
  if (merged.types.length) params.set("type", merged.types.join(","));
  if (merged.eco) params.set("eco", merged.eco);
  if (merged.q) params.set("q", merged.q);
  if (merged.bookmarked) params.set("bookmarked", "1");
  if (merged.wrong) params.set("wrong", "1");
  if (merged.page > 1) params.set("page", String(merged.page));
  const s = params.toString();
  return s ? `?${s}` : "";
}
