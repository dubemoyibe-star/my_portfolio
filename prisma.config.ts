import path from "node:path";

import { defineConfig, env } from "prisma/config";

/**
 * Prisma CLI configuration.
 *
 * Prisma 7 moved connection URLs out of `schema.prisma` and split them in two,
 * which happens to be exactly the split Neon wants:
 *
 *  - **This file** configures the CLI — `migrate`, `db`, `studio`. It uses
 *    `DIRECT_URL`, the unpooled Neon endpoint, because the migration engine
 *    issues session-level statements (advisory locks, schema introspection)
 *    that PgBouncer's transaction pooling cannot carry.
 *
 *  - **`src/lib/prisma.ts`** configures the runtime client. It uses
 *    `DATABASE_URL`, the pooled `-pooler` endpoint, which is what keeps
 *    serverless invocations from exhausting the connection limit.
 *
 * Nothing at runtime reads this file, so the direct URL never reaches a
 * request path.
 */

/**
 * Load `.env.local` for local CLI runs.
 *
 * Prisma 7 no longer reads `.env` files on its own, and Next.js only loads them
 * for its own processes — a bare `prisma migrate` would otherwise see no
 * `DIRECT_URL` at all.
 *
 * Failure is expected and ignored: in CI and on Vercel there is no
 * `.env.local`, and the variables are already in the real environment.
 */
try {
  process.loadEnvFile(path.join(process.cwd(), ".env.local"));
} catch {
  /* No local env file — rely on the ambient environment. */
}

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    /* `prisma migrate reset` and `prisma db seed` both run this. */
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
