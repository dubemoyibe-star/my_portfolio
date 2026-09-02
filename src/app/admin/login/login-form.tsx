"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

/**
 * Password form for the admin gate.
 *
 * A client component because it holds the field state and shows the error
 * inline; the page around it stays a server component.
 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  /**
   * Where to go after a successful login.
   *
   * `?from=` is set by the middleware when it intercepts a request. It is
   * user-controllable, so it is only honoured when it is a site-relative path:
   * accepting an absolute URL here would turn the login page into an open
   * redirect that phishing can point anywhere.
   */
  const requested = searchParams.get("from");
  const destination =
    requested && requested.startsWith("/") && !requested.startsWith("//")
      ? requested
      : "/admin";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.error ?? "Login failed");
        return;
      }

      setPassword("");
      /* `refresh()` after `push()` so the new server render sees the cookie —
         without it the destination can render from a pre-login cache. */
      router.push(destination);
      router.refresh();
    } catch {
      setError("Could not reach the server");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
      <label htmlFor="admin-password" className="sr-only">
        Admin password
      </label>
      <input
        id="admin-password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        aria-invalid={error !== null}
        aria-describedby={error ? "admin-password-error" : undefined}
        className="h-10 rounded-md border border-border-strong bg-surface px-3 text-body text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent"
        placeholder="Password"
      />

      <button
        type="submit"
        disabled={pending || password.length === 0}
        className="h-10 rounded-md bg-accent px-4 text-small font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>

      {error ? (
        <p id="admin-password-error" role="alert" className="text-small text-warning">
          {error}
        </p>
      ) : null}
    </form>
  );
}
