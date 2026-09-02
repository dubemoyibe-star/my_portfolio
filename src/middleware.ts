import { NextResponse, type NextRequest } from "next/server";

import { LOGIN_PATH, SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

/**
 * The gate in front of every admin route.
 *
 * This exists before any admin route does, on purpose. A guard added after the
 * pages leaves a window — a deploy, a branch, an afternoon — where the content
 * editor is publicly reachable. Written first, the matcher already covers
 * `/admin/*` and `/api/admin/*`, so a route created tomorrow is protected the
 * moment its file exists rather than the moment someone remembers to protect
 * it.
 *
 * Public routes are untouched: the matcher below never runs for them, so the
 * portfolio itself pays nothing for this.
 */

/** Routes reachable without a session — otherwise logging in is impossible. */
const PUBLIC_ADMIN_ROUTES = new Set([LOGIN_PATH, "/api/admin/login"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_ADMIN_ROUTES.has(pathname)) return NextResponse.next();

  const isAuthenticated = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
  );
  if (isAuthenticated) return NextResponse.next();

  /* API routes get a status code; a redirect to an HTML login page would be
     parsed as a malformed response by whatever fetched them. */
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  /* Pages get sent to the login form, carrying where they were headed so the
     login handler can return them there instead of dumping them at /admin. */
  const loginUrl = new URL(LOGIN_PATH, request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
