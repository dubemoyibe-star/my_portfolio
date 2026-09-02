/**
 * Timestamp formatting for the admin list views.
 *
 * `toLocaleDateString` is deliberately not used. It reads the *server's* locale
 * and timezone, which is neither the operator's nor stable between a local dev
 * machine and whichever region a serverless function happens to run in — so the
 * same row could render two different dates on two loads. Fixed month names and
 * UTC give one answer everywhere.
 *
 * The day is all these columns show. The exact instant belongs in a `title`
 * attribute, where it is available without spending a column on it.
 */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** `2026-08-31T09:12:44Z` -> `31 Aug 2026`. */
export function formatStamp(value: Date): string {
  return `${value.getUTCDate()} ${MONTHS[value.getUTCMonth()]} ${value.getUTCFullYear()}`;
}
