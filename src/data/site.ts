import type { SiteConfig } from "@/types";

/**
 * Static site configuration.
 *
 * This is the seam for the admin panel: today it is a hardcoded object, later
 * it becomes a fetch. Components must import `siteConfig` rather than reading
 * these strings inline, so swapping the source stays a one-file change.
 *
 * All values below are placeholders.
 */
export const siteConfig: SiteConfig = {
  name: "Your Name",
  role: "Placeholder role",
  description: "Placeholder description for the portfolio site.",
  url: "https://example.com",

  nav: [
    { label: "Work", href: "/work" },
    { label: "About", href: "/about" },
    { label: "Writing", href: "/writing" },
    { label: "Contact", href: "/contact" },
  ],

  social: [
    { label: "GitHub", href: "https://github.com", icon: "github" },
    { label: "LinkedIn", href: "https://linkedin.com", icon: "linkedin" },
    { label: "Email", href: "mailto:hello@example.com", icon: "mail" },
  ],
};
