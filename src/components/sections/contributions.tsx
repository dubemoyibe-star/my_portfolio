import { ContributionCard } from "@/components/cards/contribution-card";
import { Section } from "@/components/layout/section";
import { getContributions } from "@/lib/data";

/**
 * Open-source contributions.
 *
 * One column rather than a grid: each entry carries two paragraphs of context
 * before its PR links, and side-by-side that becomes a wall. The single column
 * also keeps this section visually distinct from Projects above it.
 *
 * Order is the curated `order` field, untouched — `getContributions()` sorts by
 * it and falls back to `mergedDate` only as a tiebreak.
 */
export async function Contributions() {
  const contributions = await getContributions();

  if (contributions.length === 0) return null;

  return (
    <Section
      id="contributions"
      eyebrow="Open source"
      title="Open source contributions"
      description="Work merged into projects I don't own — what the repository does, and what I actually changed in it."
    >
      <div className="flex flex-col gap-6">
        {contributions.map((contribution) => (
          <ContributionCard
            key={contribution.id}
            contribution={contribution}
          />
        ))}
      </div>
    </Section>
  );
}
