import type { MetadataRoute } from "next";

import { profile as seedProfile } from "@/data/profile";
import { siteConfig } from "@/data/site";
import { getProfile } from "@/lib/data";

/**
 * How long the profile read gets before the sitemap gives up on it.
 *
 * A cold Neon compute answers well inside this; an unreachable one does not
 * answer at all, and Prisma's own socket timeout is long enough that waiting
 * for it can outlast the build. Three seconds is the point past which the
 * database is not going to save us a stale date.
 */
const PROFILE_TIMEOUT_MS = 3_000;

/**
 * Reject if `work` has not settled within `ms`.
 *
 * The losing promise keeps its handlers either way — `then(resolve, reject)`
 * is attached before the race can be lost — so a database error arriving after
 * the timeout lands on an already-settled promise instead of surfacing as an
 * unhandled rejection and failing the build by another route.
 */
function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timed out after ${ms}ms`)),
      ms,
    );
    work.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

/**
 * The date the content was last revised.
 *
 * Read from the database so an edit made through the admin panel is reflected,
 * but never at the cost of the build. This function runs during
 * `next build` — the sitemap is prerendered — so an unreachable or cold Neon
 * would otherwise take the whole deployment down over one optional field.
 *
 * The fallback is the seed's own `updatedAt`, which is where the database's
 * value came from in the first place. Worst case the sitemap reports the date
 * of the last seed rather than the last admin edit: a `lastModified` slightly
 * behind the truth is a hint a crawler will re-check anyway, and is not worth
 * a failed deploy.
 */
async function lastModified(): Promise<Date> {
  const fallback = new Date(seedProfile.resume.updatedAt);

  try {
    const live = await withTimeout(getProfile(), PROFILE_TIMEOUT_MS);
    const date = new Date(live.resume.updatedAt);
    /* `updatedAt` is a free-text column. An unparseable value would reach
       Next as an Invalid Date and throw on serialization — the same failed
       build this function exists to prevent. */
    return Number.isNaN(date.getTime()) ? fallback : date;
  } catch {
    return fallback;
  }
}

/**
 * The sitemap, served at /sitemap.xml.
 *
 * Two routes, because there are two: education and certifications are a
 * section of the home page (`/#education`), not a destination of their own, and
 * listing a fragment here would claim a page that does not exist. When a real
 * route is added, it gets a line here — not an entry per anchor.
 *
 * The URLs are static; the only thing here that has ever needed the database
 * is `lastModified`, and it degrades on its own rather than blocking.
 *
 * That date is `profile.resume.updatedAt` rather than `new Date()`. A
 * build-time timestamp tells a crawler the content changed every time the site
 * is redeployed, which trains it to ignore the field; the date the content was
 * actually revised is the thing worth reporting.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const modified = await lastModified();

  return [
    {
      url: siteConfig.url,
      lastModified: modified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/cv`,
      lastModified: modified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
