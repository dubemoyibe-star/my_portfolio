import { cn } from "@/lib/utils";

/**
 * Download arrow. Stroked rather than filled, so it does not come from the
 * brand-icon registry — that one holds solid logo paths.
 */
export function DownloadIcon({ className }: { className?: string }) {
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
      <path d="M12 3v11m0 0l-4-4m4 4l4-4M4 19h16" />
    </svg>
  );
}
