import Image from "next/image";

import { Disclosure } from "@/components/ui/disclosure";
import { LinkButton } from "@/components/ui/link-button";
import { Paragraphs } from "@/components/ui/paragraphs";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tag } from "@/components/ui/tag";
import { formatDateRange } from "@/lib/format";
import type { Project, TechStackItem } from "@/types";

export type ProjectCardProps = {
  project: Project;
  /** Resolved from `project.tech`. The section looks these up once for all cards. */
  tech: TechStackItem[];
};

export function ProjectCard({ project, tech }: ProjectCardProps) {
  const { links } = project;
  const cover = project.images.at(0);

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface">
      {/* 64/30 (2.133:1) matches the covers' own proportions to within half a
          percent, so `object-cover` has essentially nothing to crop. A 16/9
          frame would have cut roughly a sixth off these — and on a product
          screenshot that means losing the nav bar or the fold. The placeholder
          uses the same ratio so a project without a cover keeps the row aligned. */}
      {cover ? (
        /* Own clipping context: the image grows past this box on hover and is
           cropped by it, so the card's rounded corner and bottom border stay
           put instead of scaling along with it. */
        <div className="overflow-hidden border-b border-border">
          <Image
            src={cover.src}
            alt={cover.alt}
            width={cover.width ?? 1349}
            height={cover.height ?? 632}
            /* Full width on mobile, half the 72rem column from lg up. Without
               this Next assumes full-viewport and ships an oversized variant. */
            sizes="(min-width: 1024px) 45vw, 100vw"
            /* Full size at rest, easing in to 105% on hover. The global
               reduced-motion rule already collapses this transition. */
            className="aspect-[64/30] w-full scale-100 object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
          />
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="flex aspect-[64/30] items-center justify-center border-b border-border bg-surface-raised px-6"
        >
          <span className="label text-center text-muted">{project.title}</span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusBadge status={project.status} />
          <span className="label text-muted">
            {formatDateRange(project.dates)}
          </span>
        </div>

        <h3 className="mt-4 text-h4">{project.title}</h3>

        <p className="mt-3 text-pretty text-muted">{project.summary}</p>

        {tech.length > 0 ? (
          <ul className="mt-5 flex flex-wrap gap-2">
            {tech.map((item) => (
              <Tag key={item.id} icon={item.icon}>
                {item.name}
              </Tag>
            ))}
          </ul>
        ) : null}

        {/* Pushed to the bottom so cards in a row line their actions up even
            when summaries run to different lengths. */}
        <div className="mt-auto pt-6">
          {links.repo || links.live || links.demo || links.caseStudy ? (
            <div className="flex flex-wrap gap-2">
              {links.live ? (
                <LinkButton href={links.live}>Live site</LinkButton>
              ) : null}
              {links.repo ? (
                <LinkButton href={links.repo}>Code</LinkButton>
              ) : null}
              {links.demo ? <LinkButton href={links.demo}>Demo</LinkButton> : null}
              {links.caseStudy ? (
                <LinkButton href={links.caseStudy}>Write-up</LinkButton>
              ) : null}
            </div>
          ) : null}

          <Disclosure className="mt-5">
            <div className="flex flex-col gap-6">
              <div>
                <p className="label text-muted">Role</p>
                <p className="mt-2 text-small">{project.role}</p>
              </div>

              <div>
                <p className="label text-muted">About</p>
                <Paragraphs
                  text={project.description}
                  className="mt-2 text-small text-muted"
                />
              </div>

              {project.highlights && project.highlights.length > 0 ? (
                <div>
                  <p className="label text-muted">Highlights</p>
                  <ul className="mt-3 flex flex-col gap-2">
                    {project.highlights.map((highlight) => (
                      <li
                        key={highlight}
                        className="flex gap-3 text-small text-muted"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-2.5 h-px w-3 shrink-0 bg-accent"
                        />
                        <span className="text-pretty">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {project.client ? (
                <div>
                  <p className="label text-muted">Client</p>
                  <p className="mt-2 text-small">{project.client}</p>
                </div>
              ) : null}
            </div>
          </Disclosure>
        </div>
      </div>
    </article>
  );
}
