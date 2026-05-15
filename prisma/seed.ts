/**
 * CAPM Prep seed script.
 *
 * Reads /data/questions-*.json, validates with zod, then upserts into the
 * Question table. Each question's id is derived from a SHA-256 hash of its
 * questionText so re-runs are idempotent and edits flow through cleanly.
 *
 * Run: npm run seed   (or)   npx prisma db seed
 */

import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const prisma = new PrismaClient();

// ---------- Schemas ---------------------------------------------------------

const Domain = z.enum([
  "FUNDAMENTALS",
  "PREDICTIVE",
  "AGILE",
  "BUSINESS_ANALYSIS",
]);
const Difficulty = z.enum(["EASY", "MEDIUM", "HARD"]);

const Common = z.object({
  domain: Domain,
  difficulty: Difficulty,
  ecoTask: z.string().min(3),
  questionText: z.string().min(10),
  explanation: z.string().min(20),
  reference: z.string().min(3),
});

const SingleQ = Common.extend({
  type: z.literal("SINGLE"),
  options: z.array(z.string().min(1)).length(4),
  correctAnswer: z.number().int().min(0).max(3),
});

const MultiQ = Common.extend({
  type: z.literal("MULTI"),
  options: z.array(z.string().min(1)).length(5),
  correctAnswer: z
    .array(z.number().int().min(0).max(4))
    .min(2)
    .max(5),
}).refine((q) => /\(Select \d+\)\s*$/.test(q.questionText), {
  message: "MULTI questionText must end with '(Select N)'",
  path: ["questionText"],
});

const MatchingQ = Common.extend({
  type: z.literal("MATCHING"),
  options: z.object({
    left: z.array(z.string().min(1)).min(2),
    right: z.array(z.string().min(1)).min(2),
  }),
  correctAnswer: z.array(z.number().int().min(0)),
}).refine(
  (q) =>
    q.correctAnswer.length === q.options.left.length &&
    q.correctAnswer.every((idx) => idx < q.options.right.length),
  {
    message:
      "MATCHING correctAnswer must have one entry per `left` row, each a valid `right` index",
    path: ["correctAnswer"],
  }
);

const HotspotQ = Common.extend({
  type: z.literal("HOTSPOT"),
  options: z.object({
    imageUrl: z.string().min(1),
    regions: z
      .array(
        z.object({
          id: z.string().min(1),
          label: z.string().min(1),
          x: z.number(),
          y: z.number(),
          w: z.number(),
          h: z.number(),
        })
      )
      .min(2),
  }),
  correctAnswer: z.string().min(1),
}).refine((q) => q.options.regions.some((r) => r.id === q.correctAnswer), {
  message: "HOTSPOT correctAnswer must match a region id",
  path: ["correctAnswer"],
});

const FillBlankQ = Common.extend({
  type: z.literal("FILL_BLANK"),
  options: z.null(),
  correctAnswer: z.array(z.string().min(1)).min(1),
});

const QuestionSchema = z.discriminatedUnion("type", [
  SingleQ,
  MultiQ,
  MatchingQ,
  HotspotQ,
  FillBlankQ,
]);

type SeedQuestion = z.infer<typeof QuestionSchema>;

// ---------- Helpers ---------------------------------------------------------

const FILES: { path: string; expectedDomain: z.infer<typeof Domain> }[] = [
  { path: "questions-fundamentals.json", expectedDomain: "FUNDAMENTALS" },
  { path: "questions-predictive.json", expectedDomain: "PREDICTIVE" },
  { path: "questions-agile.json", expectedDomain: "AGILE" },
  {
    path: "questions-business-analysis.json",
    expectedDomain: "BUSINESS_ANALYSIS",
  },
];

function stableId(questionText: string): string {
  return createHash("sha256")
    .update(questionText.trim())
    .digest("hex")
    .slice(0, 24);
}

function loadFile(filename: string): unknown[] {
  const full = join(process.cwd(), "data", filename);
  const raw = readFileSync(full, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`${filename}: top-level value must be an array`);
  }
  return parsed;
}

function validate(
  raw: unknown[],
  filename: string,
  expectedDomain: z.infer<typeof Domain>
): SeedQuestion[] {
  const out: SeedQuestion[] = [];
  raw.forEach((entry, i) => {
    const result = QuestionSchema.safeParse(entry);
    if (!result.success) {
      const issues = result.error.issues
        .map((iss) => `    - ${iss.path.join(".") || "(root)"}: ${iss.message}`)
        .join("\n");
      throw new Error(
        `${filename}[${i}] failed validation:\n${issues}\n  raw: ${JSON.stringify(
          entry
        ).slice(0, 200)}`
      );
    }
    if (result.data.domain !== expectedDomain) {
      throw new Error(
        `${filename}[${i}] domain ${result.data.domain} does not match file domain ${expectedDomain}`
      );
    }
    out.push(result.data);
  });
  return out;
}

// ---------- Seeding --------------------------------------------------------

async function main() {
  const all: SeedQuestion[] = [];
  const fileCounts: Record<string, number> = {};

  for (const { path, expectedDomain } of FILES) {
    const raw = loadFile(path);
    const validated = validate(raw, path, expectedDomain);
    all.push(...validated);
    fileCounts[path] = validated.length;
  }

  console.log(`\nValidated ${all.length} questions across ${FILES.length} files.`);
  for (const [path, n] of Object.entries(fileCounts)) {
    console.log(`  ${path.padEnd(40)} ${n}`);
  }

  // Detect duplicate questionText (would collide on hashed id).
  const seen = new Map<string, number>();
  all.forEach((q, i) => {
    const id = stableId(q.questionText);
    if (seen.has(id)) {
      throw new Error(
        `Duplicate questionText (or hash collision) at index ${i} and ${seen.get(
          id
        )}: "${q.questionText.slice(0, 80)}..."`
      );
    }
    seen.set(id, i);
  });

  let created = 0;
  let updated = 0;
  for (const q of all) {
    const id = stableId(q.questionText);
    const data = {
      type: q.type,
      domain: q.domain,
      difficulty: q.difficulty,
      ecoTask: q.ecoTask,
      questionText: q.questionText,
      options: JSON.stringify(q.options),
      correctAnswer: JSON.stringify(q.correctAnswer),
      explanation: q.explanation,
      reference: q.reference,
    };
    const existing = await prisma.question.findUnique({ where: { id } });
    if (existing) {
      await prisma.question.update({ where: { id }, data });
      updated++;
    } else {
      await prisma.question.create({ data: { id, ...data } });
      created++;
    }
  }

  console.log(`\nUpserted: ${created} created, ${updated} updated.`);

  // ---- Summary table -----------------------------------------------------
  const domains: Array<z.infer<typeof Domain>> = [
    "FUNDAMENTALS",
    "PREDICTIVE",
    "AGILE",
    "BUSINESS_ANALYSIS",
  ];
  const diffs: Array<z.infer<typeof Difficulty>> = ["EASY", "MEDIUM", "HARD"];
  const types = ["SINGLE", "MULTI", "MATCHING", "HOTSPOT", "FILL_BLANK"];

  console.log("\nDomain × Difficulty × Type breakdown:\n");
  const head = ["Domain", "Difficulty", ...types, "Total"];
  const rows: string[][] = [head];

  let grand = 0;
  for (const d of domains) {
    let domainTotal = 0;
    for (const diff of diffs) {
      const row: string[] = [d, diff];
      let rowTotal = 0;
      for (const t of types) {
        const n = all.filter(
          (q) => q.domain === d && q.difficulty === diff && q.type === t
        ).length;
        row.push(String(n));
        rowTotal += n;
      }
      row.push(String(rowTotal));
      domainTotal += rowTotal;
      rows.push(row);
    }
    rows.push([`${d} total`, "", "", "", "", "", "", String(domainTotal)]);
    grand += domainTotal;
  }
  rows.push(["GRAND TOTAL", "", "", "", "", "", "", String(grand)]);

  // pretty print
  const widths = head.map((_, i) =>
    Math.max(...rows.map((r) => (r[i] ?? "").length))
  );
  for (const r of rows) {
    console.log(
      r.map((cell, i) => (cell ?? "").padEnd(widths[i])).join("  ")
    );
  }
  console.log();
}

main()
  .catch((err) => {
    console.error("Seed failed:");
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
