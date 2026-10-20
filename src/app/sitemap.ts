import type { MetadataRoute } from "next";

import { profile as seedProfile } from "@/data/profile";
import { siteConfig } from "@/data/site";
import { getBlogPostSlugs, getProjectSlugs } from "@/lib/data";
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
 * Public destinations and published content routes. Education and
 * certifications remain sections of the home page (`/#education`), not
 * destinations of their own, so fragments are intentionally omitted.
 *
 * Slugs come from the content tables. The profile date degrades on its own
 * rather than blocking the sitemap when the profile store is unavailable.
 *
 * That date is `profile.resume.updatedAt` rather than `new Date()`. A
 * build-time timestamp tells a crawler the content changed every time the site
 * is redeployed, which trains it to ignore the field; the date the content was
 * actually revised is the thing worth reporting.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [modified, projectSlugs, blogSlugs] = await Promise.all([
    lastModified(),
    getProjectSlugs(),
    getBlogPostSlugs(),
  ]);

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
    {
      url: `${siteConfig.url}/projects`,
      lastModified: modified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...projectSlugs.map((slug) => ({
      url: `${siteConfig.url}/projects/${slug}`,
      lastModified: modified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${siteConfig.url}/blog`,
      lastModified: modified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...blogSlugs.map((slug) => ({
      url: `${siteConfig.url}/blog/${slug}`,
      lastModified: modified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
