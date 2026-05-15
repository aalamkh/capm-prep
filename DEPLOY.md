# Deploying CAPM Prep

The codebase ships configured for local SQLite (zero setup) and is ready to
swap to Postgres for production. The schema is portable — no enums, no
native JSON columns — so the same `prisma/schema.prisma` works against either
provider.

## Local development (default)

```bash
npm install
npx prisma migrate dev      # applies SQLite migrations
npm run seed                # 150 questions
npm run dev
```

`DATABASE_URL` defaults to `file:./dev.db` (in `.env`). No Postgres needed.

## Production: Vercel + Vercel Postgres

The deploy uses an env-driven provider: the `vercel-build` script detects
the scheme of `DATABASE_URL` and rewrites `prisma/schema.prisma`'s provider
line before running Prisma.

### One-time setup

1. **Push the repo to GitHub.**
2. **Import to Vercel** (Project → Add New → Import Git Repository).
3. **Provision Vercel Postgres** in the Storage tab. Vercel auto-injects:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL` (with connection pooling, what we use)
   - `POSTGRES_URL_NON_POOLING`
4. **Map `DATABASE_URL`**: in Project → Settings → Environment Variables, add
   ```
   DATABASE_URL = ${POSTGRES_PRISMA_URL}
   ```
   for Production, Preview, and Development environments.
5. **Override the build command** (Project → Settings → Build & Development
   Settings):
   ```
   npm run vercel-build
   ```
   That script does, in order:
   - `node scripts/configure-prisma-provider.js` — flips `provider = "sqlite"`
     to `provider = "postgresql"` based on the runtime `DATABASE_URL`.
   - `prisma generate` — regenerates the client for the new provider.
   - `prisma db push --accept-data-loss --skip-generate` — syncs the schema
     to the empty Postgres database. (Use `migrate deploy` instead once the
     prod DB has stable data and you're committed to versioned migrations.)
   - `tsx prisma/seed.ts` — seeds the 150 questions.
   - `next build` — builds the app.

### Subsequent deploys

`db push` is idempotent for additive schema changes. For breaking changes,
generate a Postgres-specific migration locally against a Postgres dev DB and
swap the `db push` step for `prisma migrate deploy`.

## Other Postgres hosts (Neon / Supabase / Railway / etc.)

Same flow — the only thing that matters is that `DATABASE_URL` starts with
`postgres://` or `postgresql://`. The provider-swap script handles the rest.

## Rolling back to SQLite

If `DATABASE_URL` is `file:...`, the swap script writes
`provider = "sqlite"` and the build runs against SQLite. You can flip the
two without changing application code.

## Notes

- **Migration history is provider-specific.** SQLite and Postgres can't
  share the same `prisma/migrations` directory. If you want versioned
  Postgres migrations, generate them in a separate branch / shadow DB.
- **No secrets in the repo.** `.env` is in `.gitignore`. Store Postgres
  credentials in Vercel only.
- **Edge runtime is not used.** All API routes use the Node runtime so the
  Prisma client works without the data-proxy.
