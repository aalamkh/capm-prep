# CAPM Prep

A self-hosted study app for the **Certified Associate in Project Management (CAPM)®** exam.

150 original ECO-aligned practice questions across all four domains, full mock-exam mode that mirrors the real Pearson VUE interface (3-hour timer, two optional 10-minute breaks, on-screen highlighter and strikethrough tools, PMI-style proficiency bands), spaced-repetition that schedules what to study today, a question bank with bookmarks and notes, and analytics that tell you whether you're actually improving across attempts.

> **Independent prep — not affiliated with PMI.** "CAPM" and "PMI" are trademarks of the Project Management Institute, Inc. All questions are original work mapped to the 2024 Examination Content Outline; nothing is copied from PMI's official exam, Pearson VUE materials, or copyrighted prep books. See [the About page](./app/about/page.tsx) for details.

---

## What's in the box

| Area | Highlights |
|---|---|
| **Question bank** | 150 questions split as 54 Fundamentals / 26 Predictive / 30 Agile / 40 Business Analysis (matching the 2024 ECO 36/17/20/27 weights). Every question has an `ecoTask` field, a 30/50/20 EASY/MEDIUM/HARD calibration, plausible distractors, and an explanation that says why each wrong option is wrong, with a citation to PMBOK 7, Agile Practice Guide, Process Groups Practice Guide, or Business Analysis for Practitioners. Five formats supported: SINGLE, MULTI ("Select N"), MATCHING, HOTSPOT, FILL\_BLANK. |
| **Modes** | `PRACTICE` (15-question untimed warm-up), `MOCK` (full 150 with 3-hr timer + breaks + realistic ECO-weighted picker), `DOMAIN` (10/20/all in one domain), `ECO_DRILL` (everything for one ECO task), `BOOKMARK_DRILL`, `REVIEW` (spaced-rep due cards), `NEW` (unseen questions in your weakest domain). |
| **Mock realism** | Pre-exam tutorial + agreement, sticky question palette, `1`–`5` keyboard shortcuts, `F` to flag, `Enter` to advance, highlighter, strikethrough/eliminate, two 10-min breaks at Q50/Q100 with a server-authoritative paused timer, PMI-style proficiency bands (Above Target / Target / Below Target / Needs Improvement), trend chart across attempts. |
| **Spaced repetition** | Simplified SM-2 (interval × ease for "easy", × 1.5 for normal, reset on wrong). `/today` shows due cards + new questions in your weakest domain. Streak counter on the homepage. |
| **Stats** | Composite score from last 5 sessions, ECO-weighted projection, per-domain mastery, difficulty breakdown, type performance, ECO weakness heatmap with click-to-drill, time-per-question vs the 72-sec real-exam pace. |
| **Quality of life** | Dark mode (next-themes), mobile-responsive with a drawer palette, loading skeletons, error boundaries on /exam, JSON export of all your data. |
| **Deploy-ready** | SQLite for local dev, one-flag swap to Postgres for production. Vercel build script handles provider switching, schema sync, seed, and build. |

---

## Quickstart

Requires Node.js 20.11+ (older Node + Prisma 5.22 combo is what this repo is pinned to — newer Node also works).

```bash
git clone https://github.com/<you>/capm-prep
cd capm-prep
cp .env.example .env
npm install
npx prisma migrate dev          # builds local SQLite at prisma/dev.db
npm run seed                    # loads 150 questions
npm run dev                     # http://localhost:3000
```

Want a production build locally?

```bash
npm run build && npm start
```

## Deploy to Vercel

Full walkthrough: **[DEPLOY.md](./DEPLOY.md)**.

Short version:

1. Push the repo to GitHub.
2. Import to Vercel.
3. Add Vercel Postgres in the Storage tab.
4. Set `DATABASE_URL = ${POSTGRES_PRISMA_URL}` in env vars.
5. Override the build command to `npm run vercel-build`.

That script auto-detects the Postgres scheme on `DATABASE_URL`, swaps `prisma/schema.prisma`'s `provider` line to `"postgresql"`, runs `prisma db push`, seeds, then builds. Local development stays on SQLite — no provider drift.

## Use it on your phone

The repo includes desktop launchers (`scripts/desktop-app/install*.sh`) that:

- **`CAPM Prep.command`** — opens `localhost:3000` in your Mac browser
- **`CAPM Prep (Mobile).command`** — boots a Pinggy SSH tunnel and gives you a public `https://...pinggy-free.link` URL that works from your phone over any network. URL is auto-copied to your clipboard.

iOS/Android: **Add to Home Screen** from the share sheet — manifest + apple-touch icons are wired up in [app/layout.tsx](./app/layout.tsx).

## Architecture

```
app/                    Next.js 14 App Router routes + loading.tsx + error.tsx
  api/sessions/         Session CRUD + /answer (debounced upsert) + /submit + /break
  api/bookmarks/        Bookmark upsert/delete
  api/export/           JSON dump of every user record
  exam/[sessionId]/     Server fetch + ExamRunner client
  practice/new/         Mode selector
  mock/                 Pre-exam tutorial → start → /exam/[id] → /exam/[id]/results → /mock/history
  today/                Due cards + new in weakest + streak
  question-bank/        Filterable list + detail (with drill-similar by ECO bucket)
  bookmarks/            Saved questions + drill-bookmarks button
  stats/                Composite + per-domain + difficulty + type + ECO heatmap + recent sessions
  about/  /export/      Disclosure + JSON download
components/exam/        SingleChoice, MultiChoice, Matching, Hotspot, FillBlank,
                        QuestionRenderer, QuestionPalette, Timer, BreakOverlay,
                        HighlightableText, ExamRunner, ReviewQuestion
lib/                    questions (types + parsing), scoring, exam (pickers per mode),
                        sm2 (spaced rep), review (queries), proficiency (bands),
                        useExamSession (hook), useExamKeyboard (shortcuts), db (Prisma client)
prisma/                 schema.prisma + seed.ts (zod-validated, hash-id idempotent upsert)
data/                   questions-fundamentals.json + 3 others (150 total)
scripts/                desktop launchers + Prisma provider swap
```

## Editing or adding questions

Patch the relevant `data/questions-*.json` and re-run `npm run seed`. Question IDs are SHA-256 hashes of `questionText`, so:

- Edits to the same question flow through cleanly (Prisma upsert)
- Renaming the question text creates a new row (the old hash no longer matches)
- A duplicate `questionText` is detected before any DB write

The seed is zod-validated — bad shape fails loudly at field level.

## Tech

Next.js 14, TypeScript, Tailwind CSS, shadcn-style components (manually wired), Prisma 5.22, SQLite or Postgres, recharts, zod, next-themes, lucide-react.

## License

Code: MIT. The PMBOK Guide, Agile Practice Guide, etc. are trademarks of PMI; this app cites them, doesn't reproduce them.
