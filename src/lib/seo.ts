import type { Metadata } from "next";

import { getSiteIdentity, type SiteIdentity } from "@/lib/site-identity";

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
 *
 * ## Why these are async now
 *
 * The share-card alt text and the OpenGraph `siteName` are the person's name
 * and title, which are live content — see `@/lib/site-identity`. Reading them
 * makes the builders async, which costs nothing at the call sites: every one
 * of them is already inside an async `generateMetadata`.
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
 * Only the file and its dimensions are fixed here. The alt text names the
 * person, so it is built per render by `ogImage()` rather than frozen into
 * this object — the picture is the same after a rename, the description of it
 * is not.
 */
const OG_FILES = {
  home: { url: "/og-home.png", width: 1200, height: 630 },
  cv: { url: "/og-cv.png", width: 1200, height: 630 },
} as const;

export type OgImageKind = keyof typeof OG_FILES;

/**
 * One share card, described.
 *
 * `home` doubles as the site-wide default in the root layout: a secondary page
 * that never declares its own image still shares as something deliberate.
 */
export function ogImage(kind: OgImageKind, identity: SiteIdentity): OgImage {
  const file = OG_FILES[kind];
  return {
    ...file,
    alt:
      kind === "cv"
        ? `The CV of ${identity.name}`
        : `${identity.name} - ${identity.role}`,
  };
}

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
  image: OgImageKind;
};

export async function pageMetadata({
  title,
  description,
  path,
  image,
}: PageSeo): Promise<Metadata> {
  const identity = await getSiteIdentity();

  return {
    title: { absolute: title },
    description,

    /* One clean address per page, so a share with a `?utm_*` tail or a stray
       trailing slash still consolidates onto the same URL. */
    alternates: { canonical: path },

    openGraph: {
      type: "website",
      url: path,
      siteName: identity.name,
      locale: "en_US",
      title,
      description,
      images: [ogImage(image, identity)],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_FILES[image].url],
    },
  };
}
