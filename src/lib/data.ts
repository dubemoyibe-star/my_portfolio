import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  TECH_CATEGORIES,
  type Certification,
  type ContactLink,
  type Contribution,
  type DateRange,
  type Education,
  type EducationStatus,
  type EmploymentType,
  type Experience,
  type ImageAsset,
  type PrLink,
  type Proficiency,
  type Profile,
  type Project,
  type ProjectLinks,
  type ProjectStatus,
  type ResumeData,
  type TechCategory,
  type TechId,
  type TechStackItem,
  type WorkMode,
} from "@/types";

/**
 * The content access layer. Everything that reads content goes through here —
 * no page, component or route imports from `@/data/*` or touches Prisma
 * directly.
 *
 * ## Where the content lives
 *
 * Postgres on Neon, read through Prisma. The files in `src/data/` are no longer
 * the live source; they are kept as the input to `prisma/seed.ts` and as a
 * rollback reference. Editing one of them changes nothing until the seed is
 * re-run.
 *
 * ## What did not change in the swap
 *
 * Every exported signature and every return shape. The `read*` functions below
 * were always the designated swap point, and they are the only thing the
 * migration touched — filtering, sorting and shaping still live here, so the
 * same rules apply whether a record came from a file or a table.
 *
 * Filtering and sorting deliberately stay in TypeScript rather than moving into
 * SQL. Two reasons: the ordering rules are not expressible as a plain `ORDER
 * BY` (an open-ended date range has to sort as if it ends in the far future,
 * and `order` overrides recency), and at four projects and six contributions
 * the whole content set is smaller than a single query plan. Worth revisiting
 * if these tables ever reach a size where reading them whole is not free.
 *
 * ## Rows in, domain types out
 *
 * A Prisma row is not a `Project`. Nullable columns become optional fields,
 * flattened columns are reassembled into `dates` / `links` / `bio` / `resume`
 * objects, and ordered child tables become plain arrays. The `to*` mappers
 * below are the only place that translation happens, so the storage layout can
 * change without any consumer noticing.
 *
 * ## Union-typed columns
 *
 * `status`, `category`, `proficiency` and friends are `String` columns, not
 * Postgres enums, and the mappers assert them back into their union types.
 *
 * That is a deliberate trade. Postgres enums would reject a bad value at write
 * time, but Prisma enum identifiers cannot contain hyphens, so every one of
 * these would need an `@map` plus a two-way lookup table between `IN_PROGRESS`
 * and `"in-progress"` — six of them, each a place where the database and the
 * TypeScript union can silently drift. Storing the union's own strings means
 * what is in the column is exactly what the type says, and the admin panel
 * validates writes against the `as const` tuples in `@/types` that already
 * exist for that purpose. Revisit if content ever gets written by something
 * that is not this codebase.
 */

/* ==========================================================================
   Row -> domain mapping
   ========================================================================== */

/** Nullable column to optional field. */
function opt<T>(value: T | null): T | undefined {
  return value ?? undefined;
}

/**
 * Optional booleans: `false` and absent mean the same thing to every consumer,
 * and the seed files wrote the flag only when it was true. Collapsing the two
 * keeps `JSON.stringify` output — and therefore the server/client payload —
 * identical to what these accessors returned before the migration.
 */
function flag(value: boolean): true | undefined {
  return value ? true : undefined;
}

/** Reassemble the flattened `startDate` / `endDate` columns. */
function toDateRange(row: { startDate: string; endDate: string | null }): DateRange {
  return { start: row.startDate, end: row.endDate };
}

/**
 * Build an `ImageAsset` from a flattened column group, or `undefined` when
 * there is no image.
 *
 * `src` is what decides: `alt` is required on the type but nullable in the
 * column, so a row with an image and no alt text falls back to an empty string
 * rather than dropping the image entirely.
 */
function toImageAsset(group: {
  src: string | null;
  alt: string | null;
  width: number | null;
  height: number | null;
  caption: string | null;
}): ImageAsset | undefined {
  if (!group.src) return undefined;
  return {
    src: group.src,
    alt: group.alt ?? "",
    width: opt(group.width),
    height: opt(group.height),
    caption: opt(group.caption),
  };
}

/** Child rows carry an explicit `position`; nothing relies on insertion order. */
function byPosition(a: { position: number }, b: { position: number }): number {
  return a.position - b.position;
}

type TechRow = Prisma.TechStackItemGetPayload<object>;

function toTechStackItem(row: TechRow): TechStackItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category as TechCategory,
    icon: opt(row.icon),
    url: opt(row.url),
    proficiency: opt(row.proficiency) as Proficiency | undefined,
    yearsOfExperience: opt(row.yearsOfExperience),
    since: opt(row.since),
    featured: flag(row.featured),
  };
}

type ProjectRow = Prisma.ProjectGetPayload<{
  include: { tech: true; images: true };
}>;

function toProject(row: ProjectRow): Project {
  /* `ProjectLinks` fields are all optional, so an absent link must be an
     absent key rather than an explicit null. */
  const links: ProjectLinks = {
    repo: opt(row.linksRepo),
    live: opt(row.linksLive),
    demo: opt(row.linksDemo),
    caseStudy: opt(row.linksCaseStudy),
  };

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    description: row.description,
    role: row.role,
    status: row.status as ProjectStatus,
    dates: toDateRange(row),
    tech: [...row.tech].sort(byPosition).map((entry) => entry.techId),
    links,
    images: [...row.images].sort(byPosition).map((image) => ({
      src: image.src,
      alt: image.alt,
      width: opt(image.width),
      height: opt(image.height),
      caption: opt(image.caption),
    })),
    featured: row.featured,
    /* `highlights` is optional on the type but non-nullable in Postgres, where
       "none" is an empty array. Collapsed back to `undefined` so callers do not
       have to distinguish two spellings of the same absence. */
    highlights: row.highlights.length > 0 ? row.highlights : undefined,
    client: opt(row.client),
    includeInResume: row.includeInResume,
    order: opt(row.order),
  };
}

type ExperienceRow = Prisma.ExperienceGetPayload<{ include: { tech: true } }>;

function toExperience(row: ExperienceRow): Experience {
  return {
    id: row.id,
    slug: row.slug,
    company: row.company,
    companyUrl: opt(row.companyUrl),
    role: row.role,
    employmentType: opt(row.employmentType) as EmploymentType | undefined,
    location: opt(row.location),
    workMode: opt(row.workMode) as WorkMode | undefined,
    dates: toDateRange(row),
    description: row.description,
    highlights: row.highlights,
    tech: [...row.tech].sort(byPosition).map((entry) => entry.techId),
    includeInResume: row.includeInResume,
    order: opt(row.order),
  };
}

type ContributionRow = Prisma.ContributionGetPayload<{
  include: { prLinks: true };
}>;

function toContribution(row: ContributionRow): Contribution {
  const prLinks: PrLink[] = [...row.prLinks]
    .sort(byPosition)
    .map((link) => ({ label: link.label, url: link.url }));

  return {
    id: row.id,
    slug: row.slug,
    repoName: row.repoName,
    owner: opt(row.owner),
    repoUrl: row.repoUrl,
    repoDescription: row.repoDescription,
    contributionSummary: row.contributionSummary,
    contributionDetails: row.contributionDetails,
    prLinks,
    tech: row.tech,
    mergedDate: opt(row.mergedDate),
    featured: row.featured,
    includeInResume: row.includeInResume,
    order: opt(row.order),
  };
}

type EducationRow = Prisma.EducationGetPayload<object>;

function toEducation(row: EducationRow): Education {
  return {
    id: row.id,
    institution: row.institution,
    fieldOfStudy: row.fieldOfStudy,
    status: row.status as EducationStatus,
    dates: toDateRange(row),
  };
}

type CertificationRow = Prisma.CertificationGetPayload<object>;

function toCertification(row: CertificationRow): Certification {
  return {
    id: row.id,
    title: row.title,
    platform: row.platform,
    description: opt(row.description),
    imageUrl: opt(row.imageUrl),
    credentialUrl: row.credentialUrl,
    dateEarned: row.dateEarned,
  };
}

type ProfileRow = Prisma.ProfileGetPayload<{ include: { links: true } }>;

function toProfile(row: ProfileRow): Profile {
  const links: ContactLink[] = [...row.links].sort(byPosition).map((link) => ({
    label: link.label,
    href: link.href,
    icon: opt(link.icon),
    handle: opt(link.handle),
    primary: flag(link.primary),
  }));

  return {
    name: row.name,
    tagline: row.tagline,
    bio: { short: row.bioShort, long: row.bioLong },
    email: row.email,
    location: opt(row.location),
    avatar: toImageAsset({
      src: row.avatarSrc,
      alt: row.avatarAlt,
      width: row.avatarWidth,
      height: row.avatarHeight,
      caption: row.avatarCaption,
    }),
    avatarCompact: toImageAsset({
      src: row.avatarCompactSrc,
      alt: row.avatarCompactAlt,
      width: row.avatarCompactWidth,
      height: row.avatarCompactHeight,
      caption: row.avatarCompactCaption,
    }),
    availableForWork: flag(row.availableForWork),
    links,
    resume: {
      title: row.resumeTitle,
      summary: row.resumeSummary,
      fileName: row.resumeFileName,
      location: opt(row.resumeLocation),
      phone: opt(row.resumePhone),
      updatedAt: row.resumeUpdatedAt,
    },
  };
}

/* ==========================================================================
   Source adapters — the swap point
   ========================================================================== */

/**
 * The pinned id of the single profile row. `Profile` is one record by
 * definition, so the table has one row and this is its primary key.
 */
const PROFILE_ID = "profile";

/** The pinned id of the single site-settings row. Same reasoning. */
const SITE_SETTINGS_ID = "site";

/**
 * A missing singleton row is a broken deployment, not an empty state.
 *
 * Every page renders the profile — the header, the hero, the CV. Returning a
 * placeholder would ship a site with someone else's name on it; failing here
 * makes an unseeded database obvious the first time anyone loads a page.
 */
function missingSingleton(what: string): Error {
  return new Error(
    `No ${what} row found. The database has not been seeded — run \`npm run db:seed\`.`,
  );
}

async function readProfile(): Promise<Profile> {
  const row = await prisma.profile.findUnique({
    where: { id: PROFILE_ID },
    include: { links: true },
  });
  if (!row) throw missingSingleton("profile");
  return toProfile(row);
}

async function readProjects(): Promise<Project[]> {
  const rows = await prisma.project.findMany({
    include: { tech: true, images: true },
    /* Not the final order — `getProjects()` applies the real rules. This only
       makes the query itself deterministic. */
    orderBy: { id: "asc" },
  });
  return rows.map(toProject);
}

async function readExperience(): Promise<Experience[]> {
  const rows = await prisma.experience.findMany({
    include: { tech: true },
    orderBy: { id: "asc" },
  });
  return rows.map(toExperience);
}

/**
 * `TechStackItem`, `Education` and `Certification` carry a `position` column
 * that is not part of their TypeScript types and is never returned from here.
 *
 * Those three entities have no `order` field on the type — unlike `Project`,
 * `Experience` and `Contribution` — so before the migration their sequence was
 * simply the order they happened to sit in the seed file. That was invisible
 * until it was not: two Scrimba certificates share `dateEarned: "2026-09"`, and
 * a sort with no tie-break would have reordered the Education section on every
 * deploy depending on what the database felt like returning first.
 *
 * `position` preserves the authored sequence and gives the admin panel
 * something to reorder. It stays internal to this layer.
 */
const BY_POSITION = [{ position: "asc" }, { id: "asc" }] as const;

async function readTechStack(): Promise<TechStackItem[]> {
  const rows = await prisma.techStackItem.findMany({ orderBy: [...BY_POSITION] });
  return rows.map(toTechStackItem);
}

async function readContributions(): Promise<Contribution[]> {
  const rows = await prisma.contribution.findMany({
    include: { prLinks: true },
    orderBy: { id: "asc" },
  });
  return rows.map(toContribution);
}

async function readEducation(): Promise<Education[]> {
  const rows = await prisma.education.findMany({ orderBy: [...BY_POSITION] });
  return rows.map(toEducation);
}

async function readCertifications(): Promise<Certification[]> {
  const rows = await prisma.certification.findMany({ orderBy: [...BY_POSITION] });
  return rows.map(toCertification);
}

async function readSiteSettings() {
  const row = await prisma.siteSettings.findUnique({
    where: { id: SITE_SETTINGS_ID },
  });
  if (!row) throw missingSingleton("site settings");
  return row;
}

/* ==========================================================================
   Sorting
   ========================================================================== */

/**
 * Newest first, with ongoing entries at the top.
 *
 * ISO dates compare correctly as plain strings, so no parsing is needed. An
 * open-ended range sorts as if it ends in the far future, which is what
 * "current role" should mean in a list.
 */
function byRecencyDesc(a: { dates: DateRange }, b: { dates: DateRange }): number {
  const aEnd = a.dates.end ?? "9999-12";
  const bEnd = b.dates.end ?? "9999-12";
  if (aEnd !== bEnd) return bEnd.localeCompare(aEnd);
  return b.dates.start.localeCompare(a.dates.start);
}

/** Manual `order` wins when present; everything else falls back to recency. */
function byOrderThenRecency(
  a: { order?: number; dates: DateRange },
  b: { order?: number; dates: DateRange },
): number {
  const aOrder = a.order ?? Number.MAX_SAFE_INTEGER;
  const bOrder = b.order ?? Number.MAX_SAFE_INTEGER;
  if (aOrder !== bOrder) return aOrder - bOrder;
  return byRecencyDesc(a, b);
}

/** Normalize `T | T[] | undefined` into a lookup set. */
function toSet<T>(value: T | T[] | undefined): Set<T> | null {
  if (value === undefined) return null;
  return new Set(Array.isArray(value) ? value : [value]);
}

/* ==========================================================================
   Profile
   ========================================================================== */

export async function getProfile(): Promise<Profile> {
  return readProfile();
}

/* ==========================================================================
   Projects
   ========================================================================== */

export type ProjectQuery = {
  featured?: boolean;
  status?: ProjectStatus | ProjectStatus[];
  /** Match projects using any of these tech ids. */
  tech?: TechId | TechId[];
  includeInResume?: boolean;
  limit?: number;
};

/**
 * Projects, sorted by `order` then recency.
 *
 * Returns a new array every call — callers can sort or splice the result
 * without corrupting anything shared.
 */
export async function getProjects(query: ProjectQuery = {}): Promise<Project[]> {
  const { featured, status, tech, includeInResume, limit } = query;
  const statuses = toSet(status);
  const techIds = toSet(tech);

  const results = (await readProjects())
    .filter((project) => {
      if (featured !== undefined && project.featured !== featured) return false;
      if (includeInResume !== undefined && project.includeInResume !== includeInResume) {
        return false;
      }
      if (statuses && !statuses.has(project.status)) return false;
      if (techIds && !project.tech.some((id) => techIds.has(id))) return false;
      return true;
    })
    .sort(byOrderThenRecency);

  return limit === undefined ? results : results.slice(0, limit);
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const row = await prisma.project.findUnique({
    where: { slug },
    include: { tech: true, images: true },
  });
  return row ? toProject(row) : null;
}

export async function getFeaturedProjects(limit?: number): Promise<Project[]> {
  return getProjects({ featured: true, limit });
}

/**
 * Slugs for `generateStaticParams()` on `/work/[slug]`.
 *
 * Separate from `getProjects()` so it can be answered with a single-column
 * query instead of loading every record and its relations.
 */
export async function getProjectSlugs(): Promise<string[]> {
  const rows = await prisma.project.findMany({
    select: { slug: true },
    /* Curated order, matching `getProjects()`, so the two never disagree about
       which project comes first. Entries with no `order` sort last. */
    orderBy: [{ order: { sort: "asc", nulls: "last" } }, { id: "asc" }],
  });
  return rows.map((row) => row.slug);
}

/* ==========================================================================
   Experience
   ========================================================================== */

export type ExperienceQuery = {
  includeInResume?: boolean;
  limit?: number;
};

/** Work history, newest first. */
export async function getExperience(
  query: ExperienceQuery = {},
): Promise<Experience[]> {
  const { includeInResume, limit } = query;

  const results = (await readExperience())
    .filter((entry) => {
      if (includeInResume !== undefined && entry.includeInResume !== includeInResume) {
        return false;
      }
      return true;
    })
    .sort(byOrderThenRecency);

  return limit === undefined ? results : results.slice(0, limit);
}

export async function getExperienceBySlug(slug: string): Promise<Experience | null> {
  const row = await prisma.experience.findUnique({
    where: { slug },
    include: { tech: true },
  });
  return row ? toExperience(row) : null;
}

/** The single current role, if there is one. Drives "currently at X" lines. */
export async function getCurrentExperience(): Promise<Experience | null> {
  const entries = await getExperience();
  return entries.find((entry) => entry.dates.end === null) ?? null;
}

/* ==========================================================================
   Tech stack
   ========================================================================== */

export type TechQuery = {
  category?: TechCategory | TechCategory[];
  featured?: boolean;
};

/** Tech items, ordered by category then name. */
export async function getTechStack(query: TechQuery = {}): Promise<TechStackItem[]> {
  const { category, featured } = query;
  const categories = toSet(category);

  return (await readTechStack())
    .filter((item) => {
      if (featured !== undefined && Boolean(item.featured) !== featured) return false;
      if (categories && !categories.has(item.category)) return false;
      return true;
    })
    .sort((a, b) => {
      const categoryDelta =
        TECH_CATEGORIES.indexOf(a.category) - TECH_CATEGORIES.indexOf(b.category);
      return categoryDelta !== 0 ? categoryDelta : a.name.localeCompare(b.name);
    });
}

/**
 * Lookup table keyed by `TechId`.
 *
 * Fetch this once per page and resolve every project's tech references against
 * it, rather than calling into the database inside a render loop. A plain
 * object rather than a `Map` so it crosses the server/client boundary intact.
 */
export async function getTechIndex(): Promise<Record<TechId, TechStackItem>> {
  const items = await readTechStack();
  return Object.fromEntries(items.map((item) => [item.id, item]));
}

/**
 * Resolve ids to tech items, preserving the order given.
 *
 * Unknown ids are dropped rather than throwing: a missing icon should not take
 * a page down. `validateContent()` is what surfaces the bad reference.
 */
export async function getTechByIds(ids: TechId[]): Promise<TechStackItem[]> {
  const index = await getTechIndex();
  return ids.map((id) => index[id]).filter((item): item is TechStackItem => Boolean(item));
}

/* ==========================================================================
   Contributions
   ========================================================================== */

export type ContributionQuery = {
  featured?: boolean;
  includeInResume?: boolean;
  limit?: number;
};

/**
 * Open-source contributions, in curated `order`.
 *
 * Sorting cannot fall back to recency the way projects do — `mergedDate` is
 * optional and currently unset everywhere — so entries without an explicit
 * `order` sort last rather than landing in arbitrary positions.
 */
export async function getContributions(
  query: ContributionQuery = {},
): Promise<Contribution[]> {
  const { featured, includeInResume, limit } = query;

  const results = (await readContributions())
    .filter((entry) => {
      if (featured !== undefined && entry.featured !== featured) return false;
      if (includeInResume !== undefined && entry.includeInResume !== includeInResume) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      const aOrder = a.order ?? Number.MAX_SAFE_INTEGER;
      const bOrder = b.order ?? Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return (b.mergedDate ?? "").localeCompare(a.mergedDate ?? "");
    });

  return limit === undefined ? results : results.slice(0, limit);
}

export async function getContributionBySlug(
  slug: string,
): Promise<Contribution | null> {
  const row = await prisma.contribution.findUnique({
    where: { slug },
    include: { prLinks: true },
  });
  return row ? toContribution(row) : null;
}

/** Slugs for `generateStaticParams()` on a contribution detail route. */
export async function getContributionSlugs(): Promise<string[]> {
  const rows = await prisma.contribution.findMany({
    select: { slug: true },
    /* Curated order, matching `getContributions()`. */
    orderBy: [{ order: { sort: "asc", nulls: "last" } }, { id: "asc" }],
  });
  return rows.map((row) => row.slug);
}

/* ==========================================================================
   Education and certifications
   ========================================================================== */

/** Formal education, most recent first. */
export async function getEducation(): Promise<Education[]> {
  return (await readEducation()).sort(byRecencyDesc);
}

/** Supporting line shown under the education entries, on site and on the CV. */
export async function getEducationNote(): Promise<string> {
  return (await readSiteSettings()).educationNote;
}

/** Issuer profile listing every certificate. */
export async function getCertificatesUrl(): Promise<string> {
  return (await readSiteSettings()).certificatesUrl;
}

/** Certifications, most recently earned first. */
export async function getCertifications(): Promise<Certification[]> {
  return (await readCertifications()).sort((a, b) =>
    b.dateEarned.localeCompare(a.dateEarned),
  );
}

/* ==========================================================================
   Resume aggregate
   ========================================================================== */

/**
 * Everything the CV page needs, filtered and ordered, in one call.
 *
 * The filtering rules live here rather than in the renderer, so the resume and
 * the site cannot drift on what "included" means. This assembles data only —
 * layout, pagination and PDF generation are not its business.
 *
 * `experience` currently returns `[]` — there is no formal employment history
 * yet — so the CV reads as projects, contributions and skills. That is a data
 * state, not a special case: the renderer skips empty sections, and adding a
 * role later needs no change here.
 */
export async function getResumeData(): Promise<ResumeData> {
  const [
    profile,
    experience,
    projects,
    contributions,
    featuredTech,
    education,
    educationNote,
    certifications,
  ] = await Promise.all([
    getProfile(),
    getExperience({ includeInResume: true }),
    getProjects({ includeInResume: true }),
    getContributions({ includeInResume: true }),
    getTechStack({ featured: true }),
    getEducation(),
    getEducationNote(),
    getCertifications(),
  ]);

  const skills = TECH_CATEGORIES.map((category) => ({
    category,
    items: featuredTech.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0);

  return {
    profile,
    experience,
    projects,
    contributions,
    skills,
    education,
    educationNote,
    certifications,
  };
}

/* ==========================================================================
   Integrity check
   ========================================================================== */

/**
 * Catch the mistakes this content model makes possible: duplicate keys, tech
 * references that point at nothing, and backwards date ranges.
 *
 * Several of these are now enforced by the schema rather than discovered here.
 * Ids and slugs are primary and unique keys, and `ProjectTech` / `ExperienceTech`
 * are foreign keys into the tech table, so a duplicate or an unresolvable tech
 * reference is rejected at write time — the seed fails rather than the CV
 * quietly losing a skill.
 *
 * The checks are kept anyway. They cost one read of a very small dataset, they
 * still catch what the schema cannot express (a date range that runs backwards,
 * a contribution with nothing to link to, an education entry marked complete
 * with no end date), and they are the thing that would notice if a future
 * migration relaxed one of those constraints.
 */
export async function validateContent(): Promise<string[]> {
  const [projects, experience, tech, contributions, education, certifications] =
    await Promise.all([
      readProjects(),
      readExperience(),
      readTechStack(),
      readContributions(),
      readEducation(),
      readCertifications(),
    ]);

  const issues: string[] = [];
  const knownTech = new Set(tech.map((item) => item.id));

  const flagDuplicates = (label: string, values: string[]) => {
    const seen = new Set<string>();
    for (const value of values) {
      if (seen.has(value)) issues.push(`Duplicate ${label}: "${value}"`);
      seen.add(value);
    }
  };

  flagDuplicates("tech id", tech.map((item) => item.id));
  flagDuplicates("project id", projects.map((project) => project.id));
  flagDuplicates("project slug", projects.map((project) => project.slug));
  flagDuplicates("experience id", experience.map((entry) => entry.id));
  flagDuplicates("experience slug", experience.map((entry) => entry.slug));
  flagDuplicates("contribution id", contributions.map((entry) => entry.id));
  flagDuplicates("education id", education.map((entry) => entry.id));
  flagDuplicates("certification id", certifications.map((entry) => entry.id));
  flagDuplicates("contribution slug", contributions.map((entry) => entry.slug));

  /* Contributions carry free-form tech labels, so there is no id resolution to
     check. What can go wrong is an entry with nothing to link to. */
  for (const entry of contributions) {
    if (entry.prLinks.length === 0) {
      issues.push(`Contribution "${entry.slug}" has no PR links`);
    }
  }

  const checkEntry = (
    label: string,
    entry: { dates: DateRange; tech: TechId[] },
  ) => {
    for (const id of entry.tech) {
      if (!knownTech.has(id)) {
        issues.push(`${label} references unknown tech id "${id}"`);
      }
    }
    if (entry.dates.end !== null && entry.dates.end < entry.dates.start) {
      issues.push(`${label} has an end date before its start date`);
    }
  };

  for (const entry of education) {
    if (entry.dates.end !== null && entry.dates.end < entry.dates.start) {
      issues.push(`Education "${entry.id}" has an end date before its start date`);
    }
    if (entry.status === "completed" && entry.dates.end === null) {
      issues.push(`Education "${entry.id}" is marked completed but has no end date`);
    }
  }

  for (const project of projects) checkEntry(`Project "${project.slug}"`, project);
  for (const entry of experience) checkEntry(`Experience "${entry.slug}"`, entry);

  return issues;
}

if (process.env.NODE_ENV === "development") {
  /* Now a database round-trip rather than an array walk, so it has to tolerate
     the database not being reachable: a dev server started before `docker
     compose up` should warn, not crash on an unhandled rejection. */
  void validateContent()
    .then((issues) => {
      if (issues.length > 0) {
        console.warn(`[content] ${issues.length} issue(s) found:\n  ${issues.join("\n  ")}`);
      }
    })
    .catch((error) => {
      console.warn("[content] could not run the integrity check:", error);
    });
}
