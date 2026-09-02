/**
 * The admin gate.
 *
 * Single-user auth: one password in `ADMIN_PASSWORD`, one signed session
 * cookie. There is no user table, no registration and no password reset,
 * because there is exactly one person who will ever log in and adding those
 * would be more code to get wrong, not more security.
 *
 * ## What the cookie is
 *
 * `<expiryEpochSeconds>.<hmacSha256(secret, expiryEpochSeconds)>`, base64url
 * for the signature. It carries no identity — there is only one user — and no
 * secret. Holding it proves the bearer knew `ADMIN_PASSWORD` at some point
 * within the session window, which is the entire claim being made.
 *
 * The expiry is inside the signed payload rather than left to the cookie's own
 * `Max-Age`. A client controls when it sends a cookie and can keep sending an
 * expired one; it cannot change a value the server signed.
 *
 * ## Why Web Crypto rather than `node:crypto`
 *
 * `middleware.ts` runs on the edge runtime, where `node:crypto` is not
 * available. Using `crypto.subtle` — present in both runtimes — lets the
 * middleware and the route handlers share one implementation instead of
 * keeping two in sync.
 *
 * ## What this is not
 *
 * Not rate-limited, and not multi-user. Both are fine at one user with a strong
 * password on an HTTPS-only cookie; neither would be fine if this grew a second
 * account. Revisit if it ever does.
 */

/** How long a session lasts before the password is required again. */
const SESSION_DURATION_SECONDS = 60 * 60 * 12; // 12 hours

export const SESSION_COOKIE = "portfolio_admin_session";

/**
 * Cookie attributes, shared by the login and logout handlers so the two cannot
 * disagree — a `Set-Cookie` that clears must match the one that set, or the
 * browser keeps the original.
 */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

/** Where an unauthenticated request to an admin route is sent. */
export const LOGIN_PATH = "/admin/login";

/* ==========================================================================
   Environment
   ========================================================================== */

/**
 * Read a required secret, failing loudly if it is missing.
 *
 * Throwing is deliberate. A missing `ADMIN_PASSWORD` that silently produced a
 * "wrong password" response would look like a typo and be debugged as one; a
 * missing `ADMIN_SESSION_SECRET` that silently fell back to a default would
 * make every session cookie forgeable by anyone who read this file. Both fail
 * closed instead.
 */
function requireEnv(name: "ADMIN_PASSWORD" | "ADMIN_SESSION_SECRET"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Copy .env.example to .env.local and fill it in — ` +
        `the admin routes cannot be served safely without it.`,
    );
  }
  return value;
}

/* ==========================================================================
   Signing
   ========================================================================== */

const encoder = new TextEncoder();

async function signingKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(requireEnv("ADMIN_SESSION_SECRET")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toBase64Url(bytes: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(payload: string): Promise<string> {
  const signature = await crypto.subtle.sign(
    "HMAC",
    await signingKey(),
    encoder.encode(payload),
  );
  return toBase64Url(signature);
}

/**
 * Compare two strings in time independent of where they first differ.
 *
 * `a === b` on a signature leaks, through timing, how many leading bytes were
 * correct, which is enough to reconstruct a valid signature byte by byte. The
 * length check up front is not a leak: signature length is fixed and public.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/* ==========================================================================
   Public API
   ========================================================================== */

/**
 * Check a submitted password against `ADMIN_PASSWORD`.
 *
 * Compared in constant time for the same reason the signature is: a plain
 * `===` on a secret reveals its length and prefix through response timing.
 */
export function verifyAdminPassword(candidate: string): boolean {
  return timingSafeEqual(candidate, requireEnv("ADMIN_PASSWORD"));
}

/** Mint a signed session token. Return value goes straight into the cookie. */
export async function createSessionToken(): Promise<{
  value: string;
  maxAge: number;
}> {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
  const payload = String(expiresAt);
  return {
    value: `${payload}.${await sign(payload)}`,
    maxAge: SESSION_DURATION_SECONDS,
  };
}

/**
 * Whether a cookie value is a live, untampered session.
 *
 * Every failure path returns `false` rather than throwing or distinguishing
 * "malformed" from "expired" from "bad signature" — the caller has the same
 * response for all three, and telling them apart only helps an attacker.
 */
export async function verifySessionToken(
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;

  const separator = token.lastIndexOf(".");
  if (separator <= 0) return false;

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  if (!timingSafeEqual(signature, await sign(payload))) return false;

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt)) return false;

  return expiresAt > Math.floor(Date.now() / 1000);
}
