import { ContributionEntry } from "@/components/cards/contribution-entry";
import { Section } from "@/components/layout/section";
import { ShowMore } from "@/components/ui/show-more";
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
 *
 * Capped at six with `ShowMore`, for the same reason the Projects grid is: the
 * rail is one entry per row and grows without limit. The container stays an
 * `<ol>` and the entries stay `<li>`s, so hiding the overflow does not cost the
 * list its semantics — hence `itemDisplay="list-item"`.
 */
export async function Contributions() {
  const contributions = await getContributions();

  if (contributions.length === 0) return null;

  return (
    <Section
      id="contributions"
      eyebrow="Open source"
      title="Open source contributions"
      description="Work merged into projects I don't own: what the repository does, and what I actually changed in it."
    >
      <ShowMore as="ol" noun="contributions" itemDisplay="list-item">
        {contributions.map((contribution) => (
          <ContributionEntry
            key={contribution.id}
            contribution={contribution}
          />
        ))}
      </ShowMore>
    </Section>
  );
}
