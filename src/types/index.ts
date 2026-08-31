/**
 * Shared domain types.
 *
 * Kept deliberately thin for now. Project / experience / skill entities land
 * here once the content model is real, so the admin panel and the public site
 * can compile against one definition instead of two.
 */

export type NavItem = {
  label: string;
  href: string;
  /** Off-site links get target/rel handling and an external affordance. */
  external?: boolean;
};

export type SocialLink = {
  label: string;
  href: string;
  /** Key for the icon lookup, resolved by the consuming component. */
  icon?: string;
};

export type SiteConfig = {
  name: string;
  role: string;
  description: string;
  url: string;
  nav: NavItem[];
  social: SocialLink[];
};
