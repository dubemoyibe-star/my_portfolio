import type { Metadata } from "next";

import { siteConfig } from "@/data/site";

/**
 * Per-page metadata, assembled in one place.
 *
 * Every page needs the same six facts said four times over — as the document
 * title, as the meta description, as OpenGraph tags, and again as Twitter card
 * tags. Writing that out per route is how og:title and <title> end up
 * disagreeing after a copy edit, so pages declare the facts once and this
 * builds the rest.
 *
 * Absolute URLs are resolved by Next against `metadataBase` in the root layout,
 * so paths here stay root-relative and the domain is stated exactly once, in
 * `siteConfig.url`.
 */

export type OgImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
};

/**
 * The share cards. Both are 1200x630 — the size every crawler crops to, so
 * anything else gets letterboxed or trimmed by the platform instead of by us.
 *
 * `home` doubles as the site-wide default in the root layout: a secondary page
 * that never declares its own image still shares as something deliberate.
 */
export const ogImages = {
  home: {
    url: "/og-home.png",
    width: 1200,
    height: 630,
    alt: `${siteConfig.name} - ${siteConfig.role}`,
  },
  cv: {
    url: "/og-cv.png",
    width: 1200,
    height: 630,
    alt: `The CV of ${siteConfig.name}`,
  },
} satisfies Record<string, OgImage>;

export type PageSeo = {
  /**
   * The full title, used verbatim. Pages set this rather than a fragment
   * because the root layout's `%s` template appends the name, and these titles
   * already lead with it — the template would say it twice.
   */
  title: string;
  description: string;
  /** Root-relative, no trailing slash: `/` or `/cv`. Becomes the canonical. */
  path: string;
  image: OgImage;
};

export function pageMetadata({
  title,
  description,
  path,
  image,
}: PageSeo): Metadata {
  return {
    title: { absolute: title },
    description,

    /* One clean address per page, so a share with a `?utm_*` tail or a stray
       trailing slash still consolidates onto the same URL. */
    alternates: { canonical: path },

    openGraph: {
      type: "website",
      url: path,
      siteName: siteConfig.name,
      locale: "en_US",
      title,
      description,
      images: [image],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.url],
    },
  };
}
