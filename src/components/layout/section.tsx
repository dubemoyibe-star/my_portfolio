import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";

export type SectionProps = {
  /** Anchor target for the nav. */
  id: string;
  /** Short mono label above the heading. */
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * Standard section frame: anchor, top hairline, heading block, content.
 *
 * `scroll-mt-16` matches the 4rem sticky header so anchor jumps do not land
 * underneath it.
 *
 * Sections that render from data decide for themselves whether to return
 * `null` — this component assumes it has something to show.
 */
export function Section({
  id,
  eyebrow,
  title,
  description,
  className,
  children,
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-16 border-t border-border py-20 lg:py-28",
        className,
      )}
    >
      <Container>
        <div className="max-w-prose-page">
          {/* Accent rule on every section eyebrow — the one systematic place
              the primary colour recurs down the page. */}
          {eyebrow ? (
            <p className="label flex items-center gap-3 text-muted">
              <span aria-hidden="true" className="h-px w-7 bg-accent" />
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-3 text-balance">{title}</h2>
          {description ? (
            <p className="mt-4 text-pretty text-body-lg text-muted">
              {description}
            </p>
          ) : null}
        </div>

        <div className="mt-12 lg:mt-16">{children}</div>
      </Container>
    </section>
  );
}
