import type { SiteConfig } from "@/types";

/** Site-level destinations and canonical URL. */
export const siteConfig: SiteConfig = {
  url: "https://oyibe.dev",
  nav: [
    { label: "Experience", href: "/#experience", icon: "experience" },
    { label: "Projects", href: "/projects", icon: "projects" },
    { label: "Blog", href: "/blog", icon: "blog" },
  ],
};
