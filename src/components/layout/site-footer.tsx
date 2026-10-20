import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";

import { BackToTopLink } from "@/components/layout/back-to-top-link";
import { Container } from "@/components/layout/container";
import { Icon } from "@/components/ui/icon";
import { siteConfig } from "@/data/site";
import { getProfile } from "@/lib/data";
import { getSiteIdentity } from "@/lib/site-identity";

/** Site close: a clear way back into the work, plus the live social links. */
export async function SiteFooter() {
  /* Profile edits made outside the admin action cannot invalidate a static
     route. Read this shared identity at request time so the footer follows the
     current profile record instead of a build-time snapshot. */
  await connection();
  const [identity, profile] = await Promise.all([
    getSiteIdentity(),
    getProfile(),
  ]);
  const mark = profile.avatarCompact ?? profile.avatar;

  return (
    <footer className="relative z-10 mt-auto border-t border-border print:hidden">
      <Container className="py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16">
          <div className="max-w-prose-page">
            <p className="label flex items-center gap-3 text-muted">
              {mark ? (
                <Image
                  src={mark.src}
                  alt=""
                  width={mark.width ?? 200}
                  height={mark.height ?? 200}
                  className="size-7 shrink-0 rounded-full border border-border object-cover"
                />
              ) : null}
              Thanks for stopping by
            </p>
            <p className="mt-5 text-h3 text-foreground">{identity.name}</p>
            <p className="mt-2 max-w-lg text-body text-muted">
              {identity.role}
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 sm:gap-6">
            {siteConfig.nav.length > 0 ? (
              <nav aria-label="Footer navigation">
                <h2 className="label text-muted">Explore</h2>
                <ul className="mt-4 flex flex-col items-start gap-3">
                  {siteConfig.nav.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="text-small text-foreground transition-colors hover:text-link"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link href="/#stack" className="text-small text-foreground transition-colors hover:text-link">
                      Tech Stack
                    </Link>
                  </li>
                  <li>
                    <Link href="/#education" className="text-small text-foreground transition-colors hover:text-link">
                      Education
                    </Link>
                  </li>
                </ul>
              </nav>
            ) : null}

            {identity.social.length > 0 ? (
              <nav aria-label="Social links">
                <h2 className="label text-muted">Find me</h2>
                <ul className="mt-4 flex flex-col items-start gap-3">
                  {identity.social.map((item) => (
                    <li key={item.href}>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="group inline-flex items-center gap-2.5 text-small text-foreground transition-colors hover:text-link"
                      >
                        <Icon
                          name={item.icon}
                          className="size-4 text-muted transition-colors group-hover:text-link"
                        />
                        {item.label}
                        <span aria-hidden="true" className="text-muted/70">
                          ↗
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}

          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-label text-muted">
            &copy; {new Date().getFullYear()} {identity.name}
          </p>
          <BackToTopLink />
        </div>
      </Container>
    </footer>
  );
}
