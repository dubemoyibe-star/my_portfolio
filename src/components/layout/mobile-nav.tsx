"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { DownloadIcon } from "@/components/ui/download-icon";
import { Icon } from "@/components/ui/icon";
import { sameDocumentHash } from "@/lib/nav";
import { cn } from "@/lib/utils";
import type { ContactLink, NavItem } from "@/types";

export type MobileNavProps = {
  nav: NavItem[];
  links: ContactLink[];
  cvHref: string;
};

/**
 * Hamburger opening a drop-down panel below the header.
 *
 * Props are plain data so the server component above can pass content straight
 * through — this file is the only part of the header that ships to the browser.
 *
 * The panel is portalled to `document.body`, and that is load-bearing rather
 * than tidiness: the header carries `backdrop-blur`, and per the Filter Effects
 * spec any element with a `backdrop-filter` becomes the containing block for
 * its `position: fixed` descendants. Rendered in place, the panel would resolve
 * against the 64px header instead of the viewport and open as a clipped strip.
 *
 * It is mounted only while open, so nothing touches `document` during SSR and
 * no mount flag is needed.
 *
 * Three ways out, which is why there is no separate close button: the scrim,
 * Escape, and the trigger itself, which toggles.
 */
export function MobileNav({ nav, links, cvHref }: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  /**
   * Anchor to scroll to once the panel has closed.
   *
   * Tapping a section link cannot just let the browser follow the href: the
   * panel locks `body { overflow: hidden }`, and the default anchor scroll runs
   * before React has re-rendered and released that lock, so the scroll is
   * swallowed and the page never moves. The scroll is therefore performed by
   * the lock effect's own cleanup, immediately after the lock comes off.
   *
   * A ref rather than state: this is a one-shot instruction to the cleanup, and
   * nothing renders from it.
   */
  const pendingHashRef = useRef<string | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    /* Stop the page behind the panel from scrolling. */
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);

    /* Move focus into the panel so the keyboard is not left behind it. */
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);

      const hash = pendingHashRef.current;
      pendingHashRef.current = null;
      if (!hash) return;

      const target = document.querySelector(hash);
      if (!target) return;

      /* One frame after the unlock, so the scroll runs against a page that can
         actually move. No `behavior` option: this inherits `scroll-behavior`
         from the stylesheet, which the reduced-motion block already switches to
         `auto`, and it honours the sections' `scroll-mt-16` so nothing lands
         underneath the sticky header. */
      requestAnimationFrame(() => {
        target.scrollIntoView();
        window.history.replaceState(null, "", hash);
      });
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleNavClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    const hash = sameDocumentHash(href, pathname);

    /* Pointing at another route — from /cv back to a section on /.
     *
     * This cannot be left to the browser's default action. Closing the panel
     * unmounts the portal, and with it this very anchor; a link removed from
     * the DOM during its own click handler has its navigation cancelled, so
     * the tap appears to do nothing at all. Navigate explicitly instead. */
    if (!hash) {
      event.preventDefault();
      setOpen(false);
      window.location.assign(href);
      return;
    }

    event.preventDefault();
    pendingHashRef.current = hash;
    setOpen(false);
  };

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((value) => !value)}
        className="flex size-10 items-center justify-center rounded-md border border-border text-muted transition-colors hover:border-border-strong hover:text-foreground"
      >
        {/* Two bars that cross into an X rather than a glyph swap.
            Both are absolutely centred and moved apart by transform alone, so
            open and closed differ only in `transform` and the browser has one
            animatable property to interpolate — swapping `top` values, or one
            icon for another, gives it nothing to tween and the change just
            snaps. `--ease-out-quart` is the shared easing from the design
            system, and the base layer's reduced-motion rule collapses the
            duration for anyone who has asked for that. */}
        <span aria-hidden="true" className="relative block size-4.5">
          <span
            className={cn(
              "absolute inset-x-0 top-1/2 h-px bg-current transition-transform duration-300 ease-out-quart",
              open ? "-translate-y-1/2 rotate-45" : "translate-y-[calc(-50%-3px)]",
            )}
          />
          <span
            className={cn(
              "absolute inset-x-0 top-1/2 h-px bg-current transition-transform duration-300 ease-out-quart",
              open ? "-translate-y-1/2 -rotate-45" : "translate-y-[calc(-50%+3px)]",
            )}
          />
        </span>
      </button>

      {open
        ? createPortal(
            <>
              {/* Scrim sits below the header's z-50, so the trigger stays lit
                  and clickable — tapping it again is one of the ways out. */}
              <div
                aria-hidden="true"
                onClick={close}
                className="fixed inset-0 z-40 bg-overlay"
              />

              <div
                id="mobile-nav"
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label="Menu"
                tabIndex={-1}
                className="fixed inset-x-4 top-[4.5rem] z-50 max-h-[calc(100svh-6rem)] overflow-y-auto rounded-lg border border-border bg-surface p-5 shadow-2xl outline-none"
              >
                {nav.length > 0 ? (
                  <nav aria-label="Primary">
                    <ul className="flex flex-col">
                      {nav.map((item) => (
                        <li key={item.href}>
                          <a
                            href={item.href}
                            onClick={(event) =>
                              handleNavClick(event, item.href)
                            }
                            className="flex items-center gap-3 py-3 text-foreground transition-colors hover:text-link"
                          >
                            <span
                              aria-hidden="true"
                              className="h-px w-4 bg-accent"
                            />
                            {item.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                ) : null}

                <div className="mt-4 flex flex-col gap-4 border-t border-border pt-5">
                  <Link
                    href={cvHref}
                    onClick={() => setOpen(false)}
                    className="flex h-11 items-center justify-center gap-2 rounded-md bg-accent px-5 text-small font-medium text-background"
                  >
                    <DownloadIcon />
                    Download CV
                  </Link>

                  {links.length > 0 ? (
                    <ul className="flex flex-wrap items-center gap-2">
                      {links.map((link) => (
                        <li key={link.href}>
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noreferrer noopener"
                            aria-label={link.label}
                            className="flex size-10 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:border-link/50"
                          >
                            <Icon name={link.icon} brand />
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </>,
            document.body,
          )
        : null}
    </div>
  );
}
