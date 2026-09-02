import { revalidatePath } from "next/cache";

/**
 * Push an admin edit out to the public site.
 *
 * The public pages have no `dynamic` or `revalidate` export and read content
 * through Prisma rather than `fetch`, so Next prerenders them at build time and
 * serves the same HTML until something invalidates it. Without this call an
 * edit would be correct in the database, correct in the admin UI, and invisible
 * on the site until the next deploy — which is exactly the failure a content
 * editor exists to remove.
 *
 * `revalidatePath` drops the cached render; the next request regenerates it
 * from the database. That works on Vercel's ISR and in `next start` alike, so
 * "live without a redeploy" holds in production, not just in dev.
 *
 * Every path that reads content is listed, and every mutation calls this
 * regardless of what it touched. Being surgical here — revalidating `/cv` only
 * when a resume flag changed — would save nothing measurable on a site this
 * size and would be one more rule to get wrong; a tech item renamed from the
 * tech editor shows up on the home page, the CV and nowhere else, and this
 * refuses to care which.
 *
 * The admin pages themselves are not listed: the admin layout reads the session
 * cookie, which opts the whole subtree out of caching, so they re-render from
 * the database on every request already.
 */
export function revalidatePublicContent(): void {
  /* Home page — every section reads content. */
  revalidatePath("/");
  /* The generated CV. */
  revalidatePath("/cv");
  /* `sitemap.ts` derives its last-modified date from the profile row. */
  revalidatePath("/sitemap.xml");
  /* `llms.txt` is the whole content set in plain text, and is `force-static` —
     without this it would serve the build's copy until the next deploy. */
  revalidatePath("/llms.txt");
}
