import { cookies } from "next/headers";

import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

/**
 * Session reads for server components and route handlers.
 *
 * Split out from `@/lib/auth` because `next/headers` cannot be imported into
 * the edge middleware bundle. `auth.ts` stays runtime-agnostic so both sides
 * share one implementation of the signing; this file is the Node-side half
 * that knows how to find the cookie.
 *
 * `middleware.ts` already blocks unauthenticated requests to `/admin/*`, so
 * calling `requireAdmin()` inside a page looks redundant. It is not: middleware
 * matching is a config string, and a route that lands outside the matcher — a
 * server action, a route group that moves, a path typo — silently loses its
 * guard with nothing failing. Checking again where the data is actually read
 * means the gate travels with the code that needs it.
 */

/** Whether the current request carries a valid admin session. */
export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/**
 * Assert an admin session, throwing if there is none.
 *
 * For use at the top of anything that reads or writes admin-only data. The
 * throw is a backstop for a routing mistake, not the primary UX — an
 * unauthenticated visitor is redirected by the middleware long before this
 * runs, and should never see the resulting error page.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized: admin session required");
  }
}
