import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "./login-form";

/**
 * The admin login screen.
 *
 * The minimum needed for the gate to be usable — the password field and
 * nothing else. There is no admin UI behind it yet; this exists now so the
 * guard is in place before the first admin route is written rather than after.
 */

export const metadata: Metadata = {
  title: "Admin",
  /* Keep the login form out of search results and off the sitemap's radar. */
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center px-[--page-gutter]">
      <div className="w-full max-w-sm">
        <h1 className="text-h4 text-foreground">Admin</h1>
        <p className="mt-2 text-small text-muted">
          Enter the admin password to manage site content.
        </p>
        {/* `LoginForm` reads `?from=` with `useSearchParams()`, which forces a
            client-side bail-out during prerendering. The boundary keeps that
            contained to the form instead of making the whole page dynamic. */}
        <Suspense fallback={<div className="mt-6 h-22" />}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
