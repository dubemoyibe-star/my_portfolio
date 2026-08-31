import Link from "next/link";

import { Container } from "@/components/layout/container";
import { siteConfig } from "@/data/site";

/**
 * Header shell - structure only.
 *
 * Deliberately static: no active-route highlighting, no mobile drawer, no
 * scroll behaviour. Those need client state and belong to a later pass. The
 * menu button below is a visual placeholder and does nothing yet.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-6">
        {/* Wordmark. Mono + a single accent mark is the whole brand gesture. */}
        <Link
          href="/"
          className="group flex items-center gap-2 font-mono text-small tracking-tight"
        >
          <span
            aria-hidden
            className="size-1.5 rounded-full bg-accent transition-opacity group-hover:opacity-70"
          />
          <span className="text-foreground">{siteConfig.name}</span>
        </Link>

        {/* Primary nav - inline from lg up. */}
        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-small text-muted transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile affordance - placeholder, wired up in a later pass. */}
        <button
          type="button"
          aria-label="Open menu"
          className="flex size-9 items-center justify-center rounded-md border border-border text-muted transition-colors hover:border-border-strong hover:text-foreground lg:hidden"
        >
          <span aria-hidden className="flex flex-col gap-1">
            <span className="block h-px w-4 bg-current" />
            <span className="block h-px w-4 bg-current" />
          </span>
        </button>
      </Container>
    </header>
  );
}
