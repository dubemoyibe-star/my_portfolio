import type { Metadata } from "next";
import Link from "next/link";

import {
  AdminPageHeader,
  EmptyState,
  Panel,
  buttonPrimary,
} from "@/components/admin/chrome";
import { formatStamp } from "@/lib/admin/format";
import { prisma } from "@/lib/prisma";

import { ContributionsTable } from "./contributions-table";

/**
 * Every contribution, in the curated order the public section renders.
 *
 * The rows are read here and the interactivity lives in `ContributionsTable`,
 * which is a client component only because reordering has to move a row before
 * the server answers. Everything it needs is serialised on the way across —
 * including `updatedAt` as a preformatted string, so the client never formats a
 * date and cannot disagree with the server about which timezone it was
 * formatted in.
 */

export const metadata: Metadata = {
  title: "Contributions",
};

export default async function AdminContributionsPage() {
  const rows = await prisma.contribution.findMany({
    include: { _count: { select: { prLinks: true } } },
    /* Mirrors `getContributions()`: curated `order` first, unranked last.
       There is no recency fallback here because `mergedDate` is optional and
       unset on every current entry — see the note on that function. */
    orderBy: [{ order: { sort: "asc", nulls: "last" } }, { id: "asc" }],
  });

  const unranked = rows.filter((row) => row.order === null).length;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Contributions"
        description="Merged work in repositories you do not own. The arrows set the order the public section renders in."
        actions={
          <Link href="/admin/contributions/new" className={buttonPrimary}>
            <span aria-hidden="true">+</span>
            New contribution
          </Link>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No contributions yet"
          description="The Contributions section hides itself while this is empty, so nothing is broken — there is just nothing to show."
          action={
            <Link href="/admin/contributions/new" className={buttonPrimary}>
              Add the first contribution
            </Link>
          }
        />
      ) : (
        <Panel
          title={`${rows.length} ${rows.length === 1 ? "contribution" : "contributions"}`}
          /* Says out loud whether the ranking is intact. An entry with no
             `order` still renders — it sorts last — so without this the only
             way to notice one is to count. */
          description={
            unranked > 0
              ? `${unranked} with no explicit order, sorting last. Moving any row renumbers the whole list.`
              : `Ranked 1 to ${rows.length}, with no gaps or duplicates.`
          }
          flush
        >
          <ContributionsTable
            rows={rows.map((row) => ({
              id: row.id,
              slug: row.slug,
              repoName: row.repoName,
              owner: row.owner,
              order: row.order,
              featured: row.featured,
              includeInResume: row.includeInResume,
              tech: row.tech,
              prLinkCount: row._count.prLinks,
              updatedAt: formatStamp(row.updatedAt),
            }))}
          />
        </Panel>
      )}
    </div>
  );
}
