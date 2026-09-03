"use server";

import { Prisma } from "@prisma/client";

import { requireAdmin } from "@/lib/admin-session";
import { discardUnusedUploads } from "@/lib/admin/asset-cleanup";
import {
  validateCertification,
  validateEducation,
  validateEducationSettings,
  type CertificationInput,
  type EducationInput,
  type EducationSettingsInput,
} from "@/lib/admin/education-input";
import { revalidatePublicContent } from "@/lib/admin/revalidate";
import {
  FIX_FIELDS_MESSAGE,
  nullableText,
  slugify,
  text,
  type ActionResult,
} from "@/lib/admin/validation";
import { prisma } from "@/lib/prisma";

/**
 * Everything the Education screen writes: the degree entries, the supporting
 * note, and the certificates.
 *
 * The same shape as `../projects/actions` — every action re-validates with the
 * function the form already ran, because a server action is an HTTP endpoint
 * and the form's check is a convenience; every mutation revalidates the public
 * site. Those notes are not repeated here.
 *
 * What is specific to this screen:
 *
 * ## `position` is written, never chosen
 *
 * `Education` and `Certification` have no `order` field on their types — see
 * the note on `BY_POSITION` in `@/lib/data`. `position` exists to give the two
 * Scrimba certificates that share `dateEarned: "2026-09"` a stable tie-break,
 * so the section cannot reorder itself between deploys. New rows take the next
 * position; nothing here moves an existing one, because nothing on the public
 * site would show the difference except in that tie.
 *
 * ## Certificate images are Cloudinary assets
 *
 * `certifications.imageUrl` is one of the columns `discardUnusedUploads`
 * checks, so both writes that can orphan an upload — deleting a certificate,
 * and saving an edit that replaced its image — hand the detached URL over. It
 * runs after the database write and never throws; see the note at the top of
 * `@/lib/admin/asset-cleanup` for why both of those matter.
 *
 * ## The settings row is upserted
 *
 * `site_settings` is a singleton pinned to `id = "site"`. The seed writes it,
 * so in practice it is always there — but an update against a missing row
 * throws P2025, and "the education note could not be saved" is a strange way
 * to learn that a table is empty. The upsert makes the first save work
 * regardless.
 */

const SITE_SETTINGS_ID = "site";

/* ==========================================================================
   Education entries
   ========================================================================== */

function toEducationColumns(input: EducationInput) {
  return {
    institution: text(input.institution),
    fieldOfStudy: text(input.fieldOfStudy),
    status: text(input.status),
    startDate: text(input.startDate),
    endDate: nullableText(input.endDate),
  };
}

/**
 * `"Maduka University"` -> `"edu-maduka-university"`, matching the convention
 * the seed established.
 *
 * Education has no `slug` column, so unlike a project this id is derived from
 * the institution name directly and is the only key the row has. The numeric
 * suffix covers a second entry at the same institution — a bachelor's and a
 * master's are two rows, not one.
 */
async function uniqueEducationId(institution: string): Promise<string> {
  const base = `edu-${slugify(institution) || "entry"}`;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const taken = await prisma.education.findUnique({
      where: { id: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
  return `${base}-${Date.now()}`;
}

export async function createEducation(
  input: EducationInput,
): Promise<ActionResult> {
  await requireAdmin();

  const fieldErrors = validateEducation(input);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors, formError: FIX_FIELDS_MESSAGE };
  }

  const columns = toEducationColumns(input);
  const id = await uniqueEducationId(columns.institution);
  const last = await prisma.education.aggregate({ _max: { position: true } });

  await prisma.education.create({
    data: { id, ...columns, position: (last._max.position ?? -1) + 1 },
  });

  revalidatePublicContent();
  return { ok: true, id, message: `“${columns.institution}” added.` };
}

export async function updateEducation(
  id: string,
  input: EducationInput,
): Promise<ActionResult> {
  await requireAdmin();

  const fieldErrors = validateEducation(input);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors, formError: FIX_FIELDS_MESSAGE };
  }

  try {
    await prisma.education.update({
      where: { id },
      data: toEducationColumns(input),
    });
  } catch (cause) {
    if (
      cause instanceof Prisma.PrismaClientKnownRequestError &&
      cause.code === "P2025"
    ) {
      return {
        ok: false,
        formError: "That entry no longer exists. It may have been deleted.",
      };
    }
    throw cause;
  }

  revalidatePublicContent();
  return { ok: true, id, message: "Saved." };
}

export async function deleteEducation(id: string): Promise<ActionResult> {
  await requireAdmin();

  try {
    await prisma.education.delete({ where: { id } });
  } catch (cause) {
    if (
      cause instanceof Prisma.PrismaClientKnownRequestError &&
      cause.code === "P2025"
    ) {
      return { ok: true, message: "That entry was already deleted." };
    }
    throw cause;
  }

  revalidatePublicContent();
  return { ok: true, message: "Education entry deleted." };
}

/* ==========================================================================
   Certifications
   ========================================================================== */

function toCertificationColumns(input: CertificationInput) {
  return {
    title: text(input.title),
    platform: text(input.platform),
    description: nullableText(input.description),
    imageUrl: nullableText(input.imageUrl),
    credentialUrl: text(input.credentialUrl),
    dateEarned: text(input.dateEarned),
  };
}

/** `"Advanced React"` at `"Scrimba"` -> `"cert-scrimba-advanced-react"`. */
async function uniqueCertificationId(
  platform: string,
  title: string,
): Promise<string> {
  const base = `cert-${slugify(`${platform} ${title}`) || "certificate"}`;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const taken = await prisma.certification.findUnique({
      where: { id: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
  return `${base}-${Date.now()}`;
}

export async function createCertification(
  input: CertificationInput,
): Promise<ActionResult> {
  await requireAdmin();

  const fieldErrors = validateCertification(input);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors, formError: FIX_FIELDS_MESSAGE };
  }

  const columns = toCertificationColumns(input);
  const id = await uniqueCertificationId(columns.platform, columns.title);
  const last = await prisma.certification.aggregate({
    _max: { position: true },
  });

  await prisma.certification.create({
    data: { id, ...columns, position: (last._max.position ?? -1) + 1 },
  });

  revalidatePublicContent();
  return { ok: true, id, message: `“${columns.title}” created.` };
}

export async function updateCertification(
  id: string,
  input: CertificationInput,
): Promise<ActionResult> {
  await requireAdmin();

  const fieldErrors = validateCertification(input);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors, formError: FIX_FIELDS_MESSAGE };
  }

  /* Read before the write: the old image is about to be overwritten, and there
     would be nothing left to compare against afterwards. */
  const existing = await prisma.certification.findUnique({
    where: { id },
    select: { imageUrl: true },
  });
  if (!existing) {
    return {
      ok: false,
      formError: "That certificate no longer exists. It may have been deleted.",
    };
  }

  const columns = toCertificationColumns(input);
  await prisma.certification.update({ where: { id }, data: columns });

  revalidatePublicContent();

  /* An image swapped out is as detached as one that went with its record. */
  if (existing.imageUrl && existing.imageUrl !== columns.imageUrl) {
    await discardUnusedUploads([existing.imageUrl]);
  }

  return { ok: true, id, message: "Saved." };
}

export async function deleteCertification(id: string): Promise<ActionResult> {
  await requireAdmin();

  /* Collected before the row goes. */
  const existing = await prisma.certification.findUnique({
    where: { id },
    select: { imageUrl: true },
  });

  try {
    await prisma.certification.delete({ where: { id } });
  } catch (cause) {
    if (
      cause instanceof Prisma.PrismaClientKnownRequestError &&
      cause.code === "P2025"
    ) {
      return { ok: true, message: "That certificate was already deleted." };
    }
    throw cause;
  }

  revalidatePublicContent();
  if (existing?.imageUrl) await discardUnusedUploads([existing.imageUrl]);

  return { ok: true, message: "Certificate deleted." };
}

/* ==========================================================================
   Site settings
   ========================================================================== */

export async function saveEducationSettings(
  input: EducationSettingsInput,
): Promise<ActionResult> {
  await requireAdmin();

  const fieldErrors = validateEducationSettings(input);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors, formError: FIX_FIELDS_MESSAGE };
  }

  const columns = {
    educationNote: text(input.educationNote),
    certificatesUrl: text(input.certificatesUrl),
  };

  await prisma.siteSettings.upsert({
    where: { id: SITE_SETTINGS_ID },
    update: columns,
    create: { id: SITE_SETTINGS_ID, ...columns },
  });

  revalidatePublicContent();
  return { ok: true, id: SITE_SETTINGS_ID, message: "Saved." };
}
