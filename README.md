# Portfolio

Personal portfolio site. Currently **foundation only** — design system, layout
shell, and one placeholder page. No real content, no features.

## Stack

| | |
| --- | --- |
| Framework | Next.js 16 (App Router, React 19, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 — CSS-first config, no `tailwind.config.js` |
| Fonts | Geist Sans + Geist Mono, self-hosted via the `geist` package |
| Lint | ESLint 9 (`eslint-config-next`) |

## Commands

```bash
npm run dev     # dev server on http://localhost:3000
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```

## Structure

```
src/
├── app/                    # routes + root layout (App Router)
│   ├── globals.css         # design tokens — single source of truth
│   ├── layout.tsx          # shell: header / main / footer
│   └── page.tsx            # placeholder home page (hero only)
├── components/
│   ├── layout/             # structural: container, header, footer
│   └── ui/                 # reusable primitives (empty — buttons, cards, tags)
├── data/                   # static content. Seam for the future admin panel:
│   └── site.ts             # today an object, later a fetch — same import
├── lib/                    # framework-agnostic helpers
│   └── utils.ts            # cn()
└── types/                  # shared domain types
docs/
└── design-system.md        # tokens, typography, layout — read this first
```

**Conventions**

- Files are `kebab-case`, React components are `PascalCase`, named exports
  everywhere except route files (Next requires default exports there).
- Import via the `@/*` alias, never relative parent paths.
- Components are server components by default. Add `"use client"` only where
  state or event handlers genuinely require it.
- No hex values in components — everything comes from a token.

## Design system

Tokens live in [`src/app/globals.css`](src/app/globals.css) and are documented in
[`docs/design-system.md`](docs/design-system.md). Read that before adding UI.

Short version: dark-only, terminal / data-intelligence feel. Restraint over
effects — no gradients, no glows. Green accent is reserved for CTAs and active
states; blue carries links and hovers.

## Not built yet

Deliberately out of scope for this pass: animations, the admin panel, dynamic
data, CV generation, and all real project/experience content.
