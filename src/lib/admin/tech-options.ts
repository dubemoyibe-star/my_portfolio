import type { TechOption } from "@/components/admin/tech-picker";
import { prisma } from "@/lib/prisma";
import type { TechCategory } from "@/types";

/**
 * The tech vocabulary, shaped for the picker.
 *
 * Shared by every editor that references tech — the project screens and the
 * experience screens — so no two of them can end up ordering or filtering it
 * differently. Sorted by the same `position` the seed authored and the tech
 * editor maintains, so the picker's list matches the order the Tech stack
 * section shows.
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
