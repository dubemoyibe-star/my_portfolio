/**
 * Shared validation vocabulary for the admin editors.
 *
 * Deliberately framework-free and dependency-free: every function here is a
 * pure string check, so the same module imports into a client form and into a
 * server action. That is the point. The form runs these to show inline errors
 * before a request is made; the action runs the *same* functions again before
 * a write, because a client check is a convenience and never a guarantee — the
 * server actions are reachable by anything holding a session cookie, not only
 * by the form that was shipped alongside them.
 *
 * The errors are keyed by field name so a form can index straight into them.
 * Nested collections use dotted paths — `images.1.alt` — so a per-row message
 * lands on the row it belongs to rather than at the top of the page.
 */

/** Field-keyed messages. An empty object means "valid". */
export type FieldErrors = Record<string, string>;

/**
 * What every admin server action returns.
 *
 * A discriminated union rather than a thrown error: a validation failure is an
 * expected outcome of a form submission, and throwing would turn it into an
 * error boundary instead of a message next to the field that caused it. Real
 * failures — a dead database, a missing session — still throw.
 */
export type ActionResult =
  | { ok: true; id?: string; message?: string }
  | { ok: false; formError?: string; fieldErrors?: FieldErrors };

/* ==========================================================================
   Normalizing
   ========================================================================== */

/** Anything to a trimmed string. Non-strings become `""` rather than `"null"`. */
export function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * A trimmed string, or `null` when there is nothing left.
 *
 * The nullable columns in the schema mean "absent", and an empty string is not
 * absent — it is a value that renders as a blank line on the public site. Every
 * optional field goes through here so clearing an input in the form and never
 * filling it in produce the same row.
 */
export function nullableText(value: unknown): string | null {
  const trimmed = text(value);
  return trimmed.length > 0 ? trimmed : null;
}

/** A finite integer, or `null`. Used for `order`, image dimensions. */
export function nullableInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(String(value).trim());
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

/**
 * `"My Cool Project!"` -> `"my-cool-project"`.
 *
 * Diacritics are decomposed and stripped rather than dropped wholesale, so
 * "Café" becomes "cafe" and not "caf". Everything else that is not a letter,
 * digit or hyphen collapses to a single hyphen.
 */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/* ==========================================================================
   Predicates
   ========================================================================== */

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Lowercase words joined by single hyphens. What `slugify` produces. */
export function isSlug(value: string): boolean {
  return SLUG.test(value);
}

const ISO_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * `YYYY-MM`. The precision the whole content model uses — see `ISODate` in
 * `@/types` for why days are not stored.
 */
export function isIsoMonth(value: string): boolean {
  return ISO_MONTH.test(value);
}

const ISO_DAY = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/** `YYYY-MM-DD`. Only `resume.updatedAt` is stored at this precision. */
export function isIsoDay(value: string): boolean {
  return ISO_DAY.test(value);
}

/**
 * An absolute `http(s)` URL.
 *
 * Protocol-relative and bare-domain values are rejected on purpose: these end
 * up in `href`s on the public site, and `//evil.example` or `javascript:` in a
 * link is the one thing a content field must not be able to become.
 */
export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * A usable image source: an absolute http(s) URL, or a site-root path.
 *
 * The root-relative case is not legacy tolerance — the seeded images live in
 * `/public` and are still perfectly good sources. Uploads add Cloudinary URLs
 * beside them rather than replacing them.
 */
export function isImageSrc(value: string): boolean {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  return isHttpUrl(value);
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Deliberately loose. The authority on a deliverable address is a sent mail. */
export function isEmail(value: string): boolean {
  return EMAIL.test(value);
}

/* ==========================================================================
   Collecting
   ========================================================================== */

/**
 * Accumulates messages without letting a later check overwrite an earlier one.
 *
 * First message per field wins, so "Required" is not replaced by the
 * format complaint that a blank value also triggers.
 */
export class ErrorBag {
  private readonly errors: FieldErrors = {};

  add(field: string, message: string): void {
    if (!(field in this.errors)) this.errors[field] = message;
  }

  /** Add when `condition` is true. Reads as the sentence it enforces. */
  addIf(condition: boolean, field: string, message: string): void {
    if (condition) this.add(field, message);
  }

  /** Required-text check, returning the trimmed value so callers can reuse it. */
  required(field: string, value: unknown, label: string): string {
    const trimmed = text(value);
    if (trimmed.length === 0) this.add(field, `${label} is required.`);
    return trimmed;
  }

  get isEmpty(): boolean {
    return Object.keys(this.errors).length === 0;
  }

  get all(): FieldErrors {
    return this.errors;
  }
}

/**
 * The message shown when a form is submitted with field errors.
 *
 * One sentence, used by every editor, so the banner does not have to be
 * re-worded per entity — the specifics are already next to the fields.
 */
export const FIX_FIELDS_MESSAGE =
  "Some fields need attention before this can be saved.";
