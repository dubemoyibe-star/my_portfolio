"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

/**
 * Form primitives for the admin editors.
 *
 * These are not the public site's components and are not trying to be. The
 * portfolio is a document to be read; this is a tool to be operated, and the
 * two want opposite things — dense rows over generous rhythm, a visible outline
 * on every input over a hairline that only appears on focus, the same control
 * repeated identically forty times over a bespoke treatment per section.
 *
 * What they do share is the token layer: `surface`, `border`, `accent`,
 * `warning`, the Geist pair, the `label` utility. Nothing here introduces a
 * colour or a size that `globals.css` does not already define, so the admin
 * reads as the same product without pretending to be the same surface.
 *
 * ## The error contract
 *
 * Every control takes an optional `error` string. When it is present the field
 * outlines in `warning`, the message renders beneath it, and `aria-invalid`
 * plus `aria-describedby` are wired so a screen reader reaches the message from
 * the input. That wiring is the reason these exist as components rather than as
 * a class string — it is exactly the part that gets skipped when each form
 * spells its own inputs out.
 */

/* ==========================================================================
   Shared styling
   ========================================================================== */

const CONTROL_BASE =
  "w-full rounded-md border bg-background px-3 text-small text-foreground transition-colors placeholder:text-muted/70 hover:border-muted focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-55";

function controlClass(error: boolean, extra?: string): string {
  return cn(
    CONTROL_BASE,
    error ? "border-warning/70 hover:border-warning" : "border-border-strong",
    extra,
  );
}

/* ==========================================================================
   Field wrapper
   ========================================================================== */

type FieldProps = {
  label: string;
  /** Id of the control this labels. */
  htmlFor: string;
  error?: string;
  /** Static guidance — a format, a rule. Steps aside when an error appears. */
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="label flex items-center gap-1.5 text-muted"
      >
        {label}
        {required ? (
          /* Marked on the label rather than left to the browser's own
             validation, because these forms submit through server actions and
             never trigger it. */
          <span aria-hidden="true" className="text-warning">
            *
          </span>
        ) : null}
      </label>

      {children}

      {/* One description at a time. Two lines of guidance under every input is
          where a form of this size starts to read as a wall of text. */}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-small text-warning">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-small text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Ties an input to whichever of its two possible descriptions is rendered. */
function describedBy(id: string, error?: string, hint?: string) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

/* ==========================================================================
   Controls
   ========================================================================== */

type TextInputProps = Omit<React.ComponentProps<"input">, "className"> & {
  id: string;
  error?: string;
  hint?: string;
  className?: string;
  /** Render in the mono face — for slugs, ids, dates and URLs. */
  mono?: boolean;
};

export function TextInput({
  error,
  hint,
  mono,
  className,
  id,
  ...props
}: TextInputProps) {
  return (
    <input
      id={id}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(id, error, hint)}
      className={controlClass(
        Boolean(error),
        cn("h-9", mono && "font-mono", className),
      )}
      {...props}
    />
  );
}

type TextAreaProps = Omit<React.ComponentProps<"textarea">, "className"> & {
  id: string;
  error?: string;
  hint?: string;
  className?: string;
};

export function TextArea({
  error,
  hint,
  className,
  id,
  rows = 5,
  ...props
}: TextAreaProps) {
  return (
    <textarea
      id={id}
      rows={rows}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(id, error, hint)}
      className={controlClass(
        Boolean(error),
        cn("py-2 leading-relaxed", className),
      )}
      {...props}
    />
  );
}

type SelectInputProps = Omit<React.ComponentProps<"select">, "className"> & {
  id: string;
  error?: string;
  hint?: string;
  className?: string;
  options: readonly { value: string; label: string }[];
  /** Placeholder entry for an optional select. Omit to force a real choice. */
  placeholder?: string;
};

/**
 * A native `<select>` with the platform caret replaced.
 *
 * `appearance-none` strips the OS-drawn arrow, which on this ground paints as
 * a pale rectangle welded to the right edge, and the chevron below takes its
 * place. The element itself stays a real `<select>` — the popup, the keyboard
 * behaviour and the mobile wheel are all things a custom listbox would have to
 * rebuild badly.
 */
export function SelectInput({
  error,
  hint,
  className,
  id,
  options,
  placeholder,
  ...props
}: SelectInputProps) {
  return (
    <div className="relative">
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={controlClass(
          Boolean(error),
          cn("h-9 cursor-pointer appearance-none pr-9", className),
        )}
        {...props}
      >
        {placeholder !== undefined ? (
          <option value="">{placeholder}</option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  );
}

/* ==========================================================================
   Toggle
   ========================================================================== */

type ToggleProps = {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
};

/**
 * A boolean, as a switch.
 *
 * A real `<input type="checkbox">` under a drawn track, rather than a `<div>`
 * with `role="switch"`: the native element already carries keyboard activation,
 * focus handling and form semantics, and every hand-rolled substitute is an
 * attempt to win those back. `peer-checked` does the painting.
 */
export function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: ToggleProps) {
  const id = useId();

  return (
    /* One wrapping label rather than a sibling `htmlFor` pair, so the track,
       the knob and the caption are all part of the same hit target — a switch
       whose switch is the one part you cannot click is a bug people work
       around rather than report. */
    <label
      className={cn(
        "flex select-none items-start gap-3",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
      )}
    >
      <span className="relative mt-0.5 flex shrink-0 items-center">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="peer size-0 appearance-none opacity-0"
        />
        <span
          aria-hidden="true"
          className={cn(
            "block h-5 w-9 rounded-full border transition-colors",
            checked
              ? "border-accent bg-accent"
              : "border-border-strong bg-background",
            "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent",
            "peer-disabled:opacity-55",
          )}
        />
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute left-0.5 size-4 rounded-full transition-transform",
            checked ? "translate-x-4 bg-background" : "translate-x-0 bg-muted",
          )}
        />
      </span>

      <span>
        <span className="block text-small text-foreground">{label}</span>
        {description ? (
          <span className="block text-small text-muted">{description}</span>
        ) : null}
      </span>
    </label>
  );
}
