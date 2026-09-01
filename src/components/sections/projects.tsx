import { ProjectCard } from "@/components/cards/project-card";
import { Section } from "@/components/layout/section";
import { getProjects, getTechIndex } from "@/lib/data";

/**
 * Projects — work owned end to end. Open-source contributions live in their
 * own section, deliberately not mixed in here.
 *
 * `getProjects()` already applies the ordering rule (manual `order` first,
 * recency as the tiebreak), so this does not re-sort.
 *
 * The tech index is fetched once and shared across every card rather than each
 * card resolving its own ids — the same reason `getTechIndex()` exists.
 */
export async function Projects() {
  const [projects, techIndex] = await Promise.all([
    getProjects(),
    getTechIndex(),
  ]);

  if (projects.length === 0) return null;

  return (
    <Section id="projects" eyebrow="Projects" title="Things I've built">
      <div className="grid gap-6 lg:grid-cols-2">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            tech={project.tech
              .map((id) => techIndex[id])
              .filter((item) => Boolean(item))}
          />
        ))}
      </div>
    </Section>
  );
}
