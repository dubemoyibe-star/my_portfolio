import type { Metadata } from "next";
import Link from "next/link";

import {
  AdminPageHeader,
  Chip,
  EmptyState,
  Panel,
  buttonGhost,
  buttonPrimary,
} from "@/components/admin/chrome";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { formatStamp } from "@/lib/admin/format";
import { PROJECT_STATUS_LABELS } from "@/lib/admin/project-input";
import { formatDateRange } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import type { ProjectStatus } from "@/types";

import { deleteProject } from "./actions";

/**
 * Every project, in the order the public site renders them.
 *
 * The sort is deliberately the same rule `getProjects()` applies — `order`
 * first, then recency — rather than "newest edited first" or alphabetical. A
 * list that disagrees with the site about what comes first makes the `order`
 * field impossible to reason about: you set it to 2, and then have to go and
 * look at the home page to find out what that did.
 *
 * Read through Prisma rather than through `getProjects()` because the list
 * needs three things the domain type does not carry — `updatedAt`, and the
 * counts of images and tech references. Those are admin concerns, and pushing
 * them into `Project` would put them on the wire for every public page render
 * that has no use for them.
 */

export const metadata: Metadata = {
  title: "Projects",
};

export default async function AdminProjectsPage() {
  const rows = await prisma.project.findMany({
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
      _count: { select: { tech: true, images: true } },
    },
    /* Mirrors `getProjects()`: manual `order` wins, entries without one fall
       to the back, and ties break on recency. An open-ended project has no
       `endDate`, and `nulls: "first"` is what makes "still running" sort as
       the most recent thing rather than the oldest. */
    orderBy: [
      { order: { sort: "asc", nulls: "last" } },
      { endDate: { sort: "desc", nulls: "first" } },
      { startDate: "desc" },
    ],
  });

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Projects"
        description="Listed in the order the public site renders them."
        actions={
          <Link href="/admin/projects/new" className={buttonPrimary}>
            <span aria-hidden="true">+</span>
            New project
          </Link>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="The Projects section on the home page hides itself while this is empty, so nothing is broken — there is just nothing to show."
          action={
            <Link href="/admin/projects/new" className={buttonPrimary}>
              Add the first project
            </Link>
          }
        />
      ) : (
        <Panel
          title={`${rows.length} ${rows.length === 1 ? "project" : "projects"}`}
          flush
        >
          {/* A real table, scrolled sideways on narrow viewports rather than
              reflowed into cards. The row is a comparison — status against
              flags against order — and a stack of cards is exactly the shape
              that makes comparing two of them impossible. */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] border-collapse text-small">
              <thead>
                <tr className="border-b border-border text-left">
                  <Th className="w-[30%]">Project</Th>
                  <Th>Status</Th>
                  <Th>Dates</Th>
                  <Th>Contents</Th>
                  <Th>Flags</Th>
                  <Th>Order</Th>
                  <Th>Updated</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => {
                  const cover = row.images[0];

                  return (
                    <tr
                      key={row.id}
                      className="border-b border-border/60 align-middle last:border-b-0 hover:bg-surface/60"
                    >
                      <Td>
                        <div className="flex items-center gap-3">
                          {cover ? (
                            /* Plain `<img>`: a 40px admin thumbnail is not
                               worth an optimizer transform. */
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={cover.src}
                              alt=""
                              className="size-10 shrink-0 rounded border border-border object-cover"
                            />
                          ) : (
                            <span
                              aria-hidden="true"
                              className="flex size-10 shrink-0 items-center justify-center rounded border border-dashed border-border-strong text-muted/60"
                            >
                              —
                            </span>
                          )}

                          <span className="min-w-0">
                            <Link
                              href={`/admin/projects/${row.id}`}
                              className="block truncate font-medium text-foreground hover:text-link"
                            >
                              {row.title}
                            </Link>
                            <span className="block truncate font-mono text-label text-muted">
                              /{row.slug}
                            </span>
                          </span>
                        </div>
                      </Td>

                      <Td>
                        <Chip
                          tone={
                            row.status === "in-progress" ? "link" : "neutral"
                          }
                        >
                          {PROJECT_STATUS_LABELS[row.status as ProjectStatus] ??
                            row.status}
                        </Chip>
                      </Td>

                      <Td className="whitespace-nowrap text-muted">
                        {formatDateRange({
                          start: row.startDate,
                          end: row.endDate,
                        })}
                      </Td>

                      <Td className="whitespace-nowrap text-muted">
                        <span className="font-mono">{row._count.tech}</span> tech
                        {" · "}
                        <span
                          className={
                            row._count.images === 0
                              ? "font-mono text-warning"
                              : "font-mono"
                          }
                        >
                          {row._count.images}
                        </span>{" "}
                        {row._count.images === 1 ? "image" : "images"}
                      </Td>

                      <Td>
                        <span className="flex flex-wrap gap-1">
                          {row.featured ? (
                            <Chip tone="accent">Featured</Chip>
                          ) : null}
                          {row.includeInResume ? <Chip>On CV</Chip> : null}
                          {!row.featured && !row.includeInResume ? (
                            <span className="text-muted/60">—</span>
                          ) : null}
                        </span>
                      </Td>

                      <Td className="font-mono text-muted">
                        {row.order ?? "—"}
                      </Td>

                      <Td
                        className="whitespace-nowrap text-muted"
                        title={row.updatedAt.toISOString()}
                      >
                        {formatStamp(row.updatedAt)}
                      </Td>

                      <Td className="text-right">
                        <span className="inline-flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/projects/${row.id}`}
                            className={`${buttonGhost} h-8`}
                          >
                            Edit
                          </Link>
                          <ConfirmDelete
                            title="Delete project"
                            description={
                              <>
                                <strong className="text-foreground">
                                  {row.title}
                                </strong>{" "}
                                will be removed from the database, along with
                                its {row._count.images} image
                                {row._count.images === 1 ? "" : "s"} and{" "}
                                {row._count.tech} tech reference
                                {row._count.tech === 1 ? "" : "s"}, and will
                                disappear from the public site. Any of those
                                images uploaded here are also deleted from
                                Cloudinary. This cannot be undone.
                              </>
                            }
                            confirmLabel="Delete project"
                            action={deleteProject.bind(null, row.id)}
                            triggerIconOnly
                            triggerLabel={`Delete ${row.title}`}
                          />
                        </span>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={`label px-4 py-2.5 font-medium text-muted ${className ?? ""}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <td title={title} className={`px-4 py-3 ${className ?? ""}`}>
      {children}
    </td>
  );
}
