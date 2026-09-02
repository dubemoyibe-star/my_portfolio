"use client";

import { useRef } from "react";

import { buttonGhost, buttonIcon } from "@/components/admin/chrome";
import { cn } from "@/lib/utils";

/**
 * An ordered list of label + URL pairs. Built for a contribution's PR links.
 *
 * ## Why order is a control and not an accident
 *
 * `PrLink` rows carry an explicit `position` and the public entry renders them
 * in that sequence, so "PR #84 — Analytics Dashboard" leading "PR #131 — Batch
 * Attestation" is an authored decision. Up and down move a row; the list is
 * renumbered from scratch on save, so the stored positions can never develop a
 * gap.
 *
 * ## Why the label is not derived from the URL
 *
 * A PR URL ends in a number, and "PR #84" could be generated from it. The
 * seeded labels are "PR #84 — Analytics Dashboard": the number plus what the
 * change actually did. That second half cannot be derived from anything, and
 * auto-filling the first half would train the operator to accept a label that
 * is missing it.
 *
 * Rows are validated as a pair — a URL with no label and a label with no URL
 * are both incomplete — with messages keyed `<field>.<index>.<label|url>` so
 * each lands on its own input.
 */

export type LinkDraft = {
  label: string;
  url: string;
};

type LinkListFieldProps = {
  /**
   * Prefix for the generated ids, and the error-path root. Ids come out as
   * `<idPrefix>-<name>-<index>-label`, which is what lets the parent form move
   * focus to a failing row from its error path alone.
   */
  idPrefix: string;
  /** The field name in error paths — `prLinks`. */
  name: string;
  values: LinkDraft[];
  onChange: (next: LinkDraft[]) => void;
  errors?: Record<string, string>;
  labelPlaceholder?: string;
  urlPlaceholder?: string;
  addLabel?: string;
  emptyLabel?: string;
};

export function LinkListField({
  idPrefix,
  name,
  values,
  onChange,
  errors = {},
  labelPlaceholder = "PR #84 — Analytics Dashboard",
  urlPlaceholder = "https://github.com/owner/repo/pull/84",
  addLabel = "Add link",
  emptyLabel = "No links yet.",
}: LinkListFieldProps) {
  /* Held so a newly added row takes focus — otherwise every entry starts with
     a click on the field that was just created. */
  const rowsRef = useRef<(HTMLInputElement | null)[]>([]);

  const idFor = (index: number, field: "label" | "url") =>
    `${idPrefix}-${name}-${index}-${field}`;

  function update(index: number, patch: Partial<LinkDraft>) {
    onChange(values.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= values.length) return;
    const next = [...values];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function add() {
    onChange([...values, { label: "", url: "" }]);
    requestAnimationFrame(() => rowsRef.current[values.length]?.focus());
  }

  return (
    <div className="flex flex-col gap-3">
      {values.length === 0 ? (
        <p className="text-small text-muted">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {values.map((row, index) => {
            const labelError = errors[`${name}.${index}.label`];
            const urlError = errors[`${name}.${index}.url`];

            return (
              <li
                key={index}
                className="rounded-md border border-border bg-background/50 p-3"
              >
                <div className="flex items-start gap-2">
                  <span className="label mt-2.5 w-5 shrink-0 text-right text-muted/70">
                    {index + 1}
                  </span>

                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor={idFor(index, "label")}
                        className="label text-muted"
                      >
                        Label
                      </label>
                      <input
                        ref={(node) => {
                          rowsRef.current[index] = node;
                        }}
                        id={idFor(index, "label")}
                        value={row.label}
                        onChange={(event) =>
                          update(index, { label: event.target.value })
                        }
                        placeholder={labelPlaceholder}
                        aria-invalid={labelError ? true : undefined}
                        aria-describedby={
                          labelError ? `${idFor(index, "label")}-error` : undefined
                        }
                        className={cn(
                          "h-9 w-full rounded-md border bg-background px-3 text-small text-foreground transition-colors placeholder:text-muted/70 hover:border-muted focus:border-accent focus:outline-none",
                          labelError ? "border-warning/70" : "border-border-strong",
                        )}
                      />
                      {labelError ? (
                        <p
                          id={`${idFor(index, "label")}-error`}
                          className="text-small text-warning"
                        >
                          {labelError}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor={idFor(index, "url")}
                        className="label text-muted"
                      >
                        URL
                      </label>
                      <input
                        id={idFor(index, "url")}
                        type="url"
                        value={row.url}
                        onChange={(event) =>
                          update(index, { url: event.target.value })
                        }
                        placeholder={urlPlaceholder}
                        aria-invalid={urlError ? true : undefined}
                        aria-describedby={
                          urlError ? `${idFor(index, "url")}-error` : undefined
                        }
                        className={cn(
                          "h-9 w-full rounded-md border bg-background px-3 font-mono text-small text-foreground transition-colors placeholder:font-sans placeholder:text-muted/70 hover:border-muted focus:border-accent focus:outline-none",
                          urlError ? "border-warning/70" : "border-border-strong",
                        )}
                      />
                      {urlError ? (
                        <p
                          id={`${idFor(index, "url")}-error`}
                          className="text-small text-warning"
                        >
                          {urlError}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <span className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label={`Move link ${index + 1} up`}
                      className={buttonIcon}
                    >
                      <ChevronIcon />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === values.length - 1}
                      aria-label={`Move link ${index + 1} down`}
                      className={cn(buttonIcon, "rotate-180")}
                    >
                      <ChevronIcon />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onChange(values.filter((_, i) => i !== index))
                      }
                      aria-label={`Remove link ${index + 1}`}
                      className={cn(
                        buttonIcon,
                        "hover:border-warning/50 hover:text-warning",
                      )}
                    >
                      <CloseIcon />
                    </button>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div>
        <button type="button" onClick={add} className={cn(buttonGhost, "h-8")}>
          <span aria-hidden="true">+</span>
          {addLabel}
        </button>
      </div>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 15l6-6 6 6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
