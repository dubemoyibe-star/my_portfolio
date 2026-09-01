import { ContributionEntry } from "@/components/cards/contribution-entry";
import { Section } from "@/components/layout/section";
import { getContributions } from "@/lib/data";

/**
 * Open-source contributions.
 *
 * A timeline rail rather than a grid of cards: each entry carries two
 * paragraphs of context before its PR links, so side-by-side becomes a wall —
 * and boxing each one made six separate objects out of what is really one
 * continuous body of work. The rail also keeps this section visually distinct
 * from the Projects cards above it.
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
      <ol>
        {contributions.map((contribution) => (
          <ContributionEntry
            key={contribution.id}
            contribution={contribution}
          />
        ))}
      </ol>
    </Section>
  );
}
