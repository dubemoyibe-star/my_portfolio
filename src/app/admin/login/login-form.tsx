"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { LockIcon } from "@/components/ui/lock-icon";
import { cn } from "@/lib/utils";

/**
 * Password form for the admin gate.
 *
 * A client component because it holds the field state and shows the error
 * inline; the page around it stays a server component.
 *
 * The password never leaves this component except as the body of one POST to
 * `/api/admin/login`. Nothing here compares it, hashes it or stores it — the
 * only code that has ever seen `ADMIN_PASSWORD` runs on the server, and the
 * client's entire share of the result is a cookie it cannot read.
 */

/** How long a failure message stays at full opacity before it starts to go. */
const ERROR_VISIBLE_MS = 6_000;

/**
 * The fade itself. Must match the `duration-500` on the message, because the
 * node is unmounted on this timer — unmounting early would cut the fade off
 * mid-way, and unmounting late would leave an invisible element holding space.
 */
const ERROR_FADE_MS = 500;
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  /**
   * Whether the message is currently fading out.
   *
   * Separate from `error` because the text has to survive the fade: dropping it
   * the moment dismissal starts would blank the message and then animate an
   * empty box out.
   */
  const [dismissing, setDismissing] = useState(false);

  /* Held so a second failure can cancel the first one's countdown. Without
     that, an error raised five seconds after the previous one inherits its
     one remaining second and blinks straight back out. */
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  /* Timers outlive the component if it unmounts mid-countdown — on a
     successful login, for instance, which navigates away while a previous
     failure is still on screen. */
  useEffect(() => clearTimers, [clearTimers]);

  /**
   * Show a failure message and schedule its own disappearance.
   *
   * Auto-dismissing is safe here in a way it usually is not: nothing is lost
   * when the message goes, because the only thing it ever says is "try again",
   * and trying again is what brings it back. Six seconds is past comfortable
   * reading for one sentence and well short of the message becoming furniture
   * the eye stops seeing.
   */
  const showError = useCallback(
    (message: string) => {
      clearTimers();
      setDismissing(false);
      setError(message);

      timersRef.current.push(
        window.setTimeout(() => setDismissing(true), ERROR_VISIBLE_MS),
        window.setTimeout(() => {
          setError(null);
          setDismissing(false);
        }, ERROR_VISIBLE_MS + ERROR_FADE_MS),
      );
    },
    [clearTimers],
  );

  const hideError = useCallback(() => {
    clearTimers();
    setError(null);
    setDismissing(false);
  }, [clearTimers]);

  /**
   * Where to go after a successful login.
   *
   * `?from=` is set by the middleware when it intercepts a request. It is
   * user-controllable, so it is only honoured when it is a site-relative path:
   * accepting an absolute URL here would turn the login page into an open
   * redirect that phishing can point anywhere. `//evil.com` is the case worth
   * spelling out — it starts with `/` but a browser reads it as a protocol
   * relative URL and leaves the site.
   */
  const requested = searchParams.get("from");
  const destination =
    requested && requested.startsWith("/") && !requested.startsWith("//")
      ? requested
      : "/admin";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    /* An empty field never reaches the server. That is a deliberate exception
       to the rule the rest of this flow follows — empty and wrong are the same
       answer once a request is made — because there is nothing to check yet:
       the round trip would spend a throttle attempt to say what is already
       known here. Not trimmed: a password may legitimately open or close with
       a space, and it is not this component's place to decide otherwise. */
    if (password.length === 0) {
      showError("Enter the password to unlock.");
      inputRef.current?.focus();
      return;
    }

    setPending(true);
    hideError();

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        showError(body?.error ?? "That didn't work. Give it another go.");
        /* Clear and refocus so the next attempt is one keystroke away rather
           than a select-all first. */
        setPassword("");
        inputRef.current?.focus();
        return;
      }

      setPassword("");
      /* `refresh()` after `push()` so the new server render sees the cookie —
         without it the destination can render from a pre-login cache. */
      router.push(destination);
      router.refresh();
    } catch {
      showError("Couldn't reach the server. Check your connection and retry.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-7 flex flex-col gap-3"
      noValidate
    >
      <label htmlFor="admin-password" className="label text-muted">
        Password
      </label>

      <input
        ref={inputRef}
        id="admin-password"
        name="password"
        type="password"
        autoComplete="current-password"
        autoFocus
        /* The form carries `noValidate`, so this does not summon the browser's
           own "please fill out this field" bubble — the one piece of unstyled
           chrome this page would otherwise render. It is here for what it says
           rather than what it enforces: a screen reader announces the field as
           required, and `handleSubmit` is what actually holds an empty submit
           back, in the site's own error styling. */
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        aria-invalid={error !== null}
        aria-describedby={error ? "admin-password-error" : undefined}
        className="h-11 rounded-md border border-border-strong bg-background px-3.5 font-mono text-body tracking-widest text-foreground transition-colors placeholder:tracking-normal placeholder:text-muted hover:border-muted focus:border-accent focus-visible:outline-none"
        placeholder="••••••••"
      />

      {/* Always mounted, so a screen reader announces the message as a change
          to a region it is already watching. A node that appears at the same
          moment its text does is announced unreliably across readers. */}
      <div aria-live="polite" className="min-h-0">
        {error ? (
          <p
            id="admin-password-error"
            className={cn(
              "mt-1 flex items-start gap-2 rounded-md border border-warning/30 bg-warning-subtle px-3 py-2.5 text-small text-warning",
              /* Opacity only — no height collapse. Reflowing the button up
                 mid-fade is how a user ends up clicking whatever slid under
                 their cursor. The base layer's reduced-motion rule already
                 flattens this transition to nothing, which leaves the message
                 simply disappearing on the same schedule. */
              "transition-opacity duration-500 ease-out-quart",
              dismissing ? "opacity-0" : "opacity-100",
            )}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4.5M12 16h.01" />
            </svg>
            {error}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-accent px-4 text-small font-medium text-background transition-shadow hover:shadow-glow-accent disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
      >
        {/* Stays put while pending. Swapping it for a spinner would reflow the
            label mid-submit for the sake of a state the button already
            announces in words. */}
        <LockIcon />
        {pending ? "Checking…" : "Unlock"}
      </button>
    </form>
  );
}
