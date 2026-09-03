"use server";

import { Prisma } from "@prisma/client";

import { requireAdmin } from "@/lib/admin-session";
import {
  validateExperience,
  type ExperienceInput,
} from "@/lib/admin/experience-input";
import { revalidatePublicContent } from "@/lib/admin/revalidate";
import {
  FIX_FIELDS_MESSAGE,
  nullableInt,
  nullableText,
  text,
  type ActionResult,
} from "@/lib/admin/validation";
import { prisma } from "@/lib/prisma";

/**
 * Create, update and delete for work history.
 *
 * The same shape as `../projects/actions`: every action re-validates with the
 * function the form already ran, because a server action is an HTTP endpoint
 * and the form's check is a convenience for the operator rather than a
 * guarantee for the database; the tech references are replaced wholesale
 * inside a transaction, because a failure between the delete and the insert
 * would otherwise leave a role with no stack and no error; and every mutation
 * revalidates the public site, without which an edit is correct everywhere
 * except on the site it was made for. Those notes are not repeated here.
 *
 * What is specific to this entity:
 *
 * ## Nothing here uploads anything
 *
 * A role carries no images, so there is no Cloudinary cleanup to run and no
 * `discardUnusedUploads` call. `experience_tech` is the only child table, and
 * it cascades from `experiences`.
 *
 * ## `description` and `highlights` may be empty
 *
 * `validateExperience` does not require either — see the note at the top of
 * `@/lib/admin/experience-input` for why. The only thing that happens to them
 * here is that blank highlight rows are dropped, exactly as on a project: an
 * empty line is what a textarea leaves behind when a bullet is deleted from
 * the middle of the list, and it would render as an empty bullet.
 */

/* ==========================================================================
   Shared
   ========================================================================== */

/** The tech vocabulary, as the validator wants it. */
async function knownTechIds(): Promise<Set<string>> {
  const rows = await prisma.techStackItem.findMany({ select: { id: true } });
  return new Set(rows.map((row) => row.id));
}

/** The scalar columns of `experiences`, from the form's all-strings input. */
function toExperienceColumns(input: ExperienceInput) {
  return {
    slug: text(input.slug),
    company: text(input.company),
    companyUrl: nullableText(input.companyUrl),
    role: text(input.role),
    employmentType: nullableText(input.employmentType),
    location: nullableText(input.location),
    workMode: nullableText(input.workMode),
    startDate: text(input.startDate),
    endDate: nullableText(input.endDate),
    /* Not `nullableText`: the column is non-nullable and "" is the honest
       value for a role that has nothing written about it yet. */
    description: text(input.description),
    highlights: input.highlights.map(text).filter((line) => line.length > 0),
    includeInResume: input.includeInResume,
    order: nullableInt(input.order),
  };
}

/** Child rows for `experience_tech`, positions assigned. */
function toTechRows(input: ExperienceInput) {
  return input.tech.map((techId, position) => ({ techId, position }));
}

/**
 * `"stenion-founder-ceo"` -> `"exp-stenion-founder-ceo"`, matching the id
 * convention the seed established for every other entity.
 *
 * `id` and `slug` are separate on purpose — a slug is allowed to change, an id
 * is what other records point at and is not — so the id is derived from the
 * slug once, at creation, and never touched again.
 */
async function uniqueExperienceId(slug: string): Promise<string> {
  const base = `exp-${slug}`;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const taken = await prisma.experience.findUnique({
      where: { id: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
  /* Fifty collisions on one slug is a bug somewhere else, not a case worth
     designing for; a timestamp keeps the save from failing. */
  return `${base}-${Date.now()}`;
}

/** Whether the slug is already spoken for by a *different* role. */
async function slugTaken(slug: string, exceptId?: string): Promise<boolean> {
  const existing = await prisma.experience.findUnique({
    where: { slug },
    select: { id: true },
  });
  return existing !== null && existing.id !== exceptId;
}

const SLUG_TAKEN: ActionResult = {
  ok: false,
  fieldErrors: { slug: "Another role already uses this slug." },
  formError: FIX_FIELDS_MESSAGE,
};

/**
 * Turn a Prisma failure into a message for the field that caused it.
 *
 * Only the constraint violations a valid-looking form can still trigger are
 * translated — a slug claimed by another tab between the check and the write.
 * Everything else is re-thrown.
 */
function asFieldError(cause: unknown): ActionResult | null {
  if (
    cause instanceof Prisma.PrismaClientKnownRequestError &&
    cause.code === "P2002"
  ) {
    const target = cause.meta?.target;
    const fields = Array.isArray(target) ? target.map(String) : [];
    if (fields.includes("slug")) return SLUG_TAKEN;
  }
  return null;
}

/* ==========================================================================
   Create
   ========================================================================== */

export async function createExperience(
  input: ExperienceInput,
): Promise<ActionResult> {
  await requireAdmin();

  const fieldErrors = validateExperience(input, {
    knownTechIds: await knownTechIds(),
  });
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors, formError: FIX_FIELDS_MESSAGE };
  }

  const columns = toExperienceColumns(input);
  if (await slugTaken(columns.slug)) return SLUG_TAKEN;

  const id = await uniqueExperienceId(columns.slug);

  try {
    await prisma.experience.create({
      data: { id, ...columns, tech: { create: toTechRows(input) } },
    });
  } catch (cause) {
    const translated = asFieldError(cause);
    if (translated) return translated;
    throw cause;
  }

  revalidatePublicContent();
  return {
    ok: true,
    id,
    message: `“${columns.role} · ${columns.company}” created.`,
  };
}

/* ==========================================================================
   Update
   ========================================================================== */

export async function updateExperience(
  id: string,
  input: ExperienceInput,
): Promise<ActionResult> {
  await requireAdmin();

  const existing = await prisma.experience.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return {
      ok: false,
      formError: "That role no longer exists. It may have been deleted.",
    };
  }

  const fieldErrors = validateExperience(input, {
    knownTechIds: await knownTechIds(),
  });
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors, formError: FIX_FIELDS_MESSAGE };
  }

  const columns = toExperienceColumns(input);
  if (await slugTaken(columns.slug, id)) return SLUG_TAKEN;

  try {
    await prisma.$transaction([
      /* The delete has to land before the creates: `experience_tech` is keyed
         on (experienceId, techId) with an explicit `position`, and a reorder
         would otherwise collide with the row it is swapping past. */
      prisma.experienceTech.deleteMany({ where: { experienceId: id } }),
      prisma.experience.update({
        where: { id },
        data: { ...columns, tech: { create: toTechRows(input) } },
      }),
    ]);
  } catch (cause) {
    const translated = asFieldError(cause);
    if (translated) return translated;
    throw cause;
  }

  revalidatePublicContent();
  return { ok: true, id, message: "Saved." };
}

/* ==========================================================================
   Delete
   ========================================================================== */

export async function deleteExperience(id: string): Promise<ActionResult> {
  await requireAdmin();

  try {
    /* `experience_tech` cascades from `experiences`, so one delete takes the
       whole record. Nothing references an experience, so there is no restrict
       to run into. */
    await prisma.experience.delete({ where: { id } });
  } catch (cause) {
    if (
      cause instanceof Prisma.PrismaClientKnownRequestError &&
      cause.code === "P2025"
    ) {
      /* Already gone — two tabs, or a double submit. The operator wanted it
         deleted and it is deleted, so this is a success with a note. */
      return { ok: true, message: "That role was already deleted." };
    }
    throw cause;
  }

  revalidatePublicContent();
  return { ok: true, message: "Role deleted." };
}
