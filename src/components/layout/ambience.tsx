/**
 * Slow warm wash behind the whole page.
 *
 * Three soft radial fields drifting on long, out-of-phase cycles. The intent is
 * something you notice on arrival and then stop seeing — warmth on a cold dark
 * ground, not an effect demanding attention.
 *
 * Fixed rather than absolute, so it stays put while content scrolls over it.
 *
 * Sits at `z-0`, not a negative index: the body paints `--background`, and
 * anything behind that is simply invisible. Content layers above with
 * `relative z-10`. `overflow-hidden` keeps the drifting fields from widening
 * the document and producing a horizontal scrollbar.
 */
export function Ambience() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="ambient-warm absolute -left-[15%] -top-[20%] size-[75vmax]" />
      <div className="ambient-cool absolute -right-[20%] top-[15%] size-[65vmax]" />
      <div className="ambient-warm-soft absolute -bottom-[25%] left-[10%] size-[70vmax]" />
    </div>
  );
}
