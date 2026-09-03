import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/chrome";
import { categoryGroupLabel, toTechInput } from "@/lib/admin/tech-input";
import { getTechIndex } from "@/lib/data";
import { prisma } from "@/lib/prisma";

import { TechForm } from "../tech-form";

/**
 * The edit screen.
 *
 * Keyed by `id` like the other editors, except here that is not a choice made
 * to survive a rename — a tech item's id *is* its slug, and it does not change.
 * See `../actions` for why.
 *
 * `/admin/tech-stack/new` and `/admin/tech-stack/[id]` are siblings, and Next
 * resolves the static segment first, so "new" can never be read as an id.
 */

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const row = await prisma.techStackItem.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: row ? row.name : "Tech item" };
}

export default async function EditTechPage({ params }: PageProps) {
  const { id } = await params;

  /* Read back through the data layer rather than mapping the row here, so the
     editor is populated by exactly the translation the public site renders
     from — a disagreement between the two then shows up in the form instead of
     silently on the site.

     The reference count comes straight from Prisma because it is not content:
     the domain type has no idea what points at it, and this screen needs to say
     so before somebody presses delete. */
  const [index, counts] = await Promise.all([
    getTechIndex(),
    prisma.techStackItem.findUnique({
      where: { id },
      select: { _count: { select: { projects: true, experiences: true } } },
    }),
  ]);

  const item = index[id];
  if (!item || !counts) notFound();

  const references = counts._count.projects + counts._count.experiences;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        backHref="/admin/tech-stack"
        backLabel="Tech stack"
        title={item.name}
        description={
          <>
            <span className="font-mono">{item.id}</span>
            {" · "}
            {categoryGroupLabel(item.category)}
            {" · "}
            {references === 0
              ? "not referenced"
              : `referenced by ${references} ${references === 1 ? "record" : "records"}`}
          </>
        }
        actions={
          <>
            {item.url ? (
              <Link
                href={item.url}
                target="_blank"
                rel="noreferrer noopener"
                className="label text-muted transition-colors hover:text-foreground"
              >
                Site ↗
              </Link>
            ) : null}
            <Link
              href="/#stack"
              target="_blank"
              rel="noreferrer"
              className="label text-muted transition-colors hover:text-foreground"
            >
              View on site ↗
            </Link>
          </>
        }
      />

      <TechForm
        mode="edit"
        techId={item.id}
        initial={toTechInput(item)}
        referenceCount={references}
      />
    </div>
  );
}
