import { profile as seedProfile } from "@/data/profile";
import { siteConfig } from "@/data/site";
import { getEducation, getProfile, getTechStack } from "@/lib/data";

/**
 * The stable identifier every other reference to this person points at.
 *
 * `#person` rather than a bare URL: `siteConfig.url` alone would collide with
 * the page's own URL as an `@id`, and a fragment is the convention schema.org
 * consumers expect for "the entity this document is *about*" versus "the
 * document itself." `WebSiteSchema` (root layout) references this same
 * constant so the two nodes agree on one identity across every page rather
 * than each page minting its own.
 */
export const PERSON_ID = `${siteConfig.url}/#person`;

/**
 * Contact links that are genuinely identity — a profile page a human or a
 * crawler can visit to confirm this is the same person — versus messaging
 * deep links like `wa.me/…` or a Telegram handle, which are contact methods,
 * not profiles. `sameAs` is specifically for the former: schema.org defines
 * it as a URL that "unambiguously indicates the item's identity." Filtering
 * by icon rather than hand-listing URLs means an identity link added in the
 * admin panel (another GitHub org, a new X handle) is picked up with no
 * change here, while a WhatsApp number added the same way is not mistaken
 * for a profile.
 */
const IDENTITY_PLATFORMS = new Set(["github", "linkedin", "x"]);

/**
 * `profile.resume.updatedAt`, defensively parsed.
 *
 * Identical guard to `lastModified()` in `@/app/sitemap.ts` — that file's own
 * note explains why: `updatedAt` is free text, an unparseable value reaches
 * `Date` as Invalid Date and throws on serialization, and the seed's own date
 * is the correct fallback rather than `new Date()`, which would tell a
 * crawler the page changed on every redeploy. Kept as a short duplicate
 * rather than a shared import: four lines is cheaper than coupling this
 * component to the sitemap's module.
 */
function dateModified(updatedAt: string): Date {
  const date = new Date(updatedAt);
  return Number.isNaN(date.getTime())
    ? new Date(seedProfile.resume.updatedAt)
    : date;
}

/**
 * `Person` + `ProfilePage` structured data for the home page.
 *
 * This is the machine-readable half of the hero: the same name, role, links,
 * education and stack the sections render, restated in a form a search engine
 * or an AI crawler can use to answer "who is this and what do they do." It is
 * built from `@/lib/data` for exactly that reason — a schema that drifts from
 * the visible page is worse than no schema, because it reads as a claim the
 * page does not support.
 *
 * `ProfilePage` (schema.org / Google's Profile Page structured data) is the
 * correct wrapper here rather than a bare `Person`: this page's whole content
 * is a description of one person, which is exactly the use case Google
 * documents it for ("an About Me page on a blog site"). The only required
 * property is `mainEntity`; `dateModified` is the one recommended property
 * this content model can answer truthfully — there is no tracked creation
 * date, so `dateCreated` is left out rather than invented.
 *
 * `sameAs` links only the platforms in `IDENTITY_PLATFORMS` — see its note.
 * `knowsAbout` comes from the featured tech stack. `alumniOf` comes from the
 * real education records; it is omitted entirely when there are none, the
 * same rule `avatar`/`location` already follow below — an empty array is a
 * claim of "no education," which is not something this component knows.
 */
export async function PersonSchema() {
  const [profile, tech, education] = await Promise.all([
    getProfile(),
    getTechStack({ featured: true }),
    getEducation(),
  ]);

  const person = {
    "@type": "Person",
    "@id": PERSON_ID,
    name: profile.name,
    jobTitle: profile.resume.title,
    url: siteConfig.url,
    description: profile.bio.short,
    /* `avatar` and `location` are both optional on the profile, and a schema
       property present but empty is worse than absent — it asserts a blank
       value. Spread them in only when there is something to say. */
    ...(profile.avatar
      ? { image: new URL(profile.avatar.src, siteConfig.url).toString() }
      : {}),
    ...(profile.location
      ? {
          address: {
            "@type": "PostalAddress",
            addressCountry: profile.location,
          },
        }
      : {}),
    sameAs: profile.links
      .filter((link) => IDENTITY_PLATFORMS.has(link.icon ?? ""))
      .map((link) => link.href),
    knowsAbout: tech.map((item) => item.name),
    ...(education.length > 0
      ? {
          alumniOf: education.map((entry) => ({
            "@type": "EducationalOrganization",
            name: entry.institution,
          })),
        }
      : {}),
  };

  const schema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    dateModified: dateModified(profile.resume.updatedAt).toISOString(),
    mainEntity: person,
  };

  return (
    <script
      type="application/ld+json"
      /* JSON.stringify escapes nothing HTML-significant on its own, and this
         data is ours rather than user input — but `</script>` inside any
         future string value would still close the tag early, so the one
         sequence that can do that is escaped. */
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema).replace(/</g, "\u003c"),
      }}
    />
  );
}
