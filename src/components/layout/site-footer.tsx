import Link from "next/link";

import { Container } from "@/components/layout/container";
import { getSiteIdentity } from "@/lib/site-identity";

/**
 * Footer shell - structure only.
 *
 * The name and the social links are read live, through `getSiteIdentity()`.
 * They used to come from `siteConfig`, which derived them from the seed file
 * at import time — so adding a link in the admin panel put it in the hero and
 * on the CV while the footer kept listing the set that was last committed.
 * Same record, same order the hero renders them in.
 *
 * Text-only for now; icons arrive with the icon set.
 */
export async function SiteFooter() {
  const identity = await getSiteIdentity();

  return (
    <footer className="relative z-10 mt-auto border-t border-border print:hidden">
      <Container className="flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-label text-muted">
          &copy; {new Date().getFullYear()} {identity.name}
        </p>

        {identity.social.length > 0 ? (
          <nav aria-label="Social">
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {identity.social.map((item) => (
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
        ) : null}
      </Container>
    </footer>
  );
}
