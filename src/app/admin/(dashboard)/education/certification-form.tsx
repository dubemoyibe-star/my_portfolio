"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  Banner,
  Panel,
  buttonGhost,
  buttonPrimary,
} from "@/components/admin/chrome";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { Field, TextArea, TextInput } from "@/components/admin/fields";
import { UploadDropzone } from "@/components/admin/image-upload";
import {
  describeField,
  validateCertification,
  type CertificationInput,
} from "@/lib/admin/education-input";
import type { FieldErrors } from "@/lib/admin/validation";
import { cn } from "@/lib/utils";

import {
  createCertification,
  deleteCertification,
  updateCertification,
} from "./actions";

/**
 * The certificate editor — one form, used for both create and edit.
 *
 * Same contract as the project and experience editors: controlled rather than
 * a `<form action={...}>`, validated on both sides with the same function, and
 * a single component for both modes so a field cannot be added to one and
 * forgotten in the other. See `../projects/project-form` for the long version.
 *
 * ## The image is one, and it is optional
 *
 * A project has an ordered list of images where the first is the cover, so it
 * gets `ImageListField` with its reorder controls. A certificate has one
 * picture of one certificate — there is nothing to order and nothing to choose
 * between — so this is a bare `UploadDropzone` with a preview beside it,
 * writing a single column.
 *
 * `Certification.imageUrl` is optional on the type, with a comment saying the
 * card falls back to a typographic placeholder rather than a broken frame. So
 * the field is genuinely allowed to be empty and the form says so, instead of
 * treating a missing scan as a blocked save.
 *
 * ## Why the URL is also editable by hand
 *
 * The seeded certificates point at `/public` paths — `/python.png` and the
 * rest — which are perfectly good sources and are not Cloudinary uploads. A
 * drop zone alone would make those uneditable without re-uploading files that
 * are already in the repository, so the raw value stays visible and typeable
 * and the uploader simply writes into it.
 */

type CertificationFormProps = {
  mode: "create" | "edit";
  /** Required in edit mode. */
  certificationId?: string;
  initial: CertificationInput;
  cloudinaryConfigured: boolean;
};

export function CertificationForm({
  mode,
  certificationId,
  initial,
  cloudinaryConfigured,
}: CertificationFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<CertificationInput>(initial);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function controlId(field: string): string {
    return `certification-${field}`;
  }

  function set<K extends keyof CertificationInput>(
    key: K,
    value: CertificationInput[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
    setSaved(null);
  }

  /** Put the operator in front of the first thing that is wrong. */
  function revealFirstError(errors: FieldErrors) {
    const [first] = Object.keys(errors);
    if (!first) return;
    requestAnimationFrame(() => {
      const target = document.getElementById(controlId(first));
      if (target) {
        target.focus({ preventScroll: true });
        target.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(null);

    const errors = validateCertification(values);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError(null);
      revealFirstError(errors);
      return;
    }

    setFieldErrors({});
    setFormError(null);

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createCertification(values)
          : await updateCertification(certificationId as string, values);

      if (!result.ok) {
        const serverErrors = result.fieldErrors ?? {};
        setFieldErrors(serverErrors);
        setFormError(result.formError ?? "The save did not go through.");
        revealFirstError(serverErrors);
        return;
      }

      if (mode === "create") {
        router.push("/admin/education");
        router.refresh();
        return;
      }

      setSaved(result.message ?? "Saved.");
      router.refresh();
    });
  }

  const invalidFields = Object.keys(fieldErrors);

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {formError ? <Banner tone="error">{formError}</Banner> : null}

      {invalidFields.length > 0 ? (
        <Banner tone="error">
          Check {[...new Set(invalidFields.map(describeField))].join(", ")}.
        </Banner>
      ) : null}

      {saved ? <Banner tone="success">{saved}</Banner> : null}

      {/* ---------------------------------------------------------------- */}
      <Panel title="The certificate" description="What the card shows.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Title"
            required
            htmlFor={controlId("title")}
            error={fieldErrors.title}
            hint="The course, as the certificate names it."
          >
            <TextInput
              id={controlId("title")}
              value={values.title}
              error={fieldErrors.title}
              hint="The course, as the certificate names it."
              onChange={(event) => set("title", event.target.value)}
              placeholder="Advanced React"
            />
          </Field>

          <Field
            label="Platform"
            required
            htmlFor={controlId("platform")}
            error={fieldErrors.platform}
            hint="The issuer, as a reader would name it."
          >
            <TextInput
              id={controlId("platform")}
              value={values.platform}
              error={fieldErrors.platform}
              hint="The issuer, as a reader would name it."
              onChange={(event) => set("platform", event.target.value)}
              placeholder="Scrimba"
            />
          </Field>

          <Field
            label="Date earned"
            required
            htmlFor={controlId("dateEarned")}
            error={fieldErrors.dateEarned}
            hint="YYYY-MM. The grid sorts on this, newest first."
          >
            {/* `type="month"` produces exactly the `YYYY-MM` the model stores,
                so a browser without the picker degrades to a text box in the
                right format rather than to a different one. */}
            <TextInput
              id={controlId("dateEarned")}
              type="month"
              mono
              value={values.dateEarned}
              error={fieldErrors.dateEarned}
              hint="YYYY-MM."
              onChange={(event) => set("dateEarned", event.target.value)}
            />
          </Field>

          <Field
            label="Credential URL"
            required
            htmlFor={controlId("credentialUrl")}
            error={fieldErrors.credentialUrl}
            hint="Where the credential can be verified. A certificate nobody can check is a claim."
          >
            <TextInput
              id={controlId("credentialUrl")}
              type="url"
              mono
              value={values.credentialUrl}
              error={fieldErrors.credentialUrl}
              hint="Where the credential can be verified."
              onChange={(event) => set("credentialUrl", event.target.value)}
              placeholder="https://scrimba.com/…"
            />
          </Field>

          <Field
            label="Description"
            htmlFor={controlId("description")}
            hint="Optional — one or two sentences on what the course covered. The card closes up without it."
            className="sm:col-span-2"
          >
            <TextArea
              id={controlId("description")}
              rows={4}
              value={values.description}
              hint="Optional — one or two sentences on what the course covered."
              onChange={(event) => set("description", event.target.value)}
            />
          </Field>
        </div>
      </Panel>

      {/* ---------------------------------------------------------------- */}
      <Panel
        title="Certificate image"
        description="Optional. Uploaded to Cloudinary. Replacing or removing it and saving deletes the old file, unless another record uses it."
      >
        <div className="flex flex-col gap-4 sm:flex-row">
          {values.imageUrl.trim().length > 0 ? (
            <div className="flex shrink-0 flex-col items-start gap-2">
              {/* A plain `<img>`, not `next/image`: this is an admin preview of
                  an image the operator uploaded seconds ago, and routing it
                  through the optimizer would spend a transform on something
                  nobody but them will see. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={values.imageUrl}
                alt=""
                className="h-32 w-48 rounded border border-border object-cover"
              />
              <button
                type="button"
                onClick={() => set("imageUrl", "")}
                className={cn(
                  buttonGhost,
                  "h-8 hover:border-warning/50 hover:text-warning",
                )}
              >
                Remove image
              </button>
            </div>
          ) : (
            <div className="flex h-32 w-48 shrink-0 items-center justify-center rounded border border-dashed border-border-strong text-small text-muted/70">
              No image
            </div>
          )}

          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <UploadDropzone
              kind="certifications"
              configured={cloudinaryConfigured}
              label="Drop the certificate here, or"
              onUploaded={(uploaded) => {
                const [image] = uploaded;
                if (image) set("imageUrl", image.src);
              }}
            />

            <Field
              label="Image URL"
              htmlFor={controlId("imageUrl")}
              error={fieldErrors.imageUrl}
              hint="Filled in by the upload above. Editable by hand for the certificates that live under /public."
            >
              <TextInput
                id={controlId("imageUrl")}
                mono
                value={values.imageUrl}
                error={fieldErrors.imageUrl}
                hint="Filled in by the upload above."
                onChange={(event) => set("imageUrl", event.target.value)}
                placeholder="/advanced_react.png"
              />
            </Field>

            {/* No alt-text field, and that is not an oversight: the card builds
                the alt from the title and the platform — "Advanced React
                certificate from Scrimba" — which is a better description than
                anything anyone would retype here, and cannot go stale when the
                title is corrected. */}
          </div>
        </div>
      </Panel>

      {/* ---------------------------------------------------------------- */}
      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background/90 px-1 py-3 backdrop-blur-sm">
        <div>
          {mode === "edit" && certificationId ? (
            <ConfirmDelete
              title="Delete certificate"
              description={
                <>
                  <strong className="text-foreground">
                    {initial.title || "This certificate"}
                  </strong>{" "}
                  will be removed from the database and will disappear from the
                  Education section. Its image, if it was uploaded here, is also
                  deleted from Cloudinary. This cannot be undone.
                </>
              }
              confirmLabel="Delete certificate"
              action={deleteCertification.bind(null, certificationId)}
              redirectTo="/admin/education"
            />
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/admin/education")}
            className={buttonGhost}
          >
            Cancel
          </button>
          <button type="submit" disabled={pending} className={buttonPrimary}>
            {pending
              ? "Saving…"
              : mode === "create"
                ? "Create certificate"
                : "Save changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
