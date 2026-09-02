"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import {
  Banner,
  Panel,
  buttonGhost,
  buttonPrimary,
} from "@/components/admin/chrome";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import {
  Field,
  SelectInput,
  TextArea,
  TextInput,
  Toggle,
} from "@/components/admin/fields";
import { ImageListField } from "@/components/admin/image-upload";
import { StringListField } from "@/components/admin/string-list";
import { TechPicker, type TechOption } from "@/components/admin/tech-picker";
import {
  PROJECT_STATUS_OPTIONS,
  describeField,
  validateProject,
  type ProjectInput,
} from "@/lib/admin/project-input";
import { slugify, type FieldErrors } from "@/lib/admin/validation";
import { cn } from "@/lib/utils";

import { createProject, deleteProject, updateProject } from "./actions";

/**
 * The project editor — one form, used for both create and edit.
 *
 * Two forms would drift: a field added to one and forgotten in the other is
 * the most common bug in a CRUD panel, and it is invisible until someone
 * notices a value that will not save on the edit screen. The only differences
 * between the modes are the action called, whether the slug tracks the title,
 * and whether there is anything to delete — all three small enough to be a
 * conditional rather than a second file.
 *
 * ## Validation happens twice, on purpose
 *
 * `validateProject` runs here before the request, so an error appears next to
 * its field instantly and without a round trip. The action runs the identical
 * function again and its verdict is the one that decides whether anything is
 * written — see the note at the top of `./actions`. Server-returned errors are
 * merged into the same state, so a message from either side renders the same
 * way.
 *
 * ## Why the form is controlled rather than a `<form action={...}>`
 *
 * Half of this record is not expressible as form fields: an ordered array of
 * images, each with its own alt text and dimensions; an ordered array of tech
 * ids; a list of highlights. Serialising those through `FormData` and parsing
 * them back would be a second encoding to keep in sync with the first. Passing
 * the typed object straight to the action skips it entirely. The cost is that
 * the form needs JavaScript — which, for an authenticated single-operator tool
 * behind a session cookie, it already did.
 */

type ProjectFormProps = {
  mode: "create" | "edit";
  /** Required in edit mode. */
  projectId?: string;
  initial: ProjectInput;
  techOptions: TechOption[];
  cloudinaryConfigured: boolean;
};

export function ProjectForm({
  mode,
  projectId,
  initial,
  techOptions,
  cloudinaryConfigured,
}: ProjectFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<ProjectInput>(initial);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  /**
   * Whether the slug has been taken over by hand.
   *
   * Seeded true when editing, because an existing slug is a live URL: silently
   * rewriting it because someone fixed a typo in the title would break every
   * link to that project. On a new project there is no URL to break, so the
   * slug follows the title until it is touched.
   */
  const [slugEdited, setSlugEdited] = useState(mode === "edit");

  const knownTechIds = useMemo(
    () => new Set(techOptions.map((option) => option.id)),
    [techOptions],
  );

  function set<K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    /* Clearing the field's own error as it is edited, rather than waiting for
       the next submit. Leaving a stale "Required" under a field someone has
       just filled in reads as the form being broken. */
    setFieldErrors((current) => {
      /* Also clears the nested paths a collection field owns — editing the
         images list should drop `images.2.alt`, not only `images`. */
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

  function setTitle(title: string) {
    setValues((current) => ({
      ...current,
      title,
      slug: slugEdited ? current.slug : slugify(title),
    }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.title;
      if (!slugEdited) delete next.slug;
      return next;
    });
    setSaved(null);
  }

  /**
   * Put the operator in front of the first thing that is wrong.
   *
   * A nineteen-field form across seven panels can easily push a failed field
   * off-screen, and a banner that says "some fields need attention" without
   * moving anywhere is a scavenger hunt. Focus rather than scroll, so the
   * message is also announced.
   */
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

    const errors = validateProject(values, { knownTechIds });
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
          ? await createProject(values)
          : await updateProject(projectId as string, values);

      if (!result.ok) {
        const serverErrors = result.fieldErrors ?? {};
        setFieldErrors(serverErrors);
        setFormError(result.formError ?? "The save did not go through.");
        revealFirstError(serverErrors);
        return;
      }

      if (mode === "create") {
        router.push("/admin/projects");
        router.refresh();
        return;
      }

      setSaved(result.message ?? "Saved.");
      /* The list behind this page, the dashboard's counts and this page's own
         server render all read from the database. `revalidatePath` in the
         action drops the public site's cache; this drops the client router's. */
      router.refresh();
    });
  }

  /** Ids are `project-<field>`, so `revealFirstError` can find any of them. */
  function controlId(field: string): string {
    return `project-${field.replaceAll(".", "-")}`;
  }

  const invalidFields = Object.keys(fieldErrors);

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {formError ? <Banner tone="error">{formError}</Banner> : null}

      {invalidFields.length > 0 ? (
        <Banner tone="error">
          Check{" "}
          {/* De-duplicated: four bad image rows are one "Images" to look at,
              not four. */}
          {[...new Set(invalidFields.map(describeField))].join(", ")}.
        </Banner>
      ) : null}

      {saved ? <Banner tone="success">{saved}</Banner> : null}

      {/* ---------------------------------------------------------------- */}
      <Panel title="Overview" description="What the card and the list show.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Title"
            required
            htmlFor={controlId("title")}
            error={fieldErrors.title}
            className="sm:col-span-2"
          >
            <TextInput
              id={controlId("title")}
              value={values.title}
              error={fieldErrors.title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Stenion"
            />
          </Field>

          <Field
            label="Slug"
            required
            htmlFor={controlId("slug")}
            error={fieldErrors.slug}
            hint={
              slugEdited
                ? "The URL segment. Changing it breaks existing links."
                : "Following the title. Type here to take it over."
            }
            className="sm:col-span-2"
          >
            <div className="flex gap-2">
              <TextInput
                id={controlId("slug")}
                mono
                value={values.slug}
                error={fieldErrors.slug}
                onChange={(event) => {
                  setSlugEdited(true);
                  set("slug", event.target.value);
                }}
                placeholder="stenion"
              />
              <button
                type="button"
                onClick={() => {
                  setSlugEdited(false);
                  set("slug", slugify(values.title));
                }}
                className={cn(buttonGhost, "shrink-0")}
              >
                From title
              </button>
            </div>
          </Field>

          <Field
            label="Summary"
            required
            htmlFor={controlId("summary")}
            error={fieldErrors.summary}
            hint="One line for cards and list views. Aim for under 140 characters."
            className="sm:col-span-2"
          >
            <TextArea
              id={controlId("summary")}
              rows={2}
              value={values.summary}
              error={fieldErrors.summary}
              hint="One line for cards and list views. Aim for under 140 characters."
              onChange={(event) => set("summary", event.target.value)}
            />
            {/* Turns amber past the guidance rather than blocking at it — see
                SUMMARY_LIMIT in project-input.ts for where the hard stop is. */}
            <span
              className={cn(
                "label self-end",
                values.summary.length > 140 ? "text-warning" : "text-muted/70",
              )}
            >
              {values.summary.length} / 140
            </span>
          </Field>

          <Field
            label="Role"
            required
            htmlFor={controlId("role")}
            error={fieldErrors.role}
            hint="What you did: “Solo build”, “Tech lead”."
          >
            <TextInput
              id={controlId("role")}
              value={values.role}
              error={fieldErrors.role}
              hint="What you did."
              onChange={(event) => set("role", event.target.value)}
              placeholder="Solo build"
            />
          </Field>

          <Field
            label="Client"
            htmlFor={controlId("client")}
            hint="Only if the project was not personal."
          >
            <TextInput
              id={controlId("client")}
              value={values.client}
              hint="Only if the project was not personal."
              onChange={(event) => set("client", event.target.value)}
            />
          </Field>

          <Field
            label="Status"
            required
            htmlFor={controlId("status")}
            error={fieldErrors.status}
          >
            <SelectInput
              id={controlId("status")}
              options={PROJECT_STATUS_OPTIONS}
              value={values.status}
              error={fieldErrors.status}
              onChange={(event) => set("status", event.target.value)}
            />
          </Field>

          <Field
            label="Order"
            htmlFor={controlId("order")}
            error={fieldErrors.order}
            hint="Lower sorts first. Empty falls back to recency."
          >
            <TextInput
              id={controlId("order")}
              mono
              inputMode="numeric"
              value={values.order}
              error={fieldErrors.order}
              hint="Lower sorts first. Empty falls back to recency."
              onChange={(event) => set("order", event.target.value)}
              placeholder="1"
            />
          </Field>

          <Field
            label="Start"
            required
            htmlFor={controlId("startDate")}
            error={fieldErrors.startDate}
            hint="YYYY-MM"
          >
            {/* `type="month"` produces exactly the `YYYY-MM` the model stores,
                so a browser without the picker degrades to a text box in the
                right format rather than to a different one. */}
            <TextInput
              id={controlId("startDate")}
              type="month"
              mono
              value={values.startDate}
              error={fieldErrors.startDate}
              hint="YYYY-MM"
              onChange={(event) => set("startDate", event.target.value)}
            />
          </Field>

          <Field
            label="End"
            htmlFor={controlId("endDate")}
            error={fieldErrors.endDate}
            hint="Leave empty while it is ongoing."
          >
            <TextInput
              id={controlId("endDate")}
              type="month"
              mono
              value={values.endDate}
              error={fieldErrors.endDate}
              hint="Leave empty while it is ongoing."
              onChange={(event) => set("endDate", event.target.value)}
            />
          </Field>
        </div>
      </Panel>

      {/* ---------------------------------------------------------------- */}
      <Panel
        title="Description"
        description="Long form, Markdown. Highlights are the scannable version the CV uses."
      >
        <div className="flex flex-col gap-5">
          <Field
            label="Description"
            required
            htmlFor={controlId("description")}
            error={fieldErrors.description}
          >
            <TextArea
              id={controlId("description")}
              rows={8}
              value={values.description}
              error={fieldErrors.description}
              onChange={(event) => set("description", event.target.value)}
            />
          </Field>

          <div className="flex flex-col gap-1.5">
            <span className="label text-muted">Highlights</span>
            <p className="text-small text-muted">
              Outcome-shaped bullets, strongest first. Numbers where they exist.
            </p>
            <div className="mt-1">
              <StringListField
                name="Highlight"
                values={values.highlights}
                onChange={(next) => set("highlights", next)}
                compact={false}
                addLabel="Add highlight"
                emptyLabel="No highlights. The description carries the project on the site; the CV prefers these."
                placeholder="Cut median audit turnaround from 6 days to under 1."
              />
            </div>
          </div>
        </div>
      </Panel>

      {/* ---------------------------------------------------------------- */}
      <Panel
        title="Tech stack"
        description="References into the tech registry. Order is what the card renders."
      >
        <TechPicker
          options={techOptions}
          selected={values.tech}
          onChange={(next) => set("tech", next)}
          errors={fieldErrors}
        />
      </Panel>

      {/* ---------------------------------------------------------------- */}
      <Panel title="Links" description="All optional. All must be absolute URLs.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Repository"
            htmlFor={controlId("linksRepo")}
            error={fieldErrors.linksRepo}
          >
            <TextInput
              id={controlId("linksRepo")}
              type="url"
              mono
              value={values.linksRepo}
              error={fieldErrors.linksRepo}
              onChange={(event) => set("linksRepo", event.target.value)}
              placeholder="https://github.com/…"
            />
          </Field>

          <Field
            label="Live"
            htmlFor={controlId("linksLive")}
            error={fieldErrors.linksLive}
          >
            <TextInput
              id={controlId("linksLive")}
              type="url"
              mono
              value={values.linksLive}
              error={fieldErrors.linksLive}
              onChange={(event) => set("linksLive", event.target.value)}
              placeholder="https://stenion.vercel.app"
            />
          </Field>

          <Field
            label="Demo"
            htmlFor={controlId("linksDemo")}
            error={fieldErrors.linksDemo}
            hint="A walkthrough or sandbox, if it is not the live app."
          >
            <TextInput
              id={controlId("linksDemo")}
              type="url"
              mono
              value={values.linksDemo}
              error={fieldErrors.linksDemo}
              hint="A walkthrough or sandbox."
              onChange={(event) => set("linksDemo", event.target.value)}
            />
          </Field>

          <Field
            label="Case study"
            htmlFor={controlId("linksCaseStudy")}
            error={fieldErrors.linksCaseStudy}
            hint="A write-up that lives somewhere else."
          >
            <TextInput
              id={controlId("linksCaseStudy")}
              type="url"
              mono
              value={values.linksCaseStudy}
              error={fieldErrors.linksCaseStudy}
              hint="A write-up that lives somewhere else."
              onChange={(event) => set("linksCaseStudy", event.target.value)}
            />
          </Field>
        </div>
      </Panel>

      {/* ---------------------------------------------------------------- */}
      <Panel
        title="Images"
        description="Uploaded to Cloudinary. The first image is the card cover. Removing one and saving deletes it from Cloudinary, unless another record uses it."
      >
        <ImageListField
          kind="projects"
          images={values.images}
          onChange={(next) => set("images", next)}
          configured={cloudinaryConfigured}
          errors={fieldErrors}
          idPrefix="project"
        />
      </Panel>

      {/* ---------------------------------------------------------------- */}
      <Panel title="Visibility" description="Where this shows up.">
        <div className="flex flex-col gap-4">
          <Toggle
            label="Featured"
            description="Promotes it on the home page."
            checked={values.featured}
            onChange={(next) => set("featured", next)}
          />
          <Toggle
            label="Include in CV"
            description="Separate from featured — the CV is a shorter, differently ordered document."
            checked={values.includeInResume}
            onChange={(next) => set("includeInResume", next)}
          />
        </div>
      </Panel>

      {/* ----------------------------------------------------------------
          The action bar sticks to the bottom of the viewport. On a form this
          long the alternative is scrolling back to the top to save, every
          time, which is how people end up leaving a page without saving. */}
      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background/90 px-1 py-3 backdrop-blur-sm">
        <div>
          {mode === "edit" && projectId ? (
            <ConfirmDelete
              title="Delete project"
              description={
                <>
                  <strong className="text-foreground">
                    {initial.title || "This project"}
                  </strong>{" "}
                  will be removed from the database, along with its images and
                  tech references, and will disappear from the public site. Any
                  of those images uploaded here are also deleted from
                  Cloudinary. This cannot be undone.
                </>
              }
              confirmLabel="Delete project"
              action={deleteProject.bind(null, projectId)}
              redirectTo="/admin/projects"
            />
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/admin/projects")}
            className={buttonGhost}
          >
            Cancel
          </button>
          <button type="submit" disabled={pending} className={buttonPrimary}>
            {pending
              ? "Saving…"
              : mode === "create"
                ? "Create project"
                : "Save changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
