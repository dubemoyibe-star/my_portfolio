import type { Metadata } from "next";
import Link from "next/link";

import {
  AdminPageHeader,
  Banner,
  Panel,
} from "@/components/admin/chrome";
import { ADMIN_SECTIONS } from "@/lib/admin/sections";
import { validateContent } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

/**
 * The admin's front door.
 *
 * Two questions, answered above the fold: how much of each thing is there, and
 * is any of it broken. Everything else on this screen is a way into a section.
 *
 * ## Why the integrity check is here
 *
 * `validateContent()` predates the admin panel and had nowhere to be surfaced —
 * it was a function someone would have to remember to call. The content model
 * makes a specific set of mistakes possible (a backwards date range, a
 * contribution with no PR to point at, an education entry marked complete with
 * no end date), and none of them throw: they render as a slightly wrong public
 * site. This is the one screen someone lands on before editing, so it is where
 * a list of them belongs.
 *
 * A clean result says so rather than rendering nothing. "No issues" is
 * information; an empty space is ambiguous between "healthy" and "did not run".
 */

export const metadata: Metadata = {
  title: "Dashboard",
};

/** Counts for the overview cards, keyed the way `ADMIN_SECTIONS` is. */
async function sectionCounts(): Promise<Record<string, number>> {
  /* `Promise.all`, deliberately not `$transaction`. The runtime client is
     configured with `max: 1` — one connection per serverless invocation, by
     design; see `src/lib/prisma.ts` — and an interactive transaction needs that
     connection exclusively. Asking for one while the integrity check below is
     already reading on it produces a P2028 "unable to start a transaction",
     which is what this page did until it stopped asking.

     Nothing is lost: these are five independent counts with no consistency
     requirement between them, and on a single connection they pipeline anyway. */
  const [projects, contributions, tech, certifications, experience] =
    await Promise.all([
      prisma.project.count(),
      prisma.contribution.count(),
      prisma.techStackItem.count(),
      prisma.certification.count(),
      prisma.experience.count(),
    ]);

  return {
    "/admin/projects": projects,
    "/admin/contributions": contributions,
    "/admin/tech-stack": tech,
    "/admin/education": certifications,
    "/admin/experience": experience,
  };
}

export default async function AdminDashboardPage() {
  const [counts, issues] = await Promise.all([
    sectionCounts(),
    validateContent(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        title="Dashboard"
        description="Everything the public site reads lives behind one of these. Changes save straight to the database and appear on the site without a redeploy."
      />

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ADMIN_SECTIONS.map((section) => {
          const count = counts[section.href];

          const body = (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-h6 text-foreground">{section.label}</span>
                {section.countLabel ? (
                  <span className="label shrink-0 text-muted">
                    <span
                      className={cn(
                        "font-mono",
                        count === 0 ? "text-muted" : "text-accent",
                      )}
                    >
                      {count ?? 0}
                    </span>{" "}
                    {section.countLabel}
                  </span>
                ) : (
                  <span className="label shrink-0 text-muted">1 record</span>
                )}
              </div>
              <p className="mt-2 text-small text-muted">{section.description}</p>
            </>
          );

          return (
            <li key={section.href}>
              {section.ready ? (
                <Link
                  href={section.href}
                  className="flex h-full flex-col rounded-lg border border-border bg-surface/40 p-4 transition-colors hover:border-border-strong hover:bg-surface"
                >
                  {body}
                  <span className="mt-3 text-small text-link">Open →</span>
                </Link>
              ) : (
                <div className="flex h-full flex-col rounded-lg border border-dashed border-border bg-surface/20 p-4 opacity-60">
                  {body}
                  <span className="label mt-3 text-muted">Not built yet</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <Panel
        title="Content integrity"
        description="Checks the schema cannot express — backwards date ranges, entries with nothing to link to, references that resolve to nothing."
      >
        {issues.length === 0 ? (
          <Banner tone="success">
            No issues found across projects, experience, contributions,
            education and the tech stack.
          </Banner>
        ) : (
          <div className="flex flex-col gap-3">
            <Banner tone="error">
              {issues.length} {issues.length === 1 ? "issue" : "issues"} to look
              at. None of these stop the site rendering — they make it render
              something slightly wrong.
            </Banner>
            <ul className="flex flex-col gap-1.5">
              {issues.map((issue) => (
                <li
                  key={issue}
                  className="flex gap-2 text-small text-muted before:text-warning before:content-['—']"
                >
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Panel>
    </div>
  );
}
