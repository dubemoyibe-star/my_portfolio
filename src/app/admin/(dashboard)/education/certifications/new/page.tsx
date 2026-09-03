import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/chrome";
import { emptyCertification } from "@/lib/admin/education-input";
import { isCloudinaryConfigured } from "@/lib/cloudinary";

import { CertificationForm } from "../../certification-form";

/**
 * The create screen for a certificate.
 *
 * `isCloudinaryConfigured()` is read here rather than inside the uploader
 * because the answer is in `process.env`, which the browser has no access to.
 * Passing it down means the drop zone can say "Cloudinary is not configured"
 * up front instead of failing on the first drop — and every other field on the
 * form still works, because the image is optional.
 */

export const metadata: Metadata = {
  title: "New certificate",
};

export default function NewCertificationPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        backHref="/admin/education"
        backLabel="Education"
        title="New certificate"
        description="Nothing is written until you press create. The image can wait — the card renders a typographic placeholder until one is added."
      />

      <CertificationForm
        mode="create"
        initial={emptyCertification()}
        cloudinaryConfigured={isCloudinaryConfigured()}
      />
    </div>
  );
}
