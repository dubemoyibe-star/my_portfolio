import type { SiteConfig } from "@/types";

import { profile } from "@/data/profile";

/**
 * Site chrome: navigation, canonical URL, and the metadata defaults.
 *
 * Everything about the *person* is derived from `profile` rather than repeated
 * here — one record owns the name, the role and the social links, so the header,
 * the footer, the CV and the OpenGraph tags cannot disagree about them.
 *
 * What stays local to this file is genuinely site-level: routes and the domain.
 */
export const siteConfig: SiteConfig = {
  name: profile.name,
  role: profile.resume.title,
  description: profile.bio.short,
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

  /* All of them. `primary` still marks the two worth showing in tight spots. */
  social: profile.links,
};
