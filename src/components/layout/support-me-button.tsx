import { cn } from "@/lib/utils";

export function SupportMeButton({
  className,
  iconClassName,
}: {
  className?: string;
  iconClassName?: string;
}) {
  return (
    <button
      type="button"
      data-myhappr-username="oyibedev"
      data-color="#00d9a3"
      data-button-color="#00d9a3"
      data-text-color="#0a0e12"
      data-radius="6px"
      data-text="Support Me"
      data-title="Support Oyibe Chidubem"
      data-theme="#11171d"
      className={cn(
        "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md py-2 text-small text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        className,
      )}
    >
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={cn("size-4", iconClassName)}>
        <path d="M11 14h2a2 2 0 0 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16" />
        <path d="m14.45 13.39 5.05-4.694C20.196 8 21 6.85 21 5.75a2.75 2.75 0 0 0-4.797-1.837.276.276 0 0 1-.406 0A2.75 2.75 0 0 0 11 5.75c0 1.2.802 2.248 1.5 2.946L16 11.95" />
        <path d="m2 15 6 6" />
        <path d="m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a1 1 0 0 0-2.75-2.91" />
      </svg>
      Support Me
    </button>
  );
}
