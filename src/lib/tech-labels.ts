/**
 * Resolves a free-form tech label to an icon slug.
 *
 * Contribution tech is stored as display strings ("Node.js", "Soroban") rather
 * than `TechId` references, because a PR often touches tools that are not part
 * of this portfolio's own stack. That keeps the data honest but leaves nothing
 * for the icon registry to key on, so this bridges the two.
 *
 * Best-effort by design: an unmatched label still returns a slug, and `Icon`
 * renders its neutral fallback glyph rather than nothing. A tag never ends up
 * shorter than its neighbours.
 */

/** Labels whose normalised form does not match the registry slug. */
const ALIASES: Record<string, string> = {
  nodejs: "nodedotjs",
  node: "nodedotjs",
  nextjs: "nextdotjs",
  web3js: "web3dotjs",
  /* Soroban is Stellar's contract platform and has no mark of its own. */
  soroban: "stellar",
  postgres: "postgresql",
  tailwind: "tailwindcss",
  shell: "gnubash",
  bash: "gnubash",
  html: "html5",
};

export function iconSlugForLabel(label: string): string {
  const normalised = label.toLowerCase().replace(/[^a-z0-9]/g, "");
  return ALIASES[normalised] ?? normalised;
}
