"use client";

import { useState } from "react";

import { Icon } from "@/components/ui/icon";
import { iconSlugForLabel } from "@/lib/tech-labels";
import { cn } from "@/lib/utils";

/**
 * Free-form tags: type, press Enter, get a chip.
 *
 * ## Why this is not the tech picker
 *
 * `Contribution.tech` is `String[]`, not `TechId[]`, and the type comment
 * spells out why: a PR routinely touches tools that are not part of this
 * portfolio's stack — a queue library the host repo happens to use, a framework
 * seen once. Offering the tech registry here would force a choice between
 * mislabelling the work and inventing registry entries that misrepresent the
 * stack. So this control deliberately has no vocabulary behind it.
 *
 * ## The icon preview is a check, not a promise
 *
 * `iconSlugForLabel` maps a label onto an icon slug best-effort, and the public
 * card renders whatever it resolves — falling back to a neutral glyph. Showing
 * the same resolution here means a typo that costs an icon ("Node.JS" against
 * "Node.js") is visible while typing rather than discovered on the live site.
 * A tag with no icon is perfectly valid; the placeholder square says so.
 *
 * ## No reordering
 *
 * Unlike images and the tech picker, chips here carry only a remove control.
 * Tags are two or three short words rendered in a single row, and re-adding one
 * is a couple of keystrokes — a pair of arrows on every chip would make the
 * controls larger than the content they move.
 */

type TagInputProps = {
  id: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
};

export function TagInput({
  id,
  values,
  onChange,
  placeholder = "Type a tag and press Enter",
  error,
  hint,
}: TagInputProps) {
  const [draft, setDraft] = useState("");

  function commit(raw: string): void {
    /* Split on commas so pasting "Rust, Soroban, Stellar" lands as three tags
       rather than one long one — which is how anyone copying from an existing
       list will paste it. */
    const additions = raw
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
      /* Case-insensitive dedupe against what is already there: "rust" and
         "Rust" are the same tag with different capitalisation, and keeping
         both renders two chips that look like a mistake. The first spelling
         wins, because it is the one already reviewed. */
      .filter(
        (entry) =>
          !values.some(
            (existing) => existing.toLowerCase() === entry.toLowerCase(),
          ),
      );

    if (additions.length > 0) onChange([...values, ...additions]);
    setDraft("");
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      /* Enter inside a form submits it. This field's Enter means "finish the
         tag", so the default has to go. */
      event.preventDefault();
      commit(draft);
      return;
    }

    /* Backspace on an empty box removes the last chip — the behaviour every
       tag field has, and the reason nobody reaches for the mouse here. */
    if (event.key === "Backspace" && draft.length === 0 && values.length > 0) {
      event.preventDefault();
      onChange(values.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {values.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {values.map((tag, index) => (
            <li
              key={`${tag}-${index}`}
              className="flex items-center gap-1.5 rounded-md border border-border-strong bg-surface py-1 pl-2 pr-1 text-small text-foreground"
            >
              <Icon
                name={iconSlugForLabel(tag)}
                fallback
                className="size-3.5 shrink-0 text-muted"
              />
              {tag}
              <button
                type="button"
                onClick={() => onChange(values.filter((_, i) => i !== index))}
                aria-label={`Remove ${tag}`}
                className="inline-flex size-5 cursor-pointer items-center justify-center rounded text-muted transition-colors hover:text-warning"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="size-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <input
        id={id}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        /* Committing on blur as well as on Enter: a half-typed tag left behind
           when someone tabs to the next field would otherwise be silently
           discarded on save, and losing typed input is never the right
           default. */
        onBlur={() => commit(draft)}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(
          "h-9 w-full rounded-md border bg-background px-3 text-small text-foreground transition-colors placeholder:text-muted/70 hover:border-muted focus:border-accent focus:outline-none",
          error ? "border-warning/70" : "border-border-strong",
        )}
      />
    </div>
  );
}
