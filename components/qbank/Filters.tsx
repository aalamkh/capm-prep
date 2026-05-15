"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ALL_DIFFICULTIES,
  ALL_TYPES,
  filtersToQuery,
  type QbankFilters,
} from "@/lib/qbank-filters";
import { ALL_DOMAINS, DOMAIN_LABELS, type Domain } from "@/lib/questions";

interface Props {
  initial: QbankFilters;
  totalResults: number;
}

export function Filters({ initial, totalResults }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilters] = useState<QbankFilters>(initial);

  // Resync if the URL is changed externally (e.g. clicking a row link with
  // its own filter state would be unusual but harmless).
  useEffect(() => {
    setFilters(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initial)]);

  const apply = (overrides: Partial<QbankFilters>) => {
    const next = { ...filters, ...overrides };
    // Any filter change resets to page 1.
    if (overrides.page === undefined) next.page = 1;
    setFilters(next);
    router.push(`${pathname}${filtersToQuery(next)}`);
  };

  const toggleInArray = <T extends string>(
    arr: T[],
    value: T
  ): T[] =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

  const reset = () => {
    const cleared: QbankFilters = {
      domains: [],
      difficulties: [],
      types: [],
      eco: "",
      q: "",
      bookmarked: false,
      wrong: false,
      page: 1,
    };
    setFilters(cleared);
    router.push(pathname);
  };

  const isFiltered =
    filters.domains.length > 0 ||
    filters.difficulties.length > 0 ||
    filters.types.length > 0 ||
    filters.eco.length > 0 ||
    filters.q.length > 0 ||
    filters.bookmarked ||
    filters.wrong;

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase text-muted-foreground">
          Search question text
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter") apply({ q: filters.q });
            }}
            onBlur={() => apply({ q: filters.q })}
            placeholder="e.g. risk register, fast tracking…"
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      <ChipRow
        label="Domain"
        items={ALL_DOMAINS as Domain[]}
        labelFor={(d) => DOMAIN_LABELS[d]}
        selected={filters.domains}
        onToggle={(v) =>
          apply({ domains: toggleInArray(filters.domains, v) })
        }
      />
      <ChipRow
        label="Difficulty"
        items={ALL_DIFFICULTIES}
        labelFor={(d) => d}
        selected={filters.difficulties}
        onToggle={(v) =>
          apply({ difficulties: toggleInArray(filters.difficulties, v) })
        }
      />
      <ChipRow
        label="Type"
        items={ALL_TYPES}
        labelFor={(t) => t.replace("_", " ")}
        selected={filters.types}
        onToggle={(v) => apply({ types: toggleInArray(filters.types, v) })}
      />

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase text-muted-foreground">
          ECO task contains
        </label>
        <input
          type="text"
          value={filters.eco}
          onChange={(e) => setFilters((f) => ({ ...f, eco: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === "Enter") apply({ eco: filters.eco });
          }}
          onBlur={() => apply({ eco: filters.eco })}
          placeholder="e.g. 1.4, risk management"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        <Toggle
          label="Bookmarked only"
          on={filters.bookmarked}
          onChange={() => apply({ bookmarked: !filters.bookmarked })}
        />
        <Toggle
          label="Gotten wrong"
          on={filters.wrong}
          onChange={() => apply({ wrong: !filters.wrong })}
        />
      </div>

      <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
        <span>
          {totalResults} match{totalResults === 1 ? "" : "es"}
        </span>
        {isFiltered && (
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1 text-xs underline-offset-2 hover:underline"
          >
            <X className="h-3 w-3" /> Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

function ChipRow<T extends string>({
  label,
  items,
  labelFor,
  selected,
  onToggle,
}: {
  label: string;
  items: T[];
  labelFor: (v: T) => string;
  selected: T[];
  onToggle: (v: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-semibold uppercase text-muted-foreground">
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((v) => {
          const on = selected.includes(v);
          return (
            <button
              key={v}
              type="button"
              onClick={() => onToggle(v)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs transition-colors",
                on
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background hover:bg-accent"
              )}
            >
              {labelFor(v)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Toggle({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={on}
      className={cn(
        "rounded-md border px-3 py-1.5 text-sm transition-colors",
        on
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-background hover:bg-accent"
      )}
    >
      {label}
    </button>
  );
}
