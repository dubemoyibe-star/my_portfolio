import { Container } from "@/components/layout/container";

/**
 * Placeholder home page.
 *
 * Exists to prove tokens + typography + layout compose correctly. Every string
 * here is a placeholder and every block is expected to be replaced once real
 * content and sections arrive.
 */
export default function HomePage() {
  return (
    <Container
      as="section"
      className="flex min-h-[calc(100svh-4rem)] flex-col justify-center py-24 lg:py-32"
    >
      <div className="max-w-prose-page">
        {/* Eyebrow - mono label + the one accent mark on the page. */}
        <p className="label flex items-center gap-2.5 text-muted">
          <span aria-hidden className="size-1.5 rounded-full bg-accent" />
          Placeholder eyebrow
        </p>

        <h1 className="mt-6 text-balance">
          Headline placeholder for the hero section
        </h1>

        <p className="mt-6 text-pretty text-body-lg text-muted">
          Supporting paragraph placeholder. Two or three lines of copy sit here
          to set the measure and prove the body scale reads correctly against
          the muted foreground token.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
          {/* Primary accent - reserved for the single most important action. */}
          <span className="inline-flex h-10 items-center rounded-md bg-accent px-5 text-small font-medium text-background">
            Primary action
          </span>

          {/* Secondary blue - links and hover states. */}
          <span className="text-small text-muted transition-colors hover:text-link">
            Secondary action
          </span>
        </div>
      </div>

      {/* Hairline metadata strip - a restrained nod to the terminal feel and a
          check that mono, muted and border tokens sit together. */}
      <dl className="mt-20 grid gap-px border-t border-border pt-6 font-mono text-label text-muted sm:grid-cols-3">
        <div className="flex gap-2">
          <dt>Status</dt>
          <dd className="text-foreground">Placeholder</dd>
        </div>
        <div className="flex gap-2">
          <dt>Location</dt>
          <dd className="text-foreground">Placeholder</dd>
        </div>
        <div className="flex gap-2">
          <dt>Focus</dt>
          <dd className="text-foreground">Placeholder</dd>
        </div>
      </dl>
    </Container>
  );
}
