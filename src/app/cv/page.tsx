import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { CvSection } from "@/components/cv/cv-section";
import { CvDownload } from "@/components/cv/cv-download";
import { getCertificatesUrl, getProfile, getResumeData } from "@/lib/data";
import { formatDateRange, formatUrl } from "@/lib/format";
import { groupTech } from "@/lib/tech-groups";
import { ogImages, pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/data/site";

/**
 * The description is `profile.resume.summary` verbatim. That is the formal
 * register the CV itself speaks in — written for someone assessing the work
 * rather than browsing it — which is exactly the framing a search result or a
 * shared link to this page wants.
 */
export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();

  return pageMetadata({
    title: "Oyibe Chidubem — CV / Resume",
    description: profile.resume.summary,
    path: "/cv",
    image: ogImages.cv,
  });
}

/**
 * The CV, assembled from `getResumeData()`.
 *
 * Every section is conditional on having data. `experience` is empty today —
 * there is no formal employment history yet — so the document currently reads
 * summary, projects, contributions, skills, with no gap and no empty heading
 * where experience would be. Adding roles to `data/experience.ts` makes the
 * section appear here with no change to this file.
 *
 * The layout is deliberately not built from the site's cards: a CV wants dense
 * typographic entries that survive a page break, not screenshots and buttons.
 */
export default async function CvPage() {
  const [resume, profile, certificatesUrl] = await Promise.all([
    getResumeData(),
    getProfile(),
    getCertificatesUrl(),
  ]);
  const { experience, projects, contributions, education } = resume;

  /* Regrouped through the same mapping the stack section uses, so the CV and
     the site never disagree about which categories exist. */
  const skills = groupTech(resume.skills.flatMap((group) => group.items));

  return (
    <Container className="max-w-3xl py-16 print:py-0 lg:py-24">
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link
          href="/"
          className="text-small text-muted transition-colors hover:text-link"
        >
          &larr; Back to site
        </Link>
        <CvDownload targetId="cv-document" fileName={profile.resume.fileName} />
      </div>

      <div id="cv-document">
        <header
          data-cv-block
          className="mt-10 border-b border-border pb-8 print:mt-0 print:pb-6"
        >
          <h1 className="text-h2">{profile.name}</h1>
          <p className="mt-2 text-h5 text-muted">{profile.resume.title}</p>

          {/* Labelled, because a bare address is a puzzle on paper: nobody
              reads "wa.me/2347026137565" and thinks WhatsApp. The label names
              the platform and the value is the part worth copying — a phone
              number rather than a wa.me path, an @name rather than a URL —
              falling back to the address wherever no handle is set. */}
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-small">
            {profile.resume.location ? (
              <li className="text-foreground">{profile.resume.location}</li>
            ) : null}

            {profile.resume.phone ? (
              <li>
                <span className="text-muted">Phone</span>{" "}
                <span className="text-foreground">{profile.resume.phone}</span>
              </li>
            ) : null}

            <li>
              <span className="text-muted">Email</span>{" "}
              <a
                href={`mailto:${profile.email}`}
                className="text-foreground hover:text-link"
              >
                {profile.email}
              </a>
            </li>

            {/* The portfolio URL belongs on the CV, not in the site's own link
                rows — a page does not link to itself. Read from siteConfig so
                there is one canonical address. */}
            <li>
              <span className="text-muted">Portfolio</span>{" "}
              <a
                href={siteConfig.url}
                target="_blank"
                rel="noreferrer noopener"
                className="text-foreground hover:text-link"
              >
                {formatUrl(siteConfig.url)}
              </a>
            </li>

            {profile.links.map((link) => (
              <li key={link.href}>
                <span className="text-muted">{link.label}</span>{" "}
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-foreground hover:text-link"
                >
                  {link.handle ?? formatUrl(link.href)}
                </a>
              </li>
            ))}
          </ul>
        </header>

        <CvSection title="Summary">
          <p data-cv-block className="text-pretty">
            {profile.resume.summary}
          </p>
        </CvSection>

        {experience.length > 0 ? (
          <CvSection title="Experience">
            {experience.map((entry) => (
              <article
                key={entry.id}
                data-cv-block
                className="print:break-inside-avoid"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="text-h5">
                    {entry.role}
                    <span className="text-muted"> · {entry.company}</span>
                  </h3>
                  <span className="label text-muted">
                    {formatDateRange(entry.dates)}
                  </span>
                </div>

                {entry.location ? (
                  <p className="mt-1 text-small text-muted">{entry.location}</p>
                ) : null}

                <p className="mt-3 text-pretty text-small text-muted">
                  {entry.description}
                </p>

                {entry.highlights.length > 0 ? (
                  <ul className="mt-3 flex flex-col gap-1.5">
                    {entry.highlights.map((highlight) => (
                      <li key={highlight} className="flex gap-3 text-small">
                        <span
                          aria-hidden="true"
                          className="mt-2.5 h-px w-3 shrink-0 bg-accent"
                        />
                        <span className="text-pretty">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </CvSection>
        ) : null}

        {projects.length > 0 ? (
          <CvSection title="Selected projects">
            {projects.map((project) => (
              <article
                key={project.id}
                data-cv-block
                className="print:break-inside-avoid"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="text-h5">
                    {project.title}
                    <span className="text-muted"> · {project.role}</span>
                  </h3>
                  <span className="label text-muted">
                    {formatDateRange(project.dates)}
                  </span>
                </div>

                <p className="mt-3 text-pretty text-small text-muted">
                  {project.summary}
                </p>

                {project.highlights && project.highlights.length > 0 ? (
                  <ul className="mt-3 flex flex-col gap-1.5">
                    {project.highlights.map((highlight) => (
                      <li key={highlight} className="flex gap-3 text-small">
                        <span
                          aria-hidden="true"
                          className="mt-2.5 h-px w-3 shrink-0 bg-accent"
                        />
                        <span className="text-pretty">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                <p className="mt-3 font-mono text-label text-muted">
                  {[project.links.live, project.links.repo]
                    .filter((url) => Boolean(url))
                    .map((url) => formatUrl(url as string))
                    .join("  ·  ")}
                </p>
              </article>
            ))}
          </CvSection>
        ) : null}

        {contributions.length > 0 ? (
          <CvSection title="Open source contributions">
            {contributions.map((entry) => (
              <article
                key={entry.id}
                data-cv-block
                className="print:break-inside-avoid"
              >
                <h3 className="text-h5">
                  {entry.repoName}
                  {entry.owner ? (
                    <span className="text-muted"> · {entry.owner}</span>
                  ) : null}
                </h3>

                <p className="mt-1 text-small text-muted">
                  {entry.repoDescription}
                </p>

                <p className="mt-3 text-pretty text-small">
                  {entry.contributionSummary}
                </p>

                <p className="mt-3 font-mono text-label text-muted">
                  {entry.prLinks.map((pr) => formatUrl(pr.url)).join("  ·  ")}
                </p>
              </article>
            ))}
          </CvSection>
        ) : null}

        {skills.length > 0 ? (
          <CvSection title="Skills">
            <dl data-cv-block className="flex flex-col gap-4">
              {skills.map((group) => (
                <div
                  key={group.label}
                  className="grid gap-1 sm:grid-cols-[minmax(0,11rem)_1fr] sm:gap-6"
                >
                  <dt className="label pt-1 text-muted">{group.label}</dt>
                  <dd className="text-small">
                    {group.items.map((item) => item.name).join(", ")}
                  </dd>
                </div>
              ))}
            </dl>
          </CvSection>
        ) : null}

        {education.length > 0 ? (
          <CvSection title="Education">
            {education.map((entry) => (
              <article
                key={entry.id}
                data-cv-block
                className="print:break-inside-avoid"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="text-h5">
                    {entry.institution}
                    <span className="text-muted"> · {entry.fieldOfStudy}</span>
                  </h3>
                  <span className="label text-muted">
                    {formatDateRange(entry.dates)}
                  </span>
                </div>

                {entry.status === "in-progress" ? (
                  <p className="mt-1 text-small text-muted">In progress</p>
                ) : null}
              </article>
            ))}

            {/* The note, not a certificate list: printing each certificate
                inline would push the actual work onto a second page. The
                detail lives in the site's Education section. */}
            <p data-cv-block className="text-small text-muted">
              {resume.educationNote}
              {resume.certifications.length > 0 ? (
                <>
                  {" "}
                  Certificates at{" "}
                  <span className="text-foreground">
                    {formatUrl(certificatesUrl)}
                  </span>
                  .
                </>
              ) : null}
            </p>
          </CvSection>
        ) : null}
      </div>
    </Container>
  );
}
