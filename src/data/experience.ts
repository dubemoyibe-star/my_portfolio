import type { Experience } from "@/types";

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

/**
 * Work history, newest first.
 *
 * Dates are `YYYY-MM` like everything else in this content model — see
 * `ISODate` in `@/types`. Both roles started on a known day, and the day is
 * deliberately not stored: nothing renders it, `formatDateRange` works in
 * months, and a precision the model does not carry everywhere is a precision
 * that goes stale in the one place it does.
 *
 * The Fildtek entry is intentionally thin. It has a description and one honest
 * placeholder highlight, and no tech, because the work has only just started
 * and there is nothing else true to say yet. Everything that renders a role —
 * the Experience section, the CV, the admin list — treats each part as
 * optional for exactly this reason; see the note at the top of
 * `@/lib/admin/experience-input`. It gets filled in as real work happens
 * rather than filled in now with what the work is expected to become.
 */
export const experience: Experience[] = [
  {
    id: "exp-fildtek-backend-developer",
    slug: "fildtek-backend-developer",
    company: "Fildtek",
    role: "Backend Developer",
    employmentType: "contract",
    location: "Lagos, Nigeria",
    workMode: "remote",
    dates: { start: "2026-09", end: null },
    description:
      "Contract backend developer for Fildtek, a property verification and trust-layer platform for Nigerian real estate, handling identity/document authentication and physical inspection reporting for property transactions.",
    highlights: [
      "Recently joined — scope and contributions to be added as work progresses.",
    ],
    /* Empty until the work says what it actually uses. An invented stack is
       the one thing on a CV that cannot be walked back in an interview. */
    tech: [],
    includeInResume: true,
    order: 2,
  },
  {
    id: "exp-stenion-founder-ceo",
    slug: "stenion-founder-ceo",
    company: "Stenion",
    /* The same address the Stenion project entry already carries as its live
       link — for a protocol company the product site *is* the company site,
       so this is one fact stored twice rather than two facts that can drift.
       Worth the duplication: it is what makes "Founder & CEO · Stenion"
       checkable rather than assertable. */
    companyUrl: "https://stenion.vercel.app/",
    role: "Founder & CEO",
    employmentType: "full-time",
    /* Not an omission and not a joke: Stenion is a protocol, not an office.
       `workMode` is `remote` because `WORK_MODES` has three members and none
       of them is "on-chain" — the honest version of that fact lives in the
       location string, where it is free text, rather than in an enum where it
       would have to be invented. */
    location: "On-chain (Stellar/Soroban)",
    workMode: "remote",
    dates: { start: "2026-08", end: null },
    description:
      "Founded and lead Stenion, an open-source, continuous risk-intelligence platform for Stellar/Soroban DeFi protocols. Own the product direction, scoring methodology, and full-stack implementation.",
    /* Ownership rather than build notes. The same facts appear on the Stenion
       project entry as what the software does; here they are what the role was
       accountable for, which is the distinction a reader of a CV is making. */
    highlights: [
      "Designed and shipped a 5-factor on-chain risk-scoring methodology, publicly auditable and payment-blind by design.",
      "Surfaced real, previously undisclosed protocol risk on a live Stellar lending pool.",
      "Set the integrity rules the product is held to: scores never influenced by payment, no assessment without an on-chain signal to support it, and unobservable factors disclosed rather than zeroed.",
      "Own product direction, scoring taxonomy and the full-stack implementation, from Soroban reads through to the public registry.",
    ],
    /* The Stenion project's stack, in the same order — one body of work, and
       two records disagreeing about what it is built with is exactly the drift
       `TechId` references exist to prevent. */
    tech: [
      "typescript",
      "javascript",
      "tailwind",
      "postgres",
      "docker",
      "neon",
      "stellar-soroban",
      "sql",
      "nextjs",
      "git",
      "vercel",
    ],
    includeInResume: true,
    order: 1,
  },
];
