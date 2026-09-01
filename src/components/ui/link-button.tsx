import { cn } from "@/lib/utils";

export type LinkButtonProps = {
  href: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * Outbound link styled as a button — repo, live site, PR.
 *
 * Blue on hover rather than accent: per the palette rule, accent marks actions
 * on this site and blue marks navigation away from it. Everything using this
 * component leaves the page.
 */
export function LinkButton({ href, className, children }: LinkButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3.5 text-small text-foreground transition-all hover:border-link/50 hover:text-link hover:shadow-glow-link",
        className,
      )}
    >
      {children}
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="size-3.5 shrink-0 opacity-60"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 17L17 7M17 7H8M17 7v9" />
      </svg>
    </a>
  );
}
