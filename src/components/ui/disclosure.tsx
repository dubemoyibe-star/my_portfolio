import { cn } from "@/lib/utils";

export type DisclosureProps = {
  /** Text on the closed trigger. The open state always reads "Hide". */
  label?: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * Expandable detail block.
 *
 * Built on native `<details>`, so it needs no client component: it toggles,
 * takes keyboard focus, announces its state to a screen reader and works with
 * JavaScript disabled, all without shipping a byte of JS.
 *
 * The trigger is a small control rather than the whole card. Making an entire
 * card clickable would nest the repo and PR links inside another interactive
 * element, which is invalid and breaks both keyboard and middle-click.
 */
export function Disclosure({
  label = "Details",
  className,
  children,
}: DisclosureProps) {
  return (
    <details className={cn("group", className)}>
      <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-small text-muted transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="size-4 shrink-0 transition-transform duration-200 group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
        <span className="group-open:hidden">{label}</span>
        <span className="hidden group-open:inline">Hide</span>
      </summary>

      <div className="mt-5 border-t border-border pt-5">{children}</div>
    </details>
  );
}
