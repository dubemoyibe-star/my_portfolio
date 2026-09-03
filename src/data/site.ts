import type { SiteConfig } from "@/types";

/**
 * Site chrome: navigation and the canonical URL.
 *
 * ## What is deliberately not here any more
 *
 * This file used to derive `name`, `role`, `description` and `social` from
 * `@/data/profile`. That was correct while the seed file was the content
 * source, and became a bug when the database took over: an import is resolved
 * once, at module load, so those four values were frozen at whatever was last
 * committed. The hero and the CV followed an admin edit; the footer, the root
 * layout's default metadata and the 404 did not.
 *
 * They now live behind `getSiteIdentity()` in `@/lib/site-identity`, which
 * reads the live row and falls back to the seed only when the database cannot
 * answer. What is left here is what genuinely belongs to the site rather than
 * to the person: the domain it is served from, and the sections the header
 * offers.
 */
export const siteConfig: SiteConfig = {
  url: "https://oyibe.vercel.app",

  /* Grows as sections land. Only anchors that exist are listed, so the header
     never offers a dead link — which is also why Experience appears here only
     now: the section renders `null` while there are no roles, and a nav item
     pointing at an id that is not in the document scrolls nowhere. */
  nav: [
    { label: "Experience", href: "/#experience" },
    { label: "Projects", href: "/#projects" },
    { label: "Contributions", href: "/#contributions" },
    { label: "Stack", href: "/#stack" },
  ],
};
