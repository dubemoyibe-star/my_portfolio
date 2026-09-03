import {
  PROFICIENCY_LEVELS,
  TECH_CATEGORIES,
  type Proficiency,
  type TechCategory,
  type TechStackItem,
} from "@/types";

import {
  ErrorBag,
  isHttpUrl,
  isIsoMonth,
  isSlug,
  text,
  type FieldErrors,
} from "./validation";

/**
 * The wire shape of the tech editor, and the rules it is held to.
 *
 * Same contract as `./project-input` and `./contribution-input`: every field is
 * a string so parsing happens once, in the action, rather than twice on either
 * side of the request; the module imports nothing server-only so the form and
 * the server action run the identical validator.
 *
 * ## `id` is the slug, and it is load-bearing
 *
 * `TechStackItem` has no separate `slug` field — unlike every other entity
 * here, its `id` *is* the slug, and it is what `project_tech` and
 * `experience_tech` point at with `onDelete: Restrict`. So it is chosen once,
 * at creation, and is not editable afterwards. See `validateTech`, and the note
 * on the edit screen, for what to do when one is genuinely wrong.
 *
 * ## `category` and `proficiency` are closed sets
 *
 * Both are `String` columns rather than Postgres enums — `@/lib/data` explains
 * why — which means nothing at the database level stops `"framwork"` from being
 * written. It would not throw; it would quietly drop the item out of every
 * display group on the public site, because `TECH_GROUPS` matches on exact
 * category strings. So the form offers a dropdown and the validator checks the
 * value against the same `as const` tuples the types are built from. A typo
 * cannot invent a category.
 */

export type TechInput = {
  /** The slug, and the id other records reference. Fixed after creation. */
  id: string;
  name: string;
  /** A `TechCategory`. */
  category: string;
  /** A simple-icons slug, or empty. */
  icon: string;
  url: string;
  /** A `Proficiency`, or empty for "not rated". */
  proficiency: string;
  /** Integer as typed, or empty. */
  yearsOfExperience: string;
  /** `YYYY-MM`, or empty. */
  since: string;
  featured: boolean;
};

/** A blank tech item, for the create form. */
export function emptyTech(): TechInput {
  return {
    id: "",
    name: "",
    /* The largest bucket, and the one a stray unclassified item does the least
       damage in — "Frameworks & Libraries" is where most things added after the
       initial stack have belonged. */
    category: "library",
    icon: "",
    url: "",
    proficiency: "",
    yearsOfExperience: "",
    since: "",
    /* Every seeded item is featured, and `getResumeData().skills` reads the
       featured set — an item added unfeatured would be missing from the CV for
       no reason anybody would think to look for. */
    featured: true,
  };
}

/** An existing tech item, as the form wants it. */
export function toTechInput(item: TechStackItem): TechInput {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    icon: item.icon ?? "",
    url: item.url ?? "",
    proficiency: item.proficiency ?? "",
    yearsOfExperience:
      item.yearsOfExperience === undefined ? "" : String(item.yearsOfExperience),
    since: item.since ?? "",
    featured: Boolean(item.featured),
  };
}

/* ==========================================================================
   Options
   ========================================================================== */

/**
 * Category labels, and the public heading each one lands under.
 *
 * The schema keeps eight categories and the site renders six headings — see
 * `@/lib/tech-groups`. Saying so in the option text is what stops someone
 * filing a library under `framework` to get it into "Frameworks & Libraries",
 * not realising both already go there.
 */
const CATEGORY_LABELS: Record<TechCategory, string> = {
  language: "Language",
  framework: "Framework",
  library: "Library",
  database: "Database",
  blockchain: "Blockchain",
  infrastructure: "Infrastructure",
  tool: "Tool",
  design: "Design",
};

const CATEGORY_GROUPS: Record<TechCategory, string> = {
  language: "Languages",
  framework: "Frameworks & Libraries",
  library: "Frameworks & Libraries",
  database: "Databases",
  blockchain: "Blockchain",
  infrastructure: "Infrastructure & Tools",
  tool: "Infrastructure & Tools",
  design: "Design",
};

export const CATEGORY_OPTIONS = TECH_CATEGORIES.map((category) => ({
  value: category,
  label: `${CATEGORY_LABELS[category]} — shows under ${CATEGORY_GROUPS[category]}`,
}));

/** The heading the public site files this category under. */
export function categoryGroupLabel(category: string): string {
  return CATEGORY_GROUPS[category as TechCategory] ?? "Ungrouped";
}

/** Sentence-case name for a category, for list rows and chips. */
export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category as TechCategory] ?? category;
}

const PROFICIENCY_LABELS: Record<Proficiency, string> = {
  learning: "Learning",
  working: "Working knowledge",
  proficient: "Proficient",
  expert: "Expert",
};

export const PROFICIENCY_OPTIONS = PROFICIENCY_LEVELS.map((level) => ({
  value: level,
  label: PROFICIENCY_LABELS[level],
}));

export function proficiencyLabel(level: string): string {
  return PROFICIENCY_LABELS[level as Proficiency] ?? level;
}

/* ==========================================================================
   Icon verdicts
   ========================================================================== */

/**
 * What the editor knows about a typed icon slug.
 *
 * Computed on the server by `@/lib/admin/icon-catalogue` — which holds the
 * whole simple-icons catalogue and must not reach the browser — and returned to
 * the form through a server action. The type lives here, in the module both
 * sides already import, so the client can name the shape without pulling the
 * catalogue in behind it.
 */
export type IconVerdict = {
  slug: string;
  /**
   * - `empty` — nothing typed. The item renders without an icon.
   * - `renders` — `Icon` draws this. What the preview shows is what ships.
   * - `unbundled` — a real simple-icons brand this site does not import, so the
   *   public site draws the neutral fallback until it is added to
   *   `@/components/ui/icon`.
   * - `unknown` — no such brand. A typo.
   */
  state: "empty" | "renders" | "unbundled" | "unknown";
  /** The brand's official name, when the catalogue knows it. */
  title?: string;
  /** Near-miss slugs, for `unknown` only. */
  suggestions?: string[];
};

/* ==========================================================================
   Validation
   ========================================================================== */

/**
 * simple-icons slugs are lowercase alphanumerics and nothing else — punctuation
 * is spelled out, which is why Next.js is `nextdotjs` and Web3.js is
 * `web3dotjs`. Rejecting anything else here turns "typed the brand name" into a
 * message next to the field rather than a blank square on the live site.
 */
const ICON_SLUG = /^[a-z0-9]+$/;

/** A working life, not a lifetime. Catches a year typed into a years box. */
const MAX_YEARS = 60;

export function validateTech(input: TechInput): FieldErrors {
  const bag = new ErrorBag();

  const id = bag.required("id", input.id, "Id");
  bag.addIf(
    id.length > 0 && !isSlug(id),
    "id",
    "Lowercase letters, numbers and single hyphens only — it is the key projects reference.",
  );

  bag.required("name", input.name, "Name");

  const category = bag.required("category", input.category, "Category");
  bag.addIf(
    category.length > 0 &&
      !(TECH_CATEGORIES as readonly string[]).includes(category),
    "category",
    "Pick one of the listed categories.",
  );

  const proficiency = text(input.proficiency);
  bag.addIf(
    proficiency.length > 0 &&
      !(PROFICIENCY_LEVELS as readonly string[]).includes(proficiency),
    "proficiency",
    "Pick one of the listed levels, or leave it unrated.",
  );

  /* The slug's *shape* is enforced; whether simple-icons has a mark under it is
     not. A slug the site cannot draw is a missing icon, which the public site
     already handles gracefully — and the item is still worth having. The editor
     says so beside the field; it does not refuse the save. */
  const icon = text(input.icon);
  bag.addIf(
    icon.length > 0 && !ICON_SLUG.test(icon),
    "icon",
    "Lowercase letters and numbers only — “Next.js” is “nextdotjs”.",
  );

  const url = text(input.url);
  bag.addIf(
    url.length > 0 && !isHttpUrl(url),
    "url",
    "Must start with http:// or https://.",
  );

  const years = text(input.yearsOfExperience);
  if (years.length > 0) {
    if (!/^\d+$/.test(years)) {
      bag.add("yearsOfExperience", "Whole years only, or leave it empty.");
    } else {
      bag.addIf(
        Number(years) > MAX_YEARS,
        "yearsOfExperience",
        `${years} years is almost certainly a typo — did you mean to fill in “Since”?`,
      );
    }
  }

  const since = text(input.since);
  bag.addIf(
    since.length > 0 && !isIsoMonth(since),
    "since",
    "Use YYYY-MM, or leave it empty.",
  );

  return bag.all;
}

/* ==========================================================================
   Field labels
   ========================================================================== */

const FIELD_LABELS: Record<string, string> = {
  id: "Id",
  name: "Name",
  category: "Category",
  icon: "Icon slug",
  url: "URL",
  proficiency: "Proficiency",
  yearsOfExperience: "Years of experience",
  since: "Since",
};

/** Human names for the banner. */
export function describeField(path: string): string {
  return FIELD_LABELS[path] ?? path;
}
