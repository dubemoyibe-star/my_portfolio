"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  Banner,
  Panel,
  buttonGhost,
  buttonPrimary,
} from "@/components/admin/chrome";
import { Field, TextArea, TextInput, Toggle } from "@/components/admin/fields";
import { UploadDropzone } from "@/components/admin/image-upload";
import {
  describeField,
  emptyAvatar,
  validateProfile,
  type AvatarInput,
  type ProfileInput,
} from "@/lib/admin/profile-input";
import type { FieldErrors } from "@/lib/admin/validation";
import { cn } from "@/lib/utils";

import { ContactLinkList } from "./contact-link-list";
import { saveProfile } from "./actions";

/**
 * The profile editor. One record, one form, one save.
 *
 * Every other section in this panel is a list with a create form and an edit
 * form. There is exactly one profile row — it is the person the site is about
 * — so there is no list to return to, no "create" mode, and no delete. The
 * form is the page.
 *
 * That removes the thing the other editors navigate away for, and it means
 * this form has to say what it changed rather than leaving a redirect to imply
 * it. Saving stays on the page, refreshes the server components underneath it,
 * and reports success in place.
 *
 * ## Validation happens twice, on purpose
 *
 * `validateProfile` runs here before the request, so an error appears next to
 * its field without a round trip. The action runs the identical function again
 * and its verdict decides whether anything is written — a server action is an
 * HTTP endpoint reachable by anything holding a session cookie, not only by
 * the form shipped alongside it.
 *
 * ## Why the form is controlled rather than a `<form action={...}>`
 *
 * The links are an ordered array of five-field rows, and the portraits carry
 * dimensions the uploader reports rather than anyone typing. Serialising those
 * through `FormData` and parsing them back would be a second encoding to keep
 * in sync with the first. Passing the typed object straight to the action
 * skips it. See `../projects/project-form` for the longer version.
 */

type ProfileFormProps = {
  initial: ProfileInput;
  cloudinaryConfigured: boolean;
  /**
   * Whether the row exists yet. False only on an unseeded database, where this
   * form's first save creates it — see the note on the upsert in `./actions`.
   */
  exists: boolean;
};

export function ProfileForm({
  initial,
  cloudinaryConfigured,
  exists,
}: ProfileFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<ProfileInput>(initial);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  /**
   * An error path to the id of the control that owns it.
   *
   * `links.2.href` becomes `profile-links-2-href` and `avatar.alt` becomes
   * `profile-avatar-alt`, which is exactly what the nested editors generate
   * from their `idPrefix`. One rule, applied in both directions, is what lets
   * the form move focus to a failing field it knows nothing else about.
   */
  function controlId(path: string): string {
    return `profile-${path.replace(/\./g, "-")}`;
  }

  function set<K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    /* Clearing the field's own error as it is edited, rather than waiting for
       the next submit — a stale "Required" under a filled-in field reads as
       the form being broken. Nested paths go with their owner: editing the
       links list drops `links.2.href`, not only `links`. */
    setFieldErrors((current) => {
      const prefix = `${String(key)}.`;
      const stale = Object.keys(current).filter(
        (path) => path === key || path.startsWith(prefix),
      );
      if (stale.length === 0) return current;
      const next = { ...current };
      for (const path of stale) delete next[path];
      return next;
    });
    setSaved(null);
  }

  /** Patch one portrait without disturbing the other. */
  function setAvatar(
    key: "avatar" | "avatarCompact",
    patch: Partial<AvatarInput>,
  ) {
    set(key, { ...values[key], ...patch });
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

    const errors = validateProfile(values);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError(null);
      revealFirstError(errors);
      return;
    }

    setFieldErrors({});
    setFormError(null);

    startTransition(async () => {
      const result = await saveProfile(values);

      if (!result.ok) {
        const serverErrors = result.fieldErrors ?? {};
        setFieldErrors(serverErrors);
        setFormError(result.formError ?? "The save did not go through.");
        revealFirstError(serverErrors);
        return;
      }

      setSaved(
        "Saved. The home page, the header and the CV are already serving this.",
      );
      /* Refreshes the server components on this page — the header's own
         portrait among them, since the admin chrome reads the same row. */
      router.refresh();
    });
  }

  const invalidFields = Object.keys(fieldErrors);

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {!exists ? (
        <Banner tone="error">
          There is no profile row in the database yet, so the public site cannot
          render. Filling this in and saving creates it — or run{" "}
          <code className="font-mono">npm run db:seed</code> to restore the
          committed baseline.
        </Banner>
      ) : null}

      {formError ? <Banner tone="error">{formError}</Banner> : null}

      {invalidFields.length > 0 ? (
        <Banner tone="error">
          Check {[...new Set(invalidFields.map(describeField))].join(", ")}.
        </Banner>
      ) : null}

      {saved ? <Banner tone="success">{saved}</Banner> : null}

      {/* ---------------------------------------------------------------- */}
      <Panel
        title="Identity"
        description="The name and the line under it, as the hero reads them."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Name"
            required
            htmlFor={controlId("name")}
            error={fieldErrors.name}
            hint="The heading on the home page, and the wordmark in the header."
          >
            <TextInput
              id={controlId("name")}
              value={values.name}
              error={fieldErrors.name}
              hint="The heading on the home page, and the wordmark in the header."
              onChange={(event) => set("name", event.target.value)}
              placeholder="Oyibe Chidubem"
            />
          </Field>

          <Field
            label="Location"
            htmlFor={controlId("location")}
            hint="Optional. Where you are, in the words you would use out loud."
          >
            <TextInput
              id={controlId("location")}
              value={values.location}
              hint="Optional."
              onChange={(event) => set("location", event.target.value)}
              placeholder="Nigeria"
            />
          </Field>

          <Field
            label="Tagline"
            required
            htmlFor={controlId("tagline")}
            error={fieldErrors.tagline}
            hint="The line directly under your name in the hero. Short, and in your own register."
            className="sm:col-span-2"
          >
            <TextArea
              id={controlId("tagline")}
              rows={2}
              value={values.tagline}
              error={fieldErrors.tagline}
              hint="The line directly under your name in the hero."
              onChange={(event) => set("tagline", event.target.value)}
              placeholder="Fullstack developer, blockchain developer…"
            />
          </Field>

          <Field
            label="Email"
            required
            htmlFor={controlId("email")}
            error={fieldErrors.email}
            hint="Public. Printed on the CV as a mailto link."
          >
            <TextInput
              id={controlId("email")}
              type="email"
              mono
              value={values.email}
              error={fieldErrors.email}
              hint="Public. Printed on the CV as a mailto link."
              onChange={(event) => set("email", event.target.value)}
              placeholder="you@example.com"
            />
          </Field>

          <div className="flex items-center">
            <Toggle
              label="Available for work"
              description="On: the hero shows an accent dot and the words “Available for work”, and llms.txt says so. Off: the line is not rendered at all."
              checked={values.availableForWork}
              onChange={(next) => set("availableForWork", next)}
            />
          </div>
        </div>
      </Panel>

      {/* ---------------------------------------------------------------- */}
      <Panel
        title="Bio"
        description="Two lengths of the same story. The short one is doing most of the work."
      >
        <div className="flex flex-col gap-4">
          <Field
            label="Short bio"
            required
            htmlFor={controlId("bioShort")}
            error={fieldErrors.bioShort}
            hint="One or two sentences. Rendered in the hero beside the accent rule, and used verbatim as the home page's meta description and the search-result snippet."
          >
            <TextArea
              id={controlId("bioShort")}
              rows={4}
              value={values.bioShort}
              error={fieldErrors.bioShort}
              hint="One or two sentences. Also the home page's meta description."
              onChange={(event) => set("bioShort", event.target.value)}
            />
          </Field>

          <Field
            label="Long bio"
            required
            htmlFor={controlId("bioLong")}
            error={fieldErrors.bioLong}
            hint="Markdown, paragraphs separated by a blank line. Held for the fuller about copy — no page renders it yet, so editing it changes nothing visible today."
          >
            <TextArea
              id={controlId("bioLong")}
              rows={10}
              value={values.bioLong}
              error={fieldErrors.bioLong}
              hint="Markdown, paragraphs separated by a blank line."
              onChange={(event) => set("bioLong", event.target.value)}
            />
          </Field>
        </div>
      </Panel>

      {/* ---------------------------------------------------------------- */}
      <Panel
        title="Portrait"
        description="Uploaded to Cloudinary. Replacing or removing one and saving deletes the old file, unless another record uses it."
      >
        <div className="flex flex-col gap-6">
          <AvatarField
            idPrefix={controlId("avatar")}
            title="Main portrait"
            note="Used in the hero from the lg breakpoint up, and everywhere if there is no compact crop. The hero frames it in a circle, so a centred subject survives the crop and an off-centre one does not."
            value={values.avatar}
            errors={fieldErrors}
            errorPrefix="avatar"
            cloudinaryConfigured={cloudinaryConfigured}
            onChange={(patch) => setAvatar("avatar", patch)}
            onClear={() => set("avatar", emptyAvatar())}
            placeholder="/profile.jpg"
          />

          <div className="border-t border-border pt-6">
            <AvatarField
              idPrefix={controlId("avatarCompact")}
              title="Compact portrait"
              note="Optional, and art direction rather than a resolution fallback: below lg — and at 28px in the header — a landscape crop leaves the face too small to read. Without one the main portrait is used at every width."
              value={values.avatarCompact}
              errors={fieldErrors}
              errorPrefix="avatarCompact"
              cloudinaryConfigured={cloudinaryConfigured}
              onChange={(patch) => setAvatar("avatarCompact", patch)}
              onClear={() => set("avatarCompact", emptyAvatar())}
              placeholder="/profile_small.jpeg"
            />
          </div>
        </div>
      </Panel>

      {/* ---------------------------------------------------------------- */}
      <Panel
        title="Contact links"
        description="The icon row in the hero, and the contact block on the CV. Rendered in the order below."
      >
        <ContactLinkList
          idPrefix="profile"
          values={values.links}
          onChange={(next) => set("links", next)}
          errors={fieldErrors}
        />
      </Panel>

      {/* ---------------------------------------------------------------- */}
      <Panel
        title="CV header"
        description="The formal register. None of this appears on the home page — the CV speaks differently about the same person."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="CV title"
            required
            htmlFor={controlId("resumeTitle")}
            error={fieldErrors.resumeTitle}
            hint="The formal title under your name on the CV, in place of the tagline."
            className="sm:col-span-2"
          >
            <TextInput
              id={controlId("resumeTitle")}
              value={values.resumeTitle}
              error={fieldErrors.resumeTitle}
              hint="The formal title under your name on the CV."
              onChange={(event) => set("resumeTitle", event.target.value)}
              placeholder="Fullstack web developer and blockchain developer"
            />
          </Field>

          <Field
            label="CV summary"
            required
            htmlFor={controlId("resumeSummary")}
            error={fieldErrors.resumeSummary}
            hint="The professional summary paragraph. Also the CV page's meta description, and the opening line of llms.txt."
            className="sm:col-span-2"
          >
            <TextArea
              id={controlId("resumeSummary")}
              rows={5}
              value={values.resumeSummary}
              error={fieldErrors.resumeSummary}
              hint="The professional summary paragraph on the CV."
              onChange={(event) => set("resumeSummary", event.target.value)}
            />
          </Field>

          <Field
            label="CV location"
            htmlFor={controlId("resumeLocation")}
            hint="Optional. The city/country line in the CV header."
          >
            <TextInput
              id={controlId("resumeLocation")}
              value={values.resumeLocation}
              hint="Optional. The city/country line in the CV header."
              onChange={(event) => set("resumeLocation", event.target.value)}
              placeholder="Nigeria"
            />
          </Field>

          <Field
            label="CV phone"
            htmlFor={controlId("resumePhone")}
            hint="Optional, and CV-only — no public page renders it."
          >
            <TextInput
              id={controlId("resumePhone")}
              type="tel"
              mono
              value={values.resumePhone}
              hint="Optional, and CV-only — no public page renders it."
              onChange={(event) => set("resumePhone", event.target.value)}
              placeholder="+234 702 613 7565"
            />
          </Field>

          <Field
            label="Download filename"
            required
            htmlFor={controlId("resumeFileName")}
            error={fieldErrors.resumeFileName}
            hint="What the downloaded PDF is called. No extension — the download adds .pdf."
          >
            <TextInput
              id={controlId("resumeFileName")}
              mono
              value={values.resumeFileName}
              error={fieldErrors.resumeFileName}
              hint="No extension — the download adds .pdf."
              onChange={(event) => set("resumeFileName", event.target.value)}
              placeholder="oyibe-chidubem-cv"
            />
          </Field>

          <Field
            label="Last reviewed"
            required
            htmlFor={controlId("resumeUpdatedAt")}
            error={fieldErrors.resumeUpdatedAt}
            hint="YYYY-MM-DD. When the CV content was last checked over — not when this row was saved."
          >
            {/* `type="date"` produces exactly the `YYYY-MM-DD` the model
                stores, so a browser without the picker degrades to a text box
                in the right format rather than to a different one. */}
            <TextInput
              id={controlId("resumeUpdatedAt")}
              type="date"
              mono
              value={values.resumeUpdatedAt}
              error={fieldErrors.resumeUpdatedAt}
              hint="YYYY-MM-DD."
              onChange={(event) => set("resumeUpdatedAt", event.target.value)}
            />
          </Field>
        </div>
      </Panel>

      {/* ---------------------------------------------------------------- */}
      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background/90 px-1 py-3 backdrop-blur-sm">
        {/* No delete, and no cancel-to-a-list: there is one profile and this
            page is where it lives. Discarding is a reload. */}
        <p className="text-small text-muted">
          Saved changes appear on the home page and the CV immediately.
        </p>

        <button type="submit" disabled={pending} className={buttonPrimary}>
          {pending ? "Saving…" : "Save profile"}
        </button>
      </div>
    </form>
  );
}

/* ==========================================================================
   Portrait
   ========================================================================== */

type AvatarFieldProps = {
  /** Already `profile-avatar` or `profile-avatarCompact`. */
  idPrefix: string;
  title: string;
  note: string;
  value: AvatarInput;
  errors: FieldErrors;
  /** `avatar` or `avatarCompact` — the root of this portrait's error paths. */
  errorPrefix: "avatar" | "avatarCompact";
  cloudinaryConfigured: boolean;
  onChange: (patch: Partial<AvatarInput>) => void;
  onClear: () => void;
  placeholder: string;
};

/**
 * One portrait: preview, drop zone, and the three fields that describe it.
 *
 * Both portraits are the same editor rather than two spellings of one, for the
 * same reason the create and edit forms elsewhere are one component — a field
 * added to one and forgotten in the other is invisible until someone notices a
 * value that will not save.
 *
 * ## The source stays typeable
 *
 * The seeded portraits are `/public` paths, not uploads. A drop zone alone
 * would make them uneditable without re-uploading files that are already in
 * the repository, so the raw value stays visible and the uploader writes into
 * it.
 *
 * ## Dimensions are shown, not edited
 *
 * `width` and `height` are what the uploader read off the file. They let
 * `next/image` reserve space and avoid layout shift, and a hand-typed pair
 * that disagrees with the actual image reintroduces exactly the shift they
 * exist to prevent. A hand-typed `/public` path has none, which the site
 * handles with per-call fallbacks — so this reports what it knows and offers
 * nothing to get wrong.
 */
function AvatarField({
  idPrefix,
  title,
  note,
  value,
  errors,
  errorPrefix,
  cloudinaryConfigured,
  onChange,
  onClear,
  placeholder,
}: AvatarFieldProps) {
  const srcError = errors[`${errorPrefix}.src`];
  const altError = errors[`${errorPrefix}.alt`];
  const present = value.src.trim().length > 0;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-small font-medium text-foreground">{title}</h3>
        <p className="mt-0.5 max-w-prose-page text-small text-muted">{note}</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex shrink-0 flex-col items-start gap-2">
          {present ? (
            <>
              {/* A plain `<img>`, not `next/image`: this is a 128px admin
                  preview of an image the operator uploaded seconds ago, and
                  routing it through the optimizer would spend a transform on
                  something nobody but them will see. Circular, because that is
                  the shape the hero crops it to — a square preview of an image
                  that will be masked to a circle hides the crop. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value.src}
                alt=""
                className="size-32 rounded-full border border-border object-cover"
              />
              <button
                type="button"
                onClick={onClear}
                className={cn(
                  buttonGhost,
                  "h-8 hover:border-warning/50 hover:text-warning",
                )}
              >
                Remove
              </button>
            </>
          ) : (
            <div className="flex size-32 items-center justify-center rounded-full border border-dashed border-border-strong text-small text-muted/70">
              None
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <UploadDropzone
            kind="profile"
            configured={cloudinaryConfigured}
            label="Drop a portrait here, or"
            onUploaded={(uploaded) => {
              const [image] = uploaded;
              if (!image) return;
              /* Dimensions travel with the source in one patch — a `src` that
                 lands a render before its `height` is a portrait the site
                 would size from the previous image. */
              onChange({
                src: image.src,
                width: image.width,
                height: image.height,
              });
            }}
          />

          <Field
            label="Image URL"
            htmlFor={`${idPrefix}-src`}
            error={srcError}
            hint="Filled in by the upload above. Editable by hand for the portraits that live under /public."
          >
            <TextInput
              id={`${idPrefix}-src`}
              mono
              value={value.src}
              error={srcError}
              hint="Filled in by the upload above."
              onChange={(event) =>
                /* Typed by hand, so whatever dimensions came from a previous
                   upload no longer describe this file. Dropped rather than
                   left to be applied to a different image. */
                onChange({
                  src: event.target.value,
                  width: undefined,
                  height: undefined,
                })
              }
              placeholder={placeholder}
            />
          </Field>

          <Field
            label="Alt text"
            required={present}
            htmlFor={`${idPrefix}-alt`}
            error={altError}
            hint="What the portrait shows, for anyone who cannot see it. The header deliberately renders it silently — your name is right beside it there."
          >
            <TextInput
              id={`${idPrefix}-alt`}
              value={value.alt}
              error={altError}
              hint="What the portrait shows, for anyone who cannot see it."
              onChange={(event) => onChange({ alt: event.target.value })}
              placeholder="Portrait of Oyibe Chidubem"
            />
          </Field>

          <Field
            label="Caption"
            htmlFor={`${idPrefix}-caption`}
            hint="Optional. Stored with the image; no page renders a portrait caption today."
          >
            <TextInput
              id={`${idPrefix}-caption`}
              value={value.caption}
              hint="Optional."
              onChange={(event) => onChange({ caption: event.target.value })}
            />
          </Field>

          <p className="label text-muted/80">
            {value.width && value.height
              ? `${value.width}×${value.height}`
              : "dimensions unknown — next/image falls back to its own defaults"}
          </p>
        </div>
      </div>
    </div>
  );
}
