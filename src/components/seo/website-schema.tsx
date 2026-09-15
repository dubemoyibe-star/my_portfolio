import { siteConfig } from "@/data/site";
import { getSiteIdentity } from "@/lib/site-identity";
import { PERSON_ID } from "@/components/seo/person-schema";

/**
 * `WebSite` structured data — the site itself, as an entity distinct from the
 * person it belongs to.
 *
 * Sits in the root layout rather than the home page: unlike the `Person` in
 * `PersonSchema`, which is deliberately asserted on `/` only, the site itself
 * is the same site on every route, so this is the one JSON-LD block safe to
 * repeat verbatim everywhere. Rendering it on admin routes too costs nothing —
 * those pages are `noindex`, so nothing ever reads it there — and skipping it
 * conditionally would need path-awareness this layout does not otherwise need.
 *
 * `publisher` and `author` both reference `PersonSchema`'s `@id` rather than
 * re-describing the person here. This is the second half of the identity
 * graph the home page's `ProfilePage` starts: a search engine or an AI
 * crawler reading any page on the site sees "this site is published by
 * `{siteConfig.url}/#person`," and the home page is where that `@id` is
 * actually defined — `sameAs`, `knowsAbout`, the rest. Repeating the full
 * `Person` object here instead of referencing it would be the "duplicate or
 * conflicting Person entities" this codebase already avoids on purpose.
 */
export async function WebSiteSchema() {
  const identity = await getSiteIdentity();

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.url}/#website`,
    url: siteConfig.url,
    name: identity.name,
    description: identity.description,
    inLanguage: "en",
    publisher: { "@id": PERSON_ID },
    author: { "@id": PERSON_ID },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema).replace(/</g, "\u003c"),
      }}
    />
  );
}
