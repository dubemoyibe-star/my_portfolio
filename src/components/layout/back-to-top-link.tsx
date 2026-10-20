"use client";

/**
 * Scrolls to the document start when already on the home page. From another
 * route, the normal root-relative anchor navigation loads the home page at its
 * hero target; HashLanding handles the post-navigation position.
 */
export function BackToTopLink() {
  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (window.location.pathname !== "/") return;

    event.preventDefault();
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion) {
      window.scrollTo(0, 0);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <a
      href="/#top"
      onClick={handleClick}
      className="text-small text-muted transition-colors hover:text-link"
    >
      Back to top <span aria-hidden="true">↑</span>
    </a>
  );
}
