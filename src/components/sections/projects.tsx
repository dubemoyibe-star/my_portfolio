import Link from "next/link";

import { ProjectCard } from "@/components/cards/project-card";
import { Section } from "@/components/layout/section";
import { getProjects, getTechIndex } from "@/lib/data";

/** Homepage preview of owned work; the complete catalogue lives at `/projects`. */
export async function Projects() {
  const [projects, techIndex] = await Promise.all([
    getProjects(),
    getTechIndex(),
  ]);

  if (projects.length === 0) return null;

  return (
    <Section id="projects" eyebrow="Projects" title="Things I've built">
      <div className="grid gap-6 lg:grid-cols-2">
        {projects.slice(0, 6).map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            tech={project.tech
              .map((id) => techIndex[id])
              .filter((item) => Boolean(item))}
          />
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <Link
          href="/projects"
          className="inline-flex h-11 items-center gap-3 rounded-md border border-border bg-surface px-5 text-small text-foreground transition-colors hover:border-link/50 hover:text-link"
        >
          See all projects
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </Section>
  );
}
