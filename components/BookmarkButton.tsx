"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  questionId: string;
  initialBookmarked: boolean;
  /** "icon" = small icon-only toggle; "full" = labeled button with note editor. */
  variant?: "icon" | "full";
  initialNote?: string | null;
}

export function BookmarkButton({
  questionId,
  initialBookmarked,
  variant = "icon",
  initialNote = null,
}: Props) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [note, setNote] = useState(initialNote ?? "");
  const [editingNote, setEditingNote] = useState(false);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const refresh = () => startTransition(() => router.refresh());

  const toggle = async () => {
    setBusy(true);
    try {
      if (bookmarked) {
        await fetch(`/api/bookmarks/${questionId}`, { method: "DELETE" });
        setBookmarked(false);
        setNote("");
        setEditingNote(false);
      } else {
        await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId, note: note || null }),
        });
        setBookmarked(true);
      }
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const saveNote = async () => {
    setBusy(true);
    try {
      await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, note: note || null }),
      });
      setBookmarked(true);
      setEditingNote(false);
      refresh();
    } finally {
      setBusy(false);
    }
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        title={bookmarked ? "Remove bookmark" : "Bookmark this question"}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors",
          bookmarked
            ? "border-amber-300 bg-amber-100 text-amber-700"
            : "border-input bg-background text-muted-foreground hover:bg-accent",
          busy && "opacity-60"
        )}
        aria-pressed={bookmarked}
      >
        {bookmarked ? (
          <BookmarkCheck className="h-4 w-4" />
        ) : (
          <Bookmark className="h-4 w-4" />
        )}
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          className={cn(
            "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
            bookmarked
              ? "border-amber-300 bg-amber-100 text-amber-900"
              : "border-input bg-background hover:bg-accent",
            busy && "opacity-60"
          )}
        >
          {bookmarked ? (
            <BookmarkCheck className="h-4 w-4" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
          {bookmarked ? "Bookmarked" : "Bookmark"}
        </button>
        {bookmarked && (
          <button
            type="button"
            onClick={() => setEditingNote((e) => !e)}
            className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent"
          >
            {editingNote ? "Cancel" : note ? "Edit note" : "Add note"}
          </button>
        )}
      </div>

      {bookmarked && !editingNote && note && (
        <div className="rounded-md border bg-muted/40 p-2 text-sm whitespace-pre-line">
          {note}
        </div>
      )}

      {bookmarked && editingNote && (
        <div className="space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Why this one matters to you (optional)…"
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveNote}
              disabled={busy}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              Save note
            </button>
            <button
              type="button"
              onClick={() => {
                setNote(initialNote ?? "");
                setEditingNote(false);
              }}
              className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
