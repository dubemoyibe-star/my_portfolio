import Link from "next/link";

import { Container } from "@/components/layout/container";
import { siteConfig } from "@/data/site";

/**
 * Footer shell - structure only.
 *
 * Social links come from `siteConfig` so the admin panel can own them later.
 * Text-only for now; icons arrive with the icon set.
 */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <Container className="flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-label text-muted">
          &copy; {new Date().getFullYear()} {siteConfig.name}
        </p>

        <nav aria-label="Social">
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {siteConfig.social.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-small text-muted transition-colors hover:text-link"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </footer>
  );
}
