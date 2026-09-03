/**
 * Shared domain types — the single source of truth for the content model.
 *
 * Both consumers compile against these: the public site, and the CV/resume
 * page that will be generated from the same data. If a field only makes sense
 * for one of the two, it says so in its comment.
 *
 * Design rules this file follows:
 *
 * 1. Dates are ISO strings (`YYYY-MM` or `YYYY-MM-DD`), never `Date` objects.
 *    They survive JSON, the server/client boundary, and a future DB column
 *    without a conversion layer.
 * 2. Entities carry a stable `id` and a mutable `slug`. `id` is what other
 *    records reference and what the admin panel will key on; `slug` is the URL
 *    and is allowed to change without breaking references.
 * 3. Tech is referenced by id, never embedded. One definition of "PostgreSQL"
 *    means its icon and category cannot drift between records.
 * 4. Unions are declared as `as const` tuples so the same list is available at
 *    runtime — for admin panel selects and validation — without a second
 *    definition to keep in sync.
 */

/* ==========================================================================
   Primitives
   ========================================================================== */

/**
 * ISO 8601 date, month precision or finer: `2024-03` or `2024-03-17`.
 * Month precision is the norm here — CVs and project timelines do not need
 * days, and month-only values sort correctly as plain strings.
 */
export type ISODate = string;

export type DateRange = {
  start: ISODate;
  /** `null` means ongoing — "Present" on the CV, "current" on the site. */
  end: ISODate | null;
};

export type ImageAsset = {
  src: string;
  /** Required, not optional. An image without alt text is a bug, not a choice. */
  alt: string;
  /** Intrinsic dimensions. Lets next/image reserve space and avoid layout shift. */
  width?: number;
  height?: number;
  caption?: string;
};

/* ==========================================================================
   Tech stack
   ========================================================================== */

export const TECH_CATEGORIES = [
  "language",
  "framework",
  "library",
  "database",
  "blockchain",
  "infrastructure",
  "tool",
  "design",
] as const;

export type TechCategory = (typeof TECH_CATEGORIES)[number];

export const PROFICIENCY_LEVELS = [
  "learning",
  "working",
  "proficient",
  "expert",
] as const;

export type Proficiency = (typeof PROFICIENCY_LEVELS)[number];

/**
 * Stable identifier for a tech item — a slug like `"typescript"`.
 *
 * Typed as a plain `string` rather than a union derived from the seed data:
 * once this comes from a database the set is no longer known at compile time.
 * `validateContent()` in `lib/data.ts` catches unresolvable references instead.
 */
export type TechId = string;

export type TechStackItem = {
  id: TechId;
  name: string;
  category: TechCategory;
  /**
   * Icon lookup key, resolved by whatever icon set the UI adopts.
   * Kept as a string so the data layer never imports a component.
   */
  icon?: string;
  /** Official site or docs. Used for tooltips and the skills page. */
  url?: string;
  /** Optional, and deliberately so — not every tool deserves a rating. */
  proficiency?: Proficiency;
  /**
   * Years of hands-on use. Prefer deriving this from `since` where possible so
   * it does not silently go stale.
   */
  yearsOfExperience?: number;
  /** First used, `YYYY-MM`. Lets years be computed rather than hardcoded. */
  since?: ISODate;
  /** Surfaces on the CV skills block and the homepage stack summary. */
  featured?: boolean;
};

/* ==========================================================================
   Projects
   ========================================================================== */

export const PROJECT_STATUSES = [
  "shipped",
  "in-progress",
  "archived",
  "concept",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type ProjectLinks = {
  repo?: string;
  live?: string;
  /** Sandbox, video walkthrough, or anything demo-like that is not the live app. */
  demo?: string;
  /** Long-form write-up, if it lives elsewhere (a blog post, a case study PDF). */
  caseStudy?: string;
};

export type Project = {
  id: string;
  /** URL segment: `/work/[slug]`. May change; `id` may not. */
  slug: string;
  title: string;
  /** One line for cards and list views. Keep under ~140 characters. */
  summary: string;
  /** Long form, Markdown. Rendered on the project detail page. */
  description: string;
  /** What you actually did: "Solo build", "Tech lead", "Frontend of four". */
  role: string;
  status: ProjectStatus;
  dates: DateRange;
  /** References into the tech stack by `TechId`. Never embedded objects. */
  tech: TechId[];
  links: ProjectLinks;
  /** First entry is treated as the cover/card image. */
  images: ImageAsset[];
  /** Hero and homepage highlighting. */
  featured: boolean;
  /**
   * Achievement bullets. Not required by the site — the description carries it
   * there — but the CV needs scannable, outcome-shaped lines per project.
   */
  highlights?: string[];
  /** Client or employer, when the project was not personal. */
  client?: string;
  /**
   * Whether this appears on the generated CV. Separate from `featured`: a CV
   * is a shorter, differently-ordered document than a portfolio homepage.
   */
  includeInResume: boolean;
  /** Manual sort override. Lower sorts first; ties fall back to recency. */
  order?: number;
};

/* ==========================================================================
   Experience
   ========================================================================== */

export const EMPLOYMENT_TYPES = [
  "full-time",
  "part-time",
  "contract",
  "freelance",
  "internship",
] as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const WORK_MODES = ["remote", "hybrid", "on-site"] as const;

export type WorkMode = (typeof WORK_MODES)[number];

export type Experience = {
  id: string;
  slug: string;
  company: string;
  companyUrl?: string;
  role: string;
  employmentType?: EmploymentType;
  /** Human-readable: "Lagos, Nigeria" or "Remote". */
  location?: string;
  workMode?: WorkMode;
  dates: DateRange;
  /** A paragraph of context: what the company does, what you owned. */
  description: string;
  /**
   * Achievement bullets, strongest first. This is the primary CV payload —
   * write them outcome-first, with numbers where they exist.
   */
  highlights: string[];
  tech: TechId[];
  includeInResume: boolean;
  order?: number;
};

/* ==========================================================================
   Open-source contributions
   ========================================================================== */

export type PrLink = {
  /** Display text, e.g. "PR #84 — Analytics Dashboard". */
  label: string;
  url: string;
};

/**
 * Work merged into someone else's repository.
 *
 * Deliberately a separate entity from {@link Project} rather than a variant of
 * it. A project is something you own and can point at; a contribution is a
 * change you made inside a codebase you do not own. The distinction the reader
 * cares about — "what does this repo do" versus "what did *you* do to it" —
 * has no equivalent on `Project`, and squeezing it into `description` would
 * lose it.
 */
export type Contribution = {
  id: string;
  slug: string;
  /** Repository display name, e.g. "AfriDollar". */
  repoName: string;
  /** GitHub org or user that owns the repo. */
  owner?: string;
  repoUrl: string;
  /** One line on what the project itself does — context, not credit. */
  repoDescription: string;
  /** One line on what you specifically did. Cards and list views. */
  contributionSummary: string;
  /** Long form, Markdown. The full account of the work. */
  contributionDetails: string;
  /** One or more merged PRs. Several entries cover multiple PRs in one repo. */
  prLinks: PrLink[];
  /**
   * Free-form display labels — NOT {@link TechId} references.
   *
   * Contribution tech describes what a single PR touched, which is often
   * outside your own stack (a one-off queue library, a framework the host repo
   * happens to use). Forcing these through the tech registry would mean adding
   * entries that misrepresent the portfolio's actual stack, so these stay
   * plain strings and simply do not get icons.
   */
  tech: string[];
  /** When the work landed, `YYYY-MM`. Optional — not always recorded. */
  mergedDate?: ISODate;
  featured: boolean;
  /**
   * Whether this appears on the generated CV. Mirrors the same flag on
   * {@link Project} and {@link Experience} so the resume has one consistent
   * inclusion rule across every section rather than a different one per entity.
   */
  includeInResume: boolean;
  /** Manual sort override. Lower sorts first. */
  order?: number;
};

/* ==========================================================================
   Education and certifications
   ========================================================================== */

export const EDUCATION_STATUSES = ["in-progress", "completed"] as const;

export type EducationStatus = (typeof EDUCATION_STATUSES)[number];

export type Education = {
  id: string;
  institution: string;
  fieldOfStudy: string;
  status: EducationStatus;
  /** `end` is `null` while still enrolled. */
  dates: DateRange;
};

export type Certification = {
  id: string;
  title: string;
  /** Issuer as a reader would name it: "Scrimba". */
  platform: string;
  /**
   * What the course covered, one or two sentences.
   *
   * Optional: a certificate can be listed before its summary is written, and
   * the card simply closes up rather than showing invented copy.
   */
  description?: string;
  /**
   * Certificate image.
   *
   * Optional: a certification can land before its scan does, and the card
   * falls back to a typographic placeholder rather than a broken frame.
   */
  imageUrl?: string;
  /** Where the credential can be verified or viewed. */
  credentialUrl: string;
  dateEarned: ISODate;
};

/* ==========================================================================
   Profile
   ========================================================================== */

export type ContactLink = {
  label: string;
  href: string;
  /** Icon lookup key, resolved by the consuming component. */
  icon?: string;
  /** Display form: `@handle`, an email address, a bare domain. */
  handle?: string;
  /** Show in compact places — footer, CV header — rather than every link. */
  primary?: boolean;
};

/**
 * CV-specific fields.
 *
 * Split out from `Profile` because a resume header says different things than
 * a homepage hero: a formal title instead of a tagline, a third-person
 * professional summary instead of a personal bio, and contact details that
 * belong on a PDF but not on a public page.
 */
export type ResumeMeta = {
  /** Formal title under the name: "Senior Backend Engineer". */
  title: string;
  /** Professional summary paragraph for the CV header. */
  summary: string;
  /** Download filename, without extension. */
  fileName: string;
  /** City/country line for the CV header. */
  location?: string;
  /** CV-only. Never render this on a public page. */
  phone?: string;
  /** When the CV content was last reviewed, `YYYY-MM-DD`. */
  updatedAt: ISODate;
};

export type Profile = {
  name: string;
  /** Short, punchy, first-person-adjacent. The homepage hero line. */
  tagline: string;
  bio: {
    /** One or two sentences. Cards, meta descriptions, the about preview. */
    short: string;
    /** Markdown. The full about page. */
    long: string;
  };
  email: string;
  location?: string;
  avatar?: ImageAsset;
  /**
   * Alternate portrait for viewports below `lg`.
   *
   * Art direction, not a resolution fallback: the main portrait is landscape,
   * and centre-cropping it into a small circle leaves the face too small to
   * read. A tighter square crop solves that at phone sizes.
   *
   * Optional — without it the main avatar is used at every width.
   */
  avatarCompact?: ImageAsset;
  /** Whether you are open to work. Drives the status dot in the header. */
  availableForWork?: boolean;
  links: ContactLink[];
  resume: ResumeMeta;
};

/* ==========================================================================
   Aggregates
   ========================================================================== */

/**
 * Everything the CV page needs, pre-filtered and pre-sorted, in one object.
 *
 * Exists so the resume renderer never has to know the filtering rules
 * (`includeInResume`, ordering, which tech counts as featured). Assembling it
 * is the data layer's job; formatting it is not.
 *
 * **Every section can legitimately be empty, and the renderer must skip empty
 * ones rather than printing a bare heading.** `experience` is `[]` today —
 * there is no formal employment history yet — so the CV currently reads as
 * projects, contributions and skills. Nothing needs to change here when a role
 * is added; the section simply starts returning entries.
 */
export type ResumeData = {
  profile: Profile;
  experience: Experience[];
  projects: Project[];
  /** Open-source work. Carries real weight here while `experience` is empty. */
  contributions: Contribution[];
  /** Featured tech only, grouped by category, in `TECH_CATEGORIES` order. */
  skills: { category: TechCategory; items: TechStackItem[] }[];
  education: Education[];
  /** Supporting line rendered under the education entries. */
  educationNote: string;
  /**
   * Present so the CV can count them and link out. The CV deliberately does
   * not print certificate details; the home page's Education section does.
   */
  certifications: Certification[];
};

/* ==========================================================================
   Site chrome
   ========================================================================== */

export type NavItem = {
  label: string;
  href: string;
  /** Off-site links get target/rel handling and an external affordance. */
  external?: boolean;
};

/** @deprecated Use {@link ContactLink}. Kept as an alias during the migration. */
export type SocialLink = ContactLink;

/**
 * What belongs to the site rather than to the person.
 *
 * `name`, `role`, `description` and `social` used to live here too, derived
 * from the seed profile at import time. They moved to `SiteIdentity` in
 * `@/lib/site-identity` when the database became the content source: a
 * module-level constant cannot follow an admin edit, and having two answers to
 * "what is this person called" is how the tab title and the footer end up
 * disagreeing.
 */
export type SiteConfig = {
  url: string;
  nav: NavItem[];
};
