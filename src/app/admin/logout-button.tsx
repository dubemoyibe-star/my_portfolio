"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Ends the session and returns to the login screen.
 *
 * POSTs to `/api/admin/logout`, which is what actually clears the cookie —
 * the cookie is `httpOnly`, so no amount of client JavaScript can remove it.
 * This component only asks.
 *
 * `replace` rather than `push`: after logging out, the browser's back button
 * should not offer the dashboard as somewhere to return to. The page it would
 * land on is gated by the middleware anyway, so the worst case is a redirect
 * rather than a leak — but an admin screen flashing back into view after a
 * deliberate logout reads as a bug whether or not it is one.
 */
export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      /* Ignored on purpose. A failed request means the cookie may still be
         set, and the redirect below sends the browser through the middleware,
         which is the authority on whether the session is really gone. */
    }
    router.replace("/admin/login");
    /* Drops the cached server render of the dashboard, so the next visit
       re-renders against the absent cookie instead of showing a stale page. */
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className={cn(
        "cursor-pointer inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3.5 text-small text-muted transition-colors hover:border-border-strong hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="size-4 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 17l5-5-5-5M20 12H9M12 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6" />
      </svg>
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
