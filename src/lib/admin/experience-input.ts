import {
  EMPLOYMENT_TYPES,
  WORK_MODES,
  type Experience,
} from "@/types";
import { EMPLOYMENT_TYPE_LABELS, WORK_MODE_LABELS } from "@/lib/format";

import {
  ErrorBag,
  isHttpUrl,
  isIsoMonth,
  isSlug,
  type FieldErrors,
} from "./validation";

/**
 * The wire shape of the experience editor, and the rules it is held to.
 *
 * Same contract as `./project-input` and `./tech-input`: every field is a
 * string so parsing happens once — in the action — rather than twice on either
 * side of the request, and the module imports nothing server-only so the form
 * and the server action run the identical validator.
 *
 * ## What is deliberately *not* required
 *
 * `description` and `highlights`, and this is the one rule here that is worth
 * arguing for rather than copying.
 *
 * On a project, a missing description is an oversight — nobody adds a project
 * before there is something to say about it. A role is the opposite: it is
 * added on the day it starts, when there is a company, a title and a date, and
 * honestly nothing else. A form that refuses to save that has exactly one
 * effect: the field gets filled with something invented to satisfy the
 * validator, which is the failure mode a portfolio can least afford.
 *
 * So the minimum is company, role and a start date: the facts that are true on
 * day one. Everything else fills in as the work happens. The public section
 * and the CV both handle the sparse shape — see `formatRoleMeta` in
 * `@/lib/format` and the empty-guards in `components/sections/experience` —
 * so a bare entry renders as a short entry rather than as a broken one.
 *
 * ## `workMode` and `employmentType` are closed sets
 *
 * Both are nullable `String` columns rather than Postgres enums (see the note
 * in `@/lib/data`), so nothing at the database level stops `"on-chain"` from
 * being written. It would not throw; it would render as a raw slug beside
 * values that render as words. The form offers dropdowns and the validator
 * checks against the same `as const` tuples the types are built from, so the
 * only way to add a mode is to add it to `WORK_MODES` — where the labels and
 * every consumer will see it.
 */

export type ExperienceInput = {
  company: string;
  companyUrl: string;
  role: string;
  /** URL segment, and the unique key. Derived from company and role. */
  slug: string;
  /** An `EmploymentType`, or empty for "not stated". */
  employmentType: string;
  location: string;
  /** A `WorkMode`, or empty for "not stated". */
  workMode: string;
  /** `YYYY-MM`. */
  startDate: string;
  /** `YYYY-MM`, or empty for a current role. */
  endDate: string;
  description: string;
  /** Achievement bullets, strongest first. May be empty. */
  highlights: string[];
  /** `TechId`s, in the order they should render. */
  tech: string[];
  includeInResume: boolean;
  /** Integer as typed, or empty for "no manual override". */
  order: string;
};

/** A blank role, for the create form. */
export function emptyExperience(): ExperienceInput {
  return {
    company: "",
    companyUrl: "",
    role: "",
    slug: "",
    employmentType: "",
    location: "",
    workMode: "",
    startDate: "",
    /* A role is almost always added when it starts, not when it ends. */
    endDate: "",
    description: "",
    highlights: [],
    tech: [],
    /* The CV is the reason this section exists — a role deliberately kept off
       it is the exception, so it is the toggle that has to be switched off
       rather than on. */
    includeInResume: true,
    order: "",
  };
}

/** An existing role, as the form wants it. */
export function toExperienceInput(entry: Experience): ExperienceInput {
  return {
    company: entry.company,
    companyUrl: entry.companyUrl ?? "",
    role: entry.role,
    slug: entry.slug,
    employmentType: entry.employmentType ?? "",
    location: entry.location ?? "",
    workMode: entry.workMode ?? "",
    startDate: entry.dates.start,
    endDate: entry.dates.end ?? "",
    description: entry.description,
    highlights: entry.highlights,
    tech: entry.tech,
    includeInResume: entry.includeInResume,
    order: entry.order === undefined ? "" : String(entry.order),
  };
}

/* ==========================================================================
   Validation
   ========================================================================== */

export type ValidateExperienceOptions = {
  /**
   * Every tech id that exists. The server passes the real set; the client
   * passes what it was rendered with, which is the same list.
   *
   * Checked because `ExperienceTech` is a foreign key with `onDelete:
   * Restrict` — an unknown id is a constraint violation at write time, and a
   * violation that surfaces as a raw Prisma error rather than as "that tech
   * item no longer exists" is a worse version of the same information.
   */
  knownTechIds: ReadonlySet<string>;
};

export function validateExperience(
  input: ExperienceInput,
  { knownTechIds }: ValidateExperienceOptions,
): FieldErrors {
  const bag = new ErrorBag();

  bag.required("company", input.company, "Company");
  bag.required("role", input.role, "Role");

  const slug = bag.required("slug", input.slug, "Slug");
  bag.addIf(
    slug.length > 0 && !isSlug(slug),
    "slug",
    "Lowercase letters, numbers and single hyphens only.",
  );

  const companyUrl = input.companyUrl.trim();
  bag.addIf(
    companyUrl.length > 0 && !isHttpUrl(companyUrl),
    "companyUrl",
    "Company URL must start with http:// or https://.",
  );

  bag.addIf(
    input.employmentType.length > 0 &&
      !(EMPLOYMENT_TYPES as readonly string[]).includes(input.employmentType),
    "employmentType",
    "Pick an employment type, or leave it unset.",
  );

  bag.addIf(
    input.workMode.length > 0 &&
      !(WORK_MODES as readonly string[]).includes(input.workMode),
    "workMode",
    "Pick a work mode, or leave it unset.",
  );

  const start = bag.required("startDate", input.startDate, "Start date");
  bag.addIf(
    start.length > 0 && !isIsoMonth(start),
    "startDate",
    "Use YYYY-MM, for example 2026-08.",
  );

  const end = input.endDate.trim();
  if (end.length > 0) {
    if (!isIsoMonth(end)) {
      bag.add("endDate", "Use YYYY-MM, or leave it empty while you are still there.");
    } else if (isIsoMonth(start) && end < start) {
      /* String comparison is correct for `YYYY-MM` — see `ISODate` in
         `@/types`. */
      bag.add("endDate", "The end date is before the start date.");
    }
  }

  /* No check on `description` or `highlights`. See the note at the top — a
     role with neither is a real state, not an incomplete form. */

  for (const [index, id] of input.tech.entries()) {
    bag.addIf(
      !knownTechIds.has(id),
      `tech.${index}`,
      `"${id}" is not in the tech stack any more.`,
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
 */
const FIELD_LABELS: Record<string, string> = {
  company: "Company",
  companyUrl: "Company URL",
  role: "Role",
  slug: "Slug",
  employmentType: "Employment type",
  location: "Location",
  workMode: "Work mode",
  startDate: "Start date",
  endDate: "End date",
  order: "Order",
};

export function describeField(path: string): string {
  if (FIELD_LABELS[path]) return FIELD_LABELS[path];
  if (path.startsWith("tech.")) return "Tech stack";
  return path;
}

/* ==========================================================================
   Select options
   ========================================================================== */

/**
 * Both selects carry a placeholder, because both fields are genuinely
 * optional — a role with no recorded work mode is not a role with a wrong one,
 * and the public site simply drops the part it has nothing for.
 */
export const EMPLOYMENT_TYPE_OPTIONS = EMPLOYMENT_TYPES.map((value) => ({
  value,
  label: EMPLOYMENT_TYPE_LABELS[value],
}));

export const WORK_MODE_OPTIONS = WORK_MODES.map((value) => ({
  value,
  label: WORK_MODE_LABELS[value],
}));

/**
 * `"Backend Developer"` at `"Fildtek"` -> `"fildtek-backend-developer"`.
 *
 * Company first so the slugs of several roles at one employer sort together,
 * which is the order anybody scanning the list is reading them in.
 */
export function experienceSlugSource(company: string, role: string): string {
  return [company, role].filter((part) => part.trim().length > 0).join(" ");
}
