import { cache } from "react";

import { profile as seedProfile } from "@/data/profile";
import { getProfile } from "@/lib/data";
import type { ContactLink, Profile } from "@/types";

/**
 * The person facts the site chrome needs, read live but never at the cost of
 * rendering.
 *
 * ## Why this exists
 *
 * `siteConfig` used to carry `name`, `role`, `description` and `social`,
 * derived from the seed file at import time. That made them constants: an edit
 * in the admin panel changed the hero and the CV, while the footer, the root
 * layout's default metadata and the 404 kept quoting the value that was
 * committed to the repository. Two sources for one fact is how a site ends up
 * introducing itself by one name in the tab and another in the footer.
 *
 * So the person facts moved here, behind a function, and `siteConfig` kept
 * only what is genuinely site-level — the domain and the nav.
 *
 * ## Why it falls back instead of throwing
 *
 * `getProfile()` throws when the row is missing, deliberately: every page
 * renders the profile, and a placeholder would ship a site with someone else's
 * name on it. That is the right answer for the hero. It is the wrong answer
 * here, because these callers are the ones that must survive a bad day:
 *
 *  - the root layout's `generateMetadata`, which runs for *every* route,
 *    including the error routes — a throw there takes down the page that was
 *    supposed to explain the problem;
 *  - the 404, whose own note points out that a visitor is most likely to reach
 *    it exactly when something else is already broken;
 *  - `next build`, which prerenders both and would fail the whole deployment
 *    over a cold or unreachable Neon compute.
 *
 * The fallback is the seed — which is where the database's values came from in
 * the first place, and which the repo keeps as the documented rollback path.
 * Worst case the chrome shows the last seeded name for one render while the
 * page body shows the live one; that is a cosmetic disagreement lasting as
 * long as the outage, against a site that does not render at all.
 *
 * This is the same doctrine `sitemap.ts` already applied to `lastModified`,
 * lifted out of it so there is one copy of the reasoning and one timeout.
 */

/**
 * How long the profile read gets before the caller gives up on it.
 *
 * This budget exists for one failure only: a database that is not answering at
 * all. Prisma's own socket timeout is long enough that waiting for it can
 * outlast a build, and the sitemap and the root layout are both prerendered.
 *
 * ## Why it is not three seconds
 *
 * It was, inherited from `sitemap.ts` where the only reader was one number on
 * a page nobody looks at. Applied to the site chrome it was actively wrong:
 * measured against this database a warm profile read is ~400ms and a cold
 * connection ~2s, and on the home page this read queues behind every other
 * query on the single pooled connection the runtime client is configured with.
 * Three seconds was therefore a threshold a *healthy* database crossed
 * routinely — so the footer and the metadata fell back to the seed on the
 * busiest page while the body rendered live content, which is precisely the
 * split this module was written to remove, only now intermittent and much
 * harder to notice.
 *
 * Ten seconds sits well past anything a working database does, cold start and
 * queueing included, and well short of a build timeout. A slow render is the
 * right answer here; a fast wrong one is not.
 */
export const PROFILE_TIMEOUT_MS = 10_000;

/**
 * Reject if `work` has not settled within `ms`.
 *
 * The losing promise keeps its handlers either way — `then(resolve, reject)`
 * is attached before the race can be lost — so a database error arriving after
 * the timeout lands on an already-settled promise instead of surfacing as an
 * unhandled rejection and failing the build by another route.
 */
export function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timed out after ${ms}ms`)),
      ms,
    );
    work.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

/**
 * The live profile, or the seeded one if the database cannot answer in time.
 *
 * `cache()` scopes the result to one render pass, which matters here more than
 * anywhere else in the data layer: on the home page the profile is now read by
 * the layout's metadata, the footer, the header, the hero, the person schema
 * and the page's own `generateMetadata`. Without memoization that is six
 * round trips for one row, serialized behind the single pooled connection the
 * runtime client is configured with — see the note in `@/lib/prisma`.
 *
 * Deliberately not `unstable_cache`: this must reflect an admin save on the
 * very next request, which is what `revalidatePath` already arranges for the
 * rendered output. A cache with its own lifetime would put the chrome behind
 * the body again, in a way that is harder to see than the bug this replaced.
 */
export const resolveProfile = cache(async (): Promise<Profile> => {
  try {
    return await withTimeout(getProfile(), PROFILE_TIMEOUT_MS);
  } catch {
    return seedProfile;
  }
});

/** The person facts the chrome and the metadata defaults are built from. */
export type SiteIdentity = {
  name: string;
  /**
   * The formal title — `profile.resume.title`. Used in the document title and
   * the share cards, where a reader is deciding whether this is the right
   * person before they have seen a word of the page.
   */
  role: string;
  /** `profile.bio.short`, the default meta description. */
  description: string;
  /** Every contact link, in stored order. `primary` still marks the short set. */
  social: ContactLink[];
};

export const getSiteIdentity = cache(async (): Promise<SiteIdentity> => {
  const profile = await resolveProfile();
  return {
    name: profile.name,
    role: profile.resume.title,
    description: profile.bio.short,
    social: profile.links,
  };
});
