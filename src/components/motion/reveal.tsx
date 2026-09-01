"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export type RevealProps = {
  /** Seconds before the first element animates. */
  delay?: number;
  /** Seconds between each element. Keep small — this should feel like one move. */
  stagger?: number;
  className?: string;
  children: React.ReactNode;
};

/**
 * Staggered entrance for its `[data-reveal]` descendants.
 *
 * Children stay server components — they are passed in, not imported here, so
 * only this wrapper ships to the browser.
 *
 * The pre-animation state (`opacity: 0`) lives in CSS rather than being set by
 * this effect, because an effect only runs after hydration: setting it here
 * would let the content paint, then blink out and animate back in. `globals.css`
 * also restores that state to visible under `prefers-reduced-motion` and inside
 * `<noscript>`, so nothing is ever permanently invisible if GSAP never runs.
 */
export function Reveal({
  delay = 0.05,
  stagger = 0.08,
  className,
  children,
}: RevealProps) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const targets = gsap.utils.toArray<HTMLElement>("[data-reveal]");
      if (targets.length === 0) return;

      /* Respect the OS setting: land on the final state, skip the motion. */
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(targets, { opacity: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        targets,
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger,
          delay,
          /* Drop the inline transform once done so it cannot fight later CSS. */
          clearProps: "transform",
        },
      );
    },
    { scope, dependencies: [delay, stagger] },
  );

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  );
}
