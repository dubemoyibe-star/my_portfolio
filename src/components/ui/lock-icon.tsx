import { cn } from "@/lib/utils";

/**
 * Padlock. Stroked to match `DownloadIcon` rather than the solid brand marks
 * in the icon registry, so the two read as one family when they sit on
 * button-sized elements.
 *
 * The shackle is drawn open-ended into the body rather than as a closed arc:
 * at 16px a fully closed loop fills in and stops reading as a lock at all.
 */
export function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-4", className)}
    >
      <rect x="4" y="10.5" width="16" height="10.5" rx="2.5" />
      <path d="M8 10.5V7a4 4 0 1 1 8 0v3.5" />
    </svg>
  );
}
