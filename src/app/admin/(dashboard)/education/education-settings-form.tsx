"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";

import { Banner, buttonPrimary } from "@/components/admin/chrome";
import { Field, TextArea, TextInput } from "@/components/admin/fields";
import {
  describeField,
  validateEducationSettings,
  type EducationSettingsInput,
} from "@/lib/admin/education-input";
import type { FieldErrors } from "@/lib/admin/validation";

import { saveEducationSettings } from "./actions";

/**
 * The two fields on the Education section that belong to no entity: the
 * supporting note, and the issuer profile the "All certificates" button links
 * to.
 *
 * Both live in `site_settings` rather than on `Education`, because neither is
 * a property of any one entry — see the note on that model in the schema. That
 * is also why they get their own form and their own save button instead of
 * being folded into the degree entry above them: they are a different row, and
 * one save button writing two tables is a save that can half-succeed.
 *
 * The note is rendered on the home page *and* on the CV, which is the reason
 * it is a database field at all: the sentence was duplicated across two
 * components before, and duplicated sentences are how two pages end up saying
 * different things.
 */

type EducationSettingsFormProps = {
  initial: EducationSettingsInput;
};

export function EducationSettingsForm({ initial }: EducationSettingsFormProps) {
  const router = useRouter();
  const prefix = useId();
  const [values, setValues] = useState<EducationSettingsInput>(initial);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function controlId(field: string): string {
    return `${prefix}-${field}`;
  }

  function set<K extends keyof EducationSettingsInput>(
    key: K,
    value: EducationSettingsInput[K],
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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(null);

    const errors = validateEducationSettings(values);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError(null);
      return;
    }

    setFieldErrors({});
    setFormError(null);

    startTransition(async () => {
      const result = await saveEducationSettings(values);

      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        setFormError(result.formError ?? "The save did not go through.");
        return;
      }

      setSaved(result.message ?? "Saved.");
      router.refresh();
    });
  }

  const invalidFields = Object.keys(fieldErrors);

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {formError ? <Banner tone="error">{formError}</Banner> : null}

      {invalidFields.length > 0 ? (
        <Banner tone="error">
          Check {[...new Set(invalidFields.map(describeField))].join(", ")}.
        </Banner>
      ) : null}

      {saved ? <Banner tone="success">{saved}</Banner> : null}

      <Field
        label="Education note"
        required
        htmlFor={controlId("educationNote")}
        error={fieldErrors.educationNote}
        hint="Rendered under the entries on the home page and on the CV. This is where issuers that award badges rather than certificates belong — naming them here keeps them out of the certificate grid, where they would read as more than they are."
      >
        <TextArea
          id={controlId("educationNote")}
          rows={6}
          value={values.educationNote}
          error={fieldErrors.educationNote}
          onChange={(event) => set("educationNote", event.target.value)}
        />
      </Field>

      <Field
        label="Certificates URL"
        required
        htmlFor={controlId("certificatesUrl")}
        error={fieldErrors.certificatesUrl}
        hint="The issuer profile listing every certificate — the “All certificates” button beside the grid."
      >
        <TextInput
          id={controlId("certificatesUrl")}
          type="url"
          mono
          value={values.certificatesUrl}
          error={fieldErrors.certificatesUrl}
          hint="The issuer profile listing every certificate."
          onChange={(event) => set("certificatesUrl", event.target.value)}
          placeholder="https://scrimba.com/…"
        />
      </Field>

      <div className="flex justify-end border-t border-border pt-4">
        <button type="submit" disabled={pending} className={buttonPrimary}>
          {pending ? "Saving…" : "Save note"}
        </button>
      </div>
    </form>
  );
}
