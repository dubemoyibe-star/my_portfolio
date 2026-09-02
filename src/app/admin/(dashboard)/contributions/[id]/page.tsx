import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/chrome";
import { toContributionInput } from "@/lib/admin/contribution-input";
import { getContributionBySlug } from "@/lib/data";
import { prisma } from "@/lib/prisma";

import { ContributionForm } from "../contribution-form";
import { readContributionRanking } from "../ranking";

/**
 * The edit screen, keyed by `id` rather than by slug — a slug is allowed to
 * change, and an editor URL built on one breaks the moment somebody renames the
 * entry they are editing.
 *
 * `/admin/contributions/new` and `/admin/contributions/[id]` are siblings, and
 * Next resolves the static segment first, so "new" can never be read as an id.
 */

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const row = await prisma.contribution.findUnique({
    where: { id },
    select: { repoName: true },
  });
  return { title: row ? row.repoName : "Contribution" };
}

export default async function EditContributionPage({ params }: PageProps) {
  const { id } = await params;

  const row = await prisma.contribution.findUnique({
    where: { id },
    select: { slug: true },
  });
  if (!row) notFound();

  /* Read back through the data layer rather than re-mapping the row here, so
     the editor is populated by exactly the same translation the public site
     renders from. A disagreement between the two then shows up in the form
     rather than silently on the site. */
  const [contribution, ranking] = await Promise.all([
    getContributionBySlug(row.slug),
    readContributionRanking(),
  ]);

  if (!contribution) notFound();

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        backHref="/admin/contributions"
        backLabel="Contributions"
        title={contribution.repoName}
        description={
          <>
            <span className="font-mono">{contribution.id}</span>
            {contribution.owner ? (
              <>
                {" · "}
                <span className="font-mono">
                  {contribution.owner}/{contribution.slug}
                </span>
              </>
            ) : null}
          </>
        }
        actions={
          <>
            <Link
              href={contribution.repoUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="label text-muted transition-colors hover:text-foreground"
            >
              Repository ↗
            </Link>
            <Link
              href="/#contributions"
              target="_blank"
              rel="noreferrer"
              className="label text-muted transition-colors hover:text-foreground"
            >
              View on site ↗
            </Link>
          </>
        }
      />

      <ContributionForm
        mode="edit"
        contributionId={contribution.id}
        initial={toContributionInput(contribution)}
        ranking={ranking}
      />
    </div>
  );
}
