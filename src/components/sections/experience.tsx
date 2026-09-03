import { Section } from "@/components/layout/section";
import { Tag } from "@/components/ui/tag";
import { getExperience, getTechIndex } from "@/lib/data";
import { formatDateRange, formatRoleMeta } from "@/lib/format";

/**
 * Work history.
 *
 * Hides itself while there are no roles — a heading over an empty list is
 * worse than no section at all — and `siteConfig.nav` carries the matching
 * "Experience" item, added when the first roles landed.
 *
 * ## Every part below the heading is optional, and the entry has to survive
 * that
 *
 * A role is added on the day it starts, when there is a company, a title and a
 * date and honestly nothing else — see the note at the top of
 * `@/lib/admin/experience-input` for why the editor refuses to demand more.
 * The consequence is here: the location line, the description, the highlights
 * and the tech row are each rendered only when they have content, so a role
 * added this morning is a short entry rather than a tall one with three empty
 * gaps in it. An unguarded `<p>` around an empty description is the specific
 * failure — it reserves a line of leading and reads as something that failed
 * to load, sitting directly beneath an entry that is full.
 */
export async function Experience() {
  const [experience, techIndex] = await Promise.all([
    getExperience(),
    getTechIndex(),
  ]);

  if (experience.length === 0) return null;

  return (
    <Section id="experience" eyebrow="Experience" title="Where I've worked">
      <ol className="flex flex-col gap-10">
        {experience.map((entry) => {
          const tech = entry.tech
            .map((id) => techIndex[id])
            .filter((item) => Boolean(item));

          const meta = formatRoleMeta(entry);

          return (
            <li
              key={entry.id}
              className="border-l border-border pl-6 lg:pl-8"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                <h3 className="text-h4">
                  {entry.role}
                  <span className="text-muted"> · </span>
                  {/* The company name is the link when there is a site to
                      point at — the natural target, and the one a reader
                      checking whether an employer is real would try first.
                      `link` rather than `accent` per the palette rule: accent
                      marks actions on this site, blue marks leaving it. */}
                  {entry.companyUrl ? (
                    <a
                      href={entry.companyUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-muted transition-colors hover:text-link"
                    >
                      {entry.company}
                      {/* Without a glyph this is a link that looks exactly
                          like the text beside it until someone happens to
                          hover it, which is a link most readers never find. */}
                      <ExternalArrow />
                    </a>
                  ) : (
                    <span className="text-muted">{entry.company}</span>
                  )}
                </h3>
                <span className="label text-muted">
                  {formatDateRange(entry.dates)}
                </span>
              </div>

              {/* Location, work mode and employment type on one line, and
                  only the parts that exist — see `formatRoleMeta`. */}
              {meta.length > 0 ? (
                <p className="mt-2 text-small text-muted">{meta}</p>
              ) : null}

              {entry.description.trim().length > 0 ? (
                <p className="mt-4 text-pretty text-muted">
                  {entry.description}
                </p>
              ) : null}

              {entry.highlights.length > 0 ? (
                <ul className="mt-4 flex flex-col gap-2">
                  {entry.highlights.map((highlight) => (
                    <li
                      key={highlight}
                      className="flex gap-3 text-small text-muted"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-2.5 h-px w-3 shrink-0 bg-accent"
                      />
                      <span className="text-pretty">{highlight}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {tech.length > 0 ? (
                <ul className="mt-5 flex flex-wrap gap-2">
                  {tech.map((item) => (
                    <Tag key={item.id} icon={item.icon}>
                      {item.name}
                    </Tag>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ol>
    </Section>
  );
}

/** The outbound marker `LinkButton` uses, sized for a heading. */
function ExternalArrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="ml-1 inline-block size-[0.6em] shrink-0 opacity-60"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 17L17 7M17 7H8M17 7v9" />
    </svg>
  );
}
