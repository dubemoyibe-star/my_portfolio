import type { TechOption } from "@/components/admin/tech-picker";
import { prisma } from "@/lib/prisma";
import type { TechCategory } from "@/types";

/**
 * The tech vocabulary, shaped for the picker.
 *
 * Shared by the new and edit pages so the two cannot end up ordering or
 * filtering it differently. Sorted by the same `position` the seed authored
 * and the tech editor will maintain, so the picker's list matches the order
 * the Tech stack section shows.
 */
export async function readTechOptions(): Promise<TechOption[]> {
  const rows = await prisma.techStackItem.findMany({
    select: { id: true, name: true, category: true, icon: true },
    orderBy: [{ position: "asc" }, { id: "asc" }],
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category as TechCategory,
    icon: row.icon ?? undefined,
  }));
}
