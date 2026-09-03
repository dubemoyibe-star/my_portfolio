import type { MetadataRoute } from "next";

import { profile as seedProfile } from "@/data/profile";
import { siteConfig } from "@/data/site";
import { resolveProfile } from "@/lib/site-identity";

/**
 * The date the content was last revised.
 *
 * Read from the database so an edit made through the admin panel is reflected,
 * but never at the cost of the build. This function runs during `next build` —
 * the sitemap is prerendered — so an unreachable or cold Neon would otherwise
 * take the whole deployment down over one optional field.
 *
 * `resolveProfile()` is what arranges that: a timed read, falling back to the
 * seed, which is where the database's value came from in the first place. The
 * timeout and the reasoning behind it used to live in this file and now sit in
 * `@/lib/site-identity`, because the root layout's metadata and the 404 need
 * exactly the same bargain — see the note there.
 *
 * Worst case the sitemap reports the date of the last seed rather than the
 * last admin edit: a `lastModified` slightly behind the truth is a hint a
 * crawler will re-check anyway, and is not worth a failed deploy.
 */
async function lastModified(): Promise<Date> {
  const profile = await resolveProfile();
  const date = new Date(profile.resume.updatedAt);
  /* `updatedAt` is a free-text column. An unparseable value would reach Next
     as an Invalid Date and throw on serialization — the same failed build the
     fallback above exists to prevent. The seed's own date stands in, rather
     than `new Date()`: a build-time timestamp claims the content changed on
     every redeploy, which is how a crawler learns to ignore the field. */
  return Number.isNaN(date.getTime())
    ? new Date(seedProfile.resume.updatedAt)
    : date;
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
