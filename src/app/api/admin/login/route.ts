import { NextResponse, type NextRequest } from "next/server";

import {
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  createSessionToken,
  verifyAdminPassword,
} from "@/lib/auth";
import {
  checkLoginAllowed,
  clearLoginFailures,
  recordLoginFailure,
  stall,
} from "@/lib/login-throttle";

/**
 * Exchange the admin password for a session cookie.
 *
 * The one route reachable without a session — see `PUBLIC_ADMIN_ROUTES` in
 * `middleware.ts`. Everything else under `/admin` and `/api/admin` is closed
 * until this succeeds.
 *
 * ## One failure message, always
 *
 * Empty field, wrong password, malformed body: all of them answer 401 with the
 * same sentence. Splitting them apart would be friendlier to the person
 * typing and equally friendly to a script — "password is required" versus
 * "incorrect password" confirms that the field reached a real comparison, and
 * a distinct 400 for a malformed body maps out the handler for free. The one
 * exception is a missing `ADMIN_PASSWORD`, which is a broken deployment rather
 * than a failed login and says so, because nobody can guess their way past a
 * password that does not exist.
 */

/** Said for every rejected attempt, whatever the reason. */
const FAILURE_MESSAGE = "That password didn't work. Give it another go.";

/* Reads the request body and sets a cookie: nothing here is cacheable, and a
   cached 200 would hand the next visitor a session. */
export const dynamic = "force-dynamic";

/**
 * Who is attempting, for throttling purposes.
 *
 * `x-forwarded-for` is a client-supplied header and is trivially spoofed when
 * nothing trusted rewrites it — which is exactly what Vercel and every other
 * managed platform does at the edge. Behind an unknown proxy the worst case is
 * that everyone shares the `unknown` bucket and throttles as one client, which
 * is stricter than intended rather than looser.
 */
function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    /* Leftmost entry is the original client; the rest were appended by hops
       along the way. */
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(request: NextRequest) {
  const key = clientKey(request);

  /* Checked before the body is even read, so a locked-out client cannot use
     this route to learn anything at all — including how long a comparison
     against the real password takes. */
  const verdict = checkLoginAllowed(key);
  if (!verdict.allowed) {
    return NextResponse.json(
      {
        error: `Too many attempts. Try again in ${formatWait(verdict.retryAfterSeconds)}.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(verdict.retryAfterSeconds) },
      },
    );
  }

  let password = "";
  try {
    const body: unknown = await request.json();
    const candidate = (body as { password?: unknown })?.password;
    if (typeof candidate === "string") password = candidate;
  } catch {
    /* Left empty. A body that will not parse fails the same way a wrong
       password does — see the note above. */
  }

  /* `verifyAdminPassword` throws if ADMIN_PASSWORD is unset. That is a
     misconfigured deployment, not a failed login — 500 says so, and returning
     401 instead would send someone hunting for a password that does not
     exist. Not counted as a failure either: locking someone out for the
     server's own misconfiguration would outlast the fix. */
  let isValid: boolean;
  try {
    isValid = verifyAdminPassword(password);
  } catch (error) {
    console.error("[admin] login is misconfigured:", error);
    return NextResponse.json(
      { error: "Admin login is not configured on the server." },
      { status: 500 },
    );
  }

  if (!isValid) {
    await stall(recordLoginFailure(key));
    return NextResponse.json({ error: FAILURE_MESSAGE }, { status: 401 });
  }

  clearLoginFailures(key);

  const { value, maxAge } = await createSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, value, {
    ...SESSION_COOKIE_OPTIONS,
    maxAge,
  });
  return response;
}

/** "45 seconds" / "10 minutes" — a wait worth reading, not a raw count. */
function formatWait(seconds: number): string {
  if (seconds < 60) return `${seconds} second${seconds === 1 ? "" : "s"}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}
