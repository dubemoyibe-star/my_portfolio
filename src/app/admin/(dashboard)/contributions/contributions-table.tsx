"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import {
  Banner,
  Chip,
  buttonGhost,
  buttonIcon,
} from "@/components/admin/chrome";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { cn } from "@/lib/utils";

import { deleteContribution, reorderContributions } from "./actions";

/**
 * The contributions list, with the ranking as a control rather than a column of
 * numbers to be edited one at a time.
 *
 * ## Why the arrows are here and not in the form
 *
 * Moving an entry is a statement about the whole list — "this one goes above
 * that one" — and the only way to express it without leaving duplicates is to
 * rewrite every position at once. That is what `reorderContributions` does, and
 * it needs the full sequence, which only this screen has. The form's `order`
 * field still exists for the occasional deliberate number, but nobody has to
 * use it to reorder.
 *
 * ## Why the displayed order is local state
 *
 * Reordering is a sequence of small adjustments — up, up, down again — so the
 * row has to move the instant the arrow is pressed, well before the write
 * returns. That makes the sequence on screen the thing being edited, and every
 * move has to be computed from *it* rather than from the server prop, which is
 * still describing the order as it was one or more moves ago. Deriving a swap
 * from the stale prop silently loses moves: the second click computes against
 * an array where the first click never happened.
 *
 * `useOptimistic` was the obvious fit and is the wrong one here, because its
 * value reverts the moment the transition settles — which happens before
 * `router.refresh()` has delivered new props, so a second move can land on the
 * pre-move order. Plain state, adopted from the server whenever fresh rows
 * arrive, has no such window.
 *
 * ## Writes are serialised
 *
 * Each move sends the *complete* sequence, so the last write to arrive is the
 * one that matters — which makes arrival order the only thing that can corrupt
 * the ranking. The promise chain guarantees one write finishes before the next
 * begins, so clicking faster than the network is safe rather than merely
 * unlikely to break.
 */

export type ContributionRow = {
  id: string;
  slug: string;
  repoName: string;
  owner: string | null;
  order: number | null;
  featured: boolean;
  includeInResume: boolean;
  tech: string[];
  prLinkCount: number;
  updatedAt: string;
};

export function ContributionsTable({ rows }: { rows: ContributionRow[] }) {
  const router = useRouter();
  const [shown, setShown] = useState(rows);
  const [adopted, setAdopted] = useState(rows);
  const [saving, setSaving] = useState(0);
  const [error, setError] = useState<string | null>(null);

  /* Adopt whatever the server last said, during render rather than in an
     effect — React's own pattern for adjusting state when a prop changes, and
     the one that avoids painting the stale order for a frame first.
     `rows` is a fresh array on every server render and untouched by this
     component's own state updates, so the comparison is true exactly when new
     data arrives.

     The `saving` guard is what makes rapid clicking safe. A refresh triggered
     by the first of three queued moves describes the order after move one;
     adopting it would throw away moves two and three that are already on
     screen and already queued to be written. Holding off until the queue is
     empty means the sequence on screen is only ever replaced by a server
     answer that has seen every move. `adopted` deliberately is not updated
     while a write is in flight, so the adoption simply happens on the next
     render once the queue drains. */
  if (saving === 0 && adopted !== rows) {
    setAdopted(rows);
    setShown(rows);
  }

  /* Serialises the writes. Holding the tail of the chain in a ref rather than
     in state keeps a queued write from triggering a render of its own. */
  const chain = useRef<Promise<void>>(Promise.resolve());

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= shown.length) return;

    /* Computed from what is on screen, not from `rows` — see the note above. */
    const next = [...shown];
    [next[index], next[target]] = [next[target], next[index]];
    setShown(next);
    setError(null);
    setSaving((count) => count + 1);

    const ids = next.map((row) => row.id);
    chain.current = chain.current
      .then(async () => {
        const result = await reorderContributions(ids);
        if (!result.ok) {
          setError(result.formError ?? "The order could not be saved.");
          /* Snap back to the server's version. Nothing was typed, so there is
             nothing to lose by discarding the move. */
          setShown(rows);
        }
      })
      .catch(() => {
        setError("The order could not be saved.");
        setShown(rows);
      })
      .finally(() => {
        setSaving((count) => count - 1);
        /* Pulls the renumbered rows back down, so the rank column shows the
           positions that were actually written. */
        router.refresh();
      });
  }

  const pending = saving > 0;

  return (
    <div className="flex flex-col gap-3">
      {error ? <Banner tone="error">{error}</Banner> : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[58rem] border-collapse text-small">
          <thead>
            <tr className="border-b border-border text-left">
              <Th className="w-14">Rank</Th>
              <Th className="w-[26%]">Repository</Th>
              <Th className="w-[24%]">Tech</Th>
              <Th>PRs</Th>
              <Th>Flags</Th>
              <Th>Updated</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>

          <tbody className={cn(pending && "opacity-70")}>
            {shown.map((row, index) => (
              <tr
                key={row.id}
                className="border-b border-border/60 align-middle last:border-b-0 hover:bg-surface/60"
              >
                <Td>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 shrink-0 font-mono text-muted">
                      {row.order ?? "—"}
                    </span>
                    <span className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => move(index, -1)}
                        disabled={index === 0}
                        aria-label={`Move ${row.repoName} up`}
                        className={cn(buttonIcon, "size-5 border-0 bg-transparent")}
                      >
                        <ChevronIcon />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(index, 1)}
                        disabled={index === shown.length - 1}
                        aria-label={`Move ${row.repoName} down`}
                        className={cn(
                          buttonIcon,
                          "size-5 rotate-180 border-0 bg-transparent",
                        )}
                      >
                        <ChevronIcon />
                      </button>
                    </span>
                  </div>
                </Td>

                <Td>
                  <Link
                    href={`/admin/contributions/${row.id}`}
                    className="block truncate font-medium text-foreground hover:text-link"
                  >
                    {row.repoName}
                  </Link>
                  <span className="block truncate font-mono text-label text-muted">
                    {row.owner ? `${row.owner}/` : ""}
                    {row.slug}
                  </span>
                </Td>

                <Td>
                  {row.tech.length === 0 ? (
                    <span className="text-muted/60">—</span>
                  ) : (
                    <span className="flex flex-wrap gap-1">
                      {/* Three, then a count. The column is a glance at what
                          the entry touched, not the full list — that is on the
                          edit screen. */}
                      {row.tech.slice(0, 3).map((tag) => (
                        <Chip key={tag} preserveCase>
                          {tag}
                        </Chip>
                      ))}
                      {row.tech.length > 3 ? (
                        <span className="label self-center text-muted">
                          +{row.tech.length - 3}
                        </span>
                      ) : null}
                    </span>
                  )}
                </Td>

                <Td className="whitespace-nowrap text-muted">
                  <span
                    className={cn(
                      "font-mono",
                      row.prLinkCount === 0 && "text-warning",
                    )}
                  >
                    {row.prLinkCount}
                  </span>{" "}
                  {row.prLinkCount === 1 ? "link" : "links"}
                </Td>

                <Td>
                  <span className="flex flex-wrap gap-1">
                    {row.featured ? <Chip tone="accent">Featured</Chip> : null}
                    {row.includeInResume ? <Chip>On CV</Chip> : null}
                    {!row.featured && !row.includeInResume ? (
                      <span className="text-muted/60">—</span>
                    ) : null}
                  </span>
                </Td>

                <Td className="whitespace-nowrap text-muted">{row.updatedAt}</Td>

                <Td className="text-right">
                  <span className="inline-flex items-center justify-end gap-1.5">
                    <Link
                      href={`/admin/contributions/${row.id}`}
                      className={cn(buttonGhost, "h-8")}
                    >
                      Edit
                    </Link>
                    <ConfirmDelete
                      title="Delete contribution"
                      description={
                        <>
                          <strong className="text-foreground">
                            {row.repoName}
                          </strong>{" "}
                          will be removed from the database, along with its{" "}
                          {row.prLinkCount} PR link
                          {row.prLinkCount === 1 ? "" : "s"}, and will disappear
                          from the public site. This cannot be undone.
                        </>
                      }
                      confirmLabel="Delete contribution"
                      action={deleteContribution.bind(null, row.id)}
                      triggerIconOnly
                      triggerLabel={`Delete ${row.repoName}`}
                    />
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={cn("label px-4 py-2.5 font-medium text-muted", className)}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={cn("px-4 py-3", className)}>{children}</td>;
}

function ChevronIcon() {
  return (
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
      <path d="M6 15l6-6 6 6" />
    </svg>
  );
}
