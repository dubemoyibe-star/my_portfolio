"use server";

import { Prisma } from "@prisma/client";

import { requireAdmin } from "@/lib/admin-session";
import {
  validateContribution,
  type ContributionInput,
} from "@/lib/admin/contribution-input";
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
 * Create, update, delete and reorder for contributions.
 *
 * The same shape as `../projects/actions`: every action re-validates with the
 * function the form already ran, writes child rows inside a transaction, and
 * revalidates the public site. The notes there apply here and are not repeated.
 *
 * What is different is `reorderContributions`, and why it exists.
 *
 * ## Why reordering is its own action
 *
 * `order` is a plain integer column that the form can edit, and that is exactly
 * how a curated ranking rots: to move an entry from fifth to second you type 2
 * into one form, and now two rows claim second place until you remember to fix
 * the other four. The tie-break in `getContributions()` hides it — the site
 * still renders something — so the drift is silent.
 *
 * This action takes the whole list in its intended sequence and rewrites every
 * row's `order` to its index, in one transaction. There is no intermediate
 * state where two entries share a position and no way to renumber half the
 * list. The form keeps its `order` field, because it is a real column and
 * sometimes typing a number is what you want; the arrows on the list view are
 * the way to reorder without having to think about numbers at all.
 *
 * ## No image handling
 *
 * Contributions have no image columns — a repository is not a screenshot, and
 * the entry renders as prose plus links. So there is no Cloudinary cleanup here
 * and no uploader in the form. If that ever changes, the delete path needs the
 * same `discardUnusedUploads` call the projects actions make.
 */

/* ==========================================================================
   Shared
   ========================================================================== */

/** The scalar columns of `contributions`, from the form's all-strings input. */
function toContributionColumns(input: ContributionInput) {
  return {
    slug: text(input.slug),
    repoName: text(input.repoName),
    owner: nullableText(input.owner),
    repoUrl: text(input.repoUrl),
    repoDescription: text(input.repoDescription),
    contributionSummary: text(input.contributionSummary),
    contributionDetails: text(input.contributionDetails),
    /* Blank tags are dropped rather than stored — they would render as empty
       pills on the public entry. */
    tech: input.tech.map(text).filter((tag) => tag.length > 0),
    mergedDate: nullableText(input.mergedDate),
    featured: input.featured,
    includeInResume: input.includeInResume,
    order: nullableInt(input.order),
  };
}

/**
 * PR link rows, positions assigned from the list's order.
 *
 * Entirely blank rows are dropped: the form starts with one and lets you add
 * more, so a row someone opened and abandoned is a cancellation, not content.
 * A half-filled row never reaches here — the validator rejects it.
 */
function toPrLinkRows(input: ContributionInput) {
  return input.prLinks
    .filter(
      (link) => text(link.label).length > 0 || text(link.url).length > 0,
    )
    .map((link, position) => ({
      position,
      label: text(link.label),
      url: text(link.url),
    }));
}

/** `"atreus"` -> `"con-atreus"`, matching the ids the seed established. */
async function uniqueContributionId(slug: string): Promise<string> {
  const base = `con-${slug}`;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const taken = await prisma.contribution.findUnique({
      where: { id: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
  return `${base}-${Date.now()}`;
}

/** Whether the slug is already spoken for by a *different* contribution. */
async function slugTaken(slug: string, exceptId?: string): Promise<boolean> {
  const existing = await prisma.contribution.findUnique({
    where: { slug },
    select: { id: true },
  });
  return existing !== null && existing.id !== exceptId;
}

const SLUG_TAKEN: ActionResult = {
  ok: false,
  fieldErrors: { slug: "Another contribution already uses this slug." },
  formError: FIX_FIELDS_MESSAGE,
};

/** Translate the one constraint violation a valid-looking form can still hit. */
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

export async function createContribution(
  input: ContributionInput,
): Promise<ActionResult> {
  await requireAdmin();

  const fieldErrors = validateContribution(input);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors, formError: FIX_FIELDS_MESSAGE };
  }

  const columns = toContributionColumns(input);
  if (await slugTaken(columns.slug)) return SLUG_TAKEN;

  const id = await uniqueContributionId(columns.slug);

  try {
    await prisma.contribution.create({
      data: {
        id,
        ...columns,
        prLinks: { create: toPrLinkRows(input) },
      },
    });
  } catch (cause) {
    const translated = asFieldError(cause);
    if (translated) return translated;
    throw cause;
  }

  revalidatePublicContent();
  return { ok: true, id, message: `"${columns.repoName}" created.` };
}

/* ==========================================================================
   Update
   ========================================================================== */

export async function updateContribution(
  id: string,
  input: ContributionInput,
): Promise<ActionResult> {
  await requireAdmin();

  const existing = await prisma.contribution.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return {
      ok: false,
      formError:
        "That contribution no longer exists. It may have been deleted.",
    };
  }

  const fieldErrors = validateContribution(input);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors, formError: FIX_FIELDS_MESSAGE };
  }

  const columns = toContributionColumns(input);
  if (await slugTaken(columns.slug, id)) return SLUG_TAKEN;

  try {
    await prisma.$transaction([
      /* Deleted before recreating: `pr_links` has a unique constraint on
         (contributionId, position), so reordering two rows would collide with
         the row being swapped past if the old ones were still there. */
      prisma.prLink.deleteMany({ where: { contributionId: id } }),
      prisma.contribution.update({
        where: { id },
        data: {
          ...columns,
          prLinks: { create: toPrLinkRows(input) },
        },
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

export async function deleteContribution(id: string): Promise<ActionResult> {
  await requireAdmin();

  try {
    /* `pr_links` cascades from `contributions`, and nothing references a
       contribution, so one delete takes the whole record. */
    await prisma.contribution.delete({ where: { id } });
  } catch (cause) {
    if (
      cause instanceof Prisma.PrismaClientKnownRequestError &&
      cause.code === "P2025"
    ) {
      return { ok: true, message: "That contribution was already deleted." };
    }
    throw cause;
  }

  revalidatePublicContent();
  return { ok: true, message: "Contribution deleted." };
}

/* ==========================================================================
   Reorder
   ========================================================================== */

/**
 * Rewrite the whole ranking from a list of ids in their intended sequence.
 *
 * All-or-nothing, and always complete: every id in the table is renumbered from
 * 1, so the result has no duplicates, no gaps and no leftover nulls. Compare
 * with editing `order` one form at a time, which has all three.
 *
 * The submitted list is checked against the table first. A stale list — a tab
 * left open while an entry was deleted in another — would otherwise renumber
 * around a row that no longer exists and quietly drop whatever was added since.
 */
export async function reorderContributions(
  orderedIds: string[],
): Promise<ActionResult> {
  await requireAdmin();

  const rows = await prisma.contribution.findMany({ select: { id: true } });
  const known = new Set(rows.map((row) => row.id));

  const submitted = new Set(orderedIds);
  const complete =
    submitted.size === orderedIds.length &&
    submitted.size === known.size &&
    orderedIds.every((id) => known.has(id));

  if (!complete) {
    return {
      ok: false,
      formError:
        "The list changed while you were reordering it. Refresh and try again.",
    };
  }

  /* An interactive transaction with an explicit budget, not the default batch.
     Prisma caps a transaction at five seconds unless told otherwise, and a
     handful of sequential updates can exceed that on a cold Neon compute —
     where the wake-up alone eats most of the window. When it does, the rollback
     expires with the transaction and the writes that already landed stay: a
     ranking renumbered halfway, which is the exact corruption this action
     exists to prevent. `prisma/seed.ts` widens the window for the same reason
     and says so in the same words. */
  await prisma.$transaction(
    async (tx) => {
      for (const [index, id] of orderedIds.entries()) {
        await tx.contribution.update({
          where: { id },
          /* One-based, so the numbers on screen read like a ranking rather
             than like array indices. */
          data: { order: index + 1 },
        });
      }
    },
    { maxWait: 15_000, timeout: 60_000 },
  );

  revalidatePublicContent();
  return { ok: true, message: "Order updated." };
}
