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
  url: "https://example.com",

  /* Grows as sections land. Projects, Contributions and the CV link are added
     in the later UI passes; only anchors that exist are listed, so the header
     never offers a dead link. */
  nav: [
    { label: "Projects", href: "#projects" },
    { label: "Contributions", href: "#contributions" },
    { label: "Stack", href: "#stack" },
  ],

  /* All of them. `primary` still marks the two worth showing in tight spots. */
  social: profile.links,
};
