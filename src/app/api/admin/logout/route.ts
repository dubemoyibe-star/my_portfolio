import { NextResponse } from "next/server";

import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/auth";

/**
 * Drop the session cookie.
 *
 * POST rather than GET so a stray `<img src="/api/admin/logout">` on any page
 * on the internet cannot log the admin out.
 *
 * The clearing cookie reuses `SESSION_COOKIE_OPTIONS`: a browser only replaces
 * a cookie when name, path and domain all match, so a mismatch here would look
 * like a successful logout while leaving the session intact.
 */

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 0,
  });
  return response;
}
