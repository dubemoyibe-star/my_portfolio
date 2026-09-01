import { Section } from "@/components/layout/section";
import { Tag } from "@/components/ui/tag";
import { getExperience, getTechIndex } from "@/lib/data";
import { formatDateRange } from "@/lib/format";

/**
 * Work history.
 *
 * Renders nothing today: `data/experience.ts` is empty because there is no
 * formal employment history yet, and a heading over an empty list is worse
 * than no section at all. Built now so that adding entries to that file is the
 * only step needed to make it appear.
 *
 * One caveat when that happens: `siteConfig.nav` is a static list, so an
 * "Experience" nav item has to be added alongside the first role or the
 * section will exist with nothing pointing at it.
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

          return (
            <li
              key={entry.id}
              className="border-l border-border pl-6 lg:pl-8"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                <h3 className="text-h4">
                  {entry.role}
                  <span className="text-muted"> · {entry.company}</span>
                </h3>
                <span className="label text-muted">
                  {formatDateRange(entry.dates)}
                </span>
              </div>

              {entry.location ? (
                <p className="mt-2 text-small text-muted">{entry.location}</p>
              ) : null}

              <p className="mt-4 text-pretty text-muted">{entry.description}</p>

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
