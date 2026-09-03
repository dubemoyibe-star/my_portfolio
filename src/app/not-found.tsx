import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion/reveal";
import { RequestedPath } from "@/app/requested-path";
import { getSiteIdentity } from "@/lib/site-identity";

/**
 * The role, in the site's own register rather than the CV's.
 *
 * The identity's `role` is `profile.resume.title` — "Fullstack web developer
 * and blockchain developer" — the formal phrasing the CV speaks in. The
 * home page's title uses this shorter form, and someone who landed here from a
 * stray link should read the same line they would have read there.
 */
const ROLE = "Fullstack & Blockchain Developer";

/**
 * Where a lost visitor can go. Deliberately not `siteConfig.nav`: that is the
 * header's set — the sections worth a persistent slot next to a wordmark —
 * while this is a rescue list, so it leads with Home and includes the CV and
 * Education that the header either promotes elsewhere or leaves out.
 */
const DESTINATIONS = [
  { label: "Home", href: "/" },
  { label: "Projects", href: "/#projects" },
  { label: "Contributions", href: "/#contributions" },
  { label: "CV", href: "/cv" },
  { label: "Education", href: "/#education" },
] as const;

/**
 * Best-effort: Next renders this file for any unmatched route, and what it
 * does with a metadata export here has moved between versions. The title is
 * the part worth having — a tab reading "404" beats one reading the site
 * default — and `noindex` states the obvious for a crawler that follows a
 * dead link, since the 404 status already says it.
 */
export async function generateMetadata(): Promise<Metadata> {
  const identity = await getSiteIdentity();
  return {
    title: { absolute: `404 — Page not found - ${identity.name}` },
    robots: { index: false, follow: true },
  };
}

/**
 * 404.
 *
 * Uses the App Router's `not-found` convention, so it answers every unmatched
 * route rather than only a link someone remembered to point here, and it
 * renders inside the root layout — header, footer and ambience included. That
 * is the point: the page a broken link lands on should look like a room in the
 * building, not the pavement outside it.
 *
 * Renders whatever the database is doing. The name is live content now — a
 * 404 that introduces you by a stale name is a small lie on the page whose
 * only job is to be honest about what went wrong — but it is read through
 * `getSiteIdentity()`, which answers from the seed rather than throwing when
 * Postgres cannot be reached. That preserves the property this page has always
 * had, and needs most: a visitor is most likely to land here exactly when
 * something else is already broken. Nothing else on the page reads content,
 * and the requested path comes from the browser.
 *
 * The error itself is drawn as terminal output because that is the identity
 * the rest of the site already uses for data: a mono log block, the accent on
 * the status code, amber on the error line — the token whose whole job is
 * "something is degraded". No illustration, no new hue.
 */
export default async function NotFound() {
  const identity = await getSiteIdentity();

  return (
    <section className="relative overflow-hidden">
      {/* Same masked engineering grid as the hero, so the page reads as part
          of the site rather than as a bare error screen. Decorative. */}
      <div
        aria-hidden="true"
        className="grid-backdrop pointer-events-none absolute inset-0"
      />

      <Container className="relative flex min-h-[60svh] flex-col justify-center py-20 lg:py-28">
        <Reveal className="max-w-prose-page">
          {/* The log block. Left edge of the prompt, the status code and the
              error all sit on one line so it scans as a single transcript. */}
          <div
            data-reveal
            className="rounded-lg border border-border bg-surface/70 p-5 font-mono lg:p-7"
          >
            <p className="flex flex-wrap items-baseline gap-x-2 text-small">
              <span aria-hidden="true" className="text-accent">
                $
              </span>
              <span className="text-muted">cd</span>
              <span className="break-all text-foreground">
                <RequestedPath />
              </span>
            </p>

            <h1 className="mt-4 text-[clamp(3.5rem,11vw,6.5rem)] font-semibold leading-none tracking-tight text-accent">
              404
              <span className="sr-only"> — page not found</span>
            </h1>

            <p className="mt-4 text-small text-warning">
              cd: no such route on this site
            </p>
          </div>

          <p data-reveal className="mt-10 text-pretty text-h4 text-foreground">
            This page doesn&apos;t exist, but you&apos;re in the right place.
          </p>

          <p data-reveal className="mt-5 text-pretty text-body-lg text-muted">
            <span className="font-mono text-foreground">{identity.name}</span>{" "}
            — {ROLE}. This is my portfolio: the things I&apos;ve built, the open
            source I contribute to, and my CV. Whatever the link you followed
            was pointing at, it is probably one of these.
          </p>

          <nav
            data-reveal
            aria-label="Site sections"
            className="mt-10 flex flex-wrap items-center gap-2.5"
          >
            {DESTINATIONS.map(({ label, href }, index) => {
              /* Home is the one accent-filled control on the page — per the
                 palette rule, accent marks the action, and getting back into
                 the site is the action a 404 exists to offer. The rest are
                 peers of each other, so they stay quiet chrome. */
              const primary = index === 0;

              const className = primary
                ? "inline-flex h-10 items-center rounded-md bg-accent px-4 text-small font-medium text-background transition-shadow hover:shadow-glow-accent"
                : "inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-small text-muted transition-colors hover:border-accent/40 hover:bg-surface-raised hover:text-foreground";

              /* Section links stay plain anchors, as in the header: the
                 browser already treats a root-relative fragment as a normal
                 navigation from a route that is not `/`, and it needs no
                 JavaScript to do it. Real routes get `Link` and its
                 prefetching. */
              return href.includes("#") ? (
                <a key={href} href={href} className={className}>
                  {label}
                </a>
              ) : (
                <Link key={href} href={href} className={className}>
                  {label}
                </Link>
              );
            })}
          </nav>
        </Reveal>
      </Container>
    </section>
  );
}
