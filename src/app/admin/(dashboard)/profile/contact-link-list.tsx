"use client";

import { useId, useRef } from "react";

import { buttonGhost, buttonIcon } from "@/components/admin/chrome";
import { Field, TextInput, Toggle } from "@/components/admin/fields";
import { ICON_SLUGS, Icon, hasIcon } from "@/components/ui/icon";
import {
  emptyContactLink,
  type ContactLinkInput,
} from "@/lib/admin/profile-input";
import type { FieldErrors } from "@/lib/admin/validation";
import { cn } from "@/lib/utils";

/**
 * The contact links editor: add, describe, reorder, remove.
 *
 * Not `LinkListField` from `@/components/admin`, and the difference is not
 * cosmetic. That component edits a label/URL pair — everything a PR link is. A
 * `ContactLink` carries three more fields that each change what the site
 * draws: the icon slug the hero renders as a brand mark, the handle the CV
 * prints instead of the raw URL, and the `primary` flag that decides which
 * links survive in compact places. Widening the shared component with three
 * optional props that only one caller passes would make the PR-links editor
 * harder to read in exchange for saving a file.
 *
 * ## Order is content
 *
 * The hero renders these left to right and the CV header top to bottom, both
 * in stored order, so GitHub leading LinkedIn is an authored decision. Up and
 * down move a row; positions are renumbered from scratch on save, so the
 * stored sequence can never develop a gap.
 *
 * Up/down buttons over drag-and-drop: they work from the keyboard with no
 * extra code, they are unambiguous about where a row landed, and there are
 * five links, not fifty.
 *
 * ## The icon preview is the real component
 *
 * The tile renders `<Icon name={slug} brand fallback />` — the same call the
 * hero makes, with the same props — so the preview cannot be right while the
 * site is wrong. A slug the site does not bundle draws the neutral
 * placeholder here exactly as it will there, and the row says so in words
 * rather than leaving an empty square to be interpreted.
 *
 * The full simple-icons catalogue is deliberately not consulted: that is the
 * tech editor's `IconSlugField`, which needs to tell a misspelling from an
 * unbundled brand because the stack has forty of them and grows. There are
 * five links here and they change once a year — the datalist of what does
 * render is the whole answer.
 */

type ContactLinkListProps = {
  /**
   * Prefix for the generated ids. Rows come out as
   * `<idPrefix>-links-<index>-<field>`, which is the same string the parent
   * form derives from an error path — that is what lets it move focus to a
   * failing row without the two files agreeing on anything more than a rule.
   */
  idPrefix: string;
  values: ContactLinkInput[];
  onChange: (next: ContactLinkInput[]) => void;
  /** Keyed `links.<index>.<field>`, matching the server's error paths. */
  errors?: FieldErrors;
};

export function ContactLinkList({
  idPrefix,
  values,
  onChange,
  errors = {},
}: ContactLinkListProps) {
  const listId = useId();

  /* Held so a newly added row takes focus — otherwise every entry starts with
     a click on the field that was just created. */
  const labelRefs = useRef<(HTMLInputElement | null)[]>([]);

  const idFor = (index: number, field: keyof ContactLinkInput) =>
    `${idPrefix}-links-${index}-${field}`;

  function update(index: number, patch: Partial<ContactLinkInput>) {
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
    onChange([...values, emptyContactLink()]);
    requestAnimationFrame(() => labelRefs.current[values.length]?.focus());
  }

  return (
    <div className="flex flex-col gap-3">
      {values.length === 0 ? (
        <p className="text-small text-muted">
          No links yet. The hero drops its icon row entirely without them, and
          the CV header falls back to the email address alone.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {values.map((row, index) => {
            const labelError = errors[`links.${index}.label`];
            const hrefError = errors[`links.${index}.href`];
            const slug = row.icon.trim();
            const renders = hasIcon(slug);

            return (
              <li
                key={index}
                className="rounded-md border border-border bg-background/50 p-3"
              >
                <div className="flex items-start gap-3">
                  <span className="flex shrink-0 flex-col items-center gap-1.5">
                    <span className="label text-muted/70">{index + 1}</span>
                    {/* Sized and coloured like the hero's icon button, because
                        that is where this mark ends up. */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex size-9 items-center justify-center rounded-md border bg-surface",
                        renders
                          ? "border-border text-foreground"
                          : "border-dashed border-border-strong text-muted",
                      )}
                    >
                      <Icon name={slug} brand fallback className="size-5" />
                    </span>
                  </span>

                  <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
                    <Field
                      label="Label"
                      required
                      htmlFor={idFor(index, "label")}
                      error={labelError}
                      hint="Names the link for screen readers in the hero."
                    >
                      <TextInput
                        ref={(node) => {
                          labelRefs.current[index] = node;
                        }}
                        id={idFor(index, "label")}
                        value={row.label}
                        error={labelError}
                        hint="Names the link for screen readers in the hero."
                        onChange={(event) =>
                          update(index, { label: event.target.value })
                        }
                        placeholder="GitHub"
                      />
                    </Field>

                    <Field
                      label="Icon slug"
                      htmlFor={idFor(index, "icon")}
                      hint={
                        slug.length === 0
                          ? "Optional. A simple-icons slug — the list offers every mark this site bundles."
                          : renders
                            ? "Renders. What is in the tile is what the hero will draw."
                            : "Not a mark this site bundles — the hero will draw the neutral placeholder shown in the tile."
                      }
                    >
                      <TextInput
                        id={idFor(index, "icon")}
                        mono
                        list={listId}
                        value={row.icon}
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck={false}
                        hint="A simple-icons slug."
                        /* Lowercased on the way in rather than flagged
                           afterwards. The slugs are lowercase without
                           exception, and "GitHub" is a reasonable thing to
                           type into a box labelled with a brand. */
                        onChange={(event) =>
                          update(index, { icon: event.target.value.toLowerCase() })
                        }
                        placeholder="github"
                      />
                    </Field>

                    <Field
                      label="URL"
                      required
                      htmlFor={idFor(index, "href")}
                      error={hrefError}
                      hint="Where the link goes. Opens in a new tab."
                    >
                      <TextInput
                        id={idFor(index, "href")}
                        type="url"
                        mono
                        value={row.href}
                        error={hrefError}
                        hint="Where the link goes."
                        onChange={(event) =>
                          update(index, { href: event.target.value })
                        }
                        placeholder="https://github.com/you"
                      />
                    </Field>

                    <Field
                      label="Handle"
                      htmlFor={idFor(index, "handle")}
                      hint="Optional. Printed on the CV in place of the raw URL."
                    >
                      <TextInput
                        id={idFor(index, "handle")}
                        value={row.handle}
                        hint="Optional. Printed on the CV in place of the raw URL."
                        onChange={(event) =>
                          update(index, { handle: event.target.value })
                        }
                        placeholder="@you"
                      />
                    </Field>

                    <div className="sm:col-span-2">
                      <Toggle
                        label="Primary link"
                        description="Marks it for compact places — the footer and the CV header — rather than every link."
                        checked={row.primary}
                        onChange={(next) => update(index, { primary: next })}
                      />
                    </div>
                  </div>

                  <span className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label={`Move ${row.label || `link ${index + 1}`} up`}
                      className={buttonIcon}
                    >
                      <ChevronIcon />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === values.length - 1}
                      aria-label={`Move ${row.label || `link ${index + 1}`} down`}
                      className={cn(buttonIcon, "rotate-180")}
                    >
                      <ChevronIcon />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onChange(values.filter((_, i) => i !== index))
                      }
                      aria-label={`Remove ${row.label || `link ${index + 1}`}`}
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

      {/* One datalist for the whole editor rather than one per row: the
          options are identical and a `<datalist>` is referenced by id, so
          five copies would be five identical DOM subtrees. */}
      <datalist id={listId}>
        {ICON_SLUGS.map((slug) => (
          <option key={slug} value={slug} />
        ))}
      </datalist>

      <div>
        <button type="button" onClick={add} className={cn(buttonGhost, "h-8")}>
          <span aria-hidden="true">+</span>
          Add link
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
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
