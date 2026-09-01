import Link from "next/link";

import { Container } from "@/components/layout/container";
import { MobileNav } from "@/components/layout/mobile-nav";
import { DownloadIcon } from "@/components/ui/download-icon";
import { Icon } from "@/components/ui/icon";
import { siteConfig } from "@/data/site";
import { getProfile } from "@/lib/data";

/** Where the CV lives. Built in the experience/CV pass. */
const CV_HREF = "/cv";

/**
 * Sticky header: wordmark left, section nav, social icons and the CV action
 * right. Below `lg` the nav and socials collapse into the overlay, but the CV
 * button stays on the bar next to the hamburger — it is the one action worth
 * reaching without opening a menu first.
 *
 * Server component: only the mobile overlay needs client state, and it is
 * isolated in its own file so the rest of this ships as HTML.
 *
 * Social icons carry their own brand colours. GitHub and X are near-black and
 * fall back to light via the contrast guard in `Icon` — which is what those
 * marks do in dark mode anyway. Because the brand colour lands as an inline
 * style it would beat any `hover:text-*` class, so hover moves the button
 * chrome (blue ring and glow) instead of the glyph: every icon then reacts the
 * same way regardless of whether it kept its colour.
 *
 * Accent still marks actions — the CV button is the only one on this bar.
 */
export async function SiteHeader() {
  const profile = await getProfile();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="group flex items-center gap-2.5 font-mono text-small tracking-tight"
        >
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-accent transition-shadow group-hover:shadow-glow-accent"
          />
          <span className="truncate text-foreground">{profile.name}</span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-6 lg:flex">
          {siteConfig.nav.length > 0 ? (
            <nav aria-label="Primary">
              <ul className="flex items-center gap-7">
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
          ) : null}

          <span aria-hidden="true" className="h-5 w-px bg-border" />

          {profile.links.length > 0 ? (
            <ul className="flex items-center gap-1">
              {profile.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={link.label}
                    title={link.label}
                    className="flex size-9 items-center justify-center rounded-md text-foreground transition-all hover:shadow-glow-link"
                  >
                    <Icon name={link.icon} brand className="size-4" />
                  </a>
                </li>
              ))}
            </ul>
          ) : null}

          <Link
            href={CV_HREF}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-accent px-4 text-small font-medium text-background transition-shadow hover:shadow-glow-accent"
          >
            <DownloadIcon />
            Download CV
          </Link>
        </div>

        {/* Mobile: the CV action stays visible, everything else folds away. */}
        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href={CV_HREF}
            aria-label="Download CV"
            className="inline-flex h-10 items-center gap-1.5 rounded-md bg-accent px-3 text-small font-medium text-background"
          >
            <DownloadIcon className="size-3.5" />
            CV
          </Link>

          <MobileNav
            nav={siteConfig.nav}
            links={profile.links}
            cvHref={CV_HREF}
          />
        </div>
      </Container>
    </header>
  );
}
