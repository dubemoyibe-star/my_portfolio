import type { Project } from "@/types";

/**
 * Project catalogue — work owned end to end.
 *
 * For work merged into repositories owned by other people, see
 * `@/data/contributions`.
 *
 * `images` is empty on every entry: no screenshots have been supplied yet. Any
 * UI built against this must handle the empty case rather than assuming a
 * cover image exists.
 */
export const projects = [
  {
    id: "prj-stenion",
    slug: "stenion",
    title: "Stenion",
    summary:
      "Open-source, continuous risk intelligence for Stellar/Soroban DeFi protocols. Live on-chain scoring with a fully public, auditable methodology.",
    description: [
      "Stenion is continuous, on-chain risk scoring for Stellar/Soroban lending protocols, the thing Stellar DeFi is missing.",
      "The gap: DeFiLlama tracks TVL, audits are one-time snapshots. Neither tells you if a protocol is safe right now. Stenion re-scores every protocol every 15 minutes from live on-chain state.",
      "The output: one safetyScore (0-100) per protocol, broken into 5 factors, collateral, oracle, admin key, liquidity, utilization safety, so protocols become actually comparable instead of each having its own 'trust us' story.",
      "Integrity rules: payment never touches score, AI never invents an assessment, thresholds anchor to each protocol's own on-chain params, and if a signal isn't observable on-chain, that's disclosed rather than faked or zeroed.",
      "Proof it works: already surfaced real risk on a live protocol, an unaudited live oracle path, hours of stale prices while claiming freshness, and a hidden router not even listed in the protocol's own docs.",
      "Where it's going: the scoring taxonomy is built to expand beyond lending into DEXs, CDPs, and yield vaults, each with its own honestly-scoped rulebook.",
    ].join("\n\n"),
    role: "Solo build",
    status: "in-progress",
    dates: { start: "2026-08", end: null },
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
    links: {
      repo: "https://github.com/stenion-lab/stenion",
      live: "https://stenion.vercel.app/",
    },
    images: [],
    featured: true,
    includeInResume: true,
    order: 1,
  },
  {
    id: "prj-dsuite",
    slug: "dsuite",
    title: "Dsuite",
    summary:
      "A full-stack hotel booking application that allows users to browse rooms, make secure bookings, and manage their reservations, while providing administrators with powerful tools to oversee bookings and room allocations.",
    description: [
      "Dsuite is a full-stack hotel booking platform covering both sides of the transaction: guests can browse available rooms, make bookings, and manage their own reservations, while admins get a dashboard to oversee bookings and room allocations without digging through a database.",
      "Authentication is handled with session cookies rather than a third-party auth provider, giving direct control over session handling. Built to handle the real edge cases of a booking system: keeping room availability accurate in real time as reservations come in and get cancelled, and giving admins visibility into occupancy without needing separate reporting tools.",
      "No payment integration yet. Booking flow currently handles reservation and room allocation logic, not transactions.",
    ].join("\n\n"),
    role: "Solo build",
    status: "shipped",
    dates: { start: "2026-03", end: "2026-04" },
    tech: ["javascript", "tailwind", "sqlite", "react", "node", "express"],
    links: {
      repo: "https://github.com/dubemoyibe-star/Dsuite",
      live: "https://dsuite-ruddy.vercel.app/",
    },
    images: [],
    featured: true,
    includeInResume: true,
    order: 2,
  },
  {
    id: "prj-crestwood",
    slug: "crestwood",
    title: "Crestwood",
    summary:
      "CrestWood is a comprehensive school management system built with modern web technologies. It provides a complete platform for managing students, teachers, classes, assignments, exams, attendances, and more.",
    description: [
      "CrestWood is a full school management system covering the four roles that actually exist in a school: admin, teacher, parent, and student, each with their own dashboard and permissions rather than one generic view bolted onto everyone.",
      "Admins manage students, teachers, classes, and the overall structure of the school. Teachers handle assignments, exams, and attendance for their classes. Parents get visibility into their child's progress and attendance. Students see their own assignments, exams, and results. Auth is handled with Clerk, and the whole system sits on Postgres via Prisma.",
      "The live demo is gated behind login, with demo credentials shown directly on the login page for each role: admin/admin, teacher/teacher, parent/parent, student/student, so you can actually see what was built instead of hitting a wall at the login screen.",
    ].join("\n\n"),
    role: "Solo build",
    status: "shipped",
    dates: { start: "2026-02", end: "2026-04" },
    tech: [
      "nextjs",
      "tailwind",
      "react",
      "clerk",
      "typescript",
      "postgres",
      "prisma",
      "vercel",
      "docker",
      "git",
    ],
    links: {
      repo: "https://github.com/dubemoyibe-star/Crestwood",
      live: "https://crestwood-schools.vercel.app/",
    },
    images: [],
    featured: true,
    includeInResume: true,
    order: 3,
  },
  {
    id: "prj-bookshell",
    slug: "bookshell",
    title: "BookShell",
    summary:
      "BookShell is a full-stack e-commerce platform for buying and selling books online. It provides a seamless shopping experience for customers and a powerful admin dashboard for managing books and orders.",
    description: [
      "BookShell is a full-stack e-commerce platform for buying and selling books, with a full shopping experience on the customer side and a complete operations dashboard for admins.",
      "Customers can sign in with Google (via Firebase Auth) or standard email/password, browse and purchase books through an integrated checkout, and track their orders. Admins get full control: adding, editing, and removing book listings, managing orders, viewing sales data, tracking stock levels, and seeing activity logs for other admins on the team.",
      "Book cover images are handled through Cloudinary rather than stored directly, keeping image delivery fast and separate from the app's own storage. Payments are integrated via Paystack, currently running in test mode; the integration is complete and can be switched to live processing without additional development work.",
    ].join("\n\n"),
    role: "Solo build",
    status: "shipped",
    dates: { start: "2026-02", end: "2026-04" },
    tech: [
      "express",
      "mongodb",
      "firebase",
      "javascript",
      "react",
      "tailwind",
      "vercel",
      "git",
      "cloudinary",
    ],
    links: {
      repo: "https://github.com/dubemoyibe-star/bookshell",
      live: "https://bookshell-app.vercel.app/",
    },
    images: [],
    featured: true,
    includeInResume: true,
    order: 4,
  },
] satisfies Project[];
