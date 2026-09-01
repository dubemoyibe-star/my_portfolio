import type { DateRange, ISODate } from "@/types";

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
