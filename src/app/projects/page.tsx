import type { Metadata } from "next";
import Link from "next/link";

import { ProjectListCard } from "@/components/cards/project-list-card";
import { Container } from "@/components/layout/container";
import { getProjects, getTechIndex } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
import { getSiteIdentity } from "@/lib/site-identity";

export async function generateMetadata(): Promise<Metadata> {
  const identity = await getSiteIdentity();

  return pageMetadata({
    title: `Projects — ${identity.name}`,
    description: `Explore ${identity.name}'s full project portfolio: shipped products, experiments, and work in progress.`,
    path: "/projects",
    image: "projects",
  });
}

export default async function ProjectsPage() {
  const [projects, techIndex] = await Promise.all([
    getProjects(),
    getTechIndex(),
  ]);

  return (
    <Container className="py-16 lg:py-24">
      <Link
        href="/"
        className="text-small text-muted transition-colors hover:text-link"
      >
        ← Back to home
      </Link>

      <header className="mt-10 max-w-prose-page">
        <p className="label flex items-center gap-3 text-muted">
          <span aria-hidden="true" className="h-px w-7 bg-accent" />
          Project archive
        </p>
        <h1 className="mt-4 text-balance">Selected work</h1>
        <p className="mt-5 text-pretty text-body-lg text-muted">
          Products and experiments built from idea to implementation. Each
          project includes the context, decisions, and technologies behind it.
        </p>
      </header>

      <div className="mt-12 flex items-center justify-between border-y border-border py-4">
        <p className="label text-muted">Projects</p>
        <p className="font-mono text-label text-muted">
          {String(projects.length).padStart(2, "0")} entries
        </p>
      </div>

      {projects.length > 0 ? (
        <div className="mt-8 flex flex-col gap-6">
          {projects.map((project) => (
            <ProjectListCard
              key={project.id}
              project={project}
              tech={project.tech
                .map((id) => techIndex[id])
                .filter((item) => Boolean(item))}
            />
          ))}
        </div>
      ) : (
        <p className="mt-10 text-muted">Projects will appear here soon.</p>
      )}
    </Container>
  );
}
