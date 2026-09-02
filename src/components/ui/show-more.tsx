"use client";

import { useId, useState } from "react";

/**
 * Caps a long list at `step` items and reveals `step` more per press.
 *
 * Four projects and six contributions fit on a page. Twenty of either do not —
 * the Projects grid and the Contributions rail both grow without limit, and a
 * home page whose middle third is an endless list stops being a summary. This
 * puts a floor under that without needing a separate index page.
 *
 * ## Every item is still in the HTML
 *
 * The children are all rendered, always; the overflow is hidden with CSS rather
 * than sliced out of the tree. That costs a little markup and buys three
 * things: the whole list is in the served HTML for a crawler, revealing more is
 * instant with no request and no layout jump, and — with the fallback below —
 * nothing is permanently unreachable.
 *
 * Slicing in JavaScript (`items.slice(0, visible)`) would have been fewer lines
 * and would have put six of twenty contributions in the document.
 *
 * ## Why a `<style>` element and not a class per child
 *
 * The cut-off point is a number that changes, and CSS cannot compare
 * `:nth-child()` against a variable. The alternatives were cloning every child
 * to inject a prop — which requires each card component to accept and forward
 * it, coupling them to this one — or wrapping each child in an element this
 * component owns, which is invalid inside `<ol>` and disturbs the grid. One
 * generated rule, scoped to a generated id, touches nothing it does not own.
 *
 * The rule is rendered on the server too, so the collapsed state is there at
 * first paint. Nothing expands and snaps shut on hydration.
 *
 * ## The no-JS fallback
 *
 * This site already needs JavaScript to *navigate* — the mobile menu is a
 * client component. What it has never done is leave content permanently
 * invisible, which is exactly why the root layout carries a `<noscript>` block
 * for the reveal animation. A button that does nothing would break that promise
 * for every item past the sixth, so the same trick is used here: a
 * `<noscript>` rule that reveals the overflow and removes the button.
 *
 * That rule has to restore a real `display` value, because `revert` would throw
 * away the item's own (a project card is `flex`). Hence `itemDisplay` — the one
 * thing this component has to be told about the children it is given.
 */

export type ShowMoreProps = {
  /** How many are visible at first, and how many each press adds. */
  step?: number;
  /**
   * The container element. `ol`/`ul` when the children are `<li>`s, so the
   * list stays a list.
   */
  as?: "div" | "ol" | "ul";
  /**
   * The CSS `display` an item has when visible.
   *
   * Only the `<noscript>` rule uses it. `revert` is not good enough: it drops
   * the author's own value, so a card that is `flex` would come back `block`.
   */
  itemDisplay: string;
  /** Plural noun for the button: "projects", "contributions". */
  noun: string;
  className?: string;
  children: React.ReactNode;
};

export function ShowMore({
  step = 6,
  as: Container = "div",
  itemDisplay,
  noun,
  className,
  children,
}: ShowMoreProps) {
  /* `useId()` returns something like `«r1»`, which is not a valid CSS
     identifier. Stripping everything but word characters leaves a unique,
     selector-safe id. */
  const scope = `show-more-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [visible, setVisible] = useState(step);

  /* Counted from the rendered children rather than taken as a prop, so the
     button can never disagree with the list it belongs to. */
  const total = childCount(children);
  const hidden = Math.max(0, total - visible);
  const nextBatch = Math.min(step, hidden);

  /* Nothing to collapse: render the container and stop. No style element, no
     button, no id — a list of four projects should not carry the machinery for
     a list of forty. */
  if (total <= step) {
    return <Container className={className}>{children}</Container>;
  }

  return (
    <>
      {/* Hides everything past the cut-off. Server-rendered, so the page is
          collapsed on arrival rather than after hydration. */}
      <style>{`#${scope}>:nth-child(n+${visible + 1}){display:none}`}</style>

      {/* Later in the document than the rule above and of equal specificity, so
          it wins — but only when scripting is off, where the button below can
          never do anything. */}
      <noscript>
        <style>{`#${scope}>:nth-child(n+${step + 1}){display:${itemDisplay}}#${scope}-more{display:none}`}</style>
      </noscript>

      <Container id={scope} className={className}>
        {children}
      </Container>

      <div className="mt-10 flex flex-col items-center gap-3">
        {hidden > 0 ? (
          <button
            id={`${scope}-more`}
            type="button"
            onClick={() => setVisible((current) => current + step)}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-4 text-small text-foreground transition-all hover:border-accent/50 hover:text-accent hover:shadow-glow-accent"
          >
            Show {nextBatch} more
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="size-4 shrink-0 opacity-70"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        ) : null}

        {/* Focus stays on the button — it is still there to press again — so
            this line is the only thing that reports what just happened. It is
            mounted for as long as the list is collapsible, rather than
            appearing with its own text: a live region that arrives at the same
            moment its content does is announced unreliably across readers. */}
        <p aria-live="polite" className="label text-muted">
          Showing {Math.min(visible, total)} of {total} {noun}
        </p>
      </div>
    </>
  );
}

/**
 * How many children were passed.
 *
 * `Children.count` counts a single array child as one, and both call sites pass
 * exactly that — the result of a `.map()`. Flattening first is what makes the
 * number match the elements the CSS rule will be counting.
 */
function childCount(children: React.ReactNode): number {
  let count = 0;
  const walk = (node: React.ReactNode) => {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (node === null || node === undefined || typeof node === "boolean") return;
    count += 1;
  };
  walk(children);
  return count;
}
