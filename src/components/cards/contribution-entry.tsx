import { Disclosure } from "@/components/ui/disclosure";
import { LinkButton } from "@/components/ui/link-button";
import { Paragraphs } from "@/components/ui/paragraphs";
import { Tag } from "@/components/ui/tag";
import { formatMonth } from "@/lib/format";
import { iconSlugForLabel } from "@/lib/tech-labels";
import type { Contribution } from "@/types";

export type ContributionEntryProps = {
  contribution: Contribution;
};

/**
 * One contribution on the timeline rail.
 *
 * Not a card: six bordered panels stacked down the page read as six separate
 * things competing for attention, when this is really one continuous body of
 * work. The rail and marker say "these belong together and there are more"
 * without drawing a box round each one.
 *
 * The reader still needs two facts kept apart — what the repository is, and
 * what *you* did to it — so the repo line and its description stay above a
 * rule, in muted text, with the contribution below it in body text.
 */
export function ContributionEntry({ contribution }: ContributionEntryProps) {
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
    <li className="relative border-l border-border pb-12 pl-7 last:pb-0 lg:pl-10">
      {/* Sits on the rail; the ring punches a clean hole through the line. */}
      <span
        aria-hidden="true"
        className="absolute -left-1 top-1.5 size-2 rounded-full bg-accent ring-4 ring-background"
      />

      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <p className="font-mono text-small">
          {owner ? <span className="text-muted">{owner}/</span> : null}
          <span className="text-foreground">{repoName}</span>
        </p>

        {mergedDate ? (
          <span className="label text-muted">
            Merged {formatMonth(mergedDate)}
          </span>
        ) : null}
      </div>

      <p className="mt-2 max-w-prose-page text-pretty text-small text-muted">
        {repoDescription}
      </p>

      <p className="mt-5 max-w-prose-page text-pretty">{contributionSummary}</p>

      {tech.length > 0 ? (
        <ul className="mt-5 flex flex-wrap gap-2">
          {/* Free-form labels rather than TechIds, so the icon is resolved from
              the label itself; anything unmatched falls back to the neutral
              glyph. */}
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
          className="max-w-prose-page text-small text-muted"
        />
      </Disclosure>
    </li>
  );
}
