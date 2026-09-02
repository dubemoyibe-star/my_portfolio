"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";

import { buttonDanger, buttonGhost } from "@/components/admin/chrome";
import type { ActionResult } from "@/lib/admin/validation";
import { cn } from "@/lib/utils";

/**
 * The confirmation step in front of every destructive action.
 *
 * ## Why a dialog and not an inline "are you sure?"
 *
 * The two-step inline swap is cheaper to build and worse to use: the confirm
 * button lands under the cursor that just pressed delete, which is the exact
 * geometry that turns a mis-click into a deletion. A modal puts the confirm
 * somewhere the pointer has to travel to, and — more usefully — has room to
 * name the record. "Delete Stenion" is a decision; "Are you sure?" is a reflex.
 *
 * ## Why native `<dialog>`
 *
 * `showModal()` brings focus trapping, the top layer, an inert background,
 * Escape-to-close and a `::backdrop` with it. Every one of those is something a
 * hand-rolled overlay has to reimplement, and most hand-rolled overlays
 * reimplement two of them.
 *
 * ## What it does with the result
 *
 * `action` is a bound server action. A rejection comes back as
 * `{ ok: false }` with a message, which stays inside the dialog — a delete that
 * failed because a tech item is still referenced by three projects needs to say
 * so, and closing the dialog first would throw that sentence away. On success
 * the dialog closes and the router refreshes, unless `redirectTo` is given, in
 * which case the caller is on the record's own page and cannot stay there.
 */

type ConfirmDeleteProps = {
  /** Heading. Names the operation: "Delete project". */
  title: string;
  /** What is about to happen, in full. Include the record's name. */
  description: React.ReactNode;
  /** The bound server action. `deleteThing.bind(null, id)`. */
  action: () => Promise<ActionResult>;
  confirmLabel?: string;
  /** Where to go afterwards. Omit to stay put and refresh. */
  redirectTo?: string;
  /** Text on the button that opens the dialog. */
  triggerLabel?: string;
  /** Compact icon-only trigger, for a dense list row. */
  triggerIconOnly?: boolean;
  triggerClassName?: string;
};

export function ConfirmDelete({
  title,
  description,
  action,
  confirmLabel = "Delete",
  redirectTo,
  triggerLabel = "Delete",
  triggerIconOnly = false,
  triggerClassName,
}: ConfirmDeleteProps) {
  const router = useRouter();
  /* Several of these render side by side in a list, so the heading id that
     labels the dialog has to be per-instance or every row points at the first
     one. */
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  /* `showModal()` is imperative and has no declarative equivalent — the `open`
     attribute renders a non-modal dialog with no backdrop and no focus trap,
     which is not the same element. So React owns the state and this effect
     mirrors it onto the DOM node. */
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      /* Cancel is the safe landing spot, so a stray Enter dismisses rather
         than deletes. DOM order already puts it first and `showModal()` would
         reach it on its own; doing it explicitly means reordering the footer
         buttons later cannot quietly move focus onto the destructive one. */
      cancelRef.current?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function close() {
    /* A dismissal mid-request would leave the mutation running with nowhere to
       report to. The buttons are disabled while pending; this covers Escape,
       which the browser handles without asking. */
    if (pending) return;
    setOpen(false);
    setError(null);
  }

  function confirm() {
    setError(null);
    startTransition(async () => {
      let result: ActionResult;
      try {
        result = await action();
      } catch {
        setError("The delete could not be completed. Try again.");
        return;
      }

      if (!result.ok) {
        setError(result.formError ?? "The delete could not be completed.");
        return;
      }

      setOpen(false);
      if (redirectTo) {
        router.push(redirectTo);
      }
      /* Refresh either way: after a push the destination is usually the list
         this record was just removed from, and it renders from the router
         cache unless it is told the data moved. */
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={triggerIconOnly ? triggerLabel : undefined}
        className={cn(
          triggerIconOnly
            ? "inline-flex size-8 cursor-pointer items-center justify-center rounded-md border border-border bg-surface text-muted transition-colors hover:border-warning/50 hover:text-warning"
            : cn(buttonGhost, "hover:border-warning/50 hover:text-warning"),
          triggerClassName,
        )}
      >
        <TrashIcon />
        {triggerIconOnly ? null : triggerLabel}
      </button>

      <dialog
        ref={dialogRef}
        onClose={close}
        /* Escape is the browser's own, and it would close the dialog out from
           under an in-flight delete — taking the failure message with it, since
           there would be nowhere left to render one. Cancelled while pending;
           the request finishes and reports either way. */
        onCancel={(event) => {
          if (pending) event.preventDefault();
        }}
        /* Clicking the backdrop closes. The check is on the target being the
           dialog itself: a click inside the panel bubbles up to the dialog
           element too, and without this the form would close under its own
           buttons. */
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
        aria-labelledby={titleId}
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-lg border border-border bg-surface p-0 text-foreground backdrop:bg-overlay backdrop:backdrop-blur-sm"
      >
        <div className="p-5">
          <h2 id={titleId} className="text-h6 text-foreground">
            {title}
          </h2>
          <div className="mt-2 text-small text-muted">{description}</div>

          {error ? (
            <p
              role="alert"
              className="mt-4 rounded-md border border-warning/30 bg-warning-subtle px-3 py-2.5 text-small text-warning"
            >
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button
              ref={cancelRef}
              type="button"
              onClick={close}
              disabled={pending}
              className={buttonGhost}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={pending}
              className={buttonDanger}
            >
              {pending ? "Deleting…" : confirmLabel}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
    </svg>
  );
}
