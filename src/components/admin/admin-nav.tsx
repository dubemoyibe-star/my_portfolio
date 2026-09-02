"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ADMIN_SECTIONS } from "@/lib/admin/sections";
import { cn } from "@/lib/utils";

/**
 * The bar that runs across every admin screen.
 *
 * A client component for one reason: `usePathname`. Marking the current
 * section is not decoration in a tool with seven of them — it is how someone
 * who tabbed away and came back knows where they are without reading the URL.
 *
 * The bar scrolls horizontally below `md` rather than collapsing into a menu.
 * A hamburger would be one more tap on every navigation for a list of seven
 * short words that fits on a phone with a swipe.
 *
 * Sections that are not built yet render as inert text with a "soon" marker —
 * see the note on `ready` in `@/lib/admin/sections`.
 */
export function AdminNav() {
  const pathname = usePathname();

  /* `/admin` is a prefix of every other admin route, so it can only match
     exactly or it would light up on all of them. The rest match their subtree,
     so an edit page keeps its section marked. */
  function isCurrent(href: string): boolean {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav
      aria-label="Admin sections"
      className="-mx-5 overflow-x-auto border-b border-border px-5 lg:-mx-8 lg:px-8"
    >
      <ul className="flex min-w-max items-center gap-1">
        <NavItem href="/admin" label="Dashboard" current={isCurrent("/admin")} />

        {ADMIN_SECTIONS.map((section) =>
          section.ready ? (
            <NavItem
              key={section.href}
              href={section.href}
              label={section.label}
              current={isCurrent(section.href)}
            />
          ) : (
            <li key={section.href}>
              <span
                className="flex items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-small text-muted/50"
                title="Not built yet"
              >
                {section.label}
                <span className="label rounded border border-border px-1 text-muted/60">
                  soon
                </span>
              </span>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}

function NavItem({
  href,
  label,
  current,
}: {
  href: string;
  label: string;
  current: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        /* `aria-current` rather than relying on the underline: the colour and
           the border say "here" to anyone looking at the bar, and this says it
           to everyone else. */
        aria-current={current ? "page" : undefined}
        className={cn(
          "block whitespace-nowrap border-b-2 px-3 py-2.5 text-small transition-colors",
          current
            ? "border-accent text-foreground"
            : "border-transparent text-muted hover:text-foreground",
        )}
      >
        {label}
      </Link>
    </li>
  );
}
