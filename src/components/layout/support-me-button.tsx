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
        "inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-accent px-3.5 text-small font-medium text-background transition-shadow hover:shadow-glow-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        className,
      )}
    >
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4">
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
      </svg>
      Support Me
    </button>
  );
}
