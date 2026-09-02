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
  TextArea,
  TextInput,
  Toggle,
} from "@/components/admin/fields";
import { LinkListField } from "@/components/admin/link-list";
import { TagInput } from "@/components/admin/tag-input";
import {
  describeField,
  validateContribution,
  type ContributionInput,
} from "@/lib/admin/contribution-input";
import { slugify, type FieldErrors } from "@/lib/admin/validation";
import { cn } from "@/lib/utils";

import {
  createContribution,
  deleteContribution,
  updateContribution,
} from "./actions";

/**
 * The contribution editor — one form for create and edit, as with projects.
 *
 * The structure is deliberately identical to `../projects/project-form`: same
 * validate-twice contract, same error plumbing, same sticky action bar, same
 * reason for being controlled rather than a `<form action>` (two ordered
 * collections that `FormData` cannot express without a second encoding). What
 * differs is the content model, and one screen-specific concern below.
 *
 * ## The ranking is shown, not just typed into
 *
 * `order` is a bare integer and the section renders by it. Editing it in
 * isolation is how a curated ranking develops two number 3s — the site keeps
 * rendering, so nothing complains. So the field is surrounded by the context it
 * needs: the current ranking is listed beside it, and typing a number another
 * entry already holds raises a notice naming that entry.
 *
 * The notice does not block the save. Sometimes a temporary collision is the
 * honest middle of a two-step change, and a form that refuses it would just
 * make someone invent a placeholder number. The real fix for reordering is the
 * arrows on the list view, which renumber every row at once and cannot leave a
 * duplicate behind; this is here to make it obvious when you have not used it.
 */

/** One row of the ranking sidebar. */
export type RankingEntry = {
  id: string;
  repoName: string;
  order: number | null;
};

type ContributionFormProps = {
  mode: "create" | "edit";
  /** Required in edit mode. */
  contributionId?: string;
  initial: ContributionInput;
  /** Every contribution's current position, for the collision notice. */
  ranking: RankingEntry[];
};

export function ContributionForm({
  mode,
  contributionId,
  initial,
  ranking,
}: ContributionFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<ContributionInput>(initial);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  /* Seeded true when editing: an existing slug is a live identifier, and
     silently rewriting it because someone corrected the repo's capitalisation
     is not something a form should decide. */
  const [slugEdited, setSlugEdited] = useState(mode === "edit");

  function controlId(field: string): string {
    return `contribution-${field.replaceAll(".", "-")}`;
  }

  function set<K extends keyof ContributionInput>(
    key: K,
    value: ContributionInput[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      /* Clears the field's own error and any nested paths it owns, so editing
         a PR link drops `prLinks.1.url` as well as `prLinks`. */
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

  function setRepoName(repoName: string) {
    setValues((current) => ({
      ...current,
      repoName,
      slug: slugEdited ? current.slug : slugify(repoName),
    }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.repoName;
      if (!slugEdited) delete next.slug;
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

    const errors = validateContribution(values);
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
          ? await createContribution(values)
          : await updateContribution(contributionId as string, values);

      if (!result.ok) {
        const serverErrors = result.fieldErrors ?? {};
        setFieldErrors(serverErrors);
        setFormError(result.formError ?? "The save did not go through.");
        revealFirstError(serverErrors);
        return;
      }

      if (mode === "create") {
        router.push("/admin/contributions");
        router.refresh();
        return;
      }

      setSaved(result.message ?? "Saved.");
      router.refresh();
    });
  }

  const invalidFields = Object.keys(fieldErrors);

  /* Who else is sitting on the number currently typed in. Recomputed on every
     keystroke — the list is six rows, and a memo would cost more to read than
     the loop it saves. */
  const typedOrder = values.order.trim();
  const collidesWith =
    typedOrder.length > 0 && /^-?\d+$/.test(typedOrder)
      ? ranking.filter(
          (entry) =>
            entry.id !== contributionId && entry.order === Number(typedOrder),
        )
      : [];

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
        title="Repository"
        description="Context, not credit — what the project you contributed to actually does."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Repository name"
            required
            htmlFor={controlId("repoName")}
            error={fieldErrors.repoName}
            hint="As the repo names itself: “Atreus”, “Quest Service”."
          >
            <TextInput
              id={controlId("repoName")}
              value={values.repoName}
              error={fieldErrors.repoName}
              hint="As the repo names itself."
              onChange={(event) => setRepoName(event.target.value)}
              placeholder="Atreus"
            />
          </Field>

          <Field
            label="Owner"
            htmlFor={controlId("owner")}
            hint="The GitHub org or user. Rendered as “owner/repo”."
          >
            <TextInput
              id={controlId("owner")}
              mono
              value={values.owner}
              hint="The GitHub org or user."
              onChange={(event) => set("owner", event.target.value)}
              placeholder="atreus-lab"
            />
          </Field>

          <Field
            label="Slug"
            required
            htmlFor={controlId("slug")}
            error={fieldErrors.slug}
            hint={
              slugEdited
                ? "The stable identifier for this entry."
                : "Following the repository name. Type here to take it over."
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
                placeholder="atreus"
              />
              <button
                type="button"
                onClick={() => {
                  setSlugEdited(false);
                  set("slug", slugify(values.repoName));
                }}
                className={cn(buttonGhost, "shrink-0")}
              >
                From name
              </button>
            </div>
          </Field>

          <Field
            label="Repository URL"
            required
            htmlFor={controlId("repoUrl")}
            error={fieldErrors.repoUrl}
            className="sm:col-span-2"
          >
            <TextInput
              id={controlId("repoUrl")}
              type="url"
              mono
              value={values.repoUrl}
              error={fieldErrors.repoUrl}
              onChange={(event) => set("repoUrl", event.target.value)}
              placeholder="https://github.com/atreus-lab/atreus"
            />
          </Field>

          <Field
            label="Repository description"
            required
            htmlFor={controlId("repoDescription")}
            error={fieldErrors.repoDescription}
            hint="One line on what the project does. Not what you did to it."
            className="sm:col-span-2"
          >
            <TextArea
              id={controlId("repoDescription")}
              rows={2}
              value={values.repoDescription}
              error={fieldErrors.repoDescription}
              hint="One line on what the project does."
              onChange={(event) => set("repoDescription", event.target.value)}
            />
          </Field>
        </div>
      </Panel>

      {/* ---------------------------------------------------------------- */}
      <Panel
        title="The contribution"
        description="What you changed. The summary carries the entry; the details expand under it."
      >
        <div className="flex flex-col gap-5">
          <Field
            label="Summary"
            required
            htmlFor={controlId("contributionSummary")}
            error={fieldErrors.contributionSummary}
            hint="One line on what you specifically did."
          >
            <TextArea
              id={controlId("contributionSummary")}
              rows={2}
              value={values.contributionSummary}
              error={fieldErrors.contributionSummary}
              hint="One line on what you specifically did."
              onChange={(event) =>
                set("contributionSummary", event.target.value)
              }
            />
            <span
              className={cn(
                "label self-end",
                values.contributionSummary.length > 140
                  ? "text-warning"
                  : "text-muted/70",
              )}
            >
              {values.contributionSummary.length} / 140
            </span>
          </Field>

          <Field
            label="Details"
            required
            htmlFor={controlId("contributionDetails")}
            error={fieldErrors.contributionDetails}
            hint="Long form, Markdown. The full account, shown when the entry is expanded."
          >
            <TextArea
              id={controlId("contributionDetails")}
              rows={10}
              value={values.contributionDetails}
              error={fieldErrors.contributionDetails}
              hint="Long form, Markdown."
              onChange={(event) =>
                set("contributionDetails", event.target.value)
              }
            />
          </Field>

          <Field
            label="Merged"
            htmlFor={controlId("mergedDate")}
            error={fieldErrors.mergedDate}
            hint="Optional — leave empty if it is not recorded."
            className="sm:max-w-56"
          >
            <TextInput
              id={controlId("mergedDate")}
              type="month"
              mono
              value={values.mergedDate}
              error={fieldErrors.mergedDate}
              hint="Optional."
              onChange={(event) => set("mergedDate", event.target.value)}
            />
          </Field>
        </div>
      </Panel>

      {/* ---------------------------------------------------------------- */}
      <Panel
        title="Tech"
        description="Free text, not the tech registry — a PR often touches tools outside this stack."
      >
        <Field
          label="Tags"
          htmlFor={controlId("tech")}
          hint="Enter or comma to add. Backspace on an empty box removes the last one. The icon beside each tag is what the public site will render."
        >
          <TagInput
            id={controlId("tech")}
            values={values.tech}
            onChange={(next) => set("tech", next)}
            hint="Enter or comma to add."
            placeholder="Rust, Soroban, Stellar"
          />
        </Field>
      </Panel>

      {/* ---------------------------------------------------------------- */}
      <Panel
        title="PR links"
        description="At least one. The order here is the order they render in."
      >
        {/* Focusable wrapper so the list-level error ("add at least one") has
            somewhere to send focus — there is no single input to blame. */}
        <div
          id={controlId("prLinks")}
          tabIndex={-1}
          className="flex flex-col gap-3 outline-none"
        >
          {fieldErrors.prLinks ? (
            <p className="text-small text-warning">{fieldErrors.prLinks}</p>
          ) : null}

          <LinkListField
            idPrefix="contribution"
            name="prLinks"
            values={values.prLinks}
            onChange={(next) => set("prLinks", next)}
            errors={fieldErrors}
            addLabel="Add PR link"
            emptyLabel="No links yet — a contribution needs at least one."
          />
        </div>
      </Panel>

      {/* ---------------------------------------------------------------- */}
      <Panel title="Placement" description="Where and whether this shows up.">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <Toggle
              label="Featured"
              description="Kept for parity with projects; the section currently renders every entry."
              checked={values.featured}
              onChange={(next) => set("featured", next)}
            />
            <Toggle
              label="Include in CV"
              description="Open-source work carries real weight on the CV while the experience section is empty."
              checked={values.includeInResume}
              onChange={(next) => set("includeInResume", next)}
            />

            <Field
              label="Order"
              htmlFor={controlId("order")}
              error={fieldErrors.order}
              hint="Lower sorts first. Empty sorts last."
              className="max-w-40"
            >
              <TextInput
                id={controlId("order")}
                mono
                inputMode="numeric"
                value={values.order}
                error={fieldErrors.order}
                hint="Lower sorts first."
                onChange={(event) => set("order", event.target.value)}
                placeholder="1"
              />
            </Field>

            {collidesWith.length > 0 ? (
              <p className="rounded-md border border-warning/30 bg-warning-subtle px-3 py-2 text-small text-warning">
                {collidesWith.map((entry) => entry.repoName).join(", ")}{" "}
                {collidesWith.length === 1 ? "is" : "are"} already at position{" "}
                {typedOrder}. This will still save — the section breaks the tie
                on merge date — but the ranking is clearer if you reorder from
                the list instead.
              </p>
            ) : null}
          </div>

          {/* The ranking, so a number is chosen against something rather than
              guessed. Read-only on purpose: this is context for the field
              beside it, and the place to actually change the sequence is the
              list view, where a move renumbers every row at once. */}
          <div className="rounded-md border border-border bg-background/50 p-3">
            <p className="label text-muted">Current ranking</p>
            <ol className="mt-2 flex flex-col gap-1">
              {ranking.length === 0 ? (
                <li className="text-small text-muted">Nothing else yet.</li>
              ) : (
                ranking.map((entry) => (
                  <li
                    key={entry.id}
                    className={cn(
                      "flex items-baseline gap-2 text-small",
                      entry.id === contributionId
                        ? "text-foreground"
                        : "text-muted",
                    )}
                  >
                    <span className="w-5 shrink-0 text-right font-mono text-label">
                      {entry.order ?? "—"}
                    </span>
                    <span className="min-w-0 truncate">
                      {entry.repoName}
                      {entry.id === contributionId ? (
                        <span className="ml-1.5 text-accent">· this one</span>
                      ) : null}
                    </span>
                  </li>
                ))
              )}
            </ol>
            <p className="mt-3 text-small text-muted">
              Use the arrows on the{" "}
              <span className="text-foreground">Contributions list</span> to
              reorder — it renumbers everything at once, so no two entries can
              end up sharing a position.
            </p>
          </div>
        </div>
      </Panel>

      {/* ---------------------------------------------------------------- */}
      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background/90 px-1 py-3 backdrop-blur-sm">
        <div>
          {mode === "edit" && contributionId ? (
            <ConfirmDelete
              title="Delete contribution"
              description={
                <>
                  <strong className="text-foreground">
                    {initial.repoName || "This contribution"}
                  </strong>{" "}
                  will be removed from the database, along with its PR links,
                  and will disappear from the public site. This cannot be
                  undone.
                </>
              }
              confirmLabel="Delete contribution"
              action={deleteContribution.bind(null, contributionId)}
              redirectTo="/admin/contributions"
            />
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/admin/contributions")}
            className={buttonGhost}
          >
            Cancel
          </button>
          <button type="submit" disabled={pending} className={buttonPrimary}>
            {pending
              ? "Saving…"
              : mode === "create"
                ? "Create contribution"
                : "Save changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
