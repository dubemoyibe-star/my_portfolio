import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/chrome";
import { toExperienceInput } from "@/lib/admin/experience-input";
import { readTechOptions } from "@/lib/admin/tech-options";
import { getExperienceBySlug } from "@/lib/data";
import { formatRoleMeta } from "@/lib/format";
import { prisma } from "@/lib/prisma";

import { ExperienceForm } from "../experience-form";

/**
 * The edit screen, keyed by `id` rather than by slug.
 *
 * A slug is allowed to change — that is the whole reason the model carries
 * both — so an editor URL built on one would break the moment someone renamed
 * the role they were editing. `id` never changes.
 *
 * `/admin/experience/new` and `/admin/experience/[id]` are siblings, and Next
 * resolves the static segment first, so "new" can never be read as an id.
 */

type PageProps = { params: Promise<{ id: string }> };

/** Titles the browser tab with the role's own name. */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const row = await prisma.experience.findUnique({
    where: { id },
    select: { role: true, company: true },
  });
  return { title: row ? `${row.role} · ${row.company}` : "Role" };
}

export default async function EditExperiencePage({ params }: PageProps) {
  const { id } = await params;

  const row = await prisma.experience.findUnique({
    where: { id },
    select: { slug: true },
  });
  if (!row) notFound();

  /* Read back through the data layer rather than re-mapping the row here, so
     the editor is populated by exactly the same translation the public site
     renders from. If the two ever disagree about what a column means, the bug
     shows up in the form rather than silently on the site. */
  const [entry, techOptions] = await Promise.all([
    getExperienceBySlug(row.slug),
    readTechOptions(),
  ]);

  if (!entry) notFound();

  const meta = formatRoleMeta(entry);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        backHref="/admin/experience"
        backLabel="Experience"
        title={`${entry.role} · ${entry.company}`}
        description={
          <>
            <span className="font-mono">{entry.id}</span>
            {meta.length > 0 ? ` · ${meta}` : null}
          </>
        }
        actions={
          <>
            {entry.companyUrl ? (
              <Link
                href={entry.companyUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="label text-muted transition-colors hover:text-foreground"
              >
                Company ↗
              </Link>
            ) : null}
            <Link
              href="/#experience"
              target="_blank"
              rel="noreferrer"
              className="label text-muted transition-colors hover:text-foreground"
            >
              View on site ↗
            </Link>
          </>
        }
      />

      <ExperienceForm
        mode="edit"
        experienceId={entry.id}
        initial={toExperienceInput(entry)}
        techOptions={techOptions}
      />
    </div>
  );
}
