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

  nav: [
    { label: "Work", href: "/work" },
    { label: "About", href: "/about" },
    { label: "Writing", href: "/writing" },
    { label: "Contact", href: "/contact" },
  ],

  social: profile.links.filter((link) => link.primary),
};
