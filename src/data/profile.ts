import type { Profile } from "@/types";

/**
 * The person behind the site.
 *
 * Note the split between `tagline`/`bio` and `resume`: the site speaks in first
 * person, the CV speaks formally. Same person, two registers, one record.
 */
export const profile = {
  name: "Oyibe Chidubem",
  tagline:
    "Fullstack developer, blockchain developer, Web3 enthusiast, continuously learning while shipping products",

  bio: {
    short:
      "I'm a fullstack and blockchain developer from Nigeria. I like solving real problems, not just writing code for the sake of it, and I'm most interested in building applications that people actually use.",
    long: [
      "I'm a fullstack and blockchain developer from Nigeria. I like solving real problems, not just writing code for the sake of it, and I'm most interested in building applications that people actually use instead of portfolio pieces.",
      "I'm continuously learning while shipping, with a growing focus on Web3 and decentralized technologies. Open source matters to me. I contribute where I can and prefer building in the open over building in isolation.",
      "When I'm not building, I'm usually digging into whatever's next in the Web3 space: new tools, new chains, new problems worth solving.",
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
      handle: "Oyibe Chidubem",
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
    title: "Fullstack web developer and blockchain developer",
    summary:
      "Fullstack and blockchain developer with experience across TypeScript/JavaScript and Solidity/Foundry. Focused on building practical, user-facing applications and contributing to open-source projects, with a growing specialization in Web3 and decentralized technologies.",
    /* Derived from the name — change if you want a different download filename. */
    fileName: "oyibe-chidubem-cv",
    location: "Nigeria",
    updatedAt: "2026-09-01",
  },
} satisfies Profile;
