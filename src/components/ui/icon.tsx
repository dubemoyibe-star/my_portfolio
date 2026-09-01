import {
  siClerk,
  siCloudinary,
  siDocker,
  siExpress,
  siFirebase,
  siGit,
  siGithub,
  siGnubash,
  siHtml5,
  siJavascript,
  siMongodb,
  siMysql,
  siNeon,
  siNextdotjs,
  siNodedotjs,
  siPostgresql,
  siPrisma,
  siPython,
  siRailway,
  siReact,
  siRender,
  siRust,
  siSolidity,
  siSqlite,
  siStellar,
  siSupabase,
  siTailwindcss,
  siTelegram,
  siTypescript,
  siVercel,
  siWeb3dotjs,
  siWhatsapp,
  siX,
} from "simple-icons";

import { cn } from "@/lib/utils";

/**
 * Icon lookup, keyed by the `icon` slug stored on profile links and tech items.
 * The data layer never imports a component — it stores a string, and this
 * resolves it.
 *
 * Paths come from simple-icons where they exist. Two do not:
 *
 * - LinkedIn was removed from the set at LinkedIn's request, so its path and
 *   brand hex are inlined.
 * - Foundry (the Ethereum toolchain) has no entry. `siFoundryvirtualtabletop`
 *   is an unrelated product and would be wrong, so it falls back to the neutral
 *   glyph below.
 *
 * Imports are explicit rather than a dynamic `icons[slug]` lookup so the
 * bundler can tree-shake the other ~3,400 icons out.
 */

const LINKEDIN = {
  path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z",
  hex: "0A66C2",
};

/* --- Brand colour legibility ---------------------------------------------

   A dozen brand marks are black or near-black (GitHub #181717, Next.js,
   Vercel, Rust, Express, X, Railway, Render …). Painted literally, they
   disappear against the #0A0E12 ground — about a third of the stack would
   render as empty gaps.

   So a brand colour is used only when it clears 3:1 against the background;
   below that the icon inherits `currentColor` and comes out light. That is
   what these brands do themselves in dark mode, and it keeps the rule
   self-maintaining: add an icon and it is classified automatically rather
   than needing a hand-kept exception list. */

const BACKGROUND_HEX = "0a0e12";
const MIN_CONTRAST = 3;

function relativeLuminance(hex: string): number {
  const channels = [0, 2, 4].map((offset) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4);
  });
  return (
    0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
  );
}

const backgroundLuminance = relativeLuminance(BACKGROUND_HEX);

/** `undefined` means "not legible here — inherit currentColor instead". */
function legibleBrandColor(hex: string): string | undefined {
  const luminance = relativeLuminance(hex);
  const ratio =
    (Math.max(luminance, backgroundLuminance) + 0.05) /
    (Math.min(luminance, backgroundLuminance) + 0.05);
  return ratio >= MIN_CONTRAST ? `#${hex}` : undefined;
}

type IconEntry = { path: string; color?: string };

function entry(icon: { path: string; hex: string }): IconEntry {
  return { path: icon.path, color: legibleBrandColor(icon.hex) };
}

const ICONS: Record<string, IconEntry> = {
  /* Social */
  github: entry(siGithub),
  linkedin: entry(LINKEDIN),
  x: entry(siX),
  telegram: entry(siTelegram),
  whatsapp: entry(siWhatsapp),

  /* Languages */
  typescript: entry(siTypescript),
  javascript: entry(siJavascript),
  solidity: entry(siSolidity),
  rust: entry(siRust),
  html5: entry(siHtml5),
  gnubash: entry(siGnubash),
  python: entry(siPython),
  postgresql: entry(siPostgresql),

  /* Frameworks and libraries */
  react: entry(siReact),
  nextdotjs: entry(siNextdotjs),
  nodedotjs: entry(siNodedotjs),
  express: entry(siExpress),
  tailwindcss: entry(siTailwindcss),
  web3dotjs: entry(siWeb3dotjs),
  prisma: entry(siPrisma),
  firebase: entry(siFirebase),
  clerk: entry(siClerk),

  /* Databases */
  mysql: entry(siMysql),
  mongodb: entry(siMongodb),
  neon: entry(siNeon),
  supabase: entry(siSupabase),
  sqlite: entry(siSqlite),

  /* Blockchain */
  stellar: entry(siStellar),

  /* Infrastructure and tooling */
  docker: entry(siDocker),
  vercel: entry(siVercel),
  render: entry(siRender),
  railway: entry(siRailway),
  cloudinary: entry(siCloudinary),
  git: entry(siGit),
};

export type IconProps = {
  /** Icon slug from the data layer. */
  name?: string;
  /**
   * Paint the icon in its own brand colour, where that colour is legible on
   * the dark ground. Off by default: monochrome is right for UI chrome like
   * header and footer links, where five competing brand colours read as noise.
   */
  brand?: boolean;
  /**
   * Render a neutral placeholder glyph when the slug does not resolve.
   *
   * On for grids where every row needs the same visual rhythm (tech pills);
   * off where a missing icon should simply take no space.
   */
  fallback?: boolean;
  className?: string;
};

export function Icon({ name, brand = false, fallback = false, className }: IconProps) {
  const icon = name ? ICONS[name] : undefined;

  if (!icon) {
    if (!fallback) return null;
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
        className={cn("size-4.5", className)}
      >
        <rect
          x="4.5"
          y="4.5"
          width="15"
          height="15"
          rx="3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          opacity="0.65"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={brand && icon.color ? { color: icon.color } : undefined}
      className={cn("size-4.5", className)}
    >
      <path d={icon.path} />
    </svg>
  );
}
