import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Container } from "@/components/layout/container";

import { LoginForm } from "./login-form";

/**
 * The admin login screen.
 *
 * Deliberately one card on an empty page: there is nothing else to do here,
 * and the only decision on offer is "type the password or leave". The site
 * header and footer still frame it, because this is a room in the same
 * building — same ground, same fonts, same one accent, and a way back to the
 * public site that does not require the back button.
 *
 * Everything below is tokens and existing utilities: `label` for the mono
 * eyebrow, `surface` for the raised card, `border` for its hairline, and the
 * single accent on the submit button, which is the only action in the
 * viewport.
 */

export const metadata: Metadata = {
  title: "Admin",
  /* Keep the login form out of search results and off the sitemap's radar. */
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <Container
      width="prose"
      /* Header height comes out of the viewport so the card centres in the
         space actually left for it rather than sitting low on the page. */
      className="flex min-h-[calc(100svh-var(--header-height))] max-w-md items-center py-16"
    >
      <div className="w-full">
        <div className="rounded-lg border border-border bg-surface/70 p-6 backdrop-blur-sm sm:p-8">
          <p className="label flex items-center gap-2 text-accent">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
            Restricted
          </p>

          <h1 className="mt-4 text-h4 text-foreground">Admin access</h1>
          <p className="mt-2 text-small text-muted">
            One password stands between here and the content editor. If you
            landed here by accident, there is nothing for you behind it.
          </p>

          {/* `LoginForm` reads `?from=` with `useSearchParams()`, which forces a
              client-side bail-out during prerendering. The boundary keeps that
              contained to the form instead of making the whole page dynamic.
              The fallback matches the form's height so the card does not jump
              once it hydrates. */}
          <Suspense fallback={<div className="mt-7 h-38" aria-hidden="true" />}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-small text-muted">
          <Link
            href="/"
            className="transition-colors hover:text-link focus-visible:text-link"
          >
            ← Back to the site
          </Link>
        </p>
      </div>
    </Container>
  );
}
