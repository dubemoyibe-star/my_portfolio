import { contributions as contributionsSeed } from "@/data/contributions";
import {
  certificatesUrl,
  certifications as certificationsSeed,
  education as educationSeed,
  educationNote,
} from "@/data/education";
import { experience as experienceSeed } from "@/data/experience";
import { profile as profileSeed } from "@/data/profile";
import { projects as projectsSeed } from "@/data/projects";
import { techStack as techSeed } from "@/data/tech";
import {
  TECH_CATEGORIES,
  type Certification,
  type Contribution,
  type DateRange,
  type Education,
  type Experience,
  type Profile,
  type Project,
  type ProjectStatus,
  type ResumeData,
  type TechCategory,
  type TechId,
  type TechStackItem,
} from "@/types";

/**
 * The content access layer. Everything that reads content goes through here —
 * no page, component or route imports from `@/data/*` directly.
 *
 * ## Why every accessor is async
 *
 * These functions currently read from in-memory arrays and could all be
 * synchronous. They are async on purpose: when the source becomes a database
 * or an admin-backed API, the signatures do not change and no call site has to
 * be touched. Making them sync now would guarantee a rewrite later.
 *
 * ## What changes when the real source arrives
 *
 * Only the four imports above, and the bodies of the private `read*` functions
 * below. Filtering, sorting and shaping stay here so the same rules apply
 * whether content comes from a file or a table.
 */

/* ==========================================================================
   Source adapters — the swap point
   ========================================================================== */

async function readProfile(): Promise<Profile> {
  return profileSeed;
}

async function readProjects(): Promise<Project[]> {
  return projectsSeed;
}

async function readExperience(): Promise<Experience[]> {
  return experienceSeed;
}

async function readTechStack(): Promise<TechStackItem[]> {
  return techSeed;
}

async function readContributions(): Promise<Contribution[]> {
  return contributionsSeed;
}

async function readEducation(): Promise<Education[]> {
  return educationSeed;
}

async function readCertifications(): Promise<Certification[]> {
  return certificationsSeed;
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
 * without corrupting the shared source.
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
  const projects = await readProjects();
  return projects.find((project) => project.slug === slug) ?? null;
}

export async function getFeaturedProjects(limit?: number): Promise<Project[]> {
  return getProjects({ featured: true, limit });
}

/**
 * Slugs for `generateStaticParams()` on `/work/[slug]`.
 *
 * Separate from `getProjects()` because a real source can answer this with a
 * single-column query instead of loading every record.
 */
export async function getProjectSlugs(): Promise<string[]> {
  const projects = await readProjects();
  return projects.map((project) => project.slug);
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
  const entries = await readExperience();
  return entries.find((entry) => entry.slug === slug) ?? null;
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
 * it, rather than calling `getTechById` inside a render loop. A plain object
 * rather than a `Map` so it crosses the server/client boundary intact.
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
  const entries = await readContributions();
  return entries.find((entry) => entry.slug === slug) ?? null;
}

/** Slugs for `generateStaticParams()` on a contribution detail route. */
export async function getContributionSlugs(): Promise<string[]> {
  const entries = await readContributions();
  return entries.map((entry) => entry.slug);
}

/* ==========================================================================
   Education and certifications
   ========================================================================== */

/** Formal education, most recent first. */
export async function getEducation(): Promise<Education[]> {
  return (await readEducation()).slice().sort(byRecencyDesc);
}

/** Supporting line shown under the education entries, on site and on the CV. */
export async function getEducationNote(): Promise<string> {
  return educationNote;
}

/** Issuer profile listing every certificate. */
export async function getCertificatesUrl(): Promise<string> {
  return certificatesUrl;
}

/** Certifications, most recently earned first. */
export async function getCertifications(): Promise<Certification[]> {
  return (await readCertifications())
    .slice()
    .sort((a, b) => b.dateEarned.localeCompare(a.dateEarned));
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
    certifications,
  ] = await Promise.all([
    getProfile(),
    getExperience({ includeInResume: true }),
    getProjects({ includeInResume: true }),
    getContributions({ includeInResume: true }),
    getTechStack({ featured: true }),
    getEducation(),
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
 * Referencing tech by id is what keeps icons and categories from drifting, but
 * it means a typo silently drops a skill from the CV instead of failing loudly.
 * This is the check that makes that trade safe.
 *
 * Runs automatically in development (below). Worth wiring into CI, and worth
 * keeping when the source becomes a database — the same references can break
 * there for different reasons.
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
  void validateContent().then((issues) => {
    if (issues.length > 0) {
      console.warn(`[content] ${issues.length} issue(s) found:\n  ${issues.join("\n  ")}`);
    }
  });
}
