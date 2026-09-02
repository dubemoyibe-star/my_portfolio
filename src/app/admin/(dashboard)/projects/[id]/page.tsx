import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/chrome";
import { toProjectInput } from "@/lib/admin/project-input";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { getProjectBySlug } from "@/lib/data";
import { prisma } from "@/lib/prisma";

import { ProjectForm } from "../project-form";
import { readTechOptions } from "../tech-options";

/**
 * The edit screen, keyed by `id` rather than by slug.
 *
 * A slug is allowed to change — that is the whole reason the model carries both
 * — so an editor URL built on one would break the moment someone renamed the
 * project they were editing. `id` never changes.
 *
 * `/admin/projects/new` and `/admin/projects/[id]` are siblings, and Next
 * resolves the static segment first, so "new" can never be read as an id.
 */

type PageProps = { params: Promise<{ id: string }> };

/** Titles the browser tab with the project's own name. */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const row = await prisma.project.findUnique({
    where: { id },
    select: { title: true },
  });
  return { title: row ? row.title : "Project" };
}

export default async function EditProjectPage({ params }: PageProps) {
  const { id } = await params;

  const row = await prisma.project.findUnique({
    where: { id },
    select: { slug: true },
  });
  if (!row) notFound();

  /* Read back through the data layer rather than re-mapping the row here, so
     the editor is populated by exactly the same translation the public site
     renders from. If the two ever disagree about what a column means, the bug
     shows up in the form rather than silently on the site. */
  const [project, images, techOptions] = await Promise.all([
    getProjectBySlug(row.slug),
    prisma.projectImage.findMany({
      where: { projectId: id },
      orderBy: { position: "asc" },
    }),
    readTechOptions(),
  ]);

  if (!project) notFound();

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        backHref="/admin/projects"
        backLabel="Projects"
        title={project.title}
        description={
          <>
            <span className="font-mono">{project.id}</span> · public URL{" "}
            <span className="font-mono">/{project.slug}</span>
          </>
        }
        actions={
          <Link
            href="/#projects"
            target="_blank"
            rel="noreferrer"
            className="label text-muted transition-colors hover:text-foreground"
          >
            View on site ↗
          </Link>
        }
      />

      <ProjectForm
        mode="edit"
        projectId={project.id}
        initial={toProjectInput(
          project,
          images.map((image) => ({
            src: image.src,
            alt: image.alt,
            caption: image.caption ?? "",
            width: image.width ?? undefined,
            height: image.height ?? undefined,
          })),
        )}
        techOptions={techOptions}
        cloudinaryConfigured={isCloudinaryConfigured()}
      />
    </div>
  );
}
