"use server";

import { Prisma } from "@prisma/client";

import { requireAdmin } from "@/lib/admin-session";
import { discardUnusedUploads } from "@/lib/admin/asset-cleanup";
import { revalidatePublicContent } from "@/lib/admin/revalidate";
import {
  validateProject,
  type ProjectInput,
} from "@/lib/admin/project-input";
import {
  FIX_FIELDS_MESSAGE,
  nullableInt,
  nullableText,
  text,
  type ActionResult,
} from "@/lib/admin/validation";
import { prisma } from "@/lib/prisma";

/**
 * Create, update and delete for projects.
 *
 * ## Every action re-validates
 *
 * The form has already run `validateProject` and refused to submit if it
 * failed. That is a convenience for the operator, not a guarantee for the
 * database: a server action is an HTTP endpoint, and the only thing standing
 * between it and an arbitrary payload is the session cookie. So the same
 * function runs again here, and its result is what decides whether anything is
 * written.
 *
 * ## Why writes are transactions
 *
 * A project's tech references and images are separate tables, and updating them
 * means replacing their rows. Outside a transaction, a failure between the
 * delete and the insert leaves a project with no images and no error — the
 * worst shape a failure can take, because it looks like a successful save of
 * different content. Inside one, the project either changes completely or not
 * at all.
 *
 * Replace-all rather than diffing the child rows: the sets are tiny, `position`
 * has to be rewritten whenever anything is reordered anyway, and a diff would
 * be more code guarding a saving that does not exist at this size.
 *
 * ## Why every action revalidates
 *
 * See `@/lib/admin/revalidate`. Without it an edit is correct everywhere except
 * on the site it was made for.
 *
 * ## Detached images are destroyed
 *
 * Both writes that can orphan an upload — deleting a project, and saving an
 * edit that removed an image from the list — hand the detached URLs to
 * `discardUnusedUploads`, which destroys the ones nothing else points at. It
 * runs after the database write and never throws; see the note at the top of
 * `@/lib/admin/asset-cleanup` for why both of those matter.
 */

/* ==========================================================================
   Shared
   ========================================================================== */

/** The tech vocabulary, as the validator wants it. */
async function knownTechIds(): Promise<Set<string>> {
  const rows = await prisma.techStackItem.findMany({ select: { id: true } });
  return new Set(rows.map((row) => row.id));
}

/**
 * The scalar columns of `projects`, derived from the form's all-strings input.
 *
 * The one place parsing happens — see the note at the top of
 * `@/lib/admin/project-input` for why it is not spread across the form.
 */
function toProjectColumns(input: ProjectInput) {
  return {
    slug: text(input.slug),
    title: text(input.title),
    summary: text(input.summary),
    description: text(input.description),
    role: text(input.role),
    status: text(input.status),
    startDate: text(input.startDate),
    endDate: nullableText(input.endDate),
    linksRepo: nullableText(input.linksRepo),
    linksLive: nullableText(input.linksLive),
    linksDemo: nullableText(input.linksDemo),
    linksCaseStudy: nullableText(input.linksCaseStudy),
    featured: input.featured,
    /* Blank lines are what a textarea leaves behind when someone deletes a
       bullet from the middle; they would render as empty list items. */
    highlights: input.highlights.map(text).filter((line) => line.length > 0),
    client: nullableText(input.client),
    includeInResume: input.includeInResume,
    order: nullableInt(input.order),
  };
}

/** Child rows for `project_tech` and `project_images`, positions assigned. */
function toChildRows(input: ProjectInput) {
  return {
    tech: input.tech.map((techId, position) => ({ techId, position })),
    images: input.images.map((image, position) => ({
      position,
      src: text(image.src),
      alt: text(image.alt),
      caption: nullableText(image.caption),
      width: image.width ?? null,
      height: image.height ?? null,
    })),
  };
}

/**
 * `"stenion"` -> `"prj-stenion"`, matching the ids the seed established.
 *
 * `id` and `slug` are separate on purpose — a slug is the URL and is allowed to
 * change, an id is what other records point at and is not — so the id is
 * derived from the slug once, at creation, and never touched again.
 *
 * The numeric suffix covers the case where a project was deleted and a new one
 * created under the same slug: the slug is free, the old id may not be if
 * anything still references it.
 */
async function uniqueProjectId(slug: string): Promise<string> {
  const base = `prj-${slug}`;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const taken = await prisma.project.findUnique({
      where: { id: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
  /* Fifty collisions on one slug is not a case worth designing for; it is a
     bug somewhere else, and a timestamp keeps the save from failing. */
  return `${base}-${Date.now()}`;
}

/** Whether the slug is already spoken for by a *different* project. */
async function slugTaken(slug: string, exceptId?: string): Promise<boolean> {
  const existing = await prisma.project.findUnique({
    where: { slug },
    select: { id: true },
  });
  return existing !== null && existing.id !== exceptId;
}

/**
 * Turn a Prisma failure into a message for the field that caused it.
 *
 * Only the constraint violations that a valid-looking form can still trigger
 * are translated — a slug claimed by another tab between the check and the
 * write. Everything else is re-thrown: an unexpected database error is not
 * something to paper over with a friendly sentence next to an input.
 */
function asFieldError(cause: unknown): ActionResult | null {
  if (
    cause instanceof Prisma.PrismaClientKnownRequestError &&
    cause.code === "P2002"
  ) {
    const target = cause.meta?.target;
    const fields = Array.isArray(target) ? target.map(String) : [];
    if (fields.includes("slug")) {
      return {
        ok: false,
        fieldErrors: { slug: "Another project already uses this slug." },
        formError: FIX_FIELDS_MESSAGE,
      };
    }
  }
  return null;
}

/* ==========================================================================
   Create
   ========================================================================== */

export async function createProject(input: ProjectInput): Promise<ActionResult> {
  await requireAdmin();

  const fieldErrors = validateProject(input, {
    knownTechIds: await knownTechIds(),
  });
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors, formError: FIX_FIELDS_MESSAGE };
  }

  const columns = toProjectColumns(input);

  if (await slugTaken(columns.slug)) {
    return {
      ok: false,
      fieldErrors: { slug: "Another project already uses this slug." },
      formError: FIX_FIELDS_MESSAGE,
    };
  }

  const id = await uniqueProjectId(columns.slug);
  const children = toChildRows(input);

  try {
    await prisma.project.create({
      data: {
        id,
        ...columns,
        tech: { create: children.tech },
        images: { create: children.images },
      },
    });
  } catch (cause) {
    const translated = asFieldError(cause);
    if (translated) return translated;
    throw cause;
  }

  revalidatePublicContent();
  return { ok: true, id, message: `"${columns.title}" created.` };
}

/* ==========================================================================
   Update
   ========================================================================== */

export async function updateProject(
  id: string,
  input: ProjectInput,
): Promise<ActionResult> {
  await requireAdmin();

  const existing = await prisma.project.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return {
      ok: false,
      formError: "That project no longer exists. It may have been deleted.",
    };
  }

  const fieldErrors = validateProject(input, {
    knownTechIds: await knownTechIds(),
  });
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors, formError: FIX_FIELDS_MESSAGE };
  }

  const columns = toProjectColumns(input);

  if (await slugTaken(columns.slug, id)) {
    return {
      ok: false,
      fieldErrors: { slug: "Another project already uses this slug." },
      formError: FIX_FIELDS_MESSAGE,
    };
  }

  const children = toChildRows(input);

  /* Read before the write, because the write replaces these rows wholesale and
     there would be nothing left to compare against afterwards. */
  const previousImages = await prisma.projectImage.findMany({
    where: { projectId: id },
    select: { src: true },
  });

  try {
    await prisma.$transaction([
      /* Child rows are replaced wholesale — see the note at the top. The
         deletes have to land before the creates because both tables carry a
         unique constraint on (parent, position), and a reorder would otherwise
         collide with the row it is swapping past. */
      prisma.projectTech.deleteMany({ where: { projectId: id } }),
      prisma.projectImage.deleteMany({ where: { projectId: id } }),
      prisma.project.update({
        where: { id },
        data: {
          ...columns,
          tech: { create: children.tech },
          images: { create: children.images },
        },
      }),
    ]);
  } catch (cause) {
    const translated = asFieldError(cause);
    if (translated) return translated;
    throw cause;
  }

  revalidatePublicContent();

  /* Anything that was on the project a moment ago and is not on it now. An
     image the operator removed from the list is as deleted as one that went
     with its project. */
  const kept = new Set(children.images.map((image) => image.src));
  await discardUnusedUploads(
    previousImages.map((image) => image.src).filter((src) => !kept.has(src)),
  );

  return { ok: true, id, message: "Saved." };
}

/* ==========================================================================
   Delete
   ========================================================================== */

export async function deleteProject(id: string): Promise<ActionResult> {
  await requireAdmin();

  /* Collected before the delete cascades them away. */
  const images = await prisma.projectImage.findMany({
    where: { projectId: id },
    select: { src: true },
  });

  try {
    /* `project_tech` and `project_images` both cascade from `projects`, so one
       delete takes the whole record. Nothing references a project, so there is
       no restrict to run into. */
    await prisma.project.delete({ where: { id } });
  } catch (cause) {
    if (
      cause instanceof Prisma.PrismaClientKnownRequestError &&
      cause.code === "P2025"
    ) {
      /* Already gone — two tabs, or a double submit. The operator wanted it
         deleted and it is deleted, so this is a success with a note rather
         than a failure. */
      return { ok: true, message: "That project was already deleted." };
    }
    throw cause;
  }

  revalidatePublicContent();
  await discardUnusedUploads(images.map((image) => image.src));

  return { ok: true, message: "Project deleted." };
}
