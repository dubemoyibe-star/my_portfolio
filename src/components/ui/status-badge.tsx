import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/types";

/**
 * Status reads as state, so it borrows the palette's state colours: accent for
 * something live and finished, warning for work still in flight, muted for
 * anything parked. No new hues, and the dot carries the colour so the label
 * stays legible.
 */
const STATUS: Record<ProjectStatus, { label: string; dot: string; text: string }> =
  {
    shipped: { label: "Shipped", dot: "bg-accent", text: "text-accent" },
    "in-progress": {
      label: "In progress",
      dot: "bg-warning",
      text: "text-warning",
    },
    archived: { label: "Archived", dot: "bg-muted", text: "text-muted" },
    concept: { label: "Concept", dot: "bg-muted", text: "text-muted" },
  };

export function StatusBadge({
  status,
  className,
}: {
  status: ProjectStatus;
  className?: string;
}) {
  const { label, dot, text } = STATUS[status];

  return (
    <span className={cn("label flex items-center gap-2", text, className)}>
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", dot)} />
      {label}
    </span>
  );
}
