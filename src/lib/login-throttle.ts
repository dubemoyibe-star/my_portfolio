/**
 * Failed-login throttling for the admin gate.
 *
 * The password is the only thing in front of the content editor, so an
 * unthrottled login route is an offer to guess it a few thousand times a
 * minute. This makes that expensive without making the real login annoying:
 * the first attempt is instant, and the cost only shows up once someone is
 * clearly not the one person who knows the password.
 *
 * Two counters, doing different jobs:
 *
 *   - **Per client.** Escalating delay, then a hard lockout. This is the one
 *     that actually stops a run of guesses from a single source.
 *   - **Global.** A delay only, never a lockout. An attacker rotating IPs
 *     slips past the per-client counter entirely, and this makes that slow
 *     too. It deliberately cannot lock anyone out: a global lockout would let
 *     a stranger lock the admin out of their own site by failing on purpose.
 *
 * ## What this is not
 *
 * In-memory, so it is per server instance and it resets on deploy. On a
 * serverless platform several instances may each hold their own count, which
 * multiplies the real attempt budget by the number of warm instances. That is
 * a genuine weakness and an accepted one: the alternative is a Redis round
 * trip on every login for a site with exactly one user. If this ever needs to
 * be exact, the two maps below are the only thing that has to move.
 */

/* --------------------------------------------------------------------------
   Dials
   -------------------------------------------------------------------------- */

/** Failures from one client before it is locked out entirely. */
const MAX_FAILURES = 8;

/** A client's failure count resets after this long without a failure. */
const FAILURE_WINDOW_MS = 15 * 60_000;

/** How long a locked-out client stays locked out. */
const LOCKOUT_MS = 10 * 60_000;

/** Added per failure, per client — attempt 2 waits 300ms, attempt 3 600ms... */
const CLIENT_DELAY_STEP_MS = 300;

/** Added per recent failure site-wide, whoever caused it. */
const GLOBAL_DELAY_STEP_MS = 100;

/** Ceiling on the combined delay, so a wrong guess never looks like a hang. */
const MAX_DELAY_MS = 3_000;

/** Global failures older than this stop contributing to the global delay. */
const GLOBAL_WINDOW_MS = 60_000;

/**
 * Cap on tracked clients. Reached only under a distributed attack, which is
 * also the only situation where an unbounded map would be a memory leak.
 */
const MAX_TRACKED_CLIENTS = 5_000;

/* --------------------------------------------------------------------------
   State
   -------------------------------------------------------------------------- */

type ClientRecord = {
  failures: number;
  /** When the most recent failure happened, for windowing and pruning. */
  lastFailureAt: number;
  /** Epoch ms until which this client is refused outright; 0 when not locked. */
  lockedUntil: number;
};

const clients = new Map<string, ClientRecord>();

/** Timestamps of recent failures site-wide, oldest first. */
let globalFailures: number[] = [];

/**
 * Drop records that can no longer affect a decision.
 *
 * Called on every attempt rather than on a timer: an interval would keep a
 * serverless instance's event loop alive for a map that is almost always
 * empty, and there is no cheaper moment to sweep than the one request that
 * just touched it.
 */
function prune(now: number): void {
  globalFailures = globalFailures.filter(
    (at) => now - at < GLOBAL_WINDOW_MS,
  );

  for (const [key, record] of clients) {
    const expired =
      record.lockedUntil <= now && now - record.lastFailureAt > FAILURE_WINDOW_MS;
    if (expired) clients.delete(key);
  }

  /* Still too many after pruning means an attack in progress. Evicting the
     least recently seen is the safe direction: an active attacker keeps their
     record fresh and stays tracked, while what gets dropped is a stale entry
     that was about to expire anyway. */
  if (clients.size > MAX_TRACKED_CLIENTS) {
    const byAge = [...clients.entries()].sort(
      (a, b) => a[1].lastFailureAt - b[1].lastFailureAt,
    );
    for (const [key] of byAge.slice(0, clients.size - MAX_TRACKED_CLIENTS)) {
      clients.delete(key);
    }
  }
}

/* --------------------------------------------------------------------------
   Public API
   -------------------------------------------------------------------------- */

export type ThrottleVerdict =
  /** Go ahead and check the password. */
  | { allowed: true }
  /** Refuse without checking; `retryAfterSeconds` is when to come back. */
  | { allowed: false; retryAfterSeconds: number };

/**
 * Whether this client may attempt a password right now.
 *
 * Checked *before* the password comparison, so a locked-out client cannot use
 * the route as an oracle at all — not even a timing one.
 */
export function checkLoginAllowed(clientKey: string): ThrottleVerdict {
  const now = Date.now();
  prune(now);

  const record = clients.get(clientKey);
  if (record && record.lockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((record.lockedUntil - now) / 1000),
    };
  }

  return { allowed: true };
}

/**
 * Record a failed attempt and report how long to stall before answering.
 *
 * The delay is applied by the caller rather than in here, so the route stays
 * in control of what else it does while waiting and this module keeps no
 * timers of its own.
 */
export function recordLoginFailure(clientKey: string): number {
  const now = Date.now();

  const existing = clients.get(clientKey);
  /* A failure after a quiet window starts a fresh count rather than resuming
     an old one — otherwise a single typo a month would accumulate into a
     lockout for the legitimate user. */
  const carriedFailures =
    existing && now - existing.lastFailureAt <= FAILURE_WINDOW_MS
      ? existing.failures
      : 0;

  const failures = carriedFailures + 1;
  const lockedUntil = failures >= MAX_FAILURES ? now + LOCKOUT_MS : 0;

  clients.set(clientKey, { failures, lastFailureAt: now, lockedUntil });
  globalFailures.push(now);
  prune(now);

  /* `failures - 1` so the first wrong password answers immediately: someone
     who fat-fingered it once should not be made to wait, and one attempt
     costs an attacker nothing anyway. */
  const clientDelay = (failures - 1) * CLIENT_DELAY_STEP_MS;
  const globalDelay = Math.max(0, globalFailures.length - 1) * GLOBAL_DELAY_STEP_MS;

  return Math.min(clientDelay + globalDelay, MAX_DELAY_MS);
}

/**
 * Forget a client's failures after a correct password.
 *
 * Without this, eight typos spread over a week — each one followed by a
 * successful login — would eventually lock out the person who has been
 * logging in successfully the whole time.
 */
export function clearLoginFailures(clientKey: string): void {
  clients.delete(clientKey);
}

/** Sleep, for the caller to await before answering a failed attempt. */
export function stall(ms: number): Promise<void> {
  return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
}
