import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/chrome";
import { toCertificationInput } from "@/lib/admin/education-input";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { getCertifications } from "@/lib/data";
import { formatMonth } from "@/lib/format";

import { CertificationForm } from "../../certification-form";

/**
 * The edit screen for one certificate, keyed by `id`.
 *
 * `Certification` has no slug — the id is the only key it has — so unlike the
 * project and experience editors there is no rename to survive here.
 *
 * `/admin/education/certifications/new` and `.../[id]` are siblings, and Next
 * resolves the static segment first, so "new" can never be read as an id.
 *
 * Read through `getCertifications()` rather than straight from Prisma so the
 * editor is populated by exactly the translation the public site renders from.
 * A single `findUnique` would be one query rather than a table scan of five
 * rows, and would also be the place the two could quietly disagree about what
 * a nullable column means.
 */

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const entry = (await getCertifications()).find((row) => row.id === id);
  return { title: entry ? entry.title : "Certificate" };
}

export default async function EditCertificationPage({ params }: PageProps) {
  const { id } = await params;

  const entry = (await getCertifications()).find((row) => row.id === id);
  if (!entry) notFound();

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        backHref="/admin/education"
        backLabel="Education"
        title={entry.title}
        description={
          <>
            <span className="font-mono">{entry.id}</span>
            {` · ${entry.platform} · earned ${formatMonth(entry.dateEarned)}`}
          </>
        }
        actions={
          <>
            <Link
              href={entry.credentialUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="label text-muted transition-colors hover:text-foreground"
            >
              Verify ↗
            </Link>
            <Link
              href="/#education"
              target="_blank"
              rel="noreferrer"
              className="label text-muted transition-colors hover:text-foreground"
            >
              View on site ↗
            </Link>
          </>
        }
      />

      <CertificationForm
        mode="edit"
        certificationId={entry.id}
        initial={toCertificationInput(entry)}
        cloudinaryConfigured={isCloudinaryConfigured()}
      />
    </div>
  );
}
