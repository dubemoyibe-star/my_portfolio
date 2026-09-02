import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * The furniture every admin screen is built out of: page headers, grouping
 * panels, empty states, banners, and the three button treatments.
 *
 * All server-safe — nothing here holds state, so a list page stays HTML and
 * only the forms ship JavaScript.
 *
 * ## Three buttons, and only three
 *
 * `primary` is the one commit on the screen and is the only place the accent
 * appears, which is the design system's rule about the accent being a budget
 * rather than a colour. `ghost` is everything else — cancel, back, secondary
 * navigation. `danger` is `warning`-toned and is reserved for the second step
 * of a delete, never the first. A screen with two accent buttons on it is a
 * screen where the operator has to read both to find out which one is the
 * action, so the vocabulary stops here.
 */

/* ==========================================================================
   Buttons
   ========================================================================== */

const BUTTON_BASE =
  "inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md px-3.5 text-small font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-55";

export const buttonPrimary = cn(
  BUTTON_BASE,
  "bg-accent text-background transition-shadow hover:shadow-glow-accent disabled:shadow-none",
);

export const buttonGhost = cn(
  BUTTON_BASE,
  "border border-border bg-surface text-muted hover:border-border-strong hover:text-foreground",
);

export const buttonDanger = cn(
  BUTTON_BASE,
  "border border-warning/40 bg-warning-subtle text-warning hover:border-warning/70 hover:bg-warning/15",
);

/** Small square button for row-level icon actions — reorder, remove. */
export const buttonIcon =
  "inline-flex size-8 cursor-pointer items-center justify-center rounded-md border border-border bg-surface text-muted transition-colors hover:border-border-strong hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40";

/* ==========================================================================
   Page header
   ========================================================================== */

type PageHeaderProps = {
  /** Mono eyebrow — the section this page belongs to. */
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  /** Where "back" goes. Rendered as a text link above the title. */
  backHref?: string;
  backLabel?: string;
  /** Primary and secondary actions, right-aligned on wide viewports. */
  actions?: React.ReactNode;
};

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  backHref,
  backLabel = "Back",
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        {backHref ? (
          <Link
            href={backHref}
            className="label inline-flex items-center gap-1.5 text-muted transition-colors hover:text-foreground"
          >
            <span aria-hidden="true">←</span>
            {backLabel}
          </Link>
        ) : eyebrow ? (
          <p className="label text-muted">{eyebrow}</p>
        ) : null}

        <h1 className="mt-2 text-h4 text-foreground">{title}</h1>

        {description ? (
          <p className="mt-1.5 max-w-prose-page text-small text-muted">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

/* ==========================================================================
   Panel
   ========================================================================== */

type PanelProps = {
  title: string;
  description?: React.ReactNode;
  /** Rendered in the panel header, opposite the title. */
  actions?: React.ReactNode;
  className?: string;
  /** Drop the inner padding — for a panel whose body is a full-bleed table. */
  flush?: boolean;
  children: React.ReactNode;
};

/**
 * A titled group of fields.
 *
 * The long forms here — a project has nineteen fields — are unusable as one
 * flat column. Panels give the operator somewhere to stop reading, and give a
 * validation error a neighbourhood rather than a position in a list.
 */
export function Panel({
  title,
  description,
  actions,
  className,
  flush,
  children,
}: PanelProps) {
  return (
    <section
      className={cn(
        "rounded-lg border border-border bg-surface/40",
        className,
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-h6 text-foreground">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-small text-muted">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </header>

      <div className={flush ? undefined : "p-4 sm:p-5"}>{children}</div>
    </section>
  );
}

/* ==========================================================================
   Empty state
   ========================================================================== */

type EmptyStateProps = {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
};

/**
 * What a list shows when it has nothing in it.
 *
 * Dashed rather than solid, so it reads as a space waiting to be filled and
 * not as a card that failed to load — the distinction matters most in
 * Experience, which is legitimately empty and will stay that way for a while.
 */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-border-strong bg-surface/30 px-6 py-12 text-center">
      <p className="text-small font-medium text-foreground">{title}</p>
      {description ? (
        <p className="mx-auto mt-1.5 max-w-prose-page text-small text-muted">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/* ==========================================================================
   Banner
   ========================================================================== */

type BannerProps = {
  tone: "success" | "error" | "info";
  children: React.ReactNode;
  className?: string;
};

const BANNER_TONES = {
  success: "border-accent/30 bg-accent-subtle text-accent",
  error: "border-warning/30 bg-warning-subtle text-warning",
  info: "border-link/30 bg-link-subtle text-link",
} as const;

/**
 * The form-level outcome message.
 *
 * `role="status"` rather than `role="alert"`: these are announced after an
 * action the operator just took, and an assertive interruption for "Saved" is
 * the kind of thing that makes people turn a screen reader off.
 */
export function Banner({ tone, children, className }: BannerProps) {
  return (
    <p
      role="status"
      className={cn(
        "flex items-start gap-2 rounded-md border px-3 py-2.5 text-small",
        BANNER_TONES[tone],
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {tone === "success" ? (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M8.5 12.5l2.5 2.5 4.5-5" />
          </>
        ) : (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4.5M12 16h.01" />
          </>
        )}
      </svg>
      <span className="min-w-0">{children}</span>
    </p>
  );
}

/* ==========================================================================
   Metadata chips
   ========================================================================== */

/**
 * The small mono flags that run along a list row — "Featured", "On CV",
 * a status, an order number.
 *
 * `accent` is spent here on `featured` alone. It is the flag that changes what
 * the public site puts at the top of the page, so it is the one worth being
 * able to spot without reading.
 */
export function Chip({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "accent" | "warning" | "link";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "label inline-flex items-center gap-1 whitespace-nowrap rounded border px-1.5 py-0.5",
        tone === "accent" && "border-accent/30 bg-accent-subtle text-accent",
        tone === "warning" && "border-warning/30 bg-warning-subtle text-warning",
        tone === "link" && "border-link/30 bg-link-subtle text-link",
        tone === "neutral" && "border-border-strong bg-surface text-muted",
      )}
    >
      {children}
    </span>
  );
}
