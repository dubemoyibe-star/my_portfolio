import { CertificationCard } from "@/components/cards/certification-card";
import { Section } from "@/components/layout/section";
import { LinkButton } from "@/components/ui/link-button";
import {
  getCertificatesUrl,
  getCertifications,
  getEducation,
  getEducationNote,
} from "@/lib/data";
import { formatDateRange } from "@/lib/format";

/**
 * Education and certifications, on the home page.
 *
 * This used to be split between a short teaser here and a full /education
 * route. One page is better: the certificates are a handful of cards, not
 * enough to justify a second destination, and a link out of the main flow is a
 * link most readers never follow.
 *
 * Sits last in the section order — background is context for the work above
 * it, not an opening claim.
 */
export async function Education() {
  const [education, note, certifications, certificatesUrl] = await Promise.all([
    getEducation(),
    getEducationNote(),
    getCertifications(),
    getCertificatesUrl(),
  ]);

  if (education.length === 0 && certifications.length === 0) return null;

  return (
    <Section id="education" eyebrow="Education" title="Background">
      {education.length > 0 ? (
        <ul className="flex flex-col gap-6">
          {education.map((entry) => (
            <li
              key={entry.id}
              className="rounded-lg border border-border bg-surface p-6 lg:p-8"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                <h3 className="text-h4">{entry.institution}</h3>
                <span className="label text-muted">
                  {formatDateRange(entry.dates)}
                </span>
              </div>

              <p className="mt-2 text-muted">{entry.fieldOfStudy}</p>

              <p className="label mt-4 flex items-center gap-2 text-muted">
                <span
                  aria-hidden="true"
                  className={
                    entry.status === "in-progress"
                      ? "size-1.5 rounded-full bg-warning"
                      : "size-1.5 rounded-full bg-accent"
                  }
                />
                {entry.status === "in-progress" ? "In progress" : "Completed"}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Cyfrin Updraft lives in this sentence rather than in the grid below:
          badges are not certificates, and giving them cards would overstate
          them next to the verifiable ones. */}
      <p className="mt-6 max-w-prose-page text-pretty text-muted">{note}</p>

      {certifications.length > 0 ? (
        <div className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="label text-muted">Certifications</h3>
            <LinkButton href={certificatesUrl}>All certificates</LinkButton>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {certifications.map((certification) => (
              <CertificationCard
                key={certification.id}
                certification={certification}
              />
            ))}
          </div>
        </div>
      ) : null}
    </Section>
  );
}
