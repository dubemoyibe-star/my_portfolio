# Oyibe Chidubem — Portfolio

Personal portfolio site for **Oyibe Chidubem**, a fullstack developer. Dark,
terminal / data-intelligence aesthetic — futuristic through
restraint rather than effects.

Every section is driven by a database and edited through a password-gated admin
panel. Nothing on the public site is hardcoded content.

**Live:** [oyibe.dev](https://oyibe.dev) · **CV:** [oyibe.dev/cv](https://oyibe.dev/cv)

## Features

- **Fully dynamic content.** Projects, Contributions, Tech stack, Education,
  Certifications, Experience and Profile all live in Postgres and render from
  it — no code change needed to publish an edit.
- **Admin dashboard at `/admin`.** Single-password gate, signed session cookie,
  middleware in front of every `/admin` and `/api/admin` route. Create, edit,
  reorder and delete every content type from the browser.
- **Cloudinary image uploads.** The browser gets a short-lived, folder-scoped
  signature from an authenticated route and uploads directly; the API secret
  never reaches the client bundle.
- **Dynamic CV page with PDF export.** `/cv` is generated from the same records
  as the site; the download renders it to a paginated A4 PDF client-side, with
  page breaks that fall between entries rather than through them.
- **Generated `sitemap.xml` and `llms.txt`.** Both are built from live data, so
  they follow the content instead of drifting from it.
- **SEO metadata and OG images** per key page, plus JSON-LD `Person` schema.
- **Custom 404** that reports the path that was requested.
- **GSAP entrance animations** that respect `prefers-reduced-motion`.

## Tech stack

| | |
| --- | --- |
| Framework | Next.js 16 (App Router, React 19, Server Actions) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 — CSS-first config, no `tailwind.config.js` |
| Database | Neon Postgres via Prisma 7 |
| Images | Cloudinary (signed direct uploads) + `next/image` |
| Animation | GSAP + `@gsap/react` |
| PDF | jsPDF + html2canvas-pro |
| Fonts | Geist Sans + Geist Mono (self-hosted via `geist`) |
| Hosting | Vercel |

## Project structure

```
src/
├── app/
│   ├── admin/
│   │   ├── (dashboard)/  # CRUD dashboard for blog, contributions, education,
│   │   │                 # experience, profile, projects, and tech stack
│   │   └── login/        # admin sign-in
│   ├── api/admin/        # login, logout, and Cloudinary upload signature
│   ├── blog/             # blog index, [slug] articles, and OG image
│   ├── cv/               # CV page, PDF export, and OG image
│   ├── llms.txt/         # generated model-readable site content
│   ├── projects/         # project index, [slug] details, and social images
│   ├── layout.tsx        # root layout and site-wide metadata
│   ├── page.tsx          # home page
│   ├── not-found.tsx     # custom 404
│   ├── sitemap.ts        # generated sitemap
│   └── globals.css       # design tokens and global styles
├── components/
│   ├── admin/            # dashboard navigation and reusable form controls
│   ├── blog/             # article sharing
│   ├── cards/            # project, contribution, and certification cards
│   ├── cv/               # CV sections and download control
│   ├── layout/           # header, footer, navigation, and page layout
│   ├── motion/           # animation components
│   ├── sections/         # home page sections
│   ├── seo/              # JSON-LD structured data
│   └── ui/               # shared interface components
├── data/                 # seed and rollback content; not live content
├── lib/
│   ├── admin/            # input parsing, validation, asset cleanup, revalidation
│   ├── data.ts           # database read path
│   ├── prisma.ts         # runtime Prisma client
│   ├── auth.ts           # admin session signing and verification
│   ├── cloudinary.ts     # signed upload support
│   ├── blog.ts           # blog content helpers
│   ├── seo.ts            # metadata helpers
│   └── site-identity.ts  # live profile identity with seed fallback
├── types/index.ts        # shared domain types
└── middleware.ts         # admin route gate

prisma/
├── migrations/           # database migration history
├── schema.prisma         # content models
├── seed.ts               # seed portfolio content from src/data/
└── seed-blogs.ts         # seed blog posts

public/                   # profile images, project covers, and static assets
docs/design-system.md     # design tokens, typography, and layout guidance
```

> `src/data/` is **not** the live source. It seeds an empty database and serves
> as a rollback baseline. Editing it changes nothing until `npm run db:seed` is
> re-run — and that overwrites anything edited in the admin panel.

## Environment variables

Copy [`.env.example`](.env.example) to `.env.local` and fill in real values.
`.env.example` documents what each one is and where to get it.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon **pooled** connection (`-pooler` host). Used at runtime. |
| `DIRECT_URL` | Neon **unpooled** connection. Used by Prisma Migrate only. |
| `ADMIN_PASSWORD` | The single password for `/admin`. |
| `ADMIN_SESSION_SECRET` | Signs the admin session cookie. 32+ chars, different from the password. |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account name (appears in delivery URLs). |
| `CLOUDINARY_API_KEY` | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret — server-only, never `NEXT_PUBLIC_`. |

The Cloudinary trio is optional: without it the rest of the admin works and the
upload widgets explain what is missing.

## Local setup

```bash
git clone https://github.com/dubemoyibe-star/my_portfolio.git
cd my_portfolio
npm install

cp .env.example .env.local   # then fill in real values

npm run db:migrate           # apply migrations to your database
npm run db:seed              # optional: load the baseline content

npm run dev                  # http://localhost:3000
```

Sign in at [`/admin`](http://localhost:3000/admin) with `ADMIN_PASSWORD` to edit
content.

## Commands

```bash
npm run dev          # dev server
npm run build        # prisma generate + production build
npm run start        # serve the production build
npm run lint         # eslint

npm run db:migrate   # create/apply a migration (dev)
npm run db:deploy    # apply migrations (production)
npm run db:seed      # replace content with the src/data/ baseline
npm run db:studio    # Prisma Studio
```

## Conventions

- Files are `kebab-case`, components `PascalCase`; named exports everywhere
  except route files.
- Import via the `@/*` alias, never relative parent paths.
- Server components by default — `"use client"` only where state or event
  handlers require it.
- No hex values in components; everything comes from a token in `globals.css`.
- Nothing reads Prisma or `@/data/*` directly — content goes through
  `@/lib/data`.
