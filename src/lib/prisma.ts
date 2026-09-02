import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

/**
 * The shared Prisma client.
 *
 * ## Why the pooled Neon URL
 *
 * `DATABASE_URL` points at Neon's pooled endpoint — the host with `-pooler` in
 * it — which fronts Postgres with PgBouncer. Serverless functions scale
 * horizontally with no shared process, so every concurrent invocation would
 * otherwise hold its own direct Postgres connection and exhaust the project's
 * connection limit under very modest traffic. PgBouncer multiplexes them onto a
 * small set of real backend connections instead.
 *
 * The unpooled `DIRECT_URL` exists for `prisma migrate` only, and is wired up
 * in `prisma.config.ts`. It is deliberately not read here: nothing on a request
 * path should ever open a direct connection.
 *
 * ## Why a global singleton
 *
 * Next.js hot-reloads modules in development on every save. A bare
 * `new PrismaClient()` at module scope would create a fresh client — and a
 * fresh pool — on each reload, and within a few minutes the database refuses
 * new connections. Caching on `globalThis` survives module reloading because
 * the global object is not replaced.
 *
 * In production the module evaluates once per server instance, so the global is
 * not strictly required — but a serverless platform reuses warm instances, and
 * reusing the client along with them is exactly what we want.
 *
 * ## Pool sizing
 *
 * `max: 1` looks aggressive for a pool and is the right number here. Each
 * serverless invocation handles one request; a larger local pool would just
 * hold idle PgBouncer slots that another concurrent invocation could have used.
 * Concurrency is Neon's pooler's job, not this process's.
 *
 * ## Runtime
 *
 * `@prisma/adapter-pg` speaks the Postgres wire protocol over TCP, which needs
 * the Node.js runtime. Every page and route that reads content runs there by
 * default, so nothing extra is required. A route that opts into
 * `runtime = "edge"` could not use this client — edge has no TCP sockets — and
 * would need `@prisma/adapter-neon` over Neon's WebSocket driver instead. No
 * route needs that today, so that dependency is not carried; swapping it in
 * later is a change to this file alone.
 */

function connectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and fill in " +
        "the pooled Neon connection string.",
    );
  }
  return url;
}

function createClient(): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: connectionString(),
      max: 1,
    }),
    /* Query logs are noisy on every page render; warnings and errors are the
       ones worth surfacing. */
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
