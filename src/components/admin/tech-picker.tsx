"use client";

import { useMemo, useState } from "react";

import { buttonIcon } from "@/components/admin/chrome";
import { Icon } from "@/components/ui/icon";
import { TECH_GROUPS } from "@/lib/tech-groups";
import { cn } from "@/lib/utils";
import type { TechCategory } from "@/types";

/**
 * Pick tech items from the registry, in a specific order.
 *
 * ## Why order is part of the control
 *
 * `ProjectTech` and `ExperienceTech` carry an explicit `position`, and the
 * schema says why: the order tech renders in on a card is authored, not
 * incidental. A plain multi-select would throw that away and hand back a set,
 * so the selected items get their own row above the list where they can be
 * moved and removed.
 *
 * New selections append. That makes clicking down the list produce the order
 * you clicked in, which is the only behaviour that does not need explaining.
 *
 * ## Why grouped and searchable rather than a `<select multiple>`
 *
 * There are thirty-plus tech items across eight categories. A native multiple
 * select shows about six of them, requires ctrl-clicking to add a second, and
 * silently drops the whole selection if someone clicks one without the
 * modifier. The grouping is `TECH_GROUPS` — the same six headings the public
 * site renders — so what is picked here is filed the way it will be displayed.
 */

export type TechOption = {
  id: string;
  name: string;
  category: TechCategory;
  icon?: string;
};

type TechPickerProps = {
  options: TechOption[];
  /** Selected ids, in render order. */
  selected: string[];
  onChange: (next: string[]) => void;
  /** Keyed `tech.<index>` — set when a stored id no longer resolves. */
  errors?: Record<string, string>;
};

export function TechPicker({
  options,
  selected,
  onChange,
  errors = {},
}: TechPickerProps) {
  const [query, setQuery] = useState("");

  const byId = useMemo(
    () => new Map(options.map((option) => [option.id, option])),
    [options],
  );

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = needle
      ? options.filter(
          (option) =>
            option.name.toLowerCase().includes(needle) ||
            option.id.toLowerCase().includes(needle),
        )
      : options;

    return TECH_GROUPS.map((group) => ({
      label: group.label,
      items: matches
        .filter((option) => group.categories.includes(option.category))
        .sort((a, b) => a.name.localeCompare(b.name)),
    })).filter((group) => group.items.length > 0);
  }, [options, query]);

  function toggle(id: string) {
    onChange(
      selected.includes(id)
        ? selected.filter((entry) => entry !== id)
        : [...selected, id],
    );
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= selected.length) return;
    const next = [...selected];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="label mb-2 text-muted">
          Selected — in the order they render{" "}
          <span className="font-mono text-foreground">({selected.length})</span>
        </p>

        {selected.length === 0 ? (
          <p className="text-small text-muted">
            Nothing picked yet. Choose from the list below.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {selected.map((id, index) => {
              const option = byId.get(id);
              const error = errors[`tech.${index}`];

              return (
                <li
                  key={id}
                  className={cn(
                    "flex items-center gap-1 rounded-md border bg-surface py-1 pl-2 pr-1",
                    error
                      ? "border-warning/60 bg-warning-subtle"
                      : "border-border-strong",
                  )}
                >
                  <Icon name={option?.icon} className="size-3.5 shrink-0" />
                  <span
                    className={cn(
                      "text-small",
                      error ? "text-warning" : "text-foreground",
                    )}
                  >
                    {/* A selected id with no matching option is a tech item
                        that was deleted while this record still points at it.
                        Showing the bare id — rather than nothing — is what
                        makes the error next to it actionable. */}
                    {option?.name ?? id}
                  </span>

                  <span className="ml-1 flex items-center">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label={`Move ${option?.name ?? id} earlier`}
                      className={cn(buttonIcon, "size-6 border-0 bg-transparent")}
                    >
                      <ArrowIcon direction="left" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === selected.length - 1}
                      aria-label={`Move ${option?.name ?? id} later`}
                      className={cn(buttonIcon, "size-6 border-0 bg-transparent")}
                    >
                      <ArrowIcon direction="right" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggle(id)}
                      aria-label={`Remove ${option?.name ?? id}`}
                      className={cn(
                        buttonIcon,
                        "size-6 border-0 bg-transparent hover:text-warning",
                      )}
                    >
                      <CloseIcon />
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {/* One message for the whole control. Per-chip colouring already says
            which entry is the problem; repeating the sentence per chip would
            be four copies of the same line. */}
        {Object.keys(errors).some((key) => key.startsWith("tech.")) ? (
          <p className="mt-2 text-small text-warning">
            Highlighted items are no longer in the tech stack. Remove them, or
            add them back under Tech stack.
          </p>
        ) : null}
      </div>

      <div className="rounded-md border border-border-strong bg-background">
        <div className="border-b border-border p-2">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter tech…"
            aria-label="Filter tech stack"
            className="h-8 w-full rounded bg-transparent px-2 text-small text-foreground placeholder:text-muted/70 focus:outline-none"
          />
        </div>

        <div className="max-h-72 overflow-y-auto p-3">
          {groups.length === 0 ? (
            <p className="py-4 text-center text-small text-muted">
              Nothing matches “{query}”.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {groups.map((group) => (
                <div key={group.label}>
                  <p className="label mb-1.5 text-muted">{group.label}</p>
                  <ul className="flex flex-wrap gap-1.5">
                    {group.items.map((option) => {
                      const isSelected = selected.includes(option.id);
                      return (
                        <li key={option.id}>
                          <button
                            type="button"
                            onClick={() => toggle(option.id)}
                            aria-pressed={isSelected}
                            className={cn(
                              "flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-small transition-colors",
                              isSelected
                                ? "border-accent/50 bg-accent-subtle text-foreground"
                                : "border-border bg-surface text-muted hover:border-border-strong hover:text-foreground",
                            )}
                          >
                            <Icon
                              name={option.icon}
                              className="size-3.5 shrink-0"
                            />
                            {option.name}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("size-3.5", direction === "right" && "rotate-180")}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
