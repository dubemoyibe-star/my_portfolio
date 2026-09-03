import catalogue from "simple-icons/icons.json";

import { ICON_SLUGS, hasIcon } from "@/components/ui/icon";
import { iconSlugForLabel } from "@/lib/tech-labels";

import type { IconVerdict } from "./tech-input";

/**
 * The simple-icons catalogue, used to tell a typo apart from a real brand.
 *
 * ## Why this exists at all
 *
 * `TechStackItem.icon` is a simple-icons slug, and `Icon` draws it — but only
 * from the ~40 marks explicitly imported in `@/components/ui/icon`, so the
 * bundler can drop the other ~3,400. Everything else renders the neutral
 * fallback glyph.
 *
 * That leaves two very different mistakes looking identical on the public site:
 *
 *  - `"typescrpt"` — a misspelling. No spelling of it will ever render.
 *  - `"svelte"` — a real brand this site simply does not bundle yet. It renders
 *    the moment somebody adds one line to `@/components/ui/icon`.
 *
 * A preview that only shows what the site draws is honest about the outcome and
 * useless about the cause: both come out as an empty square, and the operator
 * retypes the second one five different ways before giving up. This module is
 * what lets the editor name the cause.
 *
 * ## Why `icons.json` and not the package's main entry
 *
 * `simple-icons`'s index is 5.2 MB — every mark, including its path data —
 * and reading it by slug defeats the tree-shaking the whole registry is built
 * around. `simple-icons/icons.json` is the same catalogue at 455 KB with the
 * path data left out: title, slug and brand hex, which is everything a
 * diagnosis needs and nothing a renderer would.
 *
 * ## Server-side only
 *
 * Nothing imports this from a client component. It is reached through the
 * `describeIconSlug` server action, so 455 KB of brand metadata stays on the
 * server and the admin bundle carries a string instead.
 */

type CatalogueEntry = { title: string; slug: string; hex: string };

/**
 * Slug -> brand, built once per process.
 *
 * The JSON is an array and lookups here are per keystroke, so a scan would be
 * 3,457 comparisons a character. The map costs one pass at import.
 */
const BY_SLUG = new Map<string, CatalogueEntry>(
  (catalogue as CatalogueEntry[]).map((entry) => [entry.slug, entry]),
);

/** Every slug in the catalogue, for the near-miss search below. */
const ALL_SLUGS = [...BY_SLUG.keys()];

const BUNDLED = new Set(ICON_SLUGS);

/** How many "did you mean" slugs to offer. Enough to be useful, few enough to read. */
const SUGGESTION_LIMIT = 6;

/** Edits allowed before two slugs stop being the same intent. */
const MAX_EDITS = 2;

/**
 * Levenshtein distance, abandoned as soon as it exceeds `MAX_EDITS`.
 *
 * Full distances are not needed — the question is only "is this within two
 * edits", and the length guard plus the per-row floor mean almost every one of
 * the 3,457 candidates is rejected before its matrix is built.
 */
function withinEdits(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > MAX_EDITS) return false;

  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    let best = i;

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const value = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost,
      );
      current.push(value);
      if (value < best) best = value;
    }

    /* No cell in this row is close enough, and distance never decreases going
       down, so nothing below it can be either. */
    if (best > MAX_EDITS) return false;
    previous = current;
  }

  return previous[b.length] <= MAX_EDITS;
}

/**
 * Slugs close enough to `slug` to be worth offering.
 *
 * Four passes, cheapest and most confident first:
 *
 *  1. The alias table in `@/lib/tech-labels`, which already maps the names
 *     people type onto the slugs simple-icons uses — `nodejs` -> `nodedotjs`,
 *     `postgres` -> `postgresql`. It exists because contribution tech is
 *     free-form labels, and it answers exactly the question being asked here,
 *     so it is reused rather than restated.
 *  2. Prefix, for a slug abandoned halfway.
 *  3. Substring, for a brand whose slug carries a prefix nobody expects.
 *  4. Within two edits, for an ordinary typo — `typescrpt` is not caught by any
 *     of the three above, and it is the single most likely way to get here.
 *
 * Bundled slugs sort ahead of the rest inside each band: a suggestion that will
 * actually render is worth more than one that will not.
 */
function suggestionsFor(slug: string): string[] {
  if (slug.length < 2) return [];

  const prefix: string[] = [];
  const contains: string[] = [];
  const near: string[] = [];

  for (const candidate of ALL_SLUGS) {
    if (candidate === slug) continue;
    if (candidate.startsWith(slug)) prefix.push(candidate);
    else if (candidate.includes(slug)) contains.push(candidate);
    else if (withinEdits(slug, candidate)) near.push(candidate);
  }

  const rank = (a: string, b: string) => {
    const bundled = Number(BUNDLED.has(b)) - Number(BUNDLED.has(a));
    return bundled !== 0 ? bundled : a.length - b.length;
  };

  const alias = iconSlugForLabel(slug);
  const ordered = [
    ...(alias !== slug && BY_SLUG.has(alias) ? [alias] : []),
    ...prefix.sort(rank),
    ...contains.sort(rank),
    ...near.sort(rank),
  ];

  return [...new Set(ordered)].slice(0, SUGGESTION_LIMIT);
}

/**
 * What the editor should say about a typed slug.
 *
 * Three outcomes, and they are the three the operator can act on differently:
 * it renders; it is a real brand that needs a one-line code change to render;
 * it is not a brand at all and needs a correction here.
 */
export function describeSlug(slug: string): IconVerdict {
  const trimmed = slug.trim();
  if (trimmed.length === 0) return { slug: "", state: "empty" };

  const entry = BY_SLUG.get(trimmed);

  if (hasIcon(trimmed)) {
    return {
      slug: trimmed,
      state: "renders",
      /* The catalogue title, where there is one. LinkedIn is in the registry
         and not in the catalogue — it was pulled from simple-icons at
         LinkedIn's request and its path is inlined — so the title falls back to
         the slug rather than the entry claiming to be unknown. */
      title: entry?.title,
      suggestions: [],
    };
  }

  if (entry) {
    return {
      slug: trimmed,
      state: "unbundled",
      title: entry.title,
      suggestions: [],
    };
  }

  return {
    slug: trimmed,
    state: "unknown",
    suggestions: suggestionsFor(trimmed),
  };
}
