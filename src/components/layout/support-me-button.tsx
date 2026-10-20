import { cn } from "@/lib/utils";

export function SupportMeButton({ className }: { className?: string }) {
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
        "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md text-small text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        className,
      )}
    >
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-4">
        <path d="M8 11V5.5a1.5 1.5 0 0 1 3 0V10 4.5a1.5 1.5 0 0 1 3 0V10 5.5a1.5 1.5 0 0 1 3 0V12l.6-1a1.6 1.6 0 0 1 3 1l-1.1 4.7a6 6 0 0 1-5.8 4.6h-2.1a6 6 0 0 1-4.6-2.1L4.2 15a1.8 1.8 0 0 1 2.6-2.5L8 14" />
      </svg>
      Support Me
    </button>
  );
}
