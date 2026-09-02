import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { contributions } from "../src/data/contributions";
import {
  certificatesUrl,
  certifications,
  education,
  educationNote,
} from "../src/data/education";
import { experience } from "../src/data/experience";
import { profile } from "../src/data/profile";
import { projects } from "../src/data/projects";
import { techStack } from "../src/data/tech";

/**
 * One-time migration of the seed files in `src/data/` into Postgres.
 *
 * Run with `npm run db:seed`. Everything already written in those files —
 * every project, contribution, certificate, the profile — lands in the
 * database as-is. Nothing is re-typed by hand.
 *
 * ## Why it is safe to re-run
 *
 * The script clears the content tables and reinserts, inside a single
 * transaction. Upserts would have been the gentler choice, but they leave
 * orphans: delete a project from `src/data/projects.ts` and an upsert-based
 * seed silently keeps the old row, so the database and the file drift while
 * both look correct. Replace-all cannot drift.
 *
 * That also means it is destructive once the admin panel exists. **After
 * content is edited through the admin UI, this script will overwrite those
 * edits with whatever is in `src/data/`.** It is a bootstrap and a rollback
 * path, not a sync.
 *
 * ## Ordering
 *
 * Deletes run children-first and inserts run parents-first, because
 * `ProjectTech` and `ExperienceTech` hold `onDelete: Restrict` foreign keys
 * into `TechStackItem` — the tech vocabulary cannot be dropped while something
 * still references it, and cannot be referenced before it exists.
 */

/**
 * This runs as a bare Node script, outside Next.js, so nothing has loaded the
 * env file for it. Ignored when absent — CI and Vercel supply the variables
 * directly.
 */
try {
  process.loadEnvFile(path.join(process.cwd(), ".env.local"));
} catch {
  /* No local env file — rely on the ambient environment. */
}

/**
 * Seeds over `DIRECT_URL`, the unpooled endpoint — not the pooled URL the app
 * uses.
 *
 * This is one long-lived connection doing a few hundred writes in a single
 * transaction, which is the opposite of the short, bursty, highly concurrent
 * traffic PgBouncer exists to smooth out. Routing a long transaction through
 * transaction-mode pooling only adds a failure mode.
 */
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DIRECT_URL is not set. Copy .env.example to .env.local and fill it in.",
  );
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

/** `undefined` is "not supplied" in the seed files; the column is nullable. */
function nullable<T>(value: T | undefined): T | null {
  return value ?? null;
}

async function main() {
  console.log("Seeding from src/data/ ...");

  /* Prisma's interactive-transaction defaults (2s to acquire, 5s to finish)
     are sized for a request handler. This is a few hundred sequential inserts
     over a single connection, and on a cold Neon compute the wake-up alone can
     eat the default window. */
  const TRANSACTION_OPTIONS = { maxWait: 30_000, timeout: 120_000 };

  await prisma.$transaction(async (tx) => {
    /* --- Clear, children first ------------------------------------------ */
    await tx.projectTech.deleteMany();
    await tx.experienceTech.deleteMany();
    await tx.projectImage.deleteMany();
    await tx.prLink.deleteMany();
    await tx.contactLink.deleteMany();
    await tx.project.deleteMany();
    await tx.experience.deleteMany();
    await tx.contribution.deleteMany();
    await tx.techStackItem.deleteMany();
    await tx.education.deleteMany();
    await tx.certification.deleteMany();
    await tx.profile.deleteMany();
    await tx.siteSettings.deleteMany();

    /* --- Tech stack ------------------------------------------------------
       First: every project and experience references it by foreign key. */
    for (const [position, item] of techStack.entries()) {
      await tx.techStackItem.create({
        data: {
          position,
          id: item.id,
          name: item.name,
          category: item.category,
          icon: nullable(item.icon),
          url: nullable(item.url),
          proficiency: nullable(item.proficiency),
          yearsOfExperience: nullable(
            (item as { yearsOfExperience?: number }).yearsOfExperience,
          ),
          since: nullable((item as { since?: string }).since),
          featured: item.featured ?? false,
        },
      });
    }
    console.log(`  tech stack items: ${techStack.length}`);

    /* --- Projects -------------------------------------------------------- */
    for (const project of projects) {
      await tx.project.create({
        data: {
          id: project.id,
          slug: project.slug,
          title: project.title,
          summary: project.summary,
          description: project.description,
          role: project.role,
          status: project.status,
          startDate: project.dates.start,
          endDate: project.dates.end,
          linksRepo: nullable(project.links.repo),
          linksLive: nullable(project.links.live),
          linksDemo: nullable((project.links as { demo?: string }).demo),
          linksCaseStudy: nullable(
            (project.links as { caseStudy?: string }).caseStudy,
          ),
          featured: project.featured,
          highlights: (project as { highlights?: string[] }).highlights ?? [],
          client: nullable((project as { client?: string }).client),
          includeInResume: project.includeInResume,
          order: nullable(project.order),
          /* `position` is the authored array index — the order the cards
             render in, and which image is the cover. */
          tech: {
            create: project.tech.map((techId, position) => ({ techId, position })),
          },
          images: {
            create: project.images.map((image, position) => ({
              position,
              src: image.src,
              alt: image.alt,
              width: nullable(image.width),
              height: nullable(image.height),
              caption: nullable((image as { caption?: string }).caption),
            })),
          },
        },
      });
    }
    console.log(`  projects: ${projects.length}`);

    /* --- Experience ------------------------------------------------------
       Empty today, and deliberately so — see src/data/experience.ts. The loop
       stays because the table must fill itself the moment a role is added. */
    for (const entry of experience) {
      await tx.experience.create({
        data: {
          id: entry.id,
          slug: entry.slug,
          company: entry.company,
          companyUrl: nullable(entry.companyUrl),
          role: entry.role,
          employmentType: nullable(entry.employmentType),
          location: nullable(entry.location),
          workMode: nullable(entry.workMode),
          startDate: entry.dates.start,
          endDate: entry.dates.end,
          description: entry.description,
          highlights: entry.highlights,
          includeInResume: entry.includeInResume,
          order: nullable(entry.order),
          tech: {
            create: entry.tech.map((techId, position) => ({ techId, position })),
          },
        },
      });
    }
    console.log(`  experience entries: ${experience.length}`);

    /* --- Contributions --------------------------------------------------- */
    for (const entry of contributions) {
      await tx.contribution.create({
        data: {
          id: entry.id,
          slug: entry.slug,
          repoName: entry.repoName,
          owner: nullable(entry.owner),
          repoUrl: entry.repoUrl,
          repoDescription: entry.repoDescription,
          contributionSummary: entry.contributionSummary,
          contributionDetails: entry.contributionDetails,
          tech: entry.tech,
          mergedDate: nullable((entry as { mergedDate?: string }).mergedDate),
          featured: entry.featured,
          includeInResume: entry.includeInResume,
          order: nullable(entry.order),
          prLinks: {
            create: entry.prLinks.map((link, position) => ({
              position,
              label: link.label,
              url: link.url,
            })),
          },
        },
      });
    }
    console.log(`  contributions: ${contributions.length}`);

    /* --- Education and certifications ------------------------------------ */
    for (const [position, entry] of education.entries()) {
      await tx.education.create({
        data: {
          position,
          id: entry.id,
          institution: entry.institution,
          fieldOfStudy: entry.fieldOfStudy,
          status: entry.status,
          startDate: entry.dates.start,
          endDate: entry.dates.end,
        },
      });
    }
    console.log(`  education entries: ${education.length}`);

    for (const [position, entry] of certifications.entries()) {
      await tx.certification.create({
        data: {
          position,
          id: entry.id,
          title: entry.title,
          platform: entry.platform,
          description: nullable(entry.description),
          imageUrl: nullable(entry.imageUrl),
          credentialUrl: entry.credentialUrl,
          dateEarned: entry.dateEarned,
        },
      });
    }
    console.log(`  certifications: ${certifications.length}`);

    /* --- Profile ---------------------------------------------------------- */
    await tx.profile.create({
      data: {
        id: "profile",
        name: profile.name,
        tagline: profile.tagline,
        bioShort: profile.bio.short,
        bioLong: profile.bio.long,
        email: profile.email,
        location: nullable(profile.location),
        availableForWork: profile.availableForWork ?? false,

        avatarSrc: nullable(profile.avatar?.src),
        avatarAlt: nullable(profile.avatar?.alt),
        avatarWidth: nullable(profile.avatar?.width),
        avatarHeight: nullable(profile.avatar?.height),
        avatarCaption: nullable(
          (profile.avatar as { caption?: string } | undefined)?.caption,
        ),

        avatarCompactSrc: nullable(profile.avatarCompact?.src),
        avatarCompactAlt: nullable(profile.avatarCompact?.alt),
        avatarCompactWidth: nullable(profile.avatarCompact?.width),
        avatarCompactHeight: nullable(profile.avatarCompact?.height),
        avatarCompactCaption: nullable(
          (profile.avatarCompact as { caption?: string } | undefined)?.caption,
        ),

        resumeTitle: profile.resume.title,
        resumeSummary: profile.resume.summary,
        resumeFileName: profile.resume.fileName,
        resumeLocation: nullable(profile.resume.location),
        resumePhone: nullable(
          (profile.resume as { phone?: string }).phone,
        ),
        resumeUpdatedAt: profile.resume.updatedAt,

        links: {
          create: profile.links.map((link, position) => ({
            position,
            label: link.label,
            href: link.href,
            icon: nullable(link.icon),
            handle: nullable(link.handle),
            primary: (link as { primary?: boolean }).primary ?? false,
          })),
        },
      },
    });
    console.log(`  profile: 1 (with ${profile.links.length} contact links)`);

    /* --- Site settings ----------------------------------------------------
       The two module-level exports from src/data/education.ts that had no home
       on any entity. See the SiteSettings model. */
    await tx.siteSettings.create({
      data: { id: "site", educationNote, certificatesUrl },
    });
    console.log("  site settings: 1");
  }, TRANSACTION_OPTIONS);

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
