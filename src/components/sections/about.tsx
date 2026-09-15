import { Section } from "@/components/layout/section";
import { Paragraphs } from "@/components/ui/paragraphs";
import { getProfile } from "@/lib/data";

/**
 * The long bio, on the home page.
 *
 * `profile.bio.long` has existed on the content model and in the admin editor
 * since the profile schema was written — see the note at the top of
 * `@/lib/admin/profile-input` — but nothing on the public site has ever read
 * it. That is a real gap, not a deliberate one: the hero already carries
 * `bio.short` for the two-sentence version, and the long form — three
 * paragraphs on how the work gets chosen, the Web3 focus, open source — sits
 * in the database, truthful and already written, saying more about how this
 * person thinks about the work than a page built only from job titles and
 * project cards can. That is exactly the kind of context a reader — human or
 * a model summarizing the page — is looking for and currently cannot find
 * here.
 *
 * Sits right after the hero: the short bio has just introduced who this is,
 * and this is the fuller answer before the evidence (experience, projects,
 * contributions) starts making its case.
 *
 * Self-gating like every other section here, on the chance the field is ever
 * cleared to empty rather than filled in — a heading over blank prose is
 * worse than no section.
 */
export async function About() {
  const profile = await getProfile();

  if (profile.bio.long.trim().length === 0) return null;

  return (
    <Section id="about" eyebrow="About" title="A little about me ">
      <Paragraphs
        text={profile.bio.long}
        className="max-w-prose-page text-pretty text-body-lg text-muted"
      />
    </Section>
  );
}
