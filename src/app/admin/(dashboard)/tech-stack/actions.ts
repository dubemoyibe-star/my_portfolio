"use server";

import { Prisma } from "@prisma/client";

import { requireAdmin } from "@/lib/admin-session";
import { describeSlug } from "@/lib/admin/icon-catalogue";
import { revalidatePublicContent } from "@/lib/admin/revalidate";
import { validateTech, type IconVerdict, type TechInput } from "@/lib/admin/tech-input";
import {
  FIX_FIELDS_MESSAGE,
  nullableInt,
  nullableText,
  text,
  type ActionResult,
} from "@/lib/admin/validation";
import { prisma } from "@/lib/prisma";

/**
 * Create, update and delete for the tech stack, plus the icon-slug lookup the
 * editor's preview runs on.
 *
 * The same shape as `../projects/actions` and `../contributions/actions`: every
 * action re-validates with the function the form already ran, because a server
 * action is an HTTP endpoint and the form's check is a convenience; every
 * mutation revalidates the public site. Those notes are not repeated here.
 *
 * What is specific to this entity:
 *
 * ## `id` is immutable, and that is not laziness
 *
 * A tech item's `id` is its slug, and `project_tech` and `experience_tech`
 * reference it under `onDelete: Restrict`. Prisma's default `onUpdate` is
 * `Cascade`, so renaming one *would* work at the database level — which is
 * exactly what makes it dangerous rather than impossible. `TechId` is the one
 * identifier in this content model with no separate mutable slug beside it, so
 * a rename silently rewrites every reference to a record that, as far as any
 * external link or bookmark is concerned, is a different thing. `updateTech`
 * writes every column except this one, and says so when a request tries.
 *
 * ## Delete is blocked by references, on purpose
 *
 * `onDelete: Restrict` means the database refuses to delete a tech item that a
 * project or an experience still lists. This action checks first and names the
 * records, because "Foreign key constraint failed on the field: `techId`" is not
 * a sentence anybody can act on, and the useful answer — *which* projects —
 * costs one extra query.
 *
 * ## No reordering action
 *
 * Unlike contributions, there is nothing to reorder. `TechStackItem.position`
 * exists and the tech picker reads it, but the public Stack section and the CV
 * both sort alphabetically within their display group — see `groupTech` — so
 * position is invisible to a reader. New items take the next position so the
 * picker's list stays stable; nothing in the editor moves them.
 */

/* ==========================================================================
   Shared
   ========================================================================== */

/** The columns of `tech_stack_items`, from the form's all-strings input. */
function toTechColumns(input: TechInput) {
  return {
    name: text(input.name),
    category: text(input.category),
    icon: nullableText(input.icon),
    url: nullableText(input.url),
    proficiency: nullableText(input.proficiency),
    yearsOfExperience: nullableInt(input.yearsOfExperience),
    since: nullableText(input.since),
    featured: input.featured,
  };
}

function idTaken(id: string): ActionResult {
  return {
    ok: false,
    fieldErrors: {
      id: `“${id}” is already taken. Ids are permanent, so pick another.`,
    },
    formError: FIX_FIELDS_MESSAGE,
  };
}

/* ==========================================================================
   Create
   ========================================================================== */

export async function createTech(input: TechInput): Promise<ActionResult> {
  await requireAdmin();

  const fieldErrors = validateTech(input);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors, formError: FIX_FIELDS_MESSAGE };
  }

  const id = text(input.id);

  const existing = await prisma.techStackItem.findUnique({
    where: { id },
    select: { id: true },
  });
  if (existing) return idTaken(id);

  /* Appended rather than inserted. `position` only decides the order of the
     tech picker on the project editor, and a new item belonging at the bottom
     of that list is both the least surprising default and the only one that
     does not renumber rows nobody asked to move. */
  const last = await prisma.techStackItem.aggregate({
    _max: { position: true },
  });

  const columns = toTechColumns(input);

  try {
    await prisma.techStackItem.create({
      data: { id, ...columns, position: (last._max.position ?? -1) + 1 },
    });
  } catch (cause) {
    /* The unique check above loses to a second tab by a few milliseconds
       roughly never, but the constraint is the thing that actually decides. */
    if (
      cause instanceof Prisma.PrismaClientKnownRequestError &&
      cause.code === "P2002"
    ) {
      return idTaken(id);
    }
    throw cause;
  }

  revalidatePublicContent();
  return { ok: true, id, message: `“${columns.name}” created.` };
}

/* ==========================================================================
   Update
   ========================================================================== */

export async function updateTech(
  id: string,
  input: TechInput,
): Promise<ActionResult> {
  await requireAdmin();

  const existing = await prisma.techStackItem.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return {
      ok: false,
      formError: "That tech item no longer exists. It may have been deleted.",
    };
  }

  const fieldErrors = validateTech(input);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors, formError: FIX_FIELDS_MESSAGE };
  }

  /* The form renders this field disabled, so a mismatch means the payload did
     not come from the form. Refused rather than quietly ignored: silently
     writing under a different id than the caller asked for is the worse of the
     two failures. */
  if (text(input.id) !== id) {
    return {
      ok: false,
      fieldErrors: {
        id: "An id cannot be changed — projects and experience reference it.",
      },
      formError:
        "To rename a tech item, create the new one, repoint whatever uses the old one, then delete it.",
    };
  }

  await prisma.techStackItem.update({
    where: { id },
    data: toTechColumns(input),
  });

  revalidatePublicContent();
  return { ok: true, id, message: "Saved." };
}

/* ==========================================================================
   Delete
   ========================================================================== */

export async function deleteTech(id: string): Promise<ActionResult> {
  await requireAdmin();

  /* Read the referencing records before trying, so a refusal can name them.
     The database would refuse anyway — `onDelete: Restrict` — but with a
     constraint name instead of "Stenion and Dsuite still list it". */
  const [projects, experiences] = await Promise.all([
    prisma.projectTech.findMany({
      where: { techId: id },
      select: { project: { select: { title: true } } },
    }),
    prisma.experienceTech.findMany({
      where: { techId: id },
      select: { experience: { select: { company: true, role: true } } },
    }),
  ]);

  if (projects.length > 0 || experiences.length > 0) {
    const names = [
      ...projects.map((row) => row.project.title),
      ...experiences.map((row) => `${row.experience.role} at ${row.experience.company}`),
    ];
    return {
      ok: false,
      formError: `Still referenced by ${names.join(", ")}. Remove it from ${names.length === 1 ? "that record" : "those records"} first — deleting it here would leave them pointing at nothing.`,
    };
  }

  try {
    await prisma.techStackItem.delete({ where: { id } });
  } catch (cause) {
    if (cause instanceof Prisma.PrismaClientKnownRequestError) {
      if (cause.code === "P2025") {
        return { ok: true, message: "That tech item was already deleted." };
      }
      /* A reference added between the check above and this line. Rare enough
         not to design around, common enough not to surface as a stack trace. */
      if (cause.code === "P2003") {
        return {
          ok: false,
          formError:
            "Something started referencing this while the dialog was open. Refresh and try again.",
        };
      }
    }
    throw cause;
  }

  revalidatePublicContent();
  return { ok: true, message: "Tech item deleted." };
}

/* ==========================================================================
   Icon lookup
   ========================================================================== */

/**
 * What the editor should say about a typed icon slug.
 *
 * A server action rather than a client-side check because the answer needs the
 * simple-icons catalogue, which is 455 KB of brand metadata that has no
 * business in a browser bundle — see `@/lib/admin/icon-catalogue`. Behind
 * `requireAdmin` like everything else here: it is a public endpoint the moment
 * it is exported, and there is no reason for it to answer strangers.
 */
export async function describeIconSlug(slug: string): Promise<IconVerdict> {
  await requireAdmin();
  return describeSlug(slug);
}
