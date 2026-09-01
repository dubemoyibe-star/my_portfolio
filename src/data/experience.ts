import type { Experience } from "@/types";

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
