import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminNav } from "@/components/admin/admin-nav";
import { LogoutButton } from "@/components/admin/logout-button";
import { Container } from "@/components/layout/container";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { LOGIN_PATH } from "@/lib/auth";

/**
 * The shell every signed-in admin screen renders inside.
 *
 * ## Why a route group
 *
 * `/admin/login` is under `/admin`, so a layout placed at `src/app/admin/`
 * would wrap the login page too — and a layout that redirects unauthenticated
 * visitors to the login page, wrapped around the login page, is a redirect
 * loop. The `(dashboard)` group takes the guard and the chrome without taking
 * the URL segment: every page inside it still lives at `/admin/...`, and login
 * stays outside, unguarded and unadorned.
 *
 * ## Why the session is checked here as well as in the middleware
 *
 * The same argument `src/lib/admin-session.ts` makes: the middleware's reach is
 * a matcher string in another file, and a route that drifts outside it loses
 * its guard with nothing failing. Checking in the layout means every page in
 * this group is covered by construction — including one added a year from now
 * by someone who never reads `middleware.ts`.
 *
 * Reading the cookie also opts this whole subtree out of static rendering,
 * which is why the admin never needs revalidating: it re-reads the database on
 * every request. Only the public site is cached, and
 * `revalidatePublicContent()` is what pushes edits out to it.
 *
 * ## Why the site header and footer stay
 *
 * Both are rendered by the root layout and are not worth escaping. The header
 * is the way back to the public site — the thing an operator wants most after
 * saving something — and the footer is two lines. Building a second root
 * layout to be rid of them would mean moving every public page into a route
 * group of its own, which is a lot of churn to remove a link home.
 */

export const metadata: Metadata = {
  title: {
    /* Every admin page sets its own title; this suffixes them all and gives
       the group a default. The root layout's template appends the site name,
       which is left alone — a browser tab reading "Projects - Admin - Oyibe
       Chidubem" is exactly right when several are open. */
    default: "Admin",
    template: "%s - Admin",
  },
  /* Restated here rather than inherited: the root layout opts the site into
     indexing, and a `noindex` on the login page alone would leave every editor
     screen crawlable the moment one of them leaked into a link. */
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* Redirect rather than `requireAdmin()`'s throw: someone whose session simply
     expired should get the login form, not an error screen. The throwing
     variant stays the right call inside a mutation, where there is no sensible
     page to fall back to. */
  if (!(await isAdminAuthenticated())) redirect(LOGIN_PATH);

  return (
    <Container width="wide" className="py-8 lg:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="label flex items-center gap-2 text-accent">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-accent"
            />
            Signed in
          </p>
          <p className="mt-1.5 text-small text-muted">
            Edits here are live on the public site as soon as they save.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-3.5 text-small text-muted transition-colors hover:border-border-strong hover:text-foreground"
          >
            View site
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="size-3.5 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 17L17 7M9 7h8v8" />
            </svg>
          </Link>

          <LogoutButton />
        </div>
      </div>

      <div className="mt-6">
        <AdminNav />
      </div>

      <div className="mt-8">{children}</div>
    </Container>
  );
}
