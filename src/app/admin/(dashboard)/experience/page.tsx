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
import { formatDateRange, formatRoleMeta } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import type { EmploymentType, WorkMode } from "@/types";

import { deleteExperience } from "./actions";

/**
 * Every role, in the order the public site renders them.
 *
 * The sort is the same rule `getExperience()` applies — manual `order` first,
 * then recency — rather than "newest edited first". A list that disagrees with
 * the site about what comes first makes `order` impossible to reason about.
 *
 * Read through Prisma rather than through `getExperience()` because the list
 * needs three things the domain type does not carry: `updatedAt`, and the
 * counts of highlights and tech references. Those are admin concerns, and
 * pushing them onto `Experience` would put them on the wire for every public
 * render that has no use for them.
 *
 * ## The two columns that are not decoration
 *
 * `Content` counts highlights and tech, and calls out a zero rather than
 * printing it plainly. Not as an error — an empty role is explicitly allowed
 * here, see `@/lib/admin/experience-input` — but as the answer to the question
 * this screen exists to answer between one visit and the next: which of these
 * is still waiting to be written up. `On CV` is the other, because a role
 * missing from the CV is invisible in the document that matters most and there
 * is nothing on the CV itself to notice its absence from.
 */

export const metadata: Metadata = {
  title: "Experience",
};

export default async function AdminExperiencePage() {
  const rows = await prisma.experience.findMany({
    include: { _count: { select: { tech: true } } },
    /* Mirrors `getExperience()`: manual `order` wins, entries without one fall
       to the back, and ties break on recency. A current role has no `endDate`,
       and `nulls: "first"` is what makes "still there" sort as the most recent
       thing rather than the oldest. */
    orderBy: [
      { order: { sort: "asc", nulls: "last" } },
      { endDate: { sort: "desc", nulls: "first" } },
      { startDate: "desc" },
    ],
  });

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Experience"
        description="Employment history, listed in the order the public site renders it. A role can be saved with nothing but a company, a title and a start date — description, highlights and stack fill in as the work happens."
        actions={
          <Link href="/admin/experience/new" className={buttonPrimary}>
            <span aria-hidden="true">+</span>
            New role
          </Link>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No roles yet"
          description="The Experience section on the home page hides itself while this is empty, and the CV skips the heading entirely — so nothing is broken, there is just nothing to show."
          action={
            <Link href="/admin/experience/new" className={buttonPrimary}>
              Add the first role
            </Link>
          }
        />
      ) : (
        <Panel
          title={`${rows.length} ${rows.length === 1 ? "role" : "roles"}`}
          flush
        >
          {/* A real table, scrolled sideways on narrow viewports rather than
              reflowed into cards. The row is a comparison — dates against
              content against the CV flag — and a stack of cards is exactly the
              shape that makes comparing two of them impossible. */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] border-collapse text-small">
              <thead>
                <tr className="border-b border-border text-left">
                  <Th className="w-[34%]">Role</Th>
                  <Th>Dates</Th>
                  <Th>Where</Th>
                  <Th>Content</Th>
                  <Th>On CV</Th>
                  <Th>Order</Th>
                  <Th>Updated</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => {
                  const meta = formatRoleMeta({
                    location: row.location ?? undefined,
                    workMode: (row.workMode as WorkMode | null) ?? undefined,
                    employmentType:
                      (row.employmentType as EmploymentType | null) ?? undefined,
                  });

                  return (
                    <tr
                      key={row.id}
                      className="border-b border-border/60 align-middle last:border-b-0 hover:bg-surface/60"
                    >
                      <Td>
                        <Link
                          href={`/admin/experience/${row.id}`}
                          className="block truncate font-medium text-foreground hover:text-link"
                        >
                          {row.role}
                          <span className="text-muted"> · {row.company}</span>
                        </Link>
                        <span className="block truncate font-mono text-label text-muted">
                          {row.slug}
                        </span>
                      </Td>

                      <Td className="whitespace-nowrap text-muted">
                        {formatDateRange({
                          start: row.startDate,
                          end: row.endDate,
                        })}
                      </Td>

                      <Td className="text-muted">
                        {meta.length > 0 ? meta : <span className="text-muted/60">—</span>}
                      </Td>

                      <Td className="whitespace-nowrap text-muted">
                        <span
                          className={
                            row.highlights.length === 0
                              ? "font-mono text-muted/60"
                              : "font-mono"
                          }
                        >
                          {row.highlights.length}
                        </span>{" "}
                        {row.highlights.length === 1 ? "highlight" : "highlights"}
                        {" · "}
                        <span
                          className={
                            row._count.tech === 0
                              ? "font-mono text-muted/60"
                              : "font-mono"
                          }
                        >
                          {row._count.tech}
                        </span>{" "}
                        tech
                        {row.description.trim().length === 0 ? (
                          <span className="text-muted/60"> · no description</span>
                        ) : null}
                      </Td>

                      <Td>
                        {row.includeInResume ? (
                          <Chip tone="accent">On CV</Chip>
                        ) : (
                          <span className="text-muted/60">—</span>
                        )}
                      </Td>

                      <Td className="font-mono text-muted">{row.order ?? "—"}</Td>

                      <Td
                        className="whitespace-nowrap text-muted"
                        title={row.updatedAt.toISOString()}
                      >
                        {formatStamp(row.updatedAt)}
                      </Td>

                      <Td className="text-right">
                        <span className="inline-flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/experience/${row.id}`}
                            className={`${buttonGhost} h-8`}
                          >
                            Edit
                          </Link>
                          <ConfirmDelete
                            title="Delete role"
                            description={
                              <>
                                <strong className="text-foreground">
                                  {row.role} · {row.company}
                                </strong>{" "}
                                will be removed from the database, along with
                                its {row._count.tech} tech reference
                                {row._count.tech === 1 ? "" : "s"}, and will
                                disappear from the Experience section and the
                                CV. This cannot be undone.
                              </>
                            }
                            confirmLabel="Delete role"
                            action={deleteExperience.bind(null, row.id)}
                            triggerIconOnly
                            triggerLabel={`Delete ${row.role} at ${row.company}`}
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
