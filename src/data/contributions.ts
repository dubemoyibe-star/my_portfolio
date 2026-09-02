import type { Contribution } from "@/types";

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
 * Open-source work merged into repositories owned by other people.
 *
 * Separate from `@/data/projects` on purpose — see the `Contribution` type for
 * why. `repoUrl` is derived from each PR URL; `owner` is the GitHub org or user.
 *
 * `mergedDate` is omitted throughout: no dates were supplied. Ordering is
 * driven entirely by the explicit `order` field until they are filled in.
 *
 * `tech` here is free-form display labels, not `TechId` references — a PR often
 * touches tools that are not part of this portfolio's own stack.
 */
export const contributions = [
  {
    id: "con-afridollar",
    slug: "afridollar",
    repoName: "AfriDollar",
    owner: "DigiAfricaEra",
    repoUrl: "https://github.com/DigiAfricaEra/afri-dollar",
    repoDescription:
      "African business USDC and compliant digital-dollar infrastructure using Stellar for fast, low-cost cross-border payments and treasury operations.",
    contributionSummary:
      "Built a complete Soroban smart contract for payroll batch distribution.",
    contributionDetails:
      "Built a complete Soroban smart contract for payroll batch distribution: create a batch, add recipients, fund it, and distribute payments atomically to everyone at once. Handled edge cases including batch cancellation before funding, overflow-safe math, and full event emission for every state change. Merged after addressing 4 review comments covering a state machine bug, a data consistency issue, initialization safety, and a recipient count cap.",
    prLinks: [
      {
        label: "PR #142",
        url: "https://github.com/DigiAfricaEra/afri-dollar/pull/142",
      },
    ],
    tech: ["Rust", "Soroban", "Stellar"],
    includeInResume: true,
    featured: true,
    order: 1,
  },
  {
    id: "con-atreus",
    slug: "atreus",
    repoName: "Atreus",
    owner: "atreus-lab",
    repoUrl: "https://github.com/atreus-lab/atreus",
    repoDescription:
      "Privacy-preserving payment links on Stellar using zero-knowledge proofs for claim attestation.",
    contributionSummary:
      "Built a privacy-safe payment-link analytics dashboard, and a batch attestation feature for the Soroban verifier contract.",
    contributionDetails:
      "Two pieces of work in this repo. First, built a full payment-link analytics dashboard: view/initiation/claim event tracking, per-link and summary stats, a conversion funnel, and time-series charts with 7/30/90-day toggles, all privacy-safe with anonymous tracking and 90-day data retention. Second, built a batch attestation feature for the Soroban verifier contract that collapses attester transaction count by 20-200x. Measured the real fee impact on testnet (about 5% savings, not the roughly 20x the original issue assumed) and explained why: Soroban meters resource fees by work performed, not transaction count. Separately investigated recursive ZK proof aggregation, found it was cryptographically unsound in the pinned toolchain (a deliberately corrupted proof passed verification identically to a valid one), and made the call not to ship it, documenting the findings instead of forcing a broken feature through. Validated the batch attestation on real testnet at N=1, 5, 10, 50, and 100 claims.",
    prLinks: [
      {
        label: "PR #84 — Analytics Dashboard",
        url: "https://github.com/atreus-lab/atreus/pull/84",
      },
      {
        label: "PR #131 — Batch Attestation",
        url: "https://github.com/atreus-lab/atreus/pull/131",
      },
    ],
    tech: ["Rust", "Soroban", "TypeScript", "Node.js"],
    includeInResume: true,
    featured: true,
    order: 2,
  },
  {
    id: "con-stellaryield",
    slug: "stellaryield",
    repoName: "StellarYield",
    owner: "StellarYield-Labs",
    repoUrl: "https://github.com/StellarYield-Labs/StellarYield",
    repoDescription:
      "Open-source DeFi infrastructure for automated yield routing on Stellar and Soroban.",
    contributionSummary:
      "Replaced mocked rebalance execution with a real idempotent on-chain pipeline, and closed a signing-key gap in audit logging.",
    contributionDetails:
      "Two pieces of work here. First, replaced fake/mocked rebalance execution with a real, idempotent, auditable on-chain execution pipeline: simulate, then submit, then confirm. Built a mock adapter for tests and a real Soroban relayer adapter for production, with error classification across simulation, transient, and terminal failures, and an idempotency guard so a worker restart can't double-execute a transaction. Second, closed a real security gap where audit logging could silently fall back to a hardcoded default signing key in production; it now fails startup instead. Added sequence numbers to audit log entries for tamper evidence, so deleted or reordered entries are detectable, plus verification tooling for maintainers.",
    prLinks: [
      {
        label: "PR #73 — Rebalance Execution Pipeline",
        url: "https://github.com/StellarYield-Labs/StellarYield/pull/73",
      },
      {
        label: "PR #87 — Audit Log Integrity",
        url: "https://github.com/StellarYield-Labs/StellarYield/pull/87",
      },
    ],
    tech: ["TypeScript", "Node.js", "Prisma", "Soroban"],
    includeInResume: true,
    featured: true,
    order: 3,
  },
  {
    id: "con-stellar-indigopay",
    slug: "stellar-indigopay",
    repoName: "Stellar-IndigoPay",
    owner: "Stellar-IndigoPay",
    repoUrl: "https://github.com/Stellar-IndigoPay/Stellar-IndigoPay",
    repoDescription:
      "Open-source climate donation platform on Stellar. Donors give XLM directly to verified environmental projects; every donation is recorded on-chain via a Soroban smart contract.",
    contributionSummary:
      "Refactored the donation-tracking pipeline from CRUD/UPSERT to full event sourcing with an immutable append-only event store.",
    contributionDetails:
      "Refactored the donation-tracking pipeline from a CRUD/UPSERT approach to full event sourcing. Built an immutable, append-only event store as the single source of truth, with four derived projections, leaderboard, global stats, donation history, and project stats, computed by replaying events rather than mutated directly. Wrote a regression test suite proving the new system produces identical output to the legacy aggregation approach on real seed data. Built an admin rebuild endpoint with a performance target of rebuilding 100,000 events in under 30 seconds, asserted by a test. Diagnosed and fixed a production-breaking CI failure, a missing metrics export that was causing 500 errors across multiple routes, under maintainer pressure to ship.",
    prLinks: [
      {
        label: "PR #352",
        url: "https://github.com/Stellar-IndigoPay/Stellar-IndigoPay/pull/352",
      },
    ],
    tech: ["Node.js", "PostgreSQL", "Soroban"],
    includeInResume: true,
    featured: true,
    order: 4,
  },
  {
    id: "con-quest-service",
    slug: "quest-service",
    repoName: "Quest Service",
    owner: "MindFlowInteractive",
    repoUrl: "https://github.com/MindFlowInteractive/quest-service",
    repoDescription: "Microservices-based backend platform.",
    contributionSummary:
      "Built a complete inventory and stock-management microservice from spec.",
    contributionDetails:
      "Built a complete inventory and stock-management microservice from spec: a standalone NestJS service handling stock tracking and deduction, reservation and back-order handling, low-stock alerts, inventory analytics, and stock reconciliation logic, fully Dockerized for independent deployment. 44+ files and over 2,300 lines added, with full test coverage.",
    prLinks: [
      {
        label: "PR #379",
        url: "https://github.com/MindFlowInteractive/quest-service/pull/379",
      },
    ],
    tech: ["NestJS", "TypeScript", "Docker"],
    includeInResume: true,
    featured: true,
    order: 5,
  },
  {
    id: "con-stellar-portfolio-rebalancer",
    slug: "stellar-portfolio-rebalancer",
    repoName: "Stellar Portfolio Rebalancer",
    owner: "ritik4ever",
    repoUrl: "https://github.com/ritik4ever/stellar-portfolio-rebalancer",
    repoDescription: "Automated portfolio rebalancing tool for Stellar assets.",
    contributionSummary:
      "Built an automated analytics snapshot compaction system with tiered retention to cut long-term storage costs.",
    contributionDetails:
      "Built an automated analytics snapshot compaction system to cut long-term database storage costs. Implemented tiered retention: full-resolution hourly snapshots for the first 7 days, one snapshot per day for days 7 through 90, and deletion beyond that, reducing a 2,376-snapshot dataset to 251 (about 89% reduction) in the worked example. Built as a BullMQ background worker with exponential-backoff retries and a weekly cron schedule, integrated with the app's readiness and monitoring systems. 14 tests covering the compaction logic and worker behavior.",
    prLinks: [
      {
        label: "PR #830",
        url: "https://github.com/ritik4ever/stellar-portfolio-rebalancer/pull/830",
      },
    ],
    tech: ["TypeScript", "PostgreSQL", "BullMQ", "Redis"],
    includeInResume: true,
    featured: true,
    order: 6,
  },
] satisfies Contribution[];
