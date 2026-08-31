# Design System

The implementation lives in [`src/app/globals.css`](../src/app/globals.css). That
file is the source of truth; this document explains the intent behind it.

**Direction:** dark, terminal / data-intelligence. Futuristic through restraint —
generous space, hairline borders, mono metadata, one accent. No gradients, no
glows, no neon washes. If something looks futuristic because of an effect rather
than because of structure, it does not belong here.

---

## 1. Color

Two layers. `:root` holds the raw hex values; `@theme inline` maps them into
Tailwind's namespace so every color is reachable as a utility. Change a value in
`:root` and it propagates everywhere.

### Core palette

| Token | Value | Utility | Use for |
| --- | --- | --- | --- |
| `--background` | `#0A0E12` | `bg-background` | Page ground. The default surface for everything. |
| `--surface` | `#12171D` | `bg-surface` | Cards, panels, inputs, anything raised off the ground. |
| `--foreground` | `#E4E9ED` | `text-foreground` | Primary text, headings, active nav. |
| `--muted` | `#6B7680` | `text-muted` | Secondary copy, metadata, timestamps, disabled states. |
| `--accent` | `#00D9A3` | `bg-accent` / `text-accent` | **Primary. CTAs and active states only.** |
| `--link` | `#3B82F6` | `text-link` | Links and hover states. |
| `--warning` | `#F59E0B` | `text-warning` | Alerts, warnings, degraded status. |

### Derived tokens

Not part of the supplied palette — interpolated from background/surface so the
shell has structure without introducing new hues.

| Token | Value | Utility | Use for |
| --- | --- | --- | --- |
| `--surface-raised` | `#182029` | `bg-surface-raised` | Hover state for a `surface` element. |
| `--border` | `#1E262E` | `border-border` | Default hairline. Section dividers, card edges. |
| `--border-strong` | `#2A343E` | `border-border-strong` | Emphasized divider, input outline, hover border. |
| `--overlay` | `rgb(10 14 18 / 0.72)` | `bg-overlay` | Scrims, sticky-header backdrop. |
| `--accent-subtle` | `accent @ 8%` | `bg-accent-subtle` | Tinted wash behind an active row or tag. |
| `--link-subtle` | `link @ 8%` | `bg-link-subtle` | Same, for link-flavored surfaces. |
| `--warning-subtle` | `warning @ 8%` | `bg-warning-subtle` | Same, for warning banners. |
| `--ring` | `= --accent` | — | Focus outline. Applied globally in the base layer. |

### Rules

1. **The accent is a budget, not a color.** Aim for at most one accent element
   in the viewport at a time — the current CTA, or the current active state. A
   second one halves the value of the first.
2. **Never fill large areas with accent or warning.** Small marks, thin rules,
   text, or the `-subtle` 8% wash. Solid accent is for a button-sized element.
3. **Blue is for links; green is for actions.** A link that turns green, or a
   CTA that turns blue, breaks the only two signals the palette carries.
4. **Hierarchy comes from `foreground` → `muted` → borders**, not from adding
   colors. If something needs to recede, it goes muted; it does not get a
   new hue.
5. **Dark only.** There is no light theme and no `prefers-color-scheme` branch.
   `color-scheme: dark` is set on `:root` so native controls follow.

### Contrast

Measured against the `#0A0E12` ground (WCAG 2.1):

| Token | vs background | vs surface | Verdict |
| --- | --- | --- | --- |
| `foreground` | 15.84:1 | 14.66:1 | AAA |
| `accent` | 10.56:1 | 9.77:1 | AAA |
| `warning` | 9.02:1 | 8.35:1 | AAA |
| `link` | 5.27:1 | 4.88:1 | AA |
| `muted` | **4.18:1** | **3.88:1** | ⚠ below AA for body text |

`#00D9A3` also gives 10.56:1 the other way round, so `text-background` on
`bg-accent` is a safe CTA treatment.

**The one caveat is `muted`.** At 4.18:1 it clears the 3:1 bar for large text
(24px+, or 18.66px+ bold) and for non-text UI, but sits under the 4.5:1 required
for body-size copy. Treat it accordingly: metadata, labels, timestamps, inactive
nav and large lead paragraphs are fine; long runs of 14–16px muted body copy are
not.

If you would rather have a muted that passes AA everywhere, `#78838D` is the
nearest drop-in — same hue and character, 5.01:1 on background and 4.66:1 on
surface. Changing `--muted` in `:root` is the entire edit.

---

## 2. Typography

**Geist Sans** for prose and UI, **Geist Mono** for data, labels, timestamps and
metadata. Both are self-hosted through the `geist` package — no network request,
no layout shift. The mono/sans split is what carries the terminal feel; it does
more work here than any color does.

Weights stop at **600**. 400 for body, 500 for small headings and UI, 600 for
h1–h3. Nothing heavier — weight is where "futuristic" designs usually overreach.

### Scale

Fluid steps use `clamp()`: the first number is the mobile size, the last the
desktop size. Each step carries its own line-height, tracking and weight, so
`text-h2` is a complete treatment rather than just a size.

| Utility | Size (min → max) | Line height | Tracking | Weight |
| --- | --- | --- | --- | --- |
| `text-h1` | 40 → 64px | 1.05 | −0.032em | 600 |
| `text-h2` | 32 → 48px | 1.12 | −0.026em | 600 |
| `text-h3` | 24 → 32px | 1.2 | −0.02em | 600 |
| `text-h4` | 24px | 1.3 | −0.015em | 500 |
| `text-h5` | 20px | 1.4 | −0.01em | 500 |
| `text-h6` | 16px | 1.5 | 0 | 500 |
| `text-body-lg` | 18px | 1.65 | 0 | 400 |
| `text-body` | 16px | 1.6 | 0 | 400 |
| `text-small` | 14px | 1.55 | 0 | 400 |
| `text-label` | 12px | 1.4 | +0.09em | 500 |

Larger text gets tighter tracking; the 12px label gets loose tracking because
that is what makes small uppercase mono readable.

The base layer already styles bare `h1`–`h6`, `small`, `code` and `pre`, so
semantic HTML renders on-system without utilities. Reach for `text-h3` on a
different element only when the visual size must differ from the heading level.

### The `label` utility

`class="label"` is the mono eyebrow: 12px, uppercase, `+0.09em` tracking,
weight 500. It recurs on section headers, status chips and metadata rows, so it
is defined once as an `@utility` rather than repeated as four classes.

---

## 3. Layout

### Containers

| Utility | Width | Use for |
| --- | --- | --- |
| `max-w-page` | 72rem / 1152px | Standard content column. |
| `max-w-page-wide` | 84rem / 1344px | Wide or near-full-bleed sections. |
| `max-w-prose-page` | 42rem / 672px | Long-form copy, ~68 character measure. |

Use the [`Container`](../src/components/layout/container.tsx) component rather
than applying these directly — it owns the horizontal gutters
(`px-5`, `lg:px-8`) so the left edge of the site stays on one vertical line.

### Breakpoints

Tailwind's defaults, restated explicitly in `@theme` so the system documents
itself. **Design mobile-first**; `lg` is the pivot where navigation goes inline.

| Prefix | Min width | Target |
| --- | --- | --- |
| — | 0 | Small phone (base styles) |
| `sm` | 640px | Large phone |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop — nav switches from menu button to inline |
| `xl` | 1280px | Wide desktop |
| `2xl` | 1536px | Max design width |

### Shell

`src/app/layout.tsx` composes: skip-link → `SiteHeader` → `main` → `SiteFooter`.
The body is a flex column with `min-h-full`, and the footer carries `mt-auto`, so
short pages still pin the footer to the bottom. `main` deliberately applies no
padding or max-width — pages own their own sections and vertical rhythm.

### Motion

`--ease-out-quart` and `--ease-in-out-quart` are defined but unused. They exist
so the animation pass has a shared vocabulary instead of inline cubic-beziers.
A `prefers-reduced-motion` guard is already in the base layer and will neutralize
CSS transitions and animations globally.

---

## 4. Adding to the system

- **A new color** goes in `:root` first, then `@theme inline`. Never write a hex
  value in a component.
- **A one-off size** is fine as a Tailwind utility. If it appears three times, it
  becomes a token.
- **A recurring class combination** becomes an `@utility` (like `label`) or a
  component in `src/components/ui/`.
- **Check contrast** on the `#0A0E12` ground before adopting any new color.
