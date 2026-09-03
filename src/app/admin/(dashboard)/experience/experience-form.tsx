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
import { StringListField } from "@/components/admin/string-list";
import { TechPicker, type TechOption } from "@/components/admin/tech-picker";
import {
  EMPLOYMENT_TYPE_OPTIONS,
  WORK_MODE_OPTIONS,
  describeField,
  experienceSlugSource,
  validateExperience,
  type ExperienceInput,
} from "@/lib/admin/experience-input";
import { slugify, type FieldErrors } from "@/lib/admin/validation";
import { cn } from "@/lib/utils";

import { createExperience, deleteExperience, updateExperience } from "./actions";

/**
 * The experience editor — one form, used for both create and edit.
 *
 * Structurally the project editor with a different field set, and deliberately
 * so: two forms drift, and a panel added to one and forgotten in the other is
 * invisible until someone notices a value that will not save. See the notes at
 * the top of `../projects/project-form` for why the form is controlled rather
 * than a `<form action={...}>`, and why validation runs on both sides.
 *
 * ## The one thing this form says that the others do not
 *
 * Description and highlights are optional here, and the form says so out loud
 * rather than leaving the absence of a `*` to carry the message. A role added
 * on its first day has nothing to report yet, and the operator needs to know
 * that saving it in that state is the intended path and not a corner they are
 * cutting — otherwise the field gets filled with something invented, which is
 * the failure this section can least afford. The panel copy, the placeholder
 * and the empty-list label all repeat it.
 */

type ExperienceFormProps = {
  mode: "create" | "edit";
  /** Required in edit mode. */
  experienceId?: string;
  initial: ExperienceInput;
  techOptions: TechOption[];
};

export function ExperienceForm({
  mode,
  experienceId,
  initial,
  techOptions,
}: ExperienceFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<ExperienceInput>(initial);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  /**
   * Whether the slug has been taken over by hand.
   *
   * Seeded true when editing: an existing slug is the key `getExperienceBySlug`
   * resolves, and silently rewriting it because someone corrected a job title
   * would repoint it. On a new role there is nothing pointing at it yet, so the
   * slug follows company and role until it is touched.
   */
  const [slugEdited, setSlugEdited] = useState(mode === "edit");

  const knownTechIds = useMemo(
    () => new Set(techOptions.map((option) => option.id)),
    [techOptions],
  );

  function set<K extends keyof ExperienceInput>(
    key: K,
    value: ExperienceInput[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    /* Clearing the field's own error as it is edited, rather than waiting for
       the next submit — a stale "Required" under a field someone has just
       filled in reads as the form being broken. Nested paths a collection
       field owns go with it, so editing the stack drops `tech.2`. */
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

  /**
   * Company and role both feed the slug, so both go through here.
   *
   * `slugify(company + " " + role)` rather than either alone: two roles at one
   * employer are the normal case for a promotion, and a slug built from the
   * company would collide on the second one.
   */
  function setSlugSource<K extends "company" | "role">(key: K, value: string) {
    setValues((current) => {
      const next = { ...current, [key]: value };
      return slugEdited
        ? next
        : {
            ...next,
            slug: slugify(experienceSlugSource(next.company, next.role)),
          };
    });
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[key];
      if (!slugEdited) delete next.slug;
      return next;
    });
    setSaved(null);
  }

  /**
   * Put the operator in front of the first thing that is wrong.
   *
   * Focus rather than scroll, so the message is announced as well as shown —
   * a banner saying "some fields need attention" without moving anywhere is a
   * scavenger hunt across five panels.
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

    const errors = validateExperience(values, { knownTechIds });
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
          ? await createExperience(values)
          : await updateExperience(experienceId as string, values);

      if (!result.ok) {
        const serverErrors = result.fieldErrors ?? {};
        setFieldErrors(serverErrors);
        setFormError(result.formError ?? "The save did not go through.");
        revealFirstError(serverErrors);
        return;
      }

      if (mode === "create") {
        router.push("/admin/experience");
        router.refresh();
        return;
      }

      setSaved(result.message ?? "Saved.");
      /* `revalidatePath` in the action drops the public site's cache; this
         drops the client router's, so the list behind this page and the
         dashboard's counts agree with what was just written. */
      router.refresh();
    });
  }

  /** Ids are `experience-<field>`, so `revealFirstError` can find any of them. */
  function controlId(field: string): string {
    return `experience-${field.replaceAll(".", "-")}`;
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
      <Panel
        title="The role"
        description="Who, what and when. These are the facts that are true on day one."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Company"
            required
            htmlFor={controlId("company")}
            error={fieldErrors.company}
          >
            <TextInput
              id={controlId("company")}
              value={values.company}
              error={fieldErrors.company}
              onChange={(event) => setSlugSource("company", event.target.value)}
              placeholder="Stenion"
            />
          </Field>

          <Field
            label="Role"
            required
            htmlFor={controlId("role")}
            error={fieldErrors.role}
            hint="The title, as you would write it on a CV."
          >
            <TextInput
              id={controlId("role")}
              value={values.role}
              error={fieldErrors.role}
              hint="The title, as you would write it on a CV."
              onChange={(event) => setSlugSource("role", event.target.value)}
              placeholder="Backend Developer"
            />
          </Field>

          <Field
            label="Slug"
            required
            htmlFor={controlId("slug")}
            error={fieldErrors.slug}
            hint={
              slugEdited
                ? "The stable key for this role. Unique across every entry."
                : "Following company and role. Type here to take it over."
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
                placeholder="stenion-founder-ceo"
              />
              <button
                type="button"
                onClick={() => {
                  setSlugEdited(false);
                  set(
                    "slug",
                    slugify(experienceSlugSource(values.company, values.role)),
                  );
                }}
                className={cn(buttonGhost, "shrink-0")}
              >
                From role
              </button>
            </div>
          </Field>

          <Field
            label="Employment type"
            htmlFor={controlId("employmentType")}
            error={fieldErrors.employmentType}
            hint="Optional. Dropped from the site when unset."
          >
            <SelectInput
              id={controlId("employmentType")}
              options={EMPLOYMENT_TYPE_OPTIONS}
              placeholder="Not stated"
              value={values.employmentType}
              error={fieldErrors.employmentType}
              hint="Optional. Dropped from the site when unset."
              onChange={(event) => set("employmentType", event.target.value)}
            />
          </Field>

          <Field
            label="Work mode"
            htmlFor={controlId("workMode")}
            error={fieldErrors.workMode}
            hint="Optional. Remote, hybrid or on-site."
          >
            <SelectInput
              id={controlId("workMode")}
              options={WORK_MODE_OPTIONS}
              placeholder="Not stated"
              value={values.workMode}
              error={fieldErrors.workMode}
              hint="Optional. Remote, hybrid or on-site."
              onChange={(event) => set("workMode", event.target.value)}
            />
          </Field>

          <Field
            label="Location"
            htmlFor={controlId("location")}
            hint="Free text — a city, or wherever the work actually happens."
          >
            <TextInput
              id={controlId("location")}
              value={values.location}
              hint="Free text — a city, or wherever the work actually happens."
              onChange={(event) => set("location", event.target.value)}
              placeholder="Lagos, Nigeria"
            />
          </Field>

          <Field
            label="Company URL"
            htmlFor={controlId("companyUrl")}
            error={fieldErrors.companyUrl}
            hint="Optional, and worth filling in: it links the company name on the site and prints as a bare domain on the CV, which is how a reader checks the employer is real."
          >
            <TextInput
              id={controlId("companyUrl")}
              type="url"
              mono
              value={values.companyUrl}
              error={fieldErrors.companyUrl}
              hint="Optional. Links the company name on the site; prints as a domain on the CV."
              onChange={(event) => set("companyUrl", event.target.value)}
              placeholder="https://…"
            />
          </Field>

          <Field
            label="Start"
            required
            htmlFor={controlId("startDate")}
            error={fieldErrors.startDate}
            hint="YYYY-MM — the whole content model is month precision."
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
            hint="Leave empty while you are still there — it renders as “Present”."
          >
            <TextInput
              id={controlId("endDate")}
              type="month"
              mono
              value={values.endDate}
              error={fieldErrors.endDate}
              hint="Leave empty while you are still there."
              onChange={(event) => set("endDate", event.target.value)}
            />
          </Field>

          <Field
            label="Order"
            htmlFor={controlId("order")}
            error={fieldErrors.order}
            hint="Lower sorts first. Empty falls back to recency."
            className="sm:col-span-2"
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
        </div>
      </Panel>

      {/* ---------------------------------------------------------------- */}
      <Panel
        title="What the work is"
        description="Both optional. A role added on its first day has nothing to report yet, and saving it empty is the intended path — these fill in as the work happens."
      >
        <div className="flex flex-col gap-5">
          <Field
            label="Description"
            htmlFor={controlId("description")}
            hint="A paragraph of context: what the company does, what you own."
          >
            <TextArea
              id={controlId("description")}
              rows={6}
              value={values.description}
              hint="A paragraph of context: what the company does, what you own."
              onChange={(event) => set("description", event.target.value)}
              placeholder="Leave this empty until there is something true to put in it."
            />
          </Field>

          <div className="flex flex-col gap-1.5">
            <span className="label text-muted">Highlights</span>
            <p className="text-small text-muted">
              Achievement bullets, strongest first — this is the primary CV
              payload. Outcome-shaped, with numbers where they exist. Add them
              as they become true, not in advance.
            </p>
            <div className="mt-1">
              <StringListField
                name="Highlight"
                values={values.highlights}
                onChange={(next) => set("highlights", next)}
                compact={false}
                addLabel="Add highlight"
                emptyLabel="No highlights. That is fine for a role that has just started — the entry renders as its description and dates until there is something to add."
                placeholder="Surfaced real, previously undisclosed protocol risk on a live Stellar lending pool."
              />
            </div>
          </div>
        </div>
      </Panel>

      {/* ---------------------------------------------------------------- */}
      <Panel
        title="Tech stack"
        description="References into the tech registry, in the order they render. Leave it empty until you know what the work actually uses."
      >
        <TechPicker
          options={techOptions}
          selected={values.tech}
          onChange={(next) => set("tech", next)}
          errors={fieldErrors}
        />
      </Panel>

      {/* ---------------------------------------------------------------- */}
      <Panel title="Visibility" description="Where this shows up.">
        <Toggle
          label="Include in CV"
          description="The Experience section on the site shows every role; the CV shows only the ones flagged here."
          checked={values.includeInResume}
          onChange={(next) => set("includeInResume", next)}
        />
      </Panel>

      {/* ----------------------------------------------------------------
          The action bar sticks to the bottom of the viewport. On a form this
          long the alternative is scrolling back to the top to save, every
          time, which is how people end up leaving a page without saving. */}
      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background/90 px-1 py-3 backdrop-blur-sm">
        <div>
          {mode === "edit" && experienceId ? (
            <ConfirmDelete
              title="Delete role"
              description={
                <>
                  <strong className="text-foreground">
                    {initial.role && initial.company
                      ? `${initial.role} · ${initial.company}`
                      : "This role"}
                  </strong>{" "}
                  will be removed from the database, along with its tech
                  references, and will disappear from the Experience section and
                  the CV. This cannot be undone.
                </>
              }
              confirmLabel="Delete role"
              action={deleteExperience.bind(null, experienceId)}
              redirectTo="/admin/experience"
            />
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/admin/experience")}
            className={buttonGhost}
          >
            Cancel
          </button>
          <button type="submit" disabled={pending} className={buttonPrimary}>
            {pending
              ? "Saving…"
              : mode === "create"
                ? "Create role"
                : "Save changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
