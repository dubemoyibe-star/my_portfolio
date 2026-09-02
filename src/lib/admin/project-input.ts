import { PROJECT_STATUSES, type Project, type ProjectStatus } from "@/types";

import {
  ErrorBag,
  isImageSrc,
  isHttpUrl,
  isIsoMonth,
  isSlug,
  type FieldErrors,
} from "./validation";

/**
 * The wire shape of the project editor, and the rules it is held to.
 *
 * ## Why every field is a string
 *
 * `order` is an integer in the database and a text input in the form; `endDate`
 * is nullable in the database and an empty box in the form. Modelling the input
 * as the database row would mean the form parsing on the way in and the action
 * parsing again on the way out, with two chances to disagree about what an
 * empty box means. Strings all the way to the action, parsed once, in one
 * place — `toPrismaData` below — removes the disagreement.
 *
 * Booleans are the exception: a checkbox has no empty state to confuse.
 *
 * ## Why this module has no `"use server"` and no Prisma import
 *
 * It is imported by both the client form and the server action, and runs
 * identically in both. The form calls `validateProject` to put messages next to
 * fields before a request happens; the action calls the same function again
 * because the action is reachable by anything with a session cookie, not only
 * by the form that was shipped with it. One definition, enforced twice.
 */

export type ProjectImageInput = {
  src: string;
  alt: string;
  caption: string;
  width?: number;
  height?: number;
};

export type ProjectInput = {
  title: string;
  slug: string;
  summary: string;
  description: string;
  role: string;
  client: string;
  status: string;
  /** `YYYY-MM`. */
  startDate: string;
  /** `YYYY-MM`, or empty for an ongoing project. */
  endDate: string;
  /** `TechId`s, in the order they should render. */
  tech: string[];
  linksRepo: string;
  linksLive: string;
  linksDemo: string;
  linksCaseStudy: string;
  images: ProjectImageInput[];
  highlights: string[];
  featured: boolean;
  includeInResume: boolean;
  /** Integer as typed, or empty for "no manual override". */
  order: string;
};

/** A blank project, for the create form. */
export function emptyProject(): ProjectInput {
  return {
    title: "",
    slug: "",
    summary: "",
    description: "",
    role: "",
    client: "",
    /* Most things being added are underway rather than finished — a project
       usually earns its portfolio entry before it ships. */
    status: "in-progress",
    startDate: "",
    endDate: "",
    tech: [],
    linksRepo: "",
    linksLive: "",
    linksDemo: "",
    linksCaseStudy: "",
    images: [],
    highlights: [],
    featured: false,
    includeInResume: false,
    order: "",
  };
}

/** An existing project, as the form wants it. The inverse of `toPrismaData`. */
export function toProjectInput(
  project: Project,
  images: ProjectImageInput[],
): ProjectInput {
  return {
    title: project.title,
    slug: project.slug,
    summary: project.summary,
    description: project.description,
    role: project.role,
    client: project.client ?? "",
    status: project.status,
    startDate: project.dates.start,
    endDate: project.dates.end ?? "",
    tech: project.tech,
    linksRepo: project.links.repo ?? "",
    linksLive: project.links.live ?? "",
    linksDemo: project.links.demo ?? "",
    linksCaseStudy: project.links.caseStudy ?? "",
    images,
    highlights: project.highlights ?? [],
    featured: project.featured,
    includeInResume: project.includeInResume,
    order: project.order === undefined ? "" : String(project.order),
  };
}

/* ==========================================================================
   Validation
   ========================================================================== */

/**
 * `summary` is documented as "one line for cards and list views, under ~140
 * characters". That is guidance, and the form shows a live count against it.
 * This is the hard stop: past here the card layout on the public site stops
 * being a card. Set well above the guidance so an occasional long line is a
 * judgement call rather than a fight with the editor.
 */
const SUMMARY_LIMIT = 240;

export type ValidateProjectOptions = {
  /**
   * Every tech id that exists. The server passes the real set; the client
   * passes what it was rendered with, which is the same list.
   *
   * Checked because `ProjectTech` is a foreign key with `onDelete: Restrict` —
   * an unknown id is a constraint violation at write time, and a violation that
   * surfaces as a raw Prisma error rather than as "that tech item no longer
   * exists" is a worse version of the same information.
   */
  knownTechIds: ReadonlySet<string>;
};

export function validateProject(
  input: ProjectInput,
  { knownTechIds }: ValidateProjectOptions,
): FieldErrors {
  const bag = new ErrorBag();

  bag.required("title", input.title, "Title");

  const slug = bag.required("slug", input.slug, "Slug");
  bag.addIf(
    slug.length > 0 && !isSlug(slug),
    "slug",
    "Lowercase letters, numbers and single hyphens only — this becomes the URL.",
  );

  const summary = bag.required("summary", input.summary, "Summary");
  bag.addIf(
    summary.length > SUMMARY_LIMIT,
    "summary",
    `Summary is ${summary.length} characters. Keep it under ${SUMMARY_LIMIT} — it has to fit on a card.`,
  );

  bag.required("description", input.description, "Description");
  bag.required("role", input.role, "Role");

  bag.addIf(
    !(PROJECT_STATUSES as readonly string[]).includes(input.status),
    "status",
    "Pick a status.",
  );

  const start = bag.required("startDate", input.startDate, "Start date");
  bag.addIf(
    start.length > 0 && !isIsoMonth(start),
    "startDate",
    "Use YYYY-MM, for example 2026-03.",
  );

  const end = input.endDate.trim();
  if (end.length > 0) {
    if (!isIsoMonth(end)) {
      bag.add("endDate", "Use YYYY-MM, or leave it empty while it is ongoing.");
    } else if (isIsoMonth(start) && end < start) {
      /* String comparison is correct for `YYYY-MM` — see `ISODate` in
         `@/types`. */
      bag.add("endDate", "The end date is before the start date.");
    }
  }

  /* Links are all optional, and all end up as an `href` on the public site.
     An unparseable one is a dead link nobody would notice until a reader
     clicked it. */
  const links = [
    ["linksRepo", input.linksRepo, "Repository URL"],
    ["linksLive", input.linksLive, "Live URL"],
    ["linksDemo", input.linksDemo, "Demo URL"],
    ["linksCaseStudy", input.linksCaseStudy, "Case study URL"],
  ] as const;

  for (const [field, value, label] of links) {
    const trimmed = value.trim();
    bag.addIf(
      trimmed.length > 0 && !isHttpUrl(trimmed),
      field,
      `${label} must start with http:// or https://.`,
    );
  }

  for (const [index, id] of input.tech.entries()) {
    bag.addIf(
      !knownTechIds.has(id),
      `tech.${index}`,
      `"${id}" is not in the tech stack any more.`,
    );
  }

  for (const [index, image] of input.images.entries()) {
    bag.addIf(
      !isImageSrc(image.src),
      `images.${index}.src`,
      "Image source must be an uploaded URL or a path under /public.",
    );
    /* `ImageAsset.alt` is required on the type, with a comment saying an image
       without alt text is a bug rather than a choice. This is where that is
       enforced. */
    bag.addIf(
      image.alt.trim().length === 0,
      `images.${index}.alt`,
      "Alt text is required.",
    );
  }

  const order = input.order.trim();
  bag.addIf(
    order.length > 0 && !/^-?\d+$/.test(order),
    "order",
    "Order must be a whole number, or empty for no override.",
  );

  return bag.all;
}

/* ==========================================================================
   Field labels
   ========================================================================== */

/**
 * Human names for the fields, so the form-level banner can say which panel to
 * look in rather than only that something is wrong somewhere.
 *
 * Nested paths (`images.2.alt`) are resolved by prefix, since their index is
 * not known here.
 */
const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  slug: "Slug",
  summary: "Summary",
  description: "Description",
  role: "Role",
  status: "Status",
  startDate: "Start date",
  endDate: "End date",
  linksRepo: "Repository URL",
  linksLive: "Live URL",
  linksDemo: "Demo URL",
  linksCaseStudy: "Case study URL",
  order: "Order",
};

export function describeField(path: string): string {
  if (FIELD_LABELS[path]) return FIELD_LABELS[path];
  if (path.startsWith("images.")) return "Images";
  if (path.startsWith("tech.")) return "Tech stack";
  return path;
}

/* ==========================================================================
   Status labels
   ========================================================================== */

/** `"in-progress"` -> `"In progress"`, for selects and list rows. */
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  shipped: "Shipped",
  "in-progress": "In progress",
  archived: "Archived",
  concept: "Concept",
};

export const PROJECT_STATUS_OPTIONS = PROJECT_STATUSES.map((status) => ({
  value: status,
  label: PROJECT_STATUS_LABELS[status],
}));
