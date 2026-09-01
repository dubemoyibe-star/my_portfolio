import type { TechCategory, TechStackItem } from "@/types";

export type TechGroup = {
  label: string;
  categories: TechCategory[];
};

/**
 * Display grouping for the tech stack.
 *
 * The schema keeps `framework` and `library` apart, and `infrastructure` apart
 * from `tool`, because those are real distinctions when authoring content. A
 * reader does not care: they want five or six headings, not eight. This is the
 * one place that mapping is defined, so the stack section and the CV skills
 * block cannot drift apart.
 */
export const TECH_GROUPS: TechGroup[] = [
  { label: "Languages", categories: ["language"] },
  { label: "Frameworks & Libraries", categories: ["framework", "library"] },
  { label: "Databases", categories: ["database"] },
  { label: "Blockchain", categories: ["blockchain"] },
  { label: "Infrastructure & Tools", categories: ["infrastructure", "tool"] },
  { label: "Design", categories: ["design"] },
];

/**
 * Bucket tech items into display groups, dropping any group with nothing in it.
 *
 * Items are re-sorted by name within each group. `getTechStack()` sorts by
 * category then name, which in a merged group ("Frameworks & Libraries") shows
 * up as two alphabetical runs back to back and reads like a broken sort.
 */
export function groupTech(
  items: TechStackItem[],
): { label: string; items: TechStackItem[] }[] {
  return TECH_GROUPS.map((group) => ({
    label: group.label,
    items: items
      .filter((item) => group.categories.includes(item.category))
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((group) => group.items.length > 0);
}
