import type { SiteConfig } from "@/types";

/** Site-level destinations and canonical URL. */
export const siteConfig: SiteConfig = {
  url: "https://oyibe.dev",
  nav: [
    { label: "Experience", href: "/#experience" },
    { label: "Projects", href: "/projects" },
    { label: "Writing", href: "/blog" },
    { label: "Contributions", href: "/#contributions" },
    { label: "Stack", href: "/#stack" },
  ],
};
