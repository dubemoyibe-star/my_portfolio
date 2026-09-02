import { NextResponse, type NextRequest } from "next/server";

import {
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  createSessionToken,
  verifyAdminPassword,
} from "@/lib/auth";

/**
 * Exchange the admin password for a session cookie.
 *
 * The one route reachable without a session — see `PUBLIC_ADMIN_ROUTES` in
 * `middleware.ts`. Everything else under `/admin` and `/api/admin` is closed
 * until this succeeds.
 */

/* Reads the request body and sets a cookie: nothing here is cacheable, and a
   cached 200 would hand the next visitor a session. */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let password: unknown;

  try {
    const body = await request.json();
    password = (body as { password?: unknown })?.password;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof password !== "string" || password.length === 0) {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  /* `verifyAdminPassword` throws if ADMIN_PASSWORD is unset. That is a
     misconfigured deployment, not a failed login — 500 says so, and returning
     401 instead would send someone hunting for a password that does not
     exist. */
  let isValid: boolean;
  try {
    isValid = verifyAdminPassword(password);
  } catch (error) {
    console.error("[admin] login is misconfigured:", error);
    return NextResponse.json(
      { error: "Admin login is not configured" },
      { status: 500 },
    );
  }

  if (!isValid) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const { value, maxAge } = await createSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, value, {
    ...SESSION_COOKIE_OPTIONS,
    maxAge,
  });
  return response;
}
