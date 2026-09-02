import type { MetadataRoute } from "next";

import { siteConfig } from "@/data/site";
import { getProfile } from "@/lib/data";

/**
 * The sitemap, served at /sitemap.xml.
 *
 * Two routes, because there are two: education and certifications are a
 * section of the home page (`/#education`), not a destination of their own, and
 * listing a fragment here would claim a page that does not exist. When a real
 * route is added, it gets a line here — not an entry per anchor.
 *
 * `lastModified` comes from `profile.resume.updatedAt` rather than
 * `new Date()`. A build-time timestamp tells a crawler the content changed
 * every time the site is redeployed, which trains it to ignore the field; the
 * date the content was actually revised is the thing worth reporting.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const profile = await getProfile();
  const lastModified = new Date(profile.resume.updatedAt);

  return [
    {
      url: siteConfig.url,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/cv`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
