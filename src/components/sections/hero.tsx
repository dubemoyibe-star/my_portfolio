import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion/reveal";
import { Avatar } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { getProfile } from "@/lib/data";

/**
 * Opening section: portrait, who, what, and every way to reach out.
 *
 * The portrait sits right on desktop and above the text on mobile — a face
 * first, then the name. DOM order keeps the text first so a screen reader
 * hears the name before the image description; `order` handles the visual
 * swap, which is safe because nothing in the portrait column is focusable.
 *
 * Accent is load-bearing in two places only: the live status dot and the rule
 * anchoring the bio. Social links hover blue — navigation away from the page —
 * so the two palette signals keep doing different jobs.
 */
export async function Hero() {
  const profile = await getProfile();
  const { avatar } = profile;

  return (
    <section id="top" className="relative scroll-mt-16 overflow-hidden">
      {/* Faint engineering grid. Decorative only — masked to fade out long
          before it reaches the text. */}
      <div
        aria-hidden="true"
        className="grid-backdrop pointer-events-none absolute inset-0"
      />

      <Container className="relative flex min-h-[calc(100svh-4rem)] flex-col justify-center py-24 lg:py-32">
        <Reveal className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
          <div className="order-2 max-w-prose-page lg:order-1">
            {/* Deliberately unstyled beyond a dot: as a bordered, tinted pill
                it read as a badge competing with the portrait, and on mobile
                it wedged a hard-edged block between the two. A single accent
                dot carries the same signal without the chrome. */}
            {profile.availableForWork ? (
              <p data-reveal className="label flex items-center gap-2 text-muted">
                <span
                  aria-hidden="true"
                  className="size-1.5 rounded-full bg-accent"
                />
                Available for work
              </p>
            ) : null}

            <h1 data-reveal className="mt-7 text-balance">
              {profile.name}
            </h1>

            <p data-reveal className="mt-5 text-pretty text-h4 text-muted">
              {profile.tagline}
            </p>

            <p
              data-reveal
              className="mt-8 border-l-2 border-accent/40 pl-5 text-pretty text-body-lg text-muted"
            >
              {profile.bio.short}
            </p>

            {profile.links.length > 0 ? (
              <ul
                data-reveal
                className="mt-10 flex flex-wrap items-center gap-3"
              >
                {profile.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={link.label}
                      title={link.label}
                      className="flex size-11 items-center justify-center rounded-md border border-border bg-surface text-foreground transition-all hover:border-link/50 hover:shadow-glow-link"
                    >
                      <Icon name={link.icon} brand />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {avatar ? (
            <div
              data-reveal
              className="order-1 justify-self-start lg:order-2 lg:justify-self-end"
            >
              {/* Reticle rings: a hairline orbit plus a single accent arc,
                  drawn as one border edge on a rotated circle. Static — the
                  obvious move is to spin it, and the direction rules out
                  anything looping. No gradient, no glow, two tokens. */}
              <div className="relative w-fit">
                <span
                  aria-hidden="true"
                  className="absolute -inset-2.5 rounded-full border border-border lg:-inset-4"
                />
                <span
                  aria-hidden="true"
                  className="absolute -inset-2.5 rotate-[-35deg] rounded-full border border-transparent border-t-accent/70 lg:-inset-4"
                />

                <Avatar
                  image={avatar}
                  compact={profile.avatarCompact}
                  /* Below lg the tighter square crop is served; from lg up the
                     1280x854 original, centre-cropped. Its 854px short edge
                     caps the size — 352px still has pixels to spare at 2x. */
                  className="relative size-40 rounded-full border border-border-strong lg:size-72 xl:size-88"
                />
              </div>
            </div>
          ) : null}
        </Reveal>
      </Container>
    </section>
  );
}
