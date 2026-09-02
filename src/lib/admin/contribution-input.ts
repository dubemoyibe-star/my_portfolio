import type { Contribution } from "@/types";

import {
  ErrorBag,
  isHttpUrl,
  isIsoMonth,
  isSlug,
  text,
  type FieldErrors,
} from "./validation";

/**
 * The wire shape of the contribution editor, and the rules it is held to.
 *
 * Same contract as `./project-input`, for the same reasons: every field is a
 * string so parsing happens once in the action rather than twice on either side
 * of the request, and the module imports nothing server-only so the form and
 * the server action can run the identical validator.
 *
 * ## Tech is not validated against the registry
 *
 * `Contribution.tech` is `String[]` while `Project.tech` is `TechId[]`, and the
 * asymmetry is deliberate — see the type comment. A contribution's tech
 * describes what one PR touched, which is often a tool this portfolio does not
 * claim as part of its stack. So there is nothing to resolve these against, and
 * the only rule is that a tag is not blank.
 *
 * ## At least one PR link
 *
 * Not an arbitrary minimum. `validateContent()` already reports a contribution
 * with no PR links as a content defect, on the grounds that the entry claims
 * merged work and then offers no way to see it. Enforcing it at the point of
 * entry means that check stops being something to notice later.
 */

export type PrLinkInput = {
  label: string;
  url: string;
};

export type ContributionInput = {
  repoName: string;
  slug: string;
  owner: string;
  repoUrl: string;
  repoDescription: string;
  contributionSummary: string;
  contributionDetails: string;
  /** Free-form display labels, in render order. */
  tech: string[];
  prLinks: PrLinkInput[];
  /** `YYYY-MM`, or empty — not always recorded. */
  mergedDate: string;
  featured: boolean;
  includeInResume: boolean;
  /** Integer as typed, or empty for "no manual override". */
  order: string;
};

/** A blank contribution, for the create form. */
export function emptyContribution(): ContributionInput {
  return {
    repoName: "",
    slug: "",
    owner: "",
    repoUrl: "",
    repoDescription: "",
    contributionSummary: "",
    contributionDetails: "",
    tech: [],
    /* One empty row rather than none. Every contribution needs at least one
       link, so an empty list is never the finished state — starting with the
       row visible skips a click and shows the shape of what is wanted. */
    prLinks: [{ label: "", url: "" }],
    mergedDate: "",
    /* Every seeded contribution is featured: the section exists to show this
       work, and an entry worth writing up is worth showing. */
    featured: true,
    includeInResume: true,
    order: "",
  };
}

/** An existing contribution, as the form wants it. */
export function toContributionInput(entry: Contribution): ContributionInput {
  return {
    repoName: entry.repoName,
    slug: entry.slug,
    owner: entry.owner ?? "",
    repoUrl: entry.repoUrl,
    repoDescription: entry.repoDescription,
    contributionSummary: entry.contributionSummary,
    contributionDetails: entry.contributionDetails,
    tech: entry.tech,
    prLinks: entry.prLinks.map((link) => ({ label: link.label, url: link.url })),
    mergedDate: entry.mergedDate ?? "",
    featured: entry.featured,
    includeInResume: entry.includeInResume,
    order: entry.order === undefined ? "" : String(entry.order),
  };
}

/* ==========================================================================
   Validation
   ========================================================================== */

/**
 * `contributionSummary` is "one line on what you specifically did" and lands in
 * a single paragraph above the tech row. The seeded entries run 71–124
 * characters; this is the hard stop, set well clear of them so a slightly long
 * line is a judgement call rather than a fight with the editor.
 */
const SUMMARY_LIMIT = 240;

/** `repoDescription` is one line of context. Same reasoning, more headroom. */
const REPO_DESCRIPTION_LIMIT = 300;

export function validateContribution(input: ContributionInput): FieldErrors {
  const bag = new ErrorBag();

  bag.required("repoName", input.repoName, "Repository name");

  const slug = bag.required("slug", input.slug, "Slug");
  bag.addIf(
    slug.length > 0 && !isSlug(slug),
    "slug",
    "Lowercase letters, numbers and single hyphens only.",
  );

  const repoUrl = bag.required("repoUrl", input.repoUrl, "Repository URL");
  bag.addIf(
    repoUrl.length > 0 && !isHttpUrl(repoUrl),
    "repoUrl",
    "Must start with http:// or https://.",
  );

  const repoDescription = bag.required(
    "repoDescription",
    input.repoDescription,
    "Repository description",
  );
  bag.addIf(
    repoDescription.length > REPO_DESCRIPTION_LIMIT,
    "repoDescription",
    `That is ${repoDescription.length} characters. Keep it under ${REPO_DESCRIPTION_LIMIT} — it is one line of context, not the write-up.`,
  );

  const summary = bag.required(
    "contributionSummary",
    input.contributionSummary,
    "Contribution summary",
  );
  bag.addIf(
    summary.length > SUMMARY_LIMIT,
    "contributionSummary",
    `That is ${summary.length} characters. Keep it under ${SUMMARY_LIMIT} — the details field is where the full account goes.`,
  );

  bag.required(
    "contributionDetails",
    input.contributionDetails,
    "Contribution details",
  );

  const merged = text(input.mergedDate);
  bag.addIf(
    merged.length > 0 && !isIsoMonth(merged),
    "mergedDate",
    "Use YYYY-MM, or leave it empty if it is not recorded.",
  );

  for (const [index, tag] of input.tech.entries()) {
    bag.addIf(
      text(tag).length === 0,
      `tech.${index}`,
      "A tag cannot be blank.",
    );
  }

  /* Rows that are entirely blank are dropped on save rather than rejected — an
     added row you changed your mind about should not block the form. What is
     rejected is a half-filled row, which is a mistake rather than a
     cancellation. */
  const meaningful = input.prLinks.filter(
    (link) => text(link.label).length > 0 || text(link.url).length > 0,
  );

  if (meaningful.length === 0) {
    bag.add(
      "prLinks",
      "Add at least one PR link — an entry that claims merged work needs somewhere to point.",
    );
  }

  for (const [index, link] of input.prLinks.entries()) {
    const label = text(link.label);
    const url = text(link.url);
    if (label.length === 0 && url.length === 0) continue;

    bag.addIf(label.length === 0, `prLinks.${index}.label`, "Label is required.");
    if (url.length === 0) {
      bag.add(`prLinks.${index}.url`, "URL is required.");
    } else {
      bag.addIf(
        !isHttpUrl(url),
        `prLinks.${index}.url`,
        "Must start with http:// or https://.",
      );
    }
  }

  const order = text(input.order);
  bag.addIf(
    order.length > 0 && !/^-?\d+$/.test(order),
    "order",
    "Order must be a whole number, or empty to sort last.",
  );

  return bag.all;
}

/* ==========================================================================
   Field labels
   ========================================================================== */

const FIELD_LABELS: Record<string, string> = {
  repoName: "Repository name",
  slug: "Slug",
  owner: "Owner",
  repoUrl: "Repository URL",
  repoDescription: "Repository description",
  contributionSummary: "Contribution summary",
  contributionDetails: "Contribution details",
  mergedDate: "Merged date",
  prLinks: "PR links",
  order: "Order",
};

/** Human names for the banner, resolving nested paths by prefix. */
export function describeField(path: string): string {
  if (FIELD_LABELS[path]) return FIELD_LABELS[path];
  if (path.startsWith("prLinks.")) return "PR links";
  if (path.startsWith("tech.")) return "Tech";
  return path;
}
