import type { Profile } from "@/types";

/**
 * REFERENCE ONLY — NO LONGER THE LIVE SOURCE.
 *
 * Content is served from Postgres (Neon) via Prisma. `@/lib/data` reads the
 * database; nothing in the running app imports this file except `@/data/site`, which still reads `name`,
 * `resume.title` and `bio.short` from here to build the static site metadata.
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
 * The person behind the site.
 *
 * Note the split between `tagline`/`bio` and `resume`: the site speaks in first
 * person, the CV speaks formally. Same person, two registers, one record.
 */
export const profile = {
  name: "Oyibe Chidubem",
  tagline:
    "Full-Stack Developer building websites, web applications, mobile apps and digital products that help businesses grow.",

  bio: {
    short:
      "I build websites, web applications, and mobile apps that help businesses and startups reach more customers, increase sales, strengthen their online presence, and scale. I focus on turning ideas into practical digital products that solve real problems and deliver measurable value. I'm also a Web3 enthusiast and open-source contributor passionate about building useful products through technology.",
    long: [
      "I build websites, web applications, mobile apps, and digital products that help businesses and startups reach more customers, increase sales, strengthen their online presence, and scale.",
      "I work with businesses, startups, and teams to turn ideas into practical, reliable digital solutions that solve real problems and deliver value. Beyond writing code, I focus on understanding business needs, creating great user experiences, and building products that people actually use.",
      "I'm open to collaborating with founders, businesses, and teams to launch new products, improve existing platforms, and build solutions that create opportunities for growth.",
      "Open source is an important part of my work. I contribute to projects and believe in building in the open. I'm also a Web3 enthusiast interested in exploring emerging technologies and the possibilities they bring.",
    ].join("\n\n"),
  },

  email: "dubemoyibe@gmail.com",
  location: "Nigeria",
  availableForWork: true,

  /* 1280x854. Landscape, so the hero's circular frame center-crops it to a
     square — the subject is centred horizontally, which is what makes that
     safe. The 854px short edge is the real limit on how large the portrait
     can render sharply. */
  avatar: {
    src: "/profile.jpg",
    alt: "Portrait of Oyibe Chidubem",
    width: 1280,
    height: 854,
  },

  /* Tighter square crop, used below lg. The landscape original loses the face
     when squeezed into a small circle. */
  avatarCompact: {
    src: "/profile_small.jpeg",
    alt: "Portrait of Oyibe Chidubem",
    width: 200,
    height: 200,
  },

  links: [
    {
      label: "GitHub",
      href: "https://github.com/dubemoyibe-star",
      icon: "github",
      handle: "@dubemoyibe-star",
      primary: true,
    },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/oyibe-chidubem-5776b537a/",
      icon: "linkedin",
      handle: "in/oyibe-chidubem-5776b537a",
      primary: true,
    },
    {
      label: "X",
      href: "https://x.com/EminenceJu94522",
      icon: "x",
      handle: "@EminenceJu94522",
    },
    {
      label: "Telegram",
      href: "https://t.me/oyibe_dev",
      icon: "telegram",
      handle: "@oyibe_dev",
    },
    {
      label: "WhatsApp",
      /* wa.me wants the full international number, digits only. */
      href: "https://wa.me/2347026137565",
      icon: "whatsapp",
      handle: "+234 702 613 7565",
    },
  ],

  resume: {
    title: "Fullstack developer",
    summary:
      "Full-Stack Developer experienced in building web applications and digital products using TypeScript, JavaScript, and modern development technologies. Focused on creating practical, user-centered solutions that solve real-world problems, contribute to open-source projects, and deliver value to businesses and users. Web3 enthusiast interested in blockchain technology and decentralized applications.",
    /* Derived from the name — change if you want a different download filename. */
    fileName: "oyibe-chidubem-cv",
    location: "Nigeria",
    updatedAt: "2026-09-01",
  },
} satisfies Profile;
