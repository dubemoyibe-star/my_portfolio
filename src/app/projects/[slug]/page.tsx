import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { LinkButton } from "@/components/ui/link-button";
import { Paragraphs } from "@/components/ui/paragraphs";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tag } from "@/components/ui/tag";
import { formatDateRange } from "@/lib/format";
import { getProjectBySlug, getTechByIds } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
import { getSiteIdentity } from "@/lib/site-identity";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [project, identity] = await Promise.all([
    getProjectBySlug(slug),
    getSiteIdentity(),
  ]);

  if (!project) {
    return { title: `Project not found — ${identity.name}` };
  }

  const cover = project.images[0];

  return pageMetadata({
    title: `${project.title} — ${identity.name}`,
    description: project.summary,
    path: `/projects/${project.slug}`,
    image: "projects",
    imageUrl: cover?.src,
    imageAlt: cover?.alt ?? `${project.title} project preview`,
    imageWidth: cover?.width,
    imageHeight: cover?.height,
  });
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) notFound();

  const tech = await getTechByIds(project.tech);
  const cover = project.images[0];

  return (
    <article>
      <Container className="py-12 lg:py-20">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-small text-muted transition-colors hover:text-link"
        >
          <span aria-hidden="true">←</span> All projects
        </Link>

        <header className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.45fr)] lg:items-end lg:gap-14">
          <div className="max-w-prose-page">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <StatusBadge status={project.status} />
              <span className="label text-muted">
                {formatDateRange(project.dates)}
              </span>
            </div>
            <h1 className="mt-5 text-balance">{project.title}</h1>
            <p className="mt-5 text-pretty text-body-lg text-muted">
              {project.summary}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            {project.links.live ? (
              <LinkButton href={project.links.live}>Visit live site</LinkButton>
            ) : null}
            {project.links.repo ? (
              <LinkButton href={project.links.repo}>View source</LinkButton>
            ) : null}
            {project.links.demo ? (
              <LinkButton href={project.links.demo}>Demo</LinkButton>
            ) : null}
            {project.links.caseStudy ? (
              <LinkButton href={project.links.caseStudy}>Case study</LinkButton>
            ) : null}
          </div>
        </header>

        {cover ? (
          <figure className="mt-12 overflow-hidden rounded-lg border border-border bg-surface">
            <Image
              src={cover.src}
              alt={cover.alt}
              width={cover.width ?? 1349}
              height={cover.height ?? 632}
              sizes="(min-width: 1152px) 1088px, 100vw"
              priority
              className="aspect-[64/30] w-full object-cover object-top"
            />
            {cover.caption ? (
              <figcaption className="border-t border-border px-4 py-3 text-small text-muted sm:px-6">
                {cover.caption}
              </figcaption>
            ) : null}
          </figure>
        ) : null}

        <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-20">
          <div className="min-w-0">
            <section aria-labelledby="project-overview">
              <p className="label text-muted">Overview</p>
              <h2 id="project-overview" className="mt-3 text-h3">
                About the project
              </h2>
              <Paragraphs
                text={project.description}
                className="mt-6 max-w-prose-page text-body text-muted"
              />
            </section>

            {project.highlights && project.highlights.length > 0 ? (
              <section
                aria-labelledby="project-highlights"
                className="mt-12 border-t border-border pt-8"
              >
                <p className="label text-muted">What I did</p>
                <h2 id="project-highlights" className="mt-3 text-h3">
                  Highlights
                </h2>
                <ul className="mt-6 flex max-w-prose-page flex-col gap-4">
                  {project.highlights.map((highlight) => (
                    <li
                      key={highlight}
                      className="flex gap-3 text-body text-muted"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-3 h-px w-4 shrink-0 bg-accent"
                      />
                      <span className="text-pretty">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {project.images.length > 1 ? (
              <section
                aria-labelledby="project-gallery"
                className="mt-12 border-t border-border pt-8"
              >
                <p className="label text-muted">Screens</p>
                <h2 id="project-gallery" className="mt-3 text-h3">
                  More from the project
                </h2>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  {project.images.slice(1).map((image) => (
                    <figure
                      key={image.src}
                      className="overflow-hidden rounded-lg border border-border bg-surface"
                    >
                      <Image
                        src={image.src}
                        alt={image.alt}
                        width={image.width ?? 1349}
                        height={image.height ?? 632}
                        sizes="(min-width: 640px) 45vw, 100vw"
                        className="aspect-[64/30] w-full object-cover object-top"
                      />
                      {image.caption ? (
                        <figcaption className="border-t border-border px-4 py-3 text-small text-muted">
                          {image.caption}
                        </figcaption>
                      ) : null}
                    </figure>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="h-fit border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <h2 className="label text-muted">Project details</h2>
            <dl className="mt-5 flex flex-col divide-y divide-border">
              <div className="py-4 first:pt-0">
                <dt className="label text-muted">Role</dt>
                <dd className="mt-2 text-small">{project.role}</dd>
              </div>
              {project.client ? (
                <div className="py-4">
                  <dt className="label text-muted">Client</dt>
                  <dd className="mt-2 text-small">{project.client}</dd>
                </div>
              ) : null}
              <div className="py-4">
                <dt className="label text-muted">Timeline</dt>
                <dd className="mt-2 text-small">
                  {formatDateRange(project.dates)}
                </dd>
              </div>
            </dl>

            {tech.length > 0 ? (
              <div className="mt-7">
                <h3 className="label text-muted">Built with</h3>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {tech.map((item) => (
                    <Tag key={item.id} icon={item.icon}>
                      {item.name}
                    </Tag>
                  ))}
                </ul>
              </div>
            ) : null}
          </aside>
        </div>

        <div className="mt-16 border-t border-border pt-6">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-small text-muted transition-colors hover:text-link"
          >
            Browse all projects <span aria-hidden="true">→</span>
          </Link>
        </div>
      </Container>
    </article>
  );
}
