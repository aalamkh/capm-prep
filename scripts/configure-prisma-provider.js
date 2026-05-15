#!/usr/bin/env node
/**
 * Rewrites prisma/schema.prisma `provider` based on the runtime DATABASE_URL.
 *
 *   file:./dev.db                 → "sqlite"
 *   postgres://… / postgresql://… → "postgresql"
 *   mysql://…                     → "mysql"
 *
 * Run by the `vercel-build` script (and any other CI build) before
 * `prisma generate` / `prisma migrate deploy` so the schema matches the
 * connected database. Local dev stays on SQLite by default.
 */
const fs = require("fs");
const path = require("path");

const SCHEMA_PATH = path.join(__dirname, "..", "prisma", "schema.prisma");

function detectProvider(url) {
  if (!url) return null;
  if (url.startsWith("file:")) return "sqlite";
  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
    return "postgresql";
  }
  if (url.startsWith("mysql://")) return "mysql";
  if (url.startsWith("sqlserver://")) return "sqlserver";
  return null;
}

function main() {
  const url = process.env.DATABASE_URL;
  const provider = detectProvider(url);
  if (!provider) {
    console.error(
      `[configure-prisma-provider] Could not detect provider from DATABASE_URL=${
        url ?? "(unset)"
      }. Leaving schema unchanged.`
    );
    return;
  }
  const original = fs.readFileSync(SCHEMA_PATH, "utf8");
  // Only target the `datasource db { ... provider = "..." ... }` block.
  // The `generator client { provider = "prisma-client-js" }` line MUST NOT
  // change.
  const updated = original.replace(
    /(datasource\s+db\s*\{[^}]*?provider\s*=\s*")[^"]+(")/,
    `$1${provider}$2`
  );
  if (updated === original) {
    console.log(
      `[configure-prisma-provider] schema.prisma already uses provider="${provider}" (or no datasource block matched).`
    );
    return;
  }
  fs.writeFileSync(SCHEMA_PATH, updated);
  console.log(
    `[configure-prisma-provider] datasource provider set to "${provider}".`
  );
}

main();
