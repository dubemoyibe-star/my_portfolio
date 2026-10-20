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
  index,
}: {
  project: Project;
  tech: TechStackItem[];
  index: number;
}) {
  const cover = project.images[0];
  const imageFirst = index % 2 === 0;

  return (
    <article className="border-b border-border py-8 first:border-t lg:py-10">
      <div className="grid items-center gap-7 lg:grid-cols-12 lg:gap-10">
        <div
          className={`group overflow-hidden rounded-md border border-border bg-surface-raised lg:col-span-6 ${imageFirst ? "lg:order-1" : "lg:order-2"}`}
        >
          {cover ? (
            <Image
              src={cover.src}
              alt={cover.alt}
              width={cover.width ?? 1349}
              height={cover.height ?? 632}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="block h-auto w-full scale-100 object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex aspect-[64/30] items-center justify-center p-8">
              <span className="label text-center text-muted">
                {project.title}
              </span>
            </div>
          )}
        </div>

        <div
          className={`flex flex-col lg:col-span-6 ${imageFirst ? "lg:order-2" : "lg:order-1"}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-label text-accent">
                {String(index + 1).padStart(2, "0")}
              </span>
              <StatusBadge status={project.status} />
            </div>
            <span className="label text-muted">
              {formatDateRange(project.dates)}
            </span>
          </div>

          <h2 className="mt-5 text-h3">
            <Link
              href={`/projects/${project.slug}`}
              className="transition-colors hover:text-link"
            >
              {project.title}
            </Link>
          </h2>
          <p className="mt-3 text-pretty text-muted">{project.summary}</p>

          <div className="mt-5 border-t border-border pt-4">
            <p className="label text-muted">Role</p>
            <p className="mt-1 text-small">{project.role}</p>
          </div>

          {tech.length > 0 ? (
            <ul className="mt-5 flex flex-wrap gap-2">
              {tech.slice(0, 5).map((item) => (
                <Tag key={item.id} icon={item.icon}>
                  {item.name}
                </Tag>
              ))}
            </ul>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-2">
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
