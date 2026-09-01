import { Disclosure } from "@/components/ui/disclosure";
import { LinkButton } from "@/components/ui/link-button";
import { Paragraphs } from "@/components/ui/paragraphs";
import { Tag } from "@/components/ui/tag";
import { formatMonth } from "@/lib/format";
import { iconSlugForLabel } from "@/lib/tech-labels";
import type { Contribution } from "@/types";

export type ContributionCardProps = {
  contribution: Contribution;
};

/**
 * Deliberately shaped differently from `ProjectCard`.
 *
 * The reader needs two facts kept apart here: what the repository is, and what
 * *you* did to it. So the repo line and its description sit above a rule, in
 * muted text, as context — and the contribution sits below it in body text as
 * the actual claim. Collapsing those into one block is what makes most
 * open-source sections unreadable.
 */
export function ContributionCard({ contribution }: ContributionCardProps) {
  const {
    owner,
    repoName,
    repoUrl,
    repoDescription,
    contributionSummary,
    contributionDetails,
    prLinks,
    tech,
    mergedDate,
  } = contribution;

  return (
    <article className="rounded-lg border border-border bg-surface p-6 lg:p-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        {/* Plain text, not a link: the Repository button below points at the
            same URL, and two links to one destination with different names is
            noise for anyone tabbing or listening through the card. */}
        <p className="font-mono text-small">
          {owner ? <span className="text-muted">{owner}/</span> : null}
          <span className="text-foreground">{repoName}</span>
        </p>

        {mergedDate ? (
          <span className="label text-muted">
            Merged {formatMonth(mergedDate)}
          </span>
        ) : null}
      </header>

      <p className="mt-2 text-pretty text-small text-muted">{repoDescription}</p>

      <p className="mt-5 border-t border-border pt-5 text-pretty">
        {contributionSummary}
      </p>

      {tech.length > 0 ? (
        <ul className="mt-5 flex flex-wrap gap-2">
          {/* Free-form labels rather than TechIds, so the icon is resolved
              from the label itself; anything unmatched falls back to the
              neutral glyph. */}
          {tech.map((label) => (
            <Tag key={label} icon={iconSlugForLabel(label)}>
              {label}
            </Tag>
          ))}
        </ul>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        <LinkButton href={repoUrl}>Repository</LinkButton>
        {prLinks.map((pr) => (
          <LinkButton key={pr.url} href={pr.url}>
            {pr.label}
          </LinkButton>
        ))}
      </div>

      <Disclosure className="mt-5" label="Full write-up">
        <Paragraphs
          text={contributionDetails}
          className="text-small text-muted"
        />
      </Disclosure>
    </article>
  );
}
