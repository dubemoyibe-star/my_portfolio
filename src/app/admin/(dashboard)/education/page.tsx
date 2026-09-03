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
import { educationStatusLabel, toEducationInput } from "@/lib/admin/education-input";
import { formatStamp } from "@/lib/admin/format";
import { formatMonth } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import type { EducationStatus } from "@/types";

import { deleteCertification } from "./actions";
import { EducationForm } from "./education-form";
import { EducationSettingsForm } from "./education-settings-form";

/**
 * Education: the degree entries, the supporting note, and every certificate.
 *
 * One screen for three tables, because they are one section to read. The
 * Education block on the home page renders the entry, then the note, then the
 * certificate grid, and this page is laid out in that order so the edit
 * surface and the thing it edits have the same shape.
 *
 * ## The degree entry is edited in place
 *
 * There is one of it. A table row whose only job is to be clicked through to a
 * form would be a page load spent confirming the operator meant the only thing
 * on screen — so the entry *is* a form, rendered once per row. See the note at
 * the top of `./education-form`. `/admin/education/new` covers a second entry;
 * certificates keep their own routes because there are five of them and
 * growing, and an image uploader per row would be a page of drop zones.
 *
 * ## Why the note has its own save button
 *
 * It is a different table — `site_settings`, not `education`. One button
 * writing two tables is a button that can half-succeed, and "did the note
 * save?" is not a question a form should leave open.
 */

export const metadata: Metadata = {
  title: "Education",
};

export default async function AdminEducationPage() {
  const [entries, settings, certifications] = await Promise.all([
    /* `position` then `id`, the same tie-break `@/lib/data` reads them with —
       see the note on `BY_POSITION` there. */
    prisma.education.findMany({ orderBy: [{ position: "asc" }, { id: "asc" }] }),
    prisma.siteSettings.findUnique({ where: { id: "site" } }),
    prisma.certification.findMany({
      /* The grid on the public site sorts by `dateEarned` descending, and this
         list matches it. `position` is the tie-break that keeps two
         certificates earned in the same month from swapping places between
         deploys — the reason the column exists at all. */
      orderBy: [{ dateEarned: "desc" }, { position: "asc" }],
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Education"
        description="The degree entry, the supporting note under it, and every certificate. All three render in the Education section on the home page; the entry and the note also appear on the CV."
        actions={
          <Link
            href="/#education"
            target="_blank"
            rel="noreferrer"
            className="label text-muted transition-colors hover:text-foreground"
          >
            View on site ↗
          </Link>
        }
      />

      {/* ---------------------------------------------------------------- */}
      {entries.length === 0 ? (
        <EmptyState
          title="No education entry"
          description="The Education section still renders — the note and the certificates carry it — but there is no institution above them."
          action={
            <Link href="/admin/education/new" className={buttonPrimary}>
              Add an entry
            </Link>
          }
        />
      ) : (
        entries.map((entry) => (
          <Panel
            key={entry.id}
            title={entry.institution}
            description={
              <>
                <span className="font-mono">{entry.id}</span>
                {" · updated "}
                {formatStamp(entry.updatedAt)}
              </>
            }
            actions={
              <Chip
                tone={entry.status === "in-progress" ? "link" : "neutral"}
              >
                {educationStatusLabel(entry.status as EducationStatus)}
              </Chip>
            }
          >
            <EducationForm
              mode="edit"
              educationId={entry.id}
              initial={toEducationInput({
                id: entry.id,
                institution: entry.institution,
                fieldOfStudy: entry.fieldOfStudy,
                status: entry.status as EducationStatus,
                dates: { start: entry.startDate, end: entry.endDate },
              })}
            />
          </Panel>
        ))
      )}

      {entries.length > 0 ? (
        <div>
          <Link href="/admin/education/new" className={buttonGhost}>
            <span aria-hidden="true">+</span>
            Add another entry
          </Link>
        </div>
      ) : null}

      {/* ---------------------------------------------------------------- */}
      <Panel
        title="Supporting note"
        description="The paragraph under the entries, on the site and on the CV."
      >
        <EducationSettingsForm
          initial={{
            educationNote: settings?.educationNote ?? "",
            certificatesUrl: settings?.certificatesUrl ?? "",
          }}
        />
      </Panel>

      {/* ---------------------------------------------------------------- */}
      <Panel
        title={`${certifications.length} ${
          certifications.length === 1 ? "certificate" : "certificates"
        }`}
        description="Listed newest first, the order the grid renders them in."
        actions={
          <Link href="/admin/education/certifications/new" className={buttonPrimary}>
            <span aria-hidden="true">+</span>
            New certificate
          </Link>
        }
        flush
      >
        {certifications.length === 0 ? (
          <div className="p-4 sm:p-5">
            <EmptyState
              title="No certificates yet"
              description="The certificate grid hides itself while this is empty — the entry and the note still render."
              action={
                <Link
                  href="/admin/education/certifications/new"
                  className={buttonPrimary}
                >
                  Add the first certificate
                </Link>
              }
            />
          </div>
        ) : (
          /* A real table, scrolled sideways on narrow viewports rather than
             reflowed into cards. The row is a comparison — dates against
             issuers against which ones are missing a scan — and a stack of
             cards is exactly the shape that makes comparing two impossible. */
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] border-collapse text-small">
              <thead>
                <tr className="border-b border-border text-left">
                  <Th className="w-[38%]">Certificate</Th>
                  <Th>Platform</Th>
                  <Th>Earned</Th>
                  <Th>Updated</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>

              <tbody>
                {certifications.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border/60 align-middle last:border-b-0 hover:bg-surface/60"
                  >
                    <Td>
                      <div className="flex items-center gap-3">
                        {row.imageUrl ? (
                          /* Plain `<img>`: a 40px admin thumbnail is not worth
                             an optimizer transform. */
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={row.imageUrl}
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
                            href={`/admin/education/certifications/${row.id}`}
                            className="block truncate font-medium text-foreground hover:text-link"
                          >
                            {row.title}
                          </Link>
                          <span className="block truncate text-label text-muted">
                            {row.description
                              ? row.description
                              : "No description — the card closes up without one."}
                          </span>
                        </span>
                      </div>
                    </Td>

                    <Td className="whitespace-nowrap text-muted">
                      {row.platform}
                    </Td>

                    <Td className="whitespace-nowrap text-muted">
                      {formatMonth(row.dateEarned)}
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
                          href={`/admin/education/certifications/${row.id}`}
                          className={`${buttonGhost} h-8`}
                        >
                          Edit
                        </Link>
                        <ConfirmDelete
                          title="Delete certificate"
                          description={
                            <>
                              <strong className="text-foreground">
                                {row.title}
                              </strong>{" "}
                              will be removed from the database and will
                              disappear from the Education section. Its image,
                              if it was uploaded here, is also deleted from
                              Cloudinary. This cannot be undone.
                            </>
                          }
                          confirmLabel="Delete certificate"
                          action={deleteCertification.bind(null, row.id)}
                          triggerIconOnly
                          triggerLabel={`Delete ${row.title}`}
                        />
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
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
