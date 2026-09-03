import type { Metadata } from "next";

import { HashLanding } from "@/components/layout/hash-landing";
import { Contributions } from "@/components/sections/contributions";
import { Education } from "@/components/sections/education";
import { Experience } from "@/components/sections/experience";
import { Hero } from "@/components/sections/hero";
import { Projects } from "@/components/sections/projects";
import { TechStack } from "@/components/sections/tech-stack";
import { PersonSchema } from "@/components/seo/person-schema";
import { getProfile } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
import { getSiteIdentity } from "@/lib/site-identity";

/**
 * The description is `profile.bio.short` verbatim: two sentences, already
 * written for exactly this length. Rewriting it here is how the page and its
 * search result end up describing different people.
 *
 * Read through `getProfile()` rather than importing the seed directly, so the
 * metadata follows the same path as the rendered page when the content source
 * changes.
 */
export async function generateMetadata(): Promise<Metadata> {
  const [profile, identity] = await Promise.all([
    getProfile(),
    getSiteIdentity(),
  ]);

  return await pageMetadata({
    /* The name is live; the role is not. "Fullstack & Blockchain Developer" is
       a third phrasing of the job — shorter than `resume.title`, which is the
       CV's formal register and reads as a mouthful in a browser tab — and the
       content model has no field for it. Interpolating the name at least means
       a rename does not leave the site's main title quoting the old one. */
    title: `${identity.name} — Fullstack & Blockchain Developer`,
    description: profile.bio.short,
    path: "/",
    image: "home",
  });
}

/**
 * Home page.
 *
 * Sections are self-gating: each returns `null` when its data is empty, so the
 * page composes them unconditionally and never renders a bare heading.
 *
 * Order puts the work first, then the supporting evidence for it: the stack,
 * then background. Neither is an opening argument.
 */
export default function HomePage() {
  return (
    <>
      {/* Person schema. Sits on the home page only: it describes the site's
          subject, and repeating it per route would assert several Persons. */}
      <PersonSchema />

      <HashLanding />
      <Hero />
      <Experience />
      <Projects />
      <Contributions />
      <TechStack />
      <Education />
    </>
  );
}
