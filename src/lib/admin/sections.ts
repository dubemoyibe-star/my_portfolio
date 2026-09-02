/**
 * The admin's own table of contents.
 *
 * One list, read by both the nav bar and the dashboard's overview grid, so a
 * section cannot exist in the navigation and be missing from the dashboard —
 * or, worse, be linked from both while its route does not exist yet.
 *
 * `ready` is the flag that makes an incremental build honest. The panel is
 * assembled one section at a time, and a nav item pointing at a route that has
 * not been written yet is a 404 with the operator's name on it. An unready
 * section renders as a disabled item that says so, and flips to a live link by
 * changing one boolean in this file when its pages land.
 */

export type AdminSection = {
  href: string;
  label: string;
  /** One line on what lives there, shown on the dashboard cards. */
  description: string;
  /**
   * How the dashboard labels this section's count — "4 projects".
   * Absent for the sections that are a single record rather than a list.
   */
  countLabel?: string;
  ready: boolean;
};

export const ADMIN_SECTIONS: AdminSection[] = [
  {
    href: "/admin/projects",
    label: "Projects",
    description:
      "The work itself: summaries, stack, links, cover images and the CV inclusion flag.",
    countLabel: "projects",
    ready: true,
  },
  {
    href: "/admin/contributions",
    label: "Contributions",
    description:
      "Merged work in repositories you do not own, with their PR links.",
    countLabel: "contributions",
    ready: true,
  },
  {
    href: "/admin/tech-stack",
    label: "Tech stack",
    description:
      "The tech vocabulary every project and role references, by category.",
    countLabel: "tech items",
    ready: false,
  },
  {
    href: "/admin/education",
    label: "Education",
    description: "The degree entry, the supporting note, and every certificate.",
    countLabel: "certifications",
    ready: false,
  },
  {
    href: "/admin/experience",
    label: "Experience",
    description:
      "Employment history. Empty today — the public site already handles that.",
    countLabel: "roles",
    ready: false,
  },
  {
    href: "/admin/profile",
    label: "Profile",
    description:
      "Name, tagline, bio, avatar, contact links and the CV header copy.",
    ready: false,
  },
];
