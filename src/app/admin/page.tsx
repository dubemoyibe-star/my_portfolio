import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Container } from "@/components/layout/container";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { LOGIN_PATH } from "@/lib/auth";

import { LogoutButton } from "./logout-button";

/**
 * The admin dashboard — a placeholder.
 *
 * There is nothing to manage here yet. This page exists so the gate has
 * somewhere to open onto, and so the session can be exercised end to end:
 * land here, refresh, sign out, get bounced back to the login screen.
 *
 * ## Why it checks the session again
 *
 * `middleware.ts` has already turned away anyone without a valid cookie, so
 * the check below looks redundant. It is not. The middleware's reach is a
 * matcher string in a config object: a route that ends up outside it — a
 * route group that moves, a path typo, a future `/dashboard` alias — loses
 * its guard silently, with nothing failing and no test going red. Repeating
 * the check where the data will actually be read means the gate travels with
 * the page rather than with a line in another file. Every admin page added
 * later should start the same way.
 */

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  /* Redirect rather than `requireAdmin()`'s throw: this is a page, and someone
     whose session simply expired should get the login form, not an error
     screen. The throwing variant stays the right call inside a data mutation,
     where there is no sensible page to fall back to. */
  if (!(await isAdminAuthenticated())) redirect(LOGIN_PATH);

  return (
    <Container className="py-16 lg:py-24">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label flex items-center gap-2 text-accent">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
            Signed in
          </p>
          <h1 className="mt-4 text-h3 text-foreground">Dashboard</h1>
          <p className="mt-2 max-w-prose-page text-body text-muted">
            The gate works. Content editing lands here next.
          </p>
        </div>

        <LogoutButton />
      </div>

      <div className="mt-10 rounded-lg border border-dashed border-border-strong bg-surface/40 p-8">
        <p className="label text-muted">Placeholder</p>
        <p className="mt-3 max-w-prose-page text-small text-muted">
          Projects, experience, education and certifications are read from
          Postgres through Prisma today and edited by hand. The editors for
          them belong in this space.
        </p>
      </div>
    </Container>
  );
}
