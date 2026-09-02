import {
  destroyAssets,
  isCloudinaryConfigured,
  publicIdFromUrl,
} from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";

/**
 * Delete uploaded images that nothing points at any more.
 *
 * Called after a record is deleted, and after an edit that dropped an image
 * from a list. Without it the database and the site stay correct while the
 * Cloudinary library fills up with files nobody can reach — invisible until the
 * account hits its storage quota, and impossible to clean by hand once there
 * are enough of them to be unsure which are live.
 *
 * ## Why it runs after the write, not inside it
 *
 * Destroying is not transactional and cannot be rolled back. If it ran first
 * and the database write then failed, the row would survive pointing at an
 * asset that no longer exists — a broken image on the public site, which is
 * strictly worse than an orphaned file nobody sees. Running afterwards means
 * the failure mode is the harmless one.
 *
 * For the same reason this function never throws: a delete that succeeded and
 * then failed to tidy storage is a success. The problem is logged and left.
 *
 * ## Why references are re-checked
 *
 * The caller knows which URLs *it* detached; it does not know whether some
 * other record uses the same one. Nothing stops the same Cloudinary URL being
 * pasted into two projects, or reused as a certificate image. So every
 * candidate is looked up across every column in the schema that can hold an
 * image source, and only the genuinely unreferenced ones are destroyed.
 *
 * That list is here rather than derived, because Prisma cannot enumerate "every
 * column that holds an image URL" — it is a fact about the content model, not
 * about the schema. **A new image-bearing column must be added to
 * `stillReferenced` below, or deleting its record will destroy an asset another
 * record is still using.**
 */

/**
 * Which of these sources are still pointed at by some row.
 *
 * Four queries rather than one join: these are unrelated tables with no
 * relationship to each other, and the sets involved are a handful of strings.
 */
async function stillReferenced(sources: string[]): Promise<Set<string>> {
  const [projectImages, certifications, profiles] = await Promise.all([
    prisma.projectImage.findMany({
      where: { src: { in: sources } },
      select: { src: true },
    }),
    prisma.certification.findMany({
      where: { imageUrl: { in: sources } },
      select: { imageUrl: true },
    }),
    prisma.profile.findMany({
      where: {
        OR: [
          { avatarSrc: { in: sources } },
          { avatarCompactSrc: { in: sources } },
        ],
      },
      select: { avatarSrc: true, avatarCompactSrc: true },
    }),
  ]);

  const held = new Set<string>();
  for (const row of projectImages) held.add(row.src);
  for (const row of certifications) {
    if (row.imageUrl) held.add(row.imageUrl);
  }
  for (const row of profiles) {
    if (row.avatarSrc) held.add(row.avatarSrc);
    if (row.avatarCompactSrc) held.add(row.avatarCompactSrc);
  }
  return held;
}

/**
 * Destroy any of `detached` that is an upload of ours and is now unreferenced.
 *
 * Safe to call with anything an `src` column might hold: `/public` paths,
 * hand-typed URLs on other hosts and assets in another Cloudinary account are
 * all filtered out by `publicIdFromUrl` before a request is made.
 */
export async function discardUnusedUploads(detached: string[]): Promise<void> {
  if (!isCloudinaryConfigured()) return;

  /* Deduplicated first: an edit that removes the same URL from two positions
     should not produce two destroy requests, the second of which reports "not
     found" and looks like a failure. */
  const candidates = [...new Set(detached.filter(Boolean))].filter(
    (src) => publicIdFromUrl(src) !== null,
  );
  if (candidates.length === 0) return;

  try {
    const held = await stillReferenced(candidates);
    const orphans = candidates.filter((src) => !held.has(src));
    if (orphans.length === 0) return;

    const publicIds = orphans
      .map(publicIdFromUrl)
      .filter((id): id is string => id !== null);

    const outcomes = await destroyAssets(publicIds);

    /* "not found" is not a failure: the asset was already gone, which is the
       state this function exists to reach. */
    const failures = outcomes.filter(
      (outcome) => outcome.result !== "ok" && outcome.result !== "not found",
    );
    if (failures.length > 0) {
      console.error(
        "[admin] some Cloudinary assets could not be deleted:",
        failures,
      );
    }
  } catch (cause) {
    console.error("[admin] Cloudinary cleanup failed:", cause);
  }
}
