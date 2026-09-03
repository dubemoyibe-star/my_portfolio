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
import {
  Field,
  SelectInput,
  TextInput,
  Toggle,
} from "@/components/admin/fields";
import {
  CATEGORY_OPTIONS,
  PROFICIENCY_OPTIONS,
  categoryGroupLabel,
  describeField,
  validateTech,
  type TechInput,
} from "@/lib/admin/tech-input";
import { slugify, type FieldErrors } from "@/lib/admin/validation";
import { cn } from "@/lib/utils";

import { createTech, deleteTech, updateTech } from "./actions";
import { IconSlugField } from "./icon-slug-field";

/**
 * The tech editor — one form for create and edit, as with projects and
 * contributions.
 *
 * Same contract as those two: controlled state, `validateTech` run here for
 * inline messages and again in the action because the action is reachable
 * without this form, a sticky bar carrying the one commit and the delete.
 *
 * Two things are specific to this entity.
 *
 * ## The id is permanent, and the form says so twice
 *
 * `TechStackItem` has no mutable slug beside its id — the id *is* the slug, and
 * it is what every project and experience references. So it is editable exactly
 * once, while creating, and rendered disabled with an explanation afterwards.
 * Making it look editable and rejecting it on save would be the same
 * information delivered after the typing rather than before it.
 *
 * ## Category is a dropdown over the schema's own tuple
 *
 * `category` is a `String` column, so a typo would be written happily and then
 * quietly drop the item out of every group the Stack section renders —
 * `TECH_GROUPS` matches exact strings. A `<select>` built from `TECH_CATEGORIES`
 * makes that unreachable from here, and the option labels name the public
 * heading each category lands under so nobody has to guess which of `framework`
 * and `library` gets into "Frameworks & Libraries". Both do.
 */

type TechFormProps = {
  mode: "create" | "edit";
  /** Required in edit mode. */
  techId?: string;
  initial: TechInput;
  /** How many projects and experiences reference this. Edit mode only. */
  referenceCount?: number;
};

export function TechForm({
  mode,
  techId,
  initial,
  referenceCount = 0,
}: TechFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<TechInput>(initial);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  /* Only ever true in create mode — in edit mode the field is disabled, so
     there is nothing for the name to overwrite and nothing to take over. */
  const [idEdited, setIdEdited] = useState(false);

  const locked = mode === "edit";

  function controlId(field: string): string {
    return `tech-${field}`;
  }

  function set<K extends keyof TechInput>(key: K, value: TechInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key as string];
      return next;
    });
    setSaved(null);
  }

  function setName(name: string) {
    setValues((current) => ({
      ...current,
      name,
      /* The id follows the name until somebody takes it over, and never once
         the record exists. "PostgreSQL" -> "postgresql" is right almost every
         time, and the times it is not are exactly the times someone types into
         the id box. */
      id: locked || idEdited ? current.id : slugify(name),
    }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.name;
      if (!locked && !idEdited) delete next.id;
      return next;
    });
    setSaved(null);
  }

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

    const errors = validateTech(values);
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
          ? await createTech(values)
          : await updateTech(techId as string, values);

      if (!result.ok) {
        const serverErrors = result.fieldErrors ?? {};
        setFieldErrors(serverErrors);
        setFormError(result.formError ?? "The save did not go through.");
        revealFirstError(serverErrors);
        return;
      }

      if (mode === "create") {
        router.push("/admin/tech-stack");
        router.refresh();
        return;
      }

      setSaved(result.message ?? "Saved.");
      router.refresh();
    });
  }

  const invalidFields = Object.keys(fieldErrors);

  /* `yearsOfExperience` is documented as something to derive from `since`
     rather than hardcode, precisely so it cannot go stale. The form cannot
     derive it — it is a stored column and the type keeps both — but it can show
     the arithmetic beside the box, which is enough to notice a "3" that was
     true two years ago. */
  const derivedYears = yearsSince(values.since);

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
        title="Identity"
        description="What it is called, what files it, and what other records point at."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Name"
            required
            htmlFor={controlId("name")}
            error={fieldErrors.name}
            hint="As the project writes it: “PostgreSQL”, “Node.js”, “Next.js”."
          >
            <TextInput
              id={controlId("name")}
              value={values.name}
              error={fieldErrors.name}
              hint="As the project writes it."
              onChange={(event) => setName(event.target.value)}
              placeholder="PostgreSQL"
            />
          </Field>

          <Field
            label="Id"
            required
            htmlFor={controlId("id")}
            error={fieldErrors.id}
            hint={
              locked
                ? "Permanent. Projects and experience reference this."
                : idEdited
                  ? "Chosen once — this cannot be changed later."
                  : "Following the name. Type here to take it over. Chosen once — this cannot be changed later."
            }
          >
            <div className="flex gap-2">
              <TextInput
                id={controlId("id")}
                mono
                value={values.id}
                error={fieldErrors.id}
                disabled={locked}
                onChange={(event) => {
                  setIdEdited(true);
                  set("id", event.target.value);
                }}
                placeholder="postgresql"
              />
              {locked ? null : (
                <button
                  type="button"
                  onClick={() => {
                    setIdEdited(false);
                    set("id", slugify(values.name));
                  }}
                  className={cn(buttonGhost, "shrink-0")}
                >
                  From name
                </button>
              )}
            </div>
          </Field>

          <Field
            label="Category"
            required
            htmlFor={controlId("category")}
            error={fieldErrors.category}
            hint={`Files it under “${categoryGroupLabel(values.category)}” on the site and the CV.`}
          >
            <SelectInput
              id={controlId("category")}
              value={values.category}
              error={fieldErrors.category}
              hint="Where it is filed."
              options={CATEGORY_OPTIONS}
              onChange={(event) => set("category", event.target.value)}
            />
          </Field>

          <Field
            label="URL"
            htmlFor={controlId("url")}
            error={fieldErrors.url}
            hint="Official site or docs. Not rendered on the Stack section today."
          >
            <TextInput
              id={controlId("url")}
              type="url"
              mono
              value={values.url}
              error={fieldErrors.url}
              hint="Official site or docs."
              onChange={(event) => set("url", event.target.value)}
              placeholder="https://www.postgresql.org"
            />
          </Field>
        </div>
      </Panel>

      {/* ---------------------------------------------------------------- */}
      <Panel
        title="Icon"
        description="The tile is the site's own renderer, with the site's own props. What it shows is what ships."
      >
        <IconSlugField
          id={controlId("icon")}
          value={values.icon}
          error={fieldErrors.icon}
          onChange={(next) => set("icon", next)}
        />
      </Panel>

      {/* ---------------------------------------------------------------- */}
      <Panel
        title="Level and placement"
        description="Stored on the item. None of it is rendered as a rating — the Stack section is a data sheet, not a scorecard."
      >
        <div className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="Proficiency"
              htmlFor={controlId("proficiency")}
              error={fieldErrors.proficiency}
              hint="Optional. Not every tool deserves a rating."
            >
              <SelectInput
                id={controlId("proficiency")}
                value={values.proficiency}
                error={fieldErrors.proficiency}
                hint="Optional."
                placeholder="Not rated"
                options={PROFICIENCY_OPTIONS}
                onChange={(event) => set("proficiency", event.target.value)}
              />
            </Field>

            <Field
              label="Since"
              htmlFor={controlId("since")}
              error={fieldErrors.since}
              hint="First used, YYYY-MM."
            >
              <TextInput
                id={controlId("since")}
                type="month"
                mono
                value={values.since}
                error={fieldErrors.since}
                hint="First used."
                onChange={(event) => set("since", event.target.value)}
              />
            </Field>

            <Field
              label="Years of experience"
              htmlFor={controlId("yearsOfExperience")}
              error={fieldErrors.yearsOfExperience}
              hint={
                derivedYears === null
                  ? "Optional. Prefer filling in “Since” and leaving this empty."
                  : `“Since” works out to ${derivedYears} ${derivedYears === 1 ? "year" : "years"} today.`
              }
            >
              <TextInput
                id={controlId("yearsOfExperience")}
                mono
                inputMode="numeric"
                value={values.yearsOfExperience}
                error={fieldErrors.yearsOfExperience}
                hint="Optional."
                onChange={(event) =>
                  set("yearsOfExperience", event.target.value)
                }
                placeholder="3"
              />
            </Field>
          </div>

          <Toggle
            label="Featured"
            description="Featured items are what the CV skills block is built from. Unfeatured ones still render in the Stack section."
            checked={values.featured}
            onChange={(next) => set("featured", next)}
          />
        </div>
      </Panel>

      {/* ---------------------------------------------------------------- */}
      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background/90 px-1 py-3 backdrop-blur-sm">
        <div>
          {mode === "edit" && techId ? (
            <ConfirmDelete
              title="Delete tech item"
              description={
                referenceCount > 0 ? (
                  <>
                    <strong className="text-foreground">
                      {initial.name || "This item"}
                    </strong>{" "}
                    is referenced by {referenceCount}{" "}
                    {referenceCount === 1 ? "record" : "records"}, so this will
                    be refused — remove it from{" "}
                    {referenceCount === 1 ? "that record" : "those records"}{" "}
                    first.
                  </>
                ) : (
                  <>
                    <strong className="text-foreground">
                      {initial.name || "This item"}
                    </strong>{" "}
                    will be removed from the database and will disappear from
                    the Stack section and the CV skills block. This cannot be
                    undone.
                  </>
                )
              }
              confirmLabel="Delete tech item"
              action={deleteTech.bind(null, techId)}
              redirectTo="/admin/tech-stack"
            />
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/admin/tech-stack")}
            className={buttonGhost}
          >
            Cancel
          </button>
          <button type="submit" disabled={pending} className={buttonPrimary}>
            {pending
              ? "Saving…"
              : mode === "create"
                ? "Create tech item"
                : "Save changes"}
          </button>
        </div>
      </div>
    </form>
  );
}

/* ==========================================================================
   Helpers
   ========================================================================== */

/**
 * Whole years between a `YYYY-MM` and today, or `null` if that is not what was
 * typed. Floored, so "since 2023-05" reads as 2 years until the month comes
 * round again — the same arithmetic anybody would do out loud.
 */
function yearsSince(since: string): number | null {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(since.trim());
  if (!match) return null;

  const now = new Date();
  const months =
    (now.getUTCFullYear() - Number(match[1])) * 12 +
    (now.getUTCMonth() + 1 - Number(match[2]));

  return months < 0 ? 0 : Math.floor(months / 12);
}
