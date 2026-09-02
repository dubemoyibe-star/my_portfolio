import type { Certification, Education } from "@/types";

/**
 * REFERENCE ONLY — NO LONGER THE LIVE SOURCE.
 *
 * Content is served from Postgres (Neon) via Prisma. `@/lib/data` reads the
 * database; nothing in the running app imports this file.
 *
 * It is kept for two reasons:
 *
 *  - It is the input to `prisma/seed.ts`. `npm run db:seed` reads this file and
 *    writes it into the database, replacing whatever is there.
 *  - It is the rollback path if the database is lost or a migration goes wrong.
 *
 * **Editing this file changes nothing on the site.** It takes effect only when
 * the seed is re-run — and re-running the seed overwrites anything edited
 * through the admin panel. Change live content in the admin panel; change this
 * file only to move the rollback baseline.
 */

export const education = [
  {
    id: "edu-maduka",
    institution: "Maduka University",
    fieldOfStudy: "Software Engineering",
    status: "in-progress",
    /* `end: null` — currently enrolled. */
    dates: { start: "2025-09", end: null },
  },
] satisfies Education[];

/**
 * Supporting line for the Education section, on the site and on the CV.
 *
 * Lives in the data layer rather than in either component because both render
 * it — duplicating the sentence is how the two end up saying different things.
 *
 * Cyfrin Updraft is named here but has no entries in `certifications` below,
 * and that is deliberate: it issues achievement badges rather than
 * certificates, so it belongs in this sentence rather than as cards with
 * images and verification links beside the Scrimba ones.
 */
export const educationNote =
  "Self-taught through Scrimba (certified in Fullstack Development, Backend Development, Advanced React, Next.js, and Python) and Cyfrin Updraft, where achievements include Solidity & Smart Contract Development, Foundry (Beginner and Advanced), Wallet Security, and dApp development.";

/** Scrimba profile listing every certificate, for the "see all" link. */
export const certificatesUrl = "https://scrimba.com/u4298fee:certs";

export const certifications = [
  {
    id: "cert-scrimba-fullstack",
    title: "Fullstack Developer",
    platform: "Scrimba",
    description:
      "End-to-end web development: building and connecting a frontend to a backend and database, REST API design, authentication, and deployment.",
    imageUrl: "/fullstack_dev.png",
    credentialUrl:
      "https://scrimba.com/u4298fee:certs;cert23wfboWopQ2wGDAhiCap6M9wmaN4GftT3dF4abnKuGhdNpxY",
    dateEarned: "2026-09",
  },
  {
    id: "cert-scrimba-backend",
    title: "Backend Developer",
    platform: "Scrimba",
    description:
      "Server-side fundamentals: building APIs, working with databases, handling authentication, and structuring backend logic that a frontend application can reliably depend on.",
    imageUrl: "/backend_dev.png",
    credentialUrl:
      "https://scrimba.com/u4298fee:certs;cert2ffentAFN5Wy1VUoVTBGw54HpkKBTnHnDm8Vex5hi9RTgE",
    dateEarned: "2026-09",
  },
  {
    id: "cert-scrimba-nextjs",
    title: "Next.js",
    platform: "Scrimba",
    description:
      "Server-side rendering, static generation, the App Router, API routes, and building production-ready full-stack apps with Next.js.",
    imageUrl: "/nextjs.png",
    credentialUrl:
      "https://scrimba.com/u4298fee:certs;cert2ffentAFN5Wy1VUoVTBGw2KcwNwih2nBxEUffKhbHistdp",
    dateEarned: "2026-02",
  },
  {
    id: "cert-scrimba-python",
    title: "Python",
    platform: "Scrimba",
    description:
      "Core Python programming: syntax, data structures, control flow, and functions, applied through building real scripts and small programs.",
    imageUrl: "/python.png",
    credentialUrl:
      "https://scrimba.com/u4298fee:certs;cert2JbLs3qgBCmd1fZuvaqQsJ2ojdxYzJiJ2BvLR7",
    dateEarned: "2026-06",
  },
  {
    id: "cert-scrimba-advanced-react",
    title: "Advanced React",
    platform: "Scrimba",
    description:
      "Deeper React patterns beyond the basics: hooks in depth, performance optimization, component architecture, state management, and testing React applications.",
    imageUrl: "/advanced_react.png",
    credentialUrl:
      "https://scrimba.com/u4298fee:certs;cert2JbLs3qgBCmd1fZuvaqQsGwHkQhptr3gRPgkmj",
    dateEarned: "2025-12",
  },
] satisfies Certification[];
