import type { SiteConfig } from "@/types";

/** Site-level destinations and canonical URL. */
export const siteConfig: SiteConfig = {
  url: "https://oyibe.dev",
  nav: [
    { label: "Experience", href: "/#experience" },
    { label: "Projects", href: "/projects" },
    { label: "Contributions", href: "/#contributions" },
    { label: "Blog", href: "/blog" },
  ],
};
