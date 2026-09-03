import type {
  DateRange,
  EmploymentType,
  ISODate,
  WorkMode,
} from "@/types";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * `"2026-02"` -> `"Feb 2026"`.
 *
 * Parsed by splitting the string rather than through `new Date()`: `"2026-02"`
 * is read as UTC midnight, which in any negative-offset timezone renders as
 * January. Splitting also avoids `Intl` locale differences, so the output is
 * identical on the server and in the browser.
 */
export function formatMonth(iso: ISODate): string {
  const [year, month] = iso.split("-");
  const name = MONTHS[Number(month) - 1];
  return name ? `${name} ${year}` : year;
}

/** `"Feb 2026 — Apr 2026"`, or `"Aug 2026 — Present"` for an open range. */
export function formatDateRange(range: DateRange): string {
  const start = formatMonth(range.start);
  const end = range.end ? formatMonth(range.end) : "Present";
  return start === end ? start : `${start} — ${end}`;
}

/**
 * `"https://stenion.vercel.app/"` -> `"stenion.vercel.app"`.
 *
 * For print, where a link is not clickable and the URL itself is the useful
 * part. Protocol, `www.` and any trailing slash are noise on paper.
 */
export function formatUrl(url: string): string {
  return url
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "");
}

/* ==========================================================================
   Employment
   ========================================================================== */

/**
 * Display names for the two closed sets on `Experience`.
 *
 * They live here rather than in the admin's `experience-input` because both
 * sides need them: the public section and the CV render them, and the editor's
 * dropdowns are built from them. One definition means a role cannot read
 * "Full-time" in the form and "full time" on the page.
 */
export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  freelance: "Freelance",
  internship: "Internship",
};

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  "on-site": "On-site",
};

/**
 * `"Lagos, Nigeria · Remote · Contract"` — the supporting line under a role.
 *
 * All three parts are optional on the type, and a role that carries none of
 * them returns `""` so the caller can drop the line entirely rather than
 * render an empty paragraph. That is the whole reason this returns a string
 * instead of the caller stringing the fields together at each call site: a
 * sparse entry — a role just started, with nothing recorded but a company and
 * a date — must not leave a blank row where the fuller entries have text.
 *
 * Unknown values pass through as typed rather than being dropped. These are
 * `String` columns, not Postgres enums (see `@/lib/data`), so a value outside
 * the union is possible; showing it is how it gets noticed and fixed.
 */
export function formatRoleMeta(entry: {
  location?: string;
  workMode?: WorkMode;
  employmentType?: EmploymentType;
}): string {
  return [
    entry.location,
    entry.workMode ? (WORK_MODE_LABELS[entry.workMode] ?? entry.workMode) : undefined,
    entry.employmentType
      ? (EMPLOYMENT_TYPE_LABELS[entry.employmentType] ?? entry.employmentType)
      : undefined,
  ]
    .filter((part): part is string => Boolean(part && part.trim().length > 0))
    .join(" · ");
}
