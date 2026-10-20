import Image from "next/image";
import Link from "next/link";

import { LinkButton } from "@/components/ui/link-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tag } from "@/components/ui/tag";
import { formatDateRange } from "@/lib/format";
import type { Project, TechStackItem } from "@/types";

export function ProjectListCard({
  project,
  tech,
}: {
  project: Project;
  tech: TechStackItem[];
}) {
  const cover = project.images[0];

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="grid h-full lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)]">
        <div className="relative flex aspect-[64/30] items-center justify-center overflow-hidden border-b border-border bg-surface-raised lg:aspect-[4/3] lg:border-b-0 lg:border-r">
          {cover ? (
            <Image
              src={cover.src}
              alt={cover.alt}
              width={cover.width ?? 1349}
              height={cover.height ?? 632}
              sizes="(min-width: 1024px) 42vw, 100vw"
              className="size-full object-contain"
            />
          ) : (
            <div className="flex size-full min-h-48 items-center justify-center p-8">
              <span className="label text-center text-muted">
                {project.title}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col p-6 lg:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StatusBadge status={project.status} />
            <span className="label text-muted">
              {formatDateRange(project.dates)}
            </span>
          </div>

          <h2 className="mt-4 text-h3">
            <Link
              href={`/projects/${project.slug}`}
              className="transition-colors hover:text-link"
            >
              {project.title}
            </Link>
          </h2>
          <p className="mt-3 text-pretty text-muted">{project.summary}</p>

          <dl className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
            <div>
              <dt className="label text-muted">Role</dt>
              <dd className="mt-1 text-small">{project.role}</dd>
            </div>
            {project.client ? (
              <div>
                <dt className="label text-muted">Client</dt>
                <dd className="mt-1 text-small">{project.client}</dd>
              </div>
            ) : null}
          </dl>

          {project.highlights && project.highlights.length > 0 ? (
            <ul className="mt-5 flex flex-col gap-2">
              {project.highlights.slice(0, 2).map((highlight) => (
                <li key={highlight} className="flex gap-3 text-small text-muted">
                  <span
                    aria-hidden="true"
                    className="mt-2.5 h-px w-3 shrink-0 bg-accent"
                  />
                  <span className="text-pretty">{highlight}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {tech.length > 0 ? (
            <ul className="mt-5 flex flex-wrap gap-2">
              {tech.map((item) => (
                <Tag key={item.id} icon={item.icon}>
                  {item.name}
                </Tag>
              ))}
            </ul>
          ) : null}

          <div className="mt-auto flex flex-wrap items-center gap-2 pt-6">
            <Link
              href={`/projects/${project.slug}`}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border-strong px-3.5 text-small text-foreground transition-colors hover:border-link/50 hover:text-link"
            >
              Project details <span aria-hidden="true">→</span>
            </Link>
            {project.links.live ? (
              <LinkButton href={project.links.live}>Live site</LinkButton>
            ) : null}
            {project.links.repo ? (
              <LinkButton href={project.links.repo}>Code</LinkButton>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
