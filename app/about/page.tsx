import Link from "next/link";
import { Info, BookOpenCheck, ShieldCheck, FileWarning } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-2">
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Info className="h-7 w-7" /> About CAPM Prep
        </h1>
        <p className="text-sm text-muted-foreground">
          Independent practice for the Certified Associate in Project
          Management (CAPM)® exam.
        </p>
      </header>

      <section className="rounded-lg border bg-card p-6 space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <FileWarning className="h-5 w-5" /> Not affiliated with PMI
        </h2>
        <p className="text-sm">
          This app is an independent study tool. It is{" "}
          <strong>not</strong> created, endorsed, sponsored, reviewed, or
          authorized by the Project Management Institute (PMI).
        </p>
        <p className="text-sm">
          “CAPM” and “PMI” are trademarks of the Project Management Institute,
          Inc., used here only to describe the certification this tool helps
          prepare for.
        </p>
      </section>

      <section className="rounded-lg border bg-card p-6 space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <BookOpenCheck className="h-5 w-5" /> Original ECO-aligned questions
        </h2>
        <p className="text-sm">
          Every question in the bank is original work, written from scratch to
          mirror the format and rigor of the real exam. Each question is
          mapped to a specific 2024 CAPM Exam Content Outline (ECO) task and
          cites a section of the PMBOK Guide 7th Edition, Agile Practice
          Guide, Process Groups Practice Guide, or Business Analysis for
          Practitioners.
        </p>
        <p className="text-sm">
          No content is copied from PMI&apos;s official exam, Pearson VUE
          materials, or copyrighted prep books. Questions reflect the same
          domain weights (36/17/20/27) and difficulty mix the real exam uses.
        </p>
      </section>

      <section className="rounded-lg border bg-card p-6 space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <ShieldCheck className="h-5 w-5" /> Your data
        </h2>
        <p className="text-sm">
          Sessions, answers, bookmarks, schedules, and streaks all live in
          your local database. There is no analytics or third-party tracking.
          You can grab your full data set any time from the{" "}
          <Link href="/export" className="underline">
            export page
          </Link>
          .
        </p>
      </section>

      <section className="rounded-lg border bg-card p-6 space-y-2">
        <h2 className="text-lg font-semibold">References used</h2>
        <ul className="list-inside list-disc text-sm text-muted-foreground">
          <li>
            PMI <em>Examination Content Outline (ECO)</em> for CAPM, 2024
            edition (structure only)
          </li>
          <li>
            <em>PMBOK Guide</em>, 7th Edition (PMI, 2021)
          </li>
          <li>
            <em>Agile Practice Guide</em> (PMI, 2017)
          </li>
          <li>
            <em>Process Groups: A Practice Guide</em> (PMI, 2022)
          </li>
          <li>
            <em>Business Analysis for Practitioners: A Practice Guide</em>{" "}
            (PMI, 2015)
          </li>
        </ul>
      </section>

      <p className="text-xs text-muted-foreground">
        Bug, mistake, or question you&apos;d phrase differently? Patch the
        relevant <code className="rounded bg-muted px-1">questions-*.json</code>
        file and re-run <code className="rounded bg-muted px-1">npm run seed</code>
        — the upsert is keyed by content hash, so edits flow through cleanly.
      </p>
    </div>
  );
}
