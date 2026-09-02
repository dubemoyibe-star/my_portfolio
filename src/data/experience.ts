import type { Experience } from "@/types";

/**
 * REFERENCE ONLY — NO LONGER THE LIVE SOURCE.
 *
 * Content is served from Postgres (Neon) via Prisma. `@/lib/data` reads the
 * database; nothing in the running app imports this file.
 *
 * It is kept for two reasons:
 *
 *  - It is the input to `prisma/seed.ts`. `npm run db:seed` reads this file and
 *    writes it into the database, replacing whatever is there.
 *  - It is the rollback path if the database is lost or a migration goes wrong.
 *
 * **Editing this file changes nothing on the site.** It takes effect only when
 * the seed is re-run — and re-running the seed overwrites anything edited
 * through the admin panel. Change live content in the admin panel; change this
 * file only to move the rollback baseline.
 */

/**
 * Work history, newest first.
 *
 * EMPTY ON PURPOSE. This file previously held placeholder employment history
 * invented for a fictional person. No real experience content was supplied, and
 * fabricated roles must not sit in a real portfolio where they could ship, so
 * the seed entries were removed rather than left in place.
 *
 * The shape is unchanged — see the `Experience` type. Consumers must handle an
 * empty list: `getCurrentExperience()` returns `null` and
 * `getResumeData().experience` is `[]` until this is populated.
 *
 * Note that the open-source work in `@/data/contributions` is a separate
 * entity and is not affected by this being empty.
 */
export const experience: Experience[] = [];
