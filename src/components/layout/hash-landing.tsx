"use client";

import { useEffect } from "react";

/**
 * Re-asserts the scroll position when the page is opened at a fragment.
 *
 * Arriving from `/cv` at `/#projects` is a cross-document navigation, and the
 * browser's own jump to the anchor is unreliable here: `scroll-behavior:
 * smooth` is set globally, and a smooth scroll begun during load competes with
 * fonts and images settling above the target. The result is landing at the top
 * of the page instead of at the section.
 *
 * So once mounted, this scrolls to the fragment itself, instantly — someone who
 * followed a link wants to be there, not to watch the journey. In the normal
 * case it re-asserts a position the browser already reached and nothing moves.
 */
export function HashLanding() {
  useEffect(() => {
    const { hash } = window.location;
    if (hash.length < 2) return;

    let target: Element | null = null;
    try {
      target = document.querySelector(hash);
    } catch {
      /* Not a valid selector — nothing to do. */
      return;
    }
    if (!target) return;

    const frame = requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "auto" });
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return null;
}
