"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { DownloadIcon } from "@/components/ui/download-icon";
import { Icon } from "@/components/ui/icon";
import type { ContactLink, NavItem } from "@/types";

export type MobileNavProps = {
  nav: NavItem[];
  links: ContactLink[];
  cvHref: string;
};

/**
 * Hamburger opening a full-screen overlay.
 *
 * A bottom bar would suit an app with persistent destinations; this is one
 * scrolling page of anchors, so an overlay gives large touch targets without
 * permanently spending vertical space on a phone.
 *
 * Props are plain data so the server component above can pass content straight
 * through — this file is the only part of the header that ships to the browser.
 */
export function MobileNav({ nav, links, cvHref }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  /**
   * Anchor to scroll to once the overlay has closed.
   *
   * Tapping a section link cannot just let the browser follow the href: the
   * overlay locks `body { overflow: hidden }`, and the default anchor scroll
   * runs before React has re-rendered and released that lock, so the scroll is
   * swallowed and the page never moves. The scroll is therefore performed by
   * the lock effect's own cleanup, immediately after the lock comes off.
   *
   * A ref rather than state: this is a one-shot instruction to the cleanup,
   * and nothing renders from it.
   */
  const pendingHashRef = useRef<string | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    /* Stop the page behind the overlay from scrolling. */
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);

    /* Move focus into the overlay so the keyboard is not left behind it. */
    closeRef.current?.focus();

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
    /* Real routes keep client-side navigation; only same-page anchors are
       intercepted, and `querySelector` is only ever handed a valid selector. */
    if (!href.startsWith("#")) {
      setOpen(false);
      return;
    }

    event.preventDefault();
    pendingHashRef.current = href;
    setOpen(false);
  };

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen(true)}
        className="flex size-10 items-center justify-center rounded-md border border-border text-muted transition-colors hover:border-border-strong hover:text-foreground"
      >
        <span aria-hidden="true" className="flex flex-col gap-[5px]">
          <span className="block h-px w-4.5 bg-current" />
          <span className="block h-px w-4.5 bg-current" />
        </span>
      </button>

      <div
        id="mobile-nav"
        hidden={!open}
        className="fixed inset-0 z-100 flex flex-col bg-background"
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <span className="label text-muted">Menu</span>
          <button
            ref={closeRef}
            type="button"
            aria-label="Close menu"
            onClick={close}
            className="flex size-10 items-center justify-center rounded-md border border-border text-muted transition-colors hover:border-border-strong hover:text-foreground"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="size-4.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 flex-col justify-between gap-10 overflow-y-auto px-5 py-10">
          {nav.length > 0 ? (
            <nav aria-label="Primary">
              <ul className="flex flex-col gap-1">
                {nav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={(event) => handleNavClick(event, item.href)}
                      className="flex items-center gap-4 py-3 text-h3 text-foreground transition-colors hover:text-link"
                    >
                      <span aria-hidden="true" className="h-px w-6 bg-accent" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          <div className="flex flex-col gap-6">
            <Link
              href={cvHref}
              onClick={() => setOpen(false)}
              className="flex h-12 items-center justify-center gap-2 rounded-md bg-accent px-5 text-small font-medium text-background"
            >
              <DownloadIcon />
              Download CV
            </Link>

            {links.length > 0 ? (
              <ul className="flex flex-wrap items-center gap-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={link.label}
                      className="flex size-11 items-center justify-center rounded-md border border-border bg-surface text-foreground transition-colors hover:border-link/50"
                    >
                      <Icon name={link.icon} brand />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
