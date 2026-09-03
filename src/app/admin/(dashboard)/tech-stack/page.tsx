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
import { Icon, hasIcon } from "@/components/ui/icon";
import { formatStamp } from "@/lib/admin/format";
import {
  categoryLabel,
  proficiencyLabel,
} from "@/lib/admin/tech-input";
import { prisma } from "@/lib/prisma";
import { TECH_GROUPS } from "@/lib/tech-groups";
import { cn } from "@/lib/utils";

import { deleteTech } from "./actions";

/**
 * The tech vocabulary, grouped the way the public site groups it.
 *
 * ## Why this page ships no JavaScript of its own
 *
 * Contributions needed a client component because reordering has to move a row
 * before the server answers. Nothing here is ordered by hand: the Stack section
 * and the CV both sort alphabetically inside a display group, so there are no
 * arrows to press and no optimistic state to hold. The only interactive thing
 * on the screen is the delete dialog, which is already a client component of
 * its own. So this stays HTML.
 *
 * ## Why the headings are `TECH_GROUPS` and not `TECH_CATEGORIES`
 *
 * The schema has eight categories and the site renders six headings — see
 * `@/lib/tech-groups` for why `framework` and `library` are separate to author
 * and merged to read. Grouping the editor by the display headings means what is
 * on this screen is laid out the way the section it edits will be, so "why is
 * Tailwind under Frameworks" is answered by looking rather than by asking.
 *
 * `Ungrouped` exists for the case `groupTech` silently swallows: a category
 * added to `TECH_CATEGORIES` and not to `TECH_GROUPS` disappears from the
 * public site, which is a bug worth seeing rather than a row worth hiding. On
 * the public site dropping it is right — a reader cannot act on it. Here it is
 * the whole point.
 *
 * ## The icon column is a rendered icon, not a slug
 *
 * A slug in a table is a string that looks fine when it is wrong. The actual
 * mark, drawn by the same component the Stack section uses, is the only version
 * of this column where a broken icon looks broken. Rows whose slug the registry
 * cannot draw are called out, and counted in the panel header, so the answer to
 * "is anything rendering as an empty square" is on screen rather than something
 * to go and check.
 */

export const metadata: Metadata = {
  title: "Tech stack",
};

export default async function AdminTechStackPage() {
  const rows = await prisma.techStackItem.findMany({
    include: { _count: { select: { projects: true, experiences: true } } },
    /* Alphabetical, because that is how every group renders. `position` is
       read by the project editor's tech picker and is not surfaced here — see
       the note in `./actions`. */
    orderBy: { name: "asc" },
  });

  const items = rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    icon: row.icon,
    proficiency: row.proficiency,
    featured: row.featured,
    references: row._count.projects + row._count.experiences,
    updatedAt: formatStamp(row.updatedAt),
  }));

  type Item = (typeof items)[number];

  const groups: { label: string; items: Item[] }[] = TECH_GROUPS.map(
    (group) => ({
      label: group.label,
      items: items.filter((item) =>
        (group.categories as readonly string[]).includes(item.category),
      ),
    }),
  ).filter((group) => group.items.length > 0);

  const grouped = new Set(groups.flatMap((group) => group.items.map((i) => i.id)));
  const ungrouped = items.filter((item) => !grouped.has(item.id));
  if (ungrouped.length > 0) {
    groups.push({ label: "Ungrouped — not rendered on the site", items: ungrouped });
  }

  const missingIcons = items.filter((item) => !hasIcon(item.icon)).length;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Tech stack"
        description="The vocabulary every project and role references. Grouped here the way the Stack section groups it, and alphabetical inside each group, which is the order it renders in."
        actions={
          <Link href="/admin/tech-stack/new" className={buttonPrimary}>
            <span aria-hidden="true">+</span>
            New tech item
          </Link>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          title="No tech items yet"
          description="The Stack section hides itself while this is empty, and no project can list any tech until something is here."
          action={
            <Link href="/admin/tech-stack/new" className={buttonPrimary}>
              Add the first tech item
            </Link>
          }
        />
      ) : (
        <>
          {missingIcons > 0 ? (
            <p className="rounded-md border border-warning/30 bg-warning-subtle px-3 py-2.5 text-small text-warning">
              {missingIcons} {missingIcons === 1 ? "item has" : "items have"} an
              icon slug this site cannot draw, marked below.{" "}
              {missingIcons === 1 ? "It renders" : "They render"} as a neutral
              placeholder rather than breaking the page — open{" "}
              {missingIcons === 1 ? "it" : "one"} to see whether the slug is a
              typo or a brand that is simply not bundled.
            </p>
          ) : null}

          {groups.map((group) => (
            <Panel
              key={group.label}
              title={group.label}
              description={`${group.items.length} ${group.items.length === 1 ? "item" : "items"}`}
              flush
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[52rem] border-collapse text-small">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <Th className="w-12">Icon</Th>
                      <Th className="w-[28%]">Name</Th>
                      <Th>Category</Th>
                      <Th>Proficiency</Th>
                      <Th>Used by</Th>
                      <Th>Flags</Th>
                      <Th>Updated</Th>
                      <Th className="text-right">Actions</Th>
                    </tr>
                  </thead>

                  <tbody>
                    {group.items.map((item) => {
                      const draws = hasIcon(item.icon);

                      return (
                        <tr
                          key={item.id}
                          className="border-b border-border/60 align-middle last:border-b-0 hover:bg-surface/60"
                        >
                          <Td>
                            <span
                              className={cn(
                                "flex size-8 items-center justify-center rounded-md border bg-surface",
                                draws
                                  ? "border-border text-foreground"
                                  : "border-dashed border-border-strong text-muted",
                              )}
                              /* The slug is the tooltip rather than a column of
                                 its own: it is the thing you need only when the
                                 icon beside it looks wrong. */
                              title={item.icon ?? "No icon slug"}
                            >
                              <Icon
                                name={item.icon ?? undefined}
                                brand
                                fallback
                                className="size-4.5"
                              />
                            </span>
                          </Td>

                          <Td>
                            <Link
                              href={`/admin/tech-stack/${item.id}`}
                              className="block truncate font-medium text-foreground hover:text-link"
                            >
                              {item.name}
                            </Link>
                            <span className="block truncate font-mono text-label text-muted">
                              {item.id}
                            </span>
                          </Td>

                          <Td className="whitespace-nowrap text-muted">
                            {categoryLabel(item.category)}
                          </Td>

                          <Td className="whitespace-nowrap text-muted">
                            {item.proficiency ? (
                              proficiencyLabel(item.proficiency)
                            ) : (
                              <span className="text-muted/60">Not rated</span>
                            )}
                          </Td>

                          <Td className="whitespace-nowrap text-muted">
                            <span className="font-mono">{item.references}</span>{" "}
                            {item.references === 1 ? "record" : "records"}
                          </Td>

                          <Td>
                            <span className="flex flex-wrap gap-1">
                              {item.featured ? (
                                <Chip tone="accent">Featured</Chip>
                              ) : null}
                              {draws ? null : (
                                <Chip tone="warning">No icon</Chip>
                              )}
                              {!item.featured && draws ? (
                                <span className="text-muted/60">—</span>
                              ) : null}
                            </span>
                          </Td>

                          <Td className="whitespace-nowrap text-muted">
                            {item.updatedAt}
                          </Td>

                          <Td className="text-right">
                            <span className="inline-flex items-center justify-end gap-1.5">
                              <Link
                                href={`/admin/tech-stack/${item.id}`}
                                className={cn(buttonGhost, "h-8")}
                              >
                                Edit
                              </Link>
                              <ConfirmDelete
                                title="Delete tech item"
                                description={
                                  item.references > 0 ? (
                                    <>
                                      <strong className="text-foreground">
                                        {item.name}
                                      </strong>{" "}
                                      is referenced by {item.references}{" "}
                                      {item.references === 1
                                        ? "record"
                                        : "records"}
                                      , so this will be refused — the database
                                      will not let a project point at nothing.
                                      Remove it from{" "}
                                      {item.references === 1
                                        ? "that record"
                                        : "those records"}{" "}
                                      first.
                                    </>
                                  ) : (
                                    <>
                                      <strong className="text-foreground">
                                        {item.name}
                                      </strong>{" "}
                                      will be removed from the database and will
                                      disappear from the Stack section and the
                                      CV skills block. This cannot be undone.
                                    </>
                                  )
                                }
                                confirmLabel="Delete tech item"
                                action={deleteTech.bind(null, item.id)}
                                triggerIconOnly
                                triggerLabel={`Delete ${item.name}`}
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
          ))}
        </>
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
      className={cn("label px-4 py-2.5 font-medium text-muted", className)}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={cn("px-4 py-3", className)}>{children}</td>;
}
