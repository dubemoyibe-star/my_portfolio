"use server";

import { requireAdmin } from "@/lib/admin-session";
import { discardUnusedUploads } from "@/lib/admin/asset-cleanup";
import {
  validateProfile,
  type AvatarInput,
  type ProfileInput,
} from "@/lib/admin/profile-input";
import { revalidatePublicContent } from "@/lib/admin/revalidate";
import {
  FIX_FIELDS_MESSAGE,
  nullableText,
  text,
  type ActionResult,
} from "@/lib/admin/validation";
import { prisma } from "@/lib/prisma";

/**
 * The one write the profile screen makes.
 *
 * Same shape as every other action here — re-validate with the function the
 * form already ran, because a server action is an HTTP endpoint and the form's
 * check is a convenience; revalidate the public site afterwards, because an
 * edit that is correct in the database and invisible on the site is the
 * failure a content editor exists to remove. Those notes live at the top of
 * `../projects/actions` and are not repeated.
 *
 * What is specific to this record:
 *
 * ## One action, not seven
 *
 * The other sections have create/update/delete triples. `Profile` is a single
 * pinned row that cannot be created or deleted — the site reads it on every
 * page and treats a missing one as a broken deployment, see `missingSingleton`
 * in `@/lib/data` — so the only verb is "save".
 *
 * ## Why it is an upsert
 *
 * In practice the row is always there; the seed writes it. But an `update`
 * against a missing row throws P2025, and "the profile could not be saved" is
 * a poor way to learn that a table is empty. The upsert means the first save
 * on an unseeded database works and produces exactly the row the site wants,
 * which pairs with the empty-profile fallback on the page.
 *
 * ## Links are replaced wholesale, inside a transaction
 *
 * `contact_links` carries a unique constraint on `(profileId, position)`, so
 * the deletes have to land before the creates or a reorder collides with the
 * row it is swapping past. Replace-all rather than diffing: the list is five
 * rows, `position` has to be rewritten whenever anything moves anyway, and a
 * diff would be more code guarding a saving that does not exist at this size.
 *
 * Outside a transaction, a failure between the delete and the insert would
 * leave a profile with no links and no error — a successful-looking save of
 * different content, which is the worst shape a failure can take.
 *
 * ## Portraits are Cloudinary assets
 *
 * `profile.avatarSrc` and `avatarCompactSrc` are two of the columns
 * `discardUnusedUploads` checks, so a save that replaced or cleared a portrait
 * hands the detached URL over. It runs after the database write and never
 * throws; see the note at the top of `@/lib/admin/asset-cleanup` for why both
 * of those matter. A `/public` path — which is what the seeded portraits are —
 * is filtered out there rather than here.
 */

/** The pinned id of the single profile row, matching `@/lib/data`. */
const PROFILE_ID = "profile";

/**
 * A portrait, as its five columns.
 *
 * All five are nulled together when the source is empty. Leaving a stale alt
 * or a stale height beside a cleared `src` would be a portrait that is
 * three-fifths present, and `toImageAsset` in `@/lib/data` keys on `src`
 * alone — so the leftovers would be invisible until someone uploaded a new
 * portrait and inherited the old one's dimensions.
 */
function toAvatarColumns(avatar: AvatarInput) {
  const src = text(avatar.src);
  if (src.length === 0) {
    return {
      src: null,
      alt: null,
      width: null,
      height: null,
      caption: null,
    };
  }
  return {
    src,
    alt: text(avatar.alt),
    width: avatar.width ?? null,
    height: avatar.height ?? null,
    caption: nullableText(avatar.caption),
  };
}

function toProfileColumns(input: ProfileInput) {
  const avatar = toAvatarColumns(input.avatar);
  const compact = toAvatarColumns(input.avatarCompact);

  return {
    name: text(input.name),
    tagline: text(input.tagline),
    bioShort: text(input.bioShort),
    bioLong: text(input.bioLong),
    email: text(input.email),
    location: nullableText(input.location),
    availableForWork: input.availableForWork,

    avatarSrc: avatar.src,
    avatarAlt: avatar.alt,
    avatarWidth: avatar.width,
    avatarHeight: avatar.height,
    avatarCaption: avatar.caption,

    avatarCompactSrc: compact.src,
    avatarCompactAlt: compact.alt,
    avatarCompactWidth: compact.width,
    avatarCompactHeight: compact.height,
    avatarCompactCaption: compact.caption,

    resumeTitle: text(input.resumeTitle),
    resumeSummary: text(input.resumeSummary),
    resumeFileName: text(input.resumeFileName),
    resumeLocation: nullableText(input.resumeLocation),
    resumePhone: nullableText(input.resumePhone),
    resumeUpdatedAt: text(input.resumeUpdatedAt),
  };
}

/** Child rows for `contact_links`, positions assigned from the array order. */
function toLinkRows(input: ProfileInput) {
  return input.links.map((link, position) => ({
    position,
    label: text(link.label),
    href: text(link.href),
    icon: nullableText(link.icon),
    handle: nullableText(link.handle),
    primary: link.primary,
  }));
}

export async function saveProfile(input: ProfileInput): Promise<ActionResult> {
  await requireAdmin();

  const fieldErrors = validateProfile(input);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors, formError: FIX_FIELDS_MESSAGE };
  }

  const columns = toProfileColumns(input);
  const links = toLinkRows(input);

  /* Read before the write: the portraits are about to be overwritten and
     there would be nothing left to compare against afterwards. */
  const existing = await prisma.profile.findUnique({
    where: { id: PROFILE_ID },
    select: { avatarSrc: true, avatarCompactSrc: true },
  });

  await prisma.$transaction([
    prisma.contactLink.deleteMany({ where: { profileId: PROFILE_ID } }),
    prisma.profile.upsert({
      where: { id: PROFILE_ID },
      update: { ...columns, links: { create: links } },
      create: { id: PROFILE_ID, ...columns, links: { create: links } },
    }),
  ]);

  revalidatePublicContent();

  /* A portrait swapped out, or cleared, is as detached as one that went with
     its record. Both are checked against what was just written rather than
     against each other: a save that moved the compact portrait into the main
     slot detaches neither. */
  const kept = new Set(
    [columns.avatarSrc, columns.avatarCompactSrc].filter(
      (src): src is string => src !== null,
    ),
  );
  const detached = [existing?.avatarSrc, existing?.avatarCompactSrc].filter(
    (src): src is string => Boolean(src) && !kept.has(src as string),
  );
  await discardUnusedUploads(detached);

  return { ok: true, id: PROFILE_ID, message: "Saved." };
}
