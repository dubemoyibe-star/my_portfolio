import { Section } from "@/components/layout/section";
import { Icon } from "@/components/ui/icon";
import { getTechStack } from "@/lib/data";
import { groupTech } from "@/lib/tech-groups";

/**
 * The stack, as a data sheet rather than a logo wall.
 *
 * Deliberately no proficiency bars, percentages or star ratings: a
 * self-assigned 85% is noise, and the schema's `proficiency` field is better
 * used for filtering than for display. Names only, grouped, in one column of
 * pills per category.
 *
 * Pills are not links. Thirty-odd outbound links to framework homepages adds
 * clutter and sends people away from the page.
 *
 * Icons render in their own brand colours, except where a brand mark is too
 * dark to survive the #0A0E12 ground — see the contrast guard in `Icon`, which
 * falls those back to light rather than letting a third of the grid vanish.
 * Unresolvable slugs (Foundry) get the neutral fallback glyph so the rows keep
 * their rhythm.
 */
export async function TechStack() {
  const groups = groupTech(await getTechStack());

  if (groups.length === 0) return null;

  return (
    <Section id="stack" eyebrow="Stack" title="What I build with">
      <dl className="border-t border-border">
        {groups.map((group) => (
          <div
            key={group.label}
            className="grid gap-4 border-b border-border py-6 lg:grid-cols-[minmax(0,13rem)_1fr] lg:gap-10 lg:py-7"
          >
            <dt className="label pt-0.5 text-muted">{group.label}</dt>
            <dd>
              <ul className="flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-2 rounded-md border border-border bg-surface py-1.5 pl-2.5 pr-3 text-small text-foreground transition-colors hover:border-accent/40 hover:bg-surface-raised"
                  >
                    <Icon
                      name={item.icon}
                      brand
                      fallback
                      className="size-4 shrink-0"
                    />
                    {item.name}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
