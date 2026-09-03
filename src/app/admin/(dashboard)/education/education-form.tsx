"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";

import { Banner, buttonGhost, buttonPrimary } from "@/components/admin/chrome";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import {
  Field,
  SelectInput,
  TextInput,
} from "@/components/admin/fields";
import {
  EDUCATION_STATUS_OPTIONS,
  describeField,
  validateEducation,
  type EducationInput,
} from "@/lib/admin/education-input";
import type { FieldErrors } from "@/lib/admin/validation";

import { createEducation, deleteEducation, updateEducation } from "./actions";

/**
 * The degree entry — five fields, and the only editor in this panel that is
 * rendered inline on its own list page rather than behind a row.
 *
 * ## Why inline and not `/admin/education/[id]`
 *
 * There is one of these. A table with a single row, whose only purpose is to
 * be clicked through to a form, is a click and a page load spent asking the
 * operator to confirm they meant the only thing on the screen. So the list
 * *is* the form. `/admin/education/new` still exists for a second entry — a
 * master's, a second institution — because a blank form has to come from
 * somewhere, and the page maps over however many rows there are.
 *
 * Several instances of this component can be on one page, so every id it
 * generates is namespaced by `useId()`. Two entries sharing `education-status`
 * would point both labels at the first select.
 *
 * ## Validation happens twice, on purpose
 *
 * `validateEducation` runs here before the request, so an error appears next to
 * its field without a round trip, and the action runs the identical function
 * again — its verdict is the one that decides whether anything is written. See
 * the note at the top of `./actions`.
 */

type EducationFormProps = {
  mode: "create" | "edit";
  /** Required in edit mode. */
  educationId?: string;
  initial: EducationInput;
  /**
   * Where to go after a create. The edit case stays put and refreshes, because
   * the form it was submitted from is still the right place to be.
   */
  redirectTo?: string;
};

export function EducationForm({
  mode,
  educationId,
  initial,
  redirectTo = "/admin/education",
}: EducationFormProps) {
  const router = useRouter();
  const prefix = useId();
  const [values, setValues] = useState<EducationInput>(initial);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function controlId(field: string): string {
    return `${prefix}-${field}`;
  }

  function set<K extends keyof EducationInput>(key: K, value: EducationInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
    setSaved(null);
  }

  /**
   * Clearing the end date when an entry goes back to "in progress".
   *
   * The two fields contradict each other in exactly one direction — a
   * completed entry needs an end date, and `validateEducation` says so — but
   * an *in-progress* entry with one left over from a mis-click renders as a
   * closed date range under an "In progress" badge. Dropping it here means the
   * contradiction cannot be saved in either direction.
   */
  function setStatus(status: string) {
    setValues((current) => ({
      ...current,
      status,
      endDate: status === "in-progress" ? "" : current.endDate,
    }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.status;
      delete next.endDate;
      return next;
    });
    setSaved(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(null);

    const errors = validateEducation(values);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError(null);
      return;
    }

    setFieldErrors({});
    setFormError(null);

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createEducation(values)
          : await updateEducation(educationId as string, values);

      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        setFormError(result.formError ?? "The save did not go through.");
        return;
      }

      if (mode === "create") {
        router.push(redirectTo);
        router.refresh();
        return;
      }

      setSaved(result.message ?? "Saved.");
      router.refresh();
    });
  }

  const invalidFields = Object.keys(fieldErrors);
  const stillEnrolled = values.status === "in-progress";

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {formError ? <Banner tone="error">{formError}</Banner> : null}

      {invalidFields.length > 0 ? (
        <Banner tone="error">
          Check {[...new Set(invalidFields.map(describeField))].join(", ")}.
        </Banner>
      ) : null}

      {saved ? <Banner tone="success">{saved}</Banner> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Institution"
          required
          htmlFor={controlId("institution")}
          error={fieldErrors.institution}
        >
          <TextInput
            id={controlId("institution")}
            value={values.institution}
            error={fieldErrors.institution}
            onChange={(event) => set("institution", event.target.value)}
            placeholder="Maduka University"
          />
        </Field>

        <Field
          label="Field of study"
          required
          htmlFor={controlId("fieldOfStudy")}
          error={fieldErrors.fieldOfStudy}
        >
          <TextInput
            id={controlId("fieldOfStudy")}
            value={values.fieldOfStudy}
            error={fieldErrors.fieldOfStudy}
            onChange={(event) => set("fieldOfStudy", event.target.value)}
            placeholder="Software Engineering"
          />
        </Field>

        <Field
          label="Status"
          required
          htmlFor={controlId("status")}
          error={fieldErrors.status}
          hint="Drives the dot on the card and the “In progress” line on the CV."
        >
          <SelectInput
            id={controlId("status")}
            options={EDUCATION_STATUS_OPTIONS}
            value={values.status}
            error={fieldErrors.status}
            hint="Drives the dot on the card and the “In progress” line on the CV."
            onChange={(event) => setStatus(event.target.value)}
          />
        </Field>

        <Field
          label="Start"
          required
          htmlFor={controlId("startDate")}
          error={fieldErrors.startDate}
          hint="YYYY-MM"
        >
          {/* `type="month"` produces exactly the `YYYY-MM` the model stores, so
              a browser without the picker degrades to a text box in the right
              format rather than to a different one. */}
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
          required={!stillEnrolled}
          htmlFor={controlId("endDate")}
          error={fieldErrors.endDate}
          hint={
            stillEnrolled
              ? "Empty while enrolled — the range renders as “Present”."
              : "Required for a completed entry."
          }
        >
          <TextInput
            id={controlId("endDate")}
            type="month"
            mono
            /* Disabled rather than hidden: a field that vanishes takes the
               reason it vanished with it, and "in progress" is exactly the
               explanation someone needs when they go looking for it. */
            disabled={stillEnrolled}
            value={values.endDate}
            error={fieldErrors.endDate}
            hint={
              stillEnrolled
                ? "Empty while enrolled."
                : "Required for a completed entry."
            }
            onChange={(event) => set("endDate", event.target.value)}
          />
        </Field>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div>
          {mode === "edit" && educationId ? (
            <ConfirmDelete
              title="Delete education entry"
              description={
                <>
                  <strong className="text-foreground">
                    {initial.institution || "This entry"}
                  </strong>{" "}
                  will be removed from the database and will disappear from the
                  Education section and the CV. The supporting note and the
                  certificates below are separate records and are not affected.
                  This cannot be undone.
                </>
              }
              confirmLabel="Delete entry"
              action={deleteEducation.bind(null, educationId)}
            />
          ) : (
            <button
              type="button"
              onClick={() => router.push("/admin/education")}
              className={buttonGhost}
            >
              Cancel
            </button>
          )}
        </div>

        <button type="submit" disabled={pending} className={buttonPrimary}>
          {pending
            ? "Saving…"
            : mode === "create"
              ? "Create entry"
              : "Save entry"}
        </button>
      </div>
    </form>
  );
}
