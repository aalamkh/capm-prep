"use client";

import { useRef, useState, useCallback } from "react";
import { Highlighter, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Range {
  start: number;
  end: number;
}

interface Props {
  text: string;
  className?: string;
}

/**
 * Renders question text with PMI-style highlight tool.
 *
 * Click "Highlight" to enter highlight mode. Drag-select any portion of the
 * text and it becomes highlighted. Click "Clear" to remove all highlights.
 * Highlights are ephemeral (per-mount) — the real Pearson VUE interface
 * also drops them between sessions.
 */
export function HighlightableText({ text, className }: Props) {
  const [active, setActive] = useState(false);
  const [ranges, setRanges] = useState<Range[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = useCallback(() => {
    if (!active) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const node = containerRef.current;
    if (!node) return;
    if (!node.contains(range.startContainer) || !node.contains(range.endContainer)) return;

    // Compute offsets relative to the full text by walking text nodes.
    const start = absoluteOffset(node, range.startContainer, range.startOffset);
    const end = absoluteOffset(node, range.endContainer, range.endOffset);
    const lo = Math.min(start, end);
    const hi = Math.max(start, end);
    if (lo === hi) return;

    setRanges((prev) => mergeRanges([...prev, { start: lo, end: hi }]));
    sel.removeAllRanges();
  }, [active]);

  const clear = () => setRanges([]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActive((a) => !a)}
          className={cn(
            "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors",
            active
              ? "border-yellow-400 bg-yellow-100 text-yellow-900"
              : "border-input bg-background text-muted-foreground hover:bg-accent"
          )}
          aria-pressed={active}
        >
          <Highlighter className="h-3.5 w-3.5" />
          {active ? "Highlight on — drag to mark" : "Highlight"}
        </button>
        {ranges.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
          >
            <X className="h-3.5 w-3.5" /> Clear highlights
          </button>
        )}
      </div>
      <div
        ref={containerRef}
        onMouseUp={handleMouseUp}
        className={cn(
          "whitespace-pre-line text-base leading-relaxed",
          active && "cursor-text select-text",
          className
        )}
      >
        {renderSegments(text, ranges)}
      </div>
    </div>
  );
}

/** Render `text` split by `ranges` so highlighted portions are wrapped in <mark>. */
function renderSegments(text: string, ranges: Range[]): React.ReactNode {
  if (ranges.length === 0) return text;
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const out: React.ReactNode[] = [];
  let cursor = 0;
  for (const r of sorted) {
    if (r.start > cursor) out.push(text.slice(cursor, r.start));
    out.push(
      <mark
        key={`${r.start}-${r.end}`}
        className="rounded-sm bg-yellow-200 px-0.5"
      >
        {text.slice(r.start, r.end)}
      </mark>
    );
    cursor = r.end;
  }
  if (cursor < text.length) out.push(text.slice(cursor));
  return out;
}

/** Walk all text nodes in `root` to convert a (node, offset) into a flat offset. */
function absoluteOffset(root: Node, node: Node, offset: number): number {
  let pos = 0;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let cur: Node | null = walker.nextNode();
  while (cur) {
    if (cur === node) return pos + offset;
    pos += (cur.textContent ?? "").length;
    cur = walker.nextNode();
  }
  // Fallback if the node is the root itself (rare): clamp to length.
  return Math.min(pos, (root.textContent ?? "").length);
}

function mergeRanges(ranges: Range[]): Range[] {
  if (ranges.length <= 1) return ranges;
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const out: Range[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const last = out[out.length - 1];
    const cur = sorted[i];
    if (cur.start <= last.end) {
      last.end = Math.max(last.end, cur.end);
    } else {
      out.push({ ...cur });
    }
  }
  return out;
}
