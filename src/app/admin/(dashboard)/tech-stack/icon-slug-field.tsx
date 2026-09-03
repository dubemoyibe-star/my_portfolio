"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Field, TextInput } from "@/components/admin/fields";
import { ICON_SLUGS, Icon, hasIcon } from "@/components/ui/icon";
import type { IconVerdict } from "@/lib/admin/tech-input";
import { cn } from "@/lib/utils";

import { describeIconSlug } from "./actions";

/**
 * The icon slug, with the site's own rendering of it beside the box.
 *
 * ## The preview is the real component, not a lookalike
 *
 * The tile renders `<Icon name={slug} brand fallback />` — the exact call the
 * Stack section makes, with the same props. There is no second icon table and
 * no approximation, so the preview cannot be right while the site is wrong.
 * When the tile shows the neutral square, that square is what will ship.
 *
 * ## Why a server round trip on top of that
 *
 * Showing the outcome is not enough on its own, because two very different
 * mistakes produce the same empty square:
 *
 *   `typescrpt`  — a misspelling. No amount of retyping around it will help.
 *   `svelte`     — a real brand this site does not bundle. One line in
 *                  `@/components/ui/icon` and it renders.
 *
 * The site's registry is ~40 marks, deliberately, so the bundler can drop the
 * other ~3,400. Telling those two apart needs the full simple-icons catalogue,
 * which is 455 KB and stays on the server; `describeIconSlug` is how the
 * question gets asked. The answer names the brand, or offers near-miss slugs.
 *
 * The round trip only happens for slugs the registry does *not* have. A
 * recognised slug is settled synchronously by `hasIcon`, so the common case —
 * typing a slug that works — never waits on the network and never flickers
 * through a "checking" state.
 *
 * ## Why a `<datalist>` rather than a picker
 *
 * The field has to accept slugs the site does not bundle yet — an item is worth
 * having with a missing icon, which is why the public site has a fallback glyph
 * at all — so it cannot be a closed list. A datalist keeps it a text input
 * while making the ~40 that do render one keystroke away.
 */

type IconSlugFieldProps = {
  id: string;
  value: string;
  error?: string;
  onChange: (next: string) => void;
};

/** Long enough that a slug is not looked up letter by letter. */
const DEBOUNCE_MS = 350;

export function IconSlugField({ id, value, error, onChange }: IconSlugFieldProps) {
  const listId = useId();
  const trimmed = value.trim();

  /* Both of these are answerable during render — the registry is right here —
     so they are, rather than being pushed through an effect and a state update
     that would land a frame after the tile beside them has already changed. */
  const renders = hasIcon(trimmed);
  const needsLookup = trimmed.length > 0 && !renders;

  /* The one thing render cannot answer: whether an unrecognised slug is a
     misspelling or a real brand this site does not bundle. Held with the slug
     it describes, so a stale answer is recognisable as stale rather than
     shown against whatever is in the box now. */
  const [remote, setRemote] = useState<IconVerdict | null>(null);

  /* Answers arrive out of order when someone types faster than the round trip.
     Every request takes a ticket and only the newest one is allowed to write
     state — otherwise deleting a character can leave the message from the
     longer string it used to be. */
  const ticket = useRef(0);

  useEffect(() => {
    if (!needsLookup) return;

    const mine = (ticket.current += 1);
    const timer = setTimeout(async () => {
      let answer: IconVerdict;
      try {
        answer = await describeIconSlug(trimmed);
      } catch {
        /* The lookup is a diagnosis, not a gate. If it cannot run, fall back to
           the more useful of the two readings — the tile already shows the
           outcome, and "check the spelling" is bad advice when it is right. */
        answer = { slug: trimmed, state: "unbundled" };
      }
      if (ticket.current === mine) setRemote(answer);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [trimmed, needsLookup]);

  const settled = remote && remote.slug === trimmed ? remote : null;
  const checking = needsLookup && settled === null;

  const verdict: IconVerdict | null = checking
    ? null
    : trimmed.length === 0
      ? { slug: "", state: "empty" }
      : renders
        ? { slug: trimmed, state: "renders" }
        : settled;

  return (
    <Field
      label="Icon slug"
      htmlFor={id}
      error={error}
      hint="A simple-icons slug — “react”, “nextdotjs”, “postgresql”. Leave empty for no icon."
    >
      <div className="flex items-start gap-3">
        {/* Sized and coloured like a Stack pill, because that is where this
            icon ends up. A preview on a different ground would misrepresent the
            one thing the contrast guard in `Icon` decides. */}
        <span
          aria-hidden="true"
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md border bg-surface",
            renders ? "border-border" : "border-dashed border-border-strong",
            renders ? "text-foreground" : "text-muted",
          )}
        >
          <Icon name={trimmed} brand fallback className="size-5" />
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <TextInput
            id={id}
            mono
            list={listId}
            value={value}
            error={error}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            /* Lowercased on the way in rather than flagged afterwards. The
               slugs are lowercase without exception, and "SvelteKit" is a
               reasonable thing to type into a box labelled with a brand. */
            onChange={(event) => onChange(event.target.value.toLowerCase())}
            placeholder="react"
          />
          <datalist id={listId}>
            {ICON_SLUGS.map((slug) => (
              <option key={slug} value={slug} />
            ))}
          </datalist>

          <IconStatus
            checking={checking}
            verdict={verdict}
            onPick={(slug) => onChange(slug)}
          />
        </div>
      </div>
    </Field>
  );
}

/* ==========================================================================
   Status line
   ========================================================================== */

function IconStatus({
  checking,
  verdict,
  onPick,
}: {
  checking: boolean;
  verdict: IconVerdict | null;
  onPick: (slug: string) => void;
}) {
  if (checking) {
    return <p className="text-small text-muted">Checking simple-icons…</p>;
  }

  if (!verdict) return null;

  if (verdict.state === "empty") {
    return (
      <p className="text-small text-muted">
        No icon. The item renders as its name alone, which is a fine thing for
        it to do.
      </p>
    );
  }

  if (verdict.state === "renders") {
    return (
      <p className="text-small text-accent">
        Renders{verdict.title ? ` as ${verdict.title}` : ""}. What is in the tile
        is what the Stack section will draw.
      </p>
    );
  }

  if (verdict.state === "unbundled") {
    return (
      <p className="text-small text-warning">
        <span className="font-mono">{verdict.slug}</span> is a real simple-icons
        brand{verdict.title ? ` (${verdict.title})` : ""}, but this site only
        bundles the marks it uses — so the Stack section will draw the neutral
        placeholder in the tile. Add it to{" "}
        <span className="font-mono">src/components/ui/icon.tsx</span> to make it
        render.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-small text-warning">
        No simple-icons brand called{" "}
        <span className="font-mono">{verdict.slug}</span>. The item still saves —
        it will just render the neutral placeholder in the tile.
      </p>
      {verdict.suggestions && verdict.suggestions.length > 0 ? (
        <p className="flex flex-wrap items-center gap-1.5 text-small text-muted">
          Did you mean
          {verdict.suggestions.map((slug) => (
            <button
              key={slug}
              type="button"
              onClick={() => onPick(slug)}
              className={cn(
                "cursor-pointer rounded border px-1.5 py-0.5 font-mono text-label transition-colors",
                hasIcon(slug)
                  ? "border-accent/30 bg-accent-subtle text-accent hover:border-accent/60"
                  : "border-border-strong bg-surface text-muted hover:text-foreground",
              )}
            >
              {slug}
            </button>
          ))}
        </p>
      ) : null}
    </div>
  );
}
