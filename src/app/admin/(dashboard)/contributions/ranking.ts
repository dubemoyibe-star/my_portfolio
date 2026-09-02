import { prisma } from "@/lib/prisma";

import type { RankingEntry } from "./contribution-form";

/**
 * Every contribution's current position, for the form's ranking panel.
 *
 * Shared by the new and edit pages so the two cannot present the ordering
 * differently. Sorted the way `getContributions()` sorts — explicit `order`
 * first, unranked entries last — so the list beside the field is the sequence
 * the public site actually renders.
 */
export async function readContributionRanking(): Promise<RankingEntry[]> {
  return prisma.contribution.findMany({
    select: { id: true, repoName: true, order: true },
    orderBy: [{ order: { sort: "asc", nulls: "last" } }, { id: "asc" }],
  });
}
