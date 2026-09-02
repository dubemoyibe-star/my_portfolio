import { siteConfig } from "@/data/site";
import { getProfile, getTechStack } from "@/lib/data";

/**
 * Person structured data for the home page.
 *
 * This is the machine-readable half of the hero: the same name, role, links
 * and stack the section renders, restated in a form a search engine can put in
 * a knowledge panel. It is built from `@/lib/data` for exactly that reason —
 * a schema that drifts from the visible page is worse than no schema, because
 * it reads as a claim the page does not support.
 *
 * `sameAs` is how the profiles are tied to the same person; `knowsAbout` comes
 * from the featured tech stack, so adding a skill to `data/tech.ts` adds it
 * here with no change to this file.
 */
export async function PersonSchema() {
  const [profile, tech] = await Promise.all([
    getProfile(),
    getTechStack({ featured: true }),
  ]);

  /* `avatar` and `location` are both optional on the profile, and a schema
     property present but empty is worse than absent — it asserts a blank
     value. Spread them in only when there is something to say. */
  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.resume.title,
    url: siteConfig.url,
    description: profile.bio.short,
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
    sameAs: profile.links.map((link) => link.href),
    knowsAbout: tech.map((item) => item.name),
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
