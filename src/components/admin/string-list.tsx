"use client";

import { useId, useRef } from "react";

import { buttonGhost, buttonIcon } from "@/components/admin/chrome";
import { cn } from "@/lib/utils";

/**
 * An ordered list of short strings — project and experience highlights, the
 * free-form tech labels on a contribution.
 *
 * ## Why not one textarea, one line each
 *
 * It is the obvious shortcut and it is worse in every way that matters here:
 * the order these render in is content (highlights are "strongest first"), and
 * moving line three above line one in a textarea is a cut and a paste rather
 * than a button. A textarea also makes an empty line indistinguishable from a
 * deleted one, which is how a bulleted list ends up with a gap in it.
 *
 * Blank entries are stripped when the record is saved rather than blocked as
 * you type — an input you have just added is empty, and refusing to accept that
 * for the second it takes to type into it would be hostile.
 */

type StringListFieldProps = {
  /** Ids are derived from this — keep it stable and unique on the page. */
  name: string;
  values: string[];
  onChange: (next: string[]) => void;
  /** Placeholder for an empty row. Write it as an example, not as a label. */
  placeholder?: string;
  addLabel?: string;
  emptyLabel?: string;
  /** True for a single-line input; false renders a textarea per row. */
  compact?: boolean;
};

export function StringListField({
  name,
  values,
  onChange,
  placeholder,
  addLabel = "Add",
  emptyLabel = "Nothing here yet.",
  compact = true,
}: StringListFieldProps) {
  const prefix = useId();
  /* Held so a newly added row can take focus. Without it, "Add" leaves the
     cursor on the button and every entry starts with a click. */
  const rowsRef = useRef<(HTMLInputElement | HTMLTextAreaElement | null)[]>([]);

  function update(index: number, value: string) {
    onChange(values.map((entry, i) => (i === index ? value : entry)));
  }

  function remove(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= values.length) return;
    const next = [...values];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function add() {
    onChange([...values, ""]);
    /* After the state lands. `requestAnimationFrame` rather than a timeout so
       it runs on the frame React paints the new row in. */
    requestAnimationFrame(() => rowsRef.current[values.length]?.focus());
  }

  return (
    <div className="flex flex-col gap-2">
      {values.length === 0 ? (
        <p className="text-small text-muted">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {values.map((value, index) => (
            <li key={`${prefix}-${index}`} className="flex items-start gap-2">
              <span className="label mt-2.5 w-5 shrink-0 text-right text-muted/70">
                {index + 1}
              </span>

              {compact ? (
                <input
                  ref={(node) => {
                    rowsRef.current[index] = node;
                  }}
                  id={`${prefix}-${index}`}
                  value={value}
                  onChange={(event) => update(index, event.target.value)}
                  placeholder={placeholder}
                  aria-label={`${name} ${index + 1}`}
                  className="h-9 w-full rounded-md border border-border-strong bg-background px-3 text-small text-foreground transition-colors placeholder:text-muted/70 hover:border-muted focus:border-accent focus:outline-none"
                />
              ) : (
                <textarea
                  ref={(node) => {
                    rowsRef.current[index] = node;
                  }}
                  id={`${prefix}-${index}`}
                  rows={2}
                  value={value}
                  onChange={(event) => update(index, event.target.value)}
                  placeholder={placeholder}
                  aria-label={`${name} ${index + 1}`}
                  className="w-full rounded-md border border-border-strong bg-background px-3 py-2 text-small leading-relaxed text-foreground transition-colors placeholder:text-muted/70 hover:border-muted focus:border-accent focus:outline-none"
                />
              )}

              <span className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move ${name} ${index + 1} up`}
                  className={buttonIcon}
                >
                  <ChevronIcon />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === values.length - 1}
                  aria-label={`Move ${name} ${index + 1} down`}
                  className={cn(buttonIcon, "rotate-180")}
                >
                  <ChevronIcon />
                </button>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label={`Remove ${name} ${index + 1}`}
                  className={cn(buttonIcon, "hover:border-warning/50 hover:text-warning")}
                >
                  <CloseIcon />
                </button>
              </span>
            </li>
          ))}
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
